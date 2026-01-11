import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getLogs, countLogs, ActionType } from '@/lib/skills'
import { supabaseAdmin } from '@/lib/db/supabase'

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
    const url = new URL(request.url)

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

    // Parse options
    const action = url.searchParams.get('action') as ActionType | null
    const reversibleOnly = url.searchParams.get('reversibleOnly') === 'true'
    const notReverted = url.searchParams.get('notReverted') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const [logs, total] = await Promise.all([
      getLogs(id, {
        action: action || undefined,
        reversibleOnly,
        notReverted,
        limit,
        offset,
      }),
      countLogs(id, {
        action: action || undefined,
        reversibleOnly,
        notReverted,
      }),
    ])

    return NextResponse.json({
      success: true,
      logs,
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get skill logs error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
