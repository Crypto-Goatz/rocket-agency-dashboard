import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getOnboardingStatus, saveOnboardingData } from '@/lib/skills'
import { supabaseAdmin } from '@/lib/db/supabase'

// Get onboarding status and fields
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify ownership and get skill info
    const { data: installation } = await supabaseAdmin
      .from('skill_installations')
      .select('*, skill:skills(manifest)')
      .eq('id', id)
      .eq('user_id', session.id)
      .single()

    if (!installation) {
      return NextResponse.json(
        { success: false, error: 'Installation not found' },
        { status: 404 }
      )
    }

    const status = await getOnboardingStatus(id)
    const manifest = installation.skill.manifest

    return NextResponse.json({
      success: true,
      fields: manifest.onboarding || [],
      ...status,
    })
  } catch (error: any) {
    console.error('Get onboarding error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Submit onboarding data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify ownership
    const { data: installation } = await supabaseAdmin
      .from('skill_installations')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.id)
      .single()

    if (!installation) {
      return NextResponse.json(
        { success: false, error: 'Installation not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { data } = body

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Data object is required' },
        { status: 400 }
      )
    }

    const result = await saveOnboardingData(id, data)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Get updated status
    const status = await getOnboardingStatus(id)

    return NextResponse.json({
      success: true,
      ...status,
    })
  } catch (error: any) {
    console.error('Save onboarding error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
