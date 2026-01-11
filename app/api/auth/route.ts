/**
 * Auth API Routes
 * 
 * POST /api/auth/signup - Create new user account
 * POST /api/auth/signin - Sign in existing user
 * POST /api/auth/signout - Sign out current user
 * GET /api/auth/session - Get current session
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/ghl/auth'

// POST /api/auth/signup
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'signup'
    const body = await request.json()

    switch (action) {
      case 'signup': {
        const { email, password, firstName, lastName, phone } = body
        
        if (!email || !password) {
          return NextResponse.json(
            { success: false, error: 'Email and password are required' },
            { status: 400 }
          )
        }
        
        if (password.length < 8) {
          return NextResponse.json(
            { success: false, error: 'Password must be at least 8 characters' },
            { status: 400 }
          )
        }
        
        const result = await auth.signUp({
          email,
          password,
          firstName,
          lastName,
          phone,
        })
        
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          )
        }
        
        return NextResponse.json({
          success: true,
          user: result.user,
        })
      }
      
      case 'signin': {
        const { email, password } = body
        
        if (!email || !password) {
          return NextResponse.json(
            { success: false, error: 'Email and password are required' },
            { status: 400 }
          )
        }
        
        const result = await auth.signIn(email, password)
        
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 401 }
          )
        }
        
        return NextResponse.json({
          success: true,
          user: result.user,
        })
      }
      
      case 'signout': {
        await auth.signOut()
        
        return NextResponse.json({
          success: true,
          message: 'Signed out successfully',
        })
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// GET /api/auth/session
export async function GET() {
  try {
    const user = await auth.getSession()
    
    if (!user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
      })
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
