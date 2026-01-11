import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { executeSkill, pauseSkill, resumeSkill } from '@/lib/skills'
import { supabaseAdmin } from '@/lib/db/supabase'

// Execute a skill
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
      .select('id, status')
      .eq('id', id)
      .eq('user_id', session.id)
      .single()

    if (!installation) {
      return NextResponse.json(
        { success: false, error: 'Installation not found' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { action, input } = body

    // Handle special actions
    if (action === 'pause') {
      const result = await pauseSkill(id)
      return NextResponse.json(result)
    }

    if (action === 'resume') {
      const result = await resumeSkill(id)
      return NextResponse.json(result)
    }

    // Execute the skill
    const result = await executeSkill(id, input)

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
      duration: result.duration,
    })
  } catch (error: any) {
    console.error('Execute skill error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
