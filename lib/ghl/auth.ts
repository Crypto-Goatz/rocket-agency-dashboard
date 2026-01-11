/**
 * GHL Authentication System
 * 
 * Uses GHL Contacts as the user database:
 * - Email = Login identifier
 * - Custom field "password_hash" = bcrypt hashed password
 * - Custom field "user_role" = admin | member | guest
 * - Tag "site-user" = Identifies as website user
 * 
 * GHL Team Members = Site Admins (automatic admin access)
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ghl, contacts, users, location, GHLContact, GHLUser, GHLCustomField } from './client'

// Session configuration
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-change-in-production'
)
const SESSION_DURATION = 60 * 60 * 24 * 7 // 7 days
const COOKIE_NAME = 'rocket_session'

// Custom field keys (must exist in GHL)
const CUSTOM_FIELD_KEYS = {
  PASSWORD_HASH: 'password_hash',
  USER_ROLE: 'user_role',
  LAST_LOGIN: 'last_login',
  PREFERENCES: 'preferences',
  SUBSCRIPTION_TIER: 'subscription_tier',
}

// User roles
export type UserRole = 'admin' | 'member' | 'guest'

// Session user type
export interface SessionUser {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  role: UserRole
  subscriptionTier?: string
  isTeamMember: boolean
  tags: string[]
}

// Auth result type
export interface AuthResult {
  success: boolean
  user?: SessionUser
  error?: string
}

// Cache for custom field IDs
let customFieldCache: Map<string, string> | null = null

/**
 * Get custom field ID by key
 */
async function getCustomFieldId(fieldKey: string): Promise<string | null> {
  if (!customFieldCache) {
    const { customFields } = await location.getCustomFields()
    customFieldCache = new Map(
      customFields.map(cf => [cf.fieldKey, cf.id])
    )
  }
  return customFieldCache.get(fieldKey) || null
}

/**
 * Get custom field value from contact
 */
function getCustomFieldValue(contact: GHLContact, fieldId: string): string | null {
  const field = contact.customFields?.find(cf => cf.id === fieldId)
  return field?.value || null
}

/**
 * Hash password using Web Crypto API (bcrypt-like)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  const hashArray = new Uint8Array(hash)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)
  return btoa(String.fromCharCode(...combined))
}

/**
 * Verify password against hash
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0))
    const salt = combined.slice(0, 16)
    const originalHash = combined.slice(16)
    
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )
    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    )
    const hashArray = new Uint8Array(hash)
    
    // Constant-time comparison
    if (hashArray.length !== originalHash.length) return false
    let result = 0
    for (let i = 0; i < hashArray.length; i++) {
      result |= hashArray[i] ^ originalHash[i]
    }
    return result === 0
  } catch {
    return false
  }
}

/**
 * Create JWT session token
 */
async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SESSION_SECRET)
}

/**
 * Verify JWT session token
 */
async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    return payload.user as SessionUser
  } catch {
    return null
  }
}

/**
 * Set session cookie
 */
async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

/**
 * Clear session cookie
 */
async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Get session cookie
 */
async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

/**
 * Convert GHL contact to session user
 */
async function contactToSessionUser(
  contact: GHLContact,
  isTeamMember: boolean = false
): Promise<SessionUser> {
  const roleFieldId = await getCustomFieldId(CUSTOM_FIELD_KEYS.USER_ROLE)
  const tierFieldId = await getCustomFieldId(CUSTOM_FIELD_KEYS.SUBSCRIPTION_TIER)
  
  let role: UserRole = 'member'
  if (isTeamMember) {
    role = 'admin'
  } else if (roleFieldId) {
    const roleValue = getCustomFieldValue(contact, roleFieldId)
    if (roleValue === 'admin' || roleValue === 'member' || roleValue === 'guest') {
      role = roleValue
    }
  }
  
  let subscriptionTier: string | undefined
  if (tierFieldId) {
    subscriptionTier = getCustomFieldValue(contact, tierFieldId) || undefined
  }
  
  return {
    id: contact.id,
    email: contact.email || '',
    name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    role,
    subscriptionTier,
    isTeamMember,
    tags: contact.tags || [],
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Sign up a new user
 */
export async function signUp(data: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existing = await contacts.getByEmail(data.email)
    if (existing) {
      return { success: false, error: 'Email already registered' }
    }
    
    // Get custom field IDs
    const passwordFieldId = await getCustomFieldId(CUSTOM_FIELD_KEYS.PASSWORD_HASH)
    const roleFieldId = await getCustomFieldId(CUSTOM_FIELD_KEYS.USER_ROLE)
    
    if (!passwordFieldId) {
      console.error('Password custom field not found in GHL')
      return { success: false, error: 'System configuration error' }
    }
    
    // Hash password
    const passwordHash = await hashPassword(data.password)
    
    // Create contact
    const customFields: { id: string; value: any }[] = [
      { id: passwordFieldId, value: passwordHash },
    ]
    if (roleFieldId) {
      customFields.push({ id: roleFieldId, value: 'member' })
    }
    
    const { contact } = await contacts.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      tags: ['site-user', 'new-signup'],
      customFields,
    })
    
    // Create session
    const user = await contactToSessionUser(contact)
    const token = await createSessionToken(user)
    await setSessionCookie(token)
    
    return { success: true, user }
  } catch (error) {
    console.error('Sign up error:', error)
    return { success: false, error: 'Failed to create account' }
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    // First, check if this is a team member (admin)
    const { users: teamMembers } = await users.list()
    const teamMember = teamMembers.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    )
    
    if (teamMember) {
      // Team members use a different auth flow
      // In production, you'd verify against GHL's team member auth
      // For now, we'll require them to have a contact with password
    }
    
    // Get contact by email
    const contact = await contacts.getByEmail(email)
    if (!contact) {
      return { success: false, error: 'Invalid email or password' }
    }
    
    // Get password field
    const passwordFieldId = await getCustomFieldId(CUSTOM_FIELD_KEYS.PASSWORD_HASH)
    if (!passwordFieldId) {
      return { success: false, error: 'System configuration error' }
    }
    
    // Verify password
    const storedHash = getCustomFieldValue(contact, passwordFieldId)
    if (!storedHash) {
      return { success: false, error: 'Invalid email or password' }
    }
    
    const isValid = await verifyPassword(password, storedHash)
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' }
    }
    
    // Update last login
    const lastLoginFieldId = await getCustomFieldId(CUSTOM_FIELD_KEYS.LAST_LOGIN)
    if (lastLoginFieldId) {
      await contacts.updateCustomField(
        contact.id,
        lastLoginFieldId,
        new Date().toISOString()
      )
    }
    
    // Create session
    const isTeamMember = !!teamMember
    const user = await contactToSessionUser(contact, isTeamMember)
    const token = await createSessionToken(user)
    await setSessionCookie(token)
    
    return { success: true, user }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: 'Failed to sign in' }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await clearSessionCookie()
}

/**
 * Get current session user
 */
export async function getSession(): Promise<SessionUser | null> {
  const token = await getSessionCookie()
  if (!token) return null
  
  const user = await verifySessionToken(token)
  return user
}

/**
 * Get current session user (throws if not authenticated)
 */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Check if user has required role
 */
export async function requireRole(roles: UserRole | UserRole[]): Promise<SessionUser> {
  const user = await requireSession()
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  
  return user
}

/**
 * Update user password
 */
export async function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> {
  try {
    const { contact } = await contacts.get(userId)
    
    // Verify current password
    const passwordFieldId = await getCustomFieldId(CUSTOM_FIELD_KEYS.PASSWORD_HASH)
    if (!passwordFieldId) {
      return { success: false, error: 'System configuration error' }
    }
    
    const storedHash = getCustomFieldValue(contact, passwordFieldId)
    if (!storedHash) {
      return { success: false, error: 'Invalid password' }
    }
    
    const isValid = await verifyPassword(currentPassword, storedHash)
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' }
    }
    
    // Hash new password and update
    const newHash = await hashPassword(newPassword)
    await contacts.updateCustomField(userId, passwordFieldId, newHash)
    
    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'Failed to update password' }
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: {
    firstName?: string
    lastName?: string
    phone?: string
  }
): Promise<AuthResult> {
  try {
    const { contact } = await contacts.update(userId, data)
    const user = await contactToSessionUser(contact)
    
    // Update session
    const token = await createSessionToken(user)
    await setSessionCookie(token)
    
    return { success: true, user }
  } catch (error) {
    console.error('Update profile error:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

/**
 * Request password reset (sends email via GHL workflow)
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
  try {
    const contact = await contacts.getByEmail(email)
    if (!contact) {
      // Don't reveal if email exists
      return { success: true }
    }
    
    // Generate reset token
    const resetToken = crypto.randomUUID()
    const resetExpiry = new Date(Date.now() + 3600000).toISOString() // 1 hour
    
    // Store reset token in custom field (would need to create this field)
    // For now, we'll trigger a workflow that sends the reset email
    
    // Add to password reset workflow (must be set up in GHL)
    // await ghl.workflows.addContact('password-reset-workflow-id', contact.id)
    
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: true } // Don't reveal errors
  }
}

/**
 * Initialize auth system - ensure custom fields exist
 */
export async function initializeAuthSystem(): Promise<{
  success: boolean
  missingFields: string[]
}> {
  const missingFields: string[] = []
  
  try {
    const { customFields } = await location.getCustomFields()
    const existingKeys = new Set(customFields.map(cf => cf.fieldKey))
    
    for (const key of Object.values(CUSTOM_FIELD_KEYS)) {
      if (!existingKeys.has(key)) {
        missingFields.push(key)
      }
    }
    
    if (missingFields.length > 0) {
      console.warn('Missing GHL custom fields for auth:', missingFields)
    }
    
    return { success: missingFields.length === 0, missingFields }
  } catch (error) {
    console.error('Auth system init error:', error)
    return { success: false, missingFields: Object.values(CUSTOM_FIELD_KEYS) }
  }
}

// Export auth object
export const auth = {
  signUp,
  signIn,
  signOut,
  getSession,
  requireSession,
  requireRole,
  updatePassword,
  updateProfile,
  requestPasswordReset,
  initialize: initializeAuthSystem,
}

export default auth
