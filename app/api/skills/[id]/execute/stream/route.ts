import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { supabaseAdmin } from '@/lib/db/supabase'
import { createIgnitionEngine, ProgressEvent } from '@/lib/skills/ignition'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stream skill execution progress via Server-Sent Events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: installationId } = await params

  // Validate session
  const session = await getSession()
  if (!session?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify ownership
  const { data: installation, error: fetchError } = await supabaseAdmin
    .from('skill_installations')
    .select('user_id, skill:skills(name)')
    .eq('id', installationId)
    .single()

  if (fetchError || !installation) {
    return new Response('Installation not found', { status: 404 })
  }

  if (installation.user_id !== session.id) {
    return new Response('Forbidden', { status: 403 })
  }

  // Get input from query params
  const { searchParams } = new URL(request.url)
  const inputParam = searchParams.get('input')
  let input: Record<string, any> = {}

  if (inputParam) {
    try {
      input = JSON.parse(inputParam)
    } catch (e) {
      // Ignore parse errors, use empty input
    }
  }

  // Create SSE stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const engine = createIgnitionEngine()

      // Send initial connection event
      const connectEvent: ProgressEvent = {
        type: 'log',
        level: 'info',
        message: 'Connected to execution stream',
        timestamp: new Date().toISOString(),
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectEvent)}\n\n`))

      // Subscribe to progress events
      const unsubscribe = engine.onProgress((event: ProgressEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch (err) {
          // Stream may be closed
          console.error('Error sending progress event:', err)
        }
      })

      try {
        // Execute the skill
        const result = await engine.execute(installationId, { input, stream: true })

        // Send final result (in case the complete event wasn't sent)
        const finalEvent: ProgressEvent = {
          type: result.success ? 'complete' : 'error',
          result: result.success ? result.data : undefined,
          error: result.error,
          duration: result.duration,
          timestamp: new Date().toISOString(),
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalEvent)}\n\n`))
      } catch (error: any) {
        // Send error event
        const errorEvent: ProgressEvent = {
          type: 'error',
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
      } finally {
        unsubscribe()
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}
