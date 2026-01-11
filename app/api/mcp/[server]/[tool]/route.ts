/**
 * MCP Tool Execution API Route
 * 
 * POST /api/mcp/[server]/[tool] - Execute an MCP tool
 */

import { NextRequest, NextResponse } from 'next/server'
import { mcpRegistry, initializeMCPRegistry } from '@/lib/mcp/registry'
import { mcpHandler, MCPActionConfig } from '@/lib/skills/ignition/actions/mcp'
import { ExecutionContext } from '@/lib/skills/ignition/types'
import { supabaseAdmin } from '@/lib/db/supabase'

// Create a minimal execution context for direct API calls
function createMinimalContext(
  userId: string,
  environment: Record<string, string> = {}
): ExecutionContext {
  return {
    installationId: 'api-call',
    userId,
    skillId: 'direct-mcp-call',
    skillSlug: 'direct-mcp-call',
    config: {},
    environment: {
      ...process.env as Record<string, string>,
      ...environment,
    },
    permissions: ['mcp:*'],
    manifest: {
      name: 'Direct MCP Call',
      slug: 'direct-mcp-call',
      version: '1.0.0',
      permissions: ['mcp:*'],
      onboarding: [],
    },
    variables: {},
    input: {},
    onboardingData: {},
  }
}

// POST - Execute MCP tool
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ server: string; tool: string }> }
) {
  const startTime = Date.now()
  
  try {
    const { server: serverSlug, tool: toolName } = await params
    await initializeMCPRegistry()
    
    // Get server config
    const server = mcpRegistry.getServer(serverSlug)
    if (!server) {
      return NextResponse.json(
        { success: false, error: `Server not found: ${serverSlug}` },
        { status: 404 }
      )
    }
    
    // Check if server is enabled
    if (!server.isEnabled) {
      return NextResponse.json(
        { success: false, error: `Server is disabled: ${serverSlug}` },
        { status: 400 }
      )
    }
    
    // Get tool config
    const tool = server.tools.find(t => t.name === toolName)
    if (!tool) {
      return NextResponse.json(
        { success: false, error: `Tool not found: ${toolName}` },
        { status: 404 }
      )
    }
    
    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { params: toolParams = {}, environment = {} } = body
    
    // Get user ID from auth (simplified - in production use proper auth)
    // For now, use a default user ID or extract from session
    const userId = 'api-user'
    
    // Create execution context
    const context = createMinimalContext(userId, environment)
    
    // Create MCP action config
    const actionConfig: MCPActionConfig = {
      type: 'mcp:call',
      server: serverSlug,
      tool: toolName,
      params: toolParams,
    }
    
    // Execute the MCP call
    const result = await mcpHandler(context, actionConfig)
    
    const duration = Date.now() - startTime
    
    // Log the call (optional, for analytics)
    try {
      await supabaseAdmin.from('mcp_call_logs').insert({
        user_id: userId,
        server_slug: serverSlug,
        tool_name: toolName,
        params: toolParams,
        success: result.success,
        response: result.data,
        error_message: result.error,
        duration_ms: duration,
      })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log MCP call:', logError)
    }
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          server: serverSlug,
          tool: toolName,
          duration,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      server: serverSlug,
      tool: toolName,
      duration,
    })
  } catch (error) {
    console.error('Error executing MCP tool:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute MCP tool',
      },
      { status: 500 }
    )
  }
}
