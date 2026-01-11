import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { revertLog, canRevert } from '@/lib/skills'
import { supabaseAdmin } from '@/lib/db/supabase'

// Revert a specific log entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, logId } = await params

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

    // Verify the log belongs to this installation
    const { data: log } = await supabaseAdmin
      .from('skill_logs')
      .select('id, installation_id')
      .eq('id', logId)
      .eq('installation_id', id)
      .single()

    if (!log) {
      return NextResponse.json(
        { success: false, error: 'Log entry not found' },
        { status: 404 }
      )
    }

    // Check if revertible
    const canRevertResult = await canRevert(logId)
    if (!canRevertResult.canRevert) {
      return NextResponse.json(
        { success: false, error: canRevertResult.reason },
        { status: 400 }
      )
    }

    // Perform revert
    const result = await revertLog(logId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Rollback error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Check if a log can be reverted
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, logId } = await params

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

    const result = await canRevert(logId)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Check rollback error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
