import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getSkill, uninstallSkill, updateSkillConfig } from '@/lib/skills'
import { supabaseAdmin } from '@/lib/db/supabase'

// Get skill details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const skill = await getSkill(id)

    if (!skill) {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      skill,
    })
  } catch (error: any) {
    console.error('Get skill error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Update skill config
export async function PUT(
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
    const body = await request.json()
    const { config } = body

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

    const result = await updateSkillConfig(id, config)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update skill config error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Uninstall skill
export async function DELETE(
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

    const result = await uninstallSkill(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Uninstall skill error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
