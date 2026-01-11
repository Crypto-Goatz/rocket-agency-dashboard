// ============================================================
// GHL-Based Authentication System
// ============================================================
// Uses GHL as the user database:
// - Team Members = Admins (full access)
// - Contacts with "user" tag = Site Users (limited access)
// - Custom Fields store password hashes and user metadata
// - Sessions managed via JWT
// ============================================================

import { ghl } from '../ghl/client'
import * as crypto from 'crypto'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'change-me-in-production'
const JWT_EXPIRY = '7d'
const PASSWORD_FIELD_KEY = 'user_password_hash'
const ROLE_FIELD_KEY = 'user_role'
const LAST_LOGIN_FIELD_KEY = 'user_last_login'

// User Types
export type UserRole = 'admin' | 'editor' | 'user' | 'viewer'

export interface GHLUser {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  role: UserRole
  source: 'team_member' | 'contact'
  permissions: string[]
  metadata?: Record<string, any>
  lastLogin?: string
}

export interface AuthSession {
  userId: string
  email: string
  role: UserRole
  source: 'team_member' | 'contact'
  permissions: string[]
  expiresAt: string
}

// Custom field IDs cache
let customFieldIds: Record<string, string> | null = null

/**
 * Initialize custom fields for user auth
 * Creates the required custom fields if they don't exist
 */
export async function initializeAuthFields(): Promise<void> {
  try {
    const { customFields } = await ghl.location.getCustomFields()
    
    customFieldIds = {}
    
    // Check for existing fields
    for (const field of customFields) {
      if (field.fieldKey === PASSWORD_FIELD_KEY) {
        customFieldIds.password = field.id
      }
      if (field.fieldKey === ROLE_FIELD_KEY) {
        customFieldIds.role = field.id
      }
      if (field.fieldKey === LAST_LOGIN_FIELD_KEY) {
        customFieldIds.lastLogin = field.id
      }
    }
    
    // Note: Creating custom fields requires agency-level API access
    // Fields should be pre-created in GHL admin
    if (!customFieldIds.password) {
      console.warn('Custom field for password hash not found. Create field with key:', PASSWORD_FIELD_KEY)
    }
    
  } catch (err) {
    console.error('Failed to initialize auth fields:', err)
  }
}

/**
 * Hash a password using PBKDF2
 */
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex')
  return { hash, salt: actualSalt }
}

/**
 * Verify a password against a hash
 */
function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt)
  return hash === storedHash
}

/**
 * Generate a JWT token for a session
 */
function generateToken(session: Omit<AuthSession, 'expiresAt'>): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      source: decoded.source,
      permissions: decoded.permissions || [],
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Get role-based permissions
 */
function getRolePermissions(role: UserRole): string[] {
  const permissions: Record<UserRole, string[]> = {
    admin: [
      'admin:*',
      'content:*',
      'users:*',
      'settings:*',
      'analytics:*',
      'skills:*',
    ],
    editor: [
      'content:read',
      'content:write',
      'content:publish',
      'analytics:read',
    ],
    user: [
      'content:read',
      'profile:*',
    ],
    viewer: [
      'content:read',
    ],
  }
  return permissions[role] || []
}

/**
 * Authenticate a Team Member (Admin)
 * Team members are authenticated against GHL's user system
 */
export async function authenticateTeamMember(
  email: string,
  password: string
): Promise<{ success: boolean; user?: GHLUser; token?: string; error?: string }> {
  try {
    // Get all team members
    const { users } = await ghl.users.list()
    
    const teamMember = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (!teamMember) {
      return { success: false, error: 'User not found' }
    }
    
    // For team members, we need to verify against stored password hash
    // This would typically be stored in a custom value or separate secure store
    // For MVP, we'll check against a stored hash in custom values
    
    const { customValues } = await ghl.location.getCustomValues()
    const userPasswordValue = customValues.find(
      cv => cv.name === `admin_password_${teamMember.id}`
    )
    
    if (!userPasswordValue) {
      // First login - password not set
      // In production, this would trigger a password setup flow
      return { success: false, error: 'Password not configured. Contact administrator.' }
    }
    
    // Parse stored hash (format: hash:salt)
    const [storedHash, salt] = userPasswordValue.value.split(':')
    
    if (!verifyPassword(password, storedHash, salt)) {
      return { success: false, error: 'Invalid password' }
    }
    
    // Build user object
    const user: GHLUser = {
      id: teamMember.id,
      email: teamMember.email,
      name: teamMember.name,
      role: 'admin',
      source: 'team_member',
      permissions: getRolePermissions('admin'),
    }
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      source: user.source,
      permissions: user.permissions,
    })
    
    return { success: true, user, token }
    
  } catch (err) {
    console.error('Team member auth error:', err)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Authenticate a Contact (Site User)
 * Contacts with "site_user" tag can log in
 */
export async function authenticateContact(
  email: string,
  password: string
): Promise<{ success: boolean; user?: GHLUser; token?: string; error?: string }> {
  try {
    // Search for contact by email
    const { contacts } = await ghl.contacts.list({ query: email, limit: 1 })
    
    const contact = contacts.find(c => c.email?.toLowerCase() === email.toLowerCase())
    
    if (!contact) {
      return { success: false, error: 'User not found' }
    }
    
    // Check if contact has user access tag
    if (!contact.tags?.includes('site_user')) {
      return { success: false, error: 'User not authorized for site access' }
    }
    
    // Get password hash from custom field
    const passwordData = contact.customFields?.[PASSWORD_FIELD_KEY]
    
    if (!passwordData) {
      return { success: false, error: 'Password not configured' }
    }
    
    // Parse stored hash
    const [storedHash, salt] = passwordData.split(':')
    
    if (!verifyPassword(password, storedHash, salt)) {
      return { success: false, error: 'Invalid password' }
    }
    
    // Get role from custom field (default to 'user')
    const role = (contact.customFields?.[ROLE_FIELD_KEY] as UserRole) || 'user'
    
    // Build user object
    const user: GHLUser = {
      id: contact.id,
      email: contact.email!,
      name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      role,
      source: 'contact',
      permissions: getRolePermissions(role),
      metadata: contact.customFields,
    }
    
    // Update last login
    await ghl.contacts.update(contact.id, {
      customFields: {
        [LAST_LOGIN_FIELD_KEY]: new Date().toISOString(),
      },
    } as any)
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      source: user.source,
      permissions: user.permissions,
    })
    
    return { success: true, user, token }
    
  } catch (err) {
    console.error('Contact auth error:', err)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Universal login - tries team member first, then contact
 */
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: GHLUser; token?: string; error?: string }> {
  // Try team member auth first (admins)
  const teamResult = await authenticateTeamMember(email, password)
  if (teamResult.success) {
    return teamResult
  }
  
  // Fall back to contact auth (users)
  const contactResult = await authenticateContact(email, password)
  return contactResult
}

/**
 * Register a new site user (creates contact with user tag)
 */
export async function registerUser(data: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}): Promise<{ success: boolean; user?: GHLUser; error?: string }> {
  try {
    // Check if user already exists
    const { contacts } = await ghl.contacts.list({ query: data.email, limit: 1 })
    
    if (contacts.some(c => c.email?.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Email already registered' }
    }
    
    // Hash password
    const { hash, salt } = hashPassword(data.password)
    const passwordValue = `${hash}:${salt}`
    
    // Create contact with user tag and password
    const { contact } = await ghl.contacts.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      tags: ['site_user'],
      customFields: [
        { id: customFieldIds?.password || PASSWORD_FIELD_KEY, value: passwordValue },
        { id: customFieldIds?.role || ROLE_FIELD_KEY, value: 'user' },
      ],
    })
    
    const user: GHLUser = {
      id: contact.id,
      email: contact.email!,
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'user',
      source: 'contact',
      permissions: getRolePermissions('user'),
    }
    
    return { success: true, user }
    
  } catch (err) {
    console.error('Registration error:', err)
    return { success: false, error: 'Registration failed' }
  }
}

/**
 * Set/update password for a team member (admin use)
 */
export async function setTeamMemberPassword(
  userId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { hash, salt } = hashPassword(password)
    const passwordValue = `${hash}:${salt}`
    
    // Store in custom values (location-level)
    // This requires a custom values API call
    const GHL_API_BASE = 'https://services.leadconnectorhq.com'
    const locationId = process.env.GHL_LOCATION_ID!
    const token = process.env.GHL_LOCATION_PIT!
    
    await fetch(`${GHL_API_BASE}/locations/${locationId}/customValues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `admin_password_${userId}`,
        value: passwordValue,
      }),
    })
    
    return { success: true }
    
  } catch (err) {
    console.error('Set password error:', err)
    return { success: false, error: 'Failed to set password' }
  }
}

/**
 * Reset password for a contact user
 */
export async function resetContactPassword(
  contactId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { hash, salt } = hashPassword(newPassword)
    const passwordValue = `${hash}:${salt}`
    
    await ghl.contacts.update(contactId, {
      customFields: {
        [PASSWORD_FIELD_KEY]: passwordValue,
      },
    } as any)
    
    return { success: true }
    
  } catch (err) {
    console.error('Reset password error:', err)
    return { success: false, error: 'Failed to reset password' }
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(token: string): Promise<GHLUser | null> {
  const session = verifyToken(token)
  if (!session) return null
  
  try {
    if (session.source === 'team_member') {
      const { user } = await ghl.users.get(session.userId)
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: session.role,
        source: 'team_member',
        permissions: session.permissions,
      }
    } else {
      const { contact } = await ghl.contacts.get(session.userId)
      return {
        id: contact.id,
        email: contact.email!,
        name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        role: session.role,
        source: 'contact',
        permissions: session.permissions,
        metadata: contact.customFields,
      }
    }
  } catch {
    return null
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(user: GHLUser | AuthSession, permission: string): boolean {
  // Admin wildcard check
  if (user.permissions.includes('admin:*')) return true
  
  // Exact match
  if (user.permissions.includes(permission)) return true
  
  // Wildcard match (e.g., content:* matches content:read)
  const [category] = permission.split(':')
  if (user.permissions.includes(`${category}:*`)) return true
  
  return false
}

/**
 * Middleware helper for API routes
 */
export async function requireAuth(
  authHeader: string | null,
  requiredPermission?: string
): Promise<{ authorized: boolean; user?: GHLUser; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'No authorization token' }
  }
  
  const token = authHeader.substring(7)
  const session = verifyToken(token)
  
  if (!session) {
    return { authorized: false, error: 'Invalid or expired token' }
  }
  
  if (requiredPermission && !hasPermission(session, requiredPermission)) {
    return { authorized: false, error: 'Insufficient permissions' }
  }
  
  const user = await getCurrentUser(token)
  if (!user) {
    return { authorized: false, error: 'User not found' }
  }
  
  return { authorized: true, user }
}
