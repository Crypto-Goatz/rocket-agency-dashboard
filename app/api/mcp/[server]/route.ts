/**
 * MCP Server Detail API Route
 * 
 * GET /api/mcp/[server] - Get server details and tools
 * DELETE /api/mcp/[server] - Unregister a custom server
 */

import { NextRequest, NextResponse } from 'next/server'
import { mcpRegistry, initializeMCPRegistry } from '@/lib/mcp/registry'

// GET - Get server details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ server: string }> }
) {
  try {
    const { server: serverSlug } = await params
    await initializeMCPRegistry()
    
    const server = mcpRegistry.getServer(serverSlug)
    
    if (!server) {
      return NextResponse.json(
        { success: false, error: `Server not found: ${serverSlug}` },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      server: {
        id: server.id,
        slug: server.slug,
        name: server.name,
        description: server.description,
        category: server.category,
        endpoint: server.endpoint,
        connectionType: server.connectionType,
        authType: server.authType,
        authConfig: server.authConfig,
        tools: server.tools,
        logo: server.logo,
        website: server.website,
        docsUrl: server.docsUrl,
        isBuiltIn: server.isBuiltIn,
        isEnabled: server.isEnabled,
      },
    })
  } catch (error) {
    console.error('Error getting MCP server:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get MCP server' },
      { status: 500 }
    )
  }
}

// DELETE - Unregister a custom server
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ server: string }> }
) {
  try {
    const { server: serverSlug } = await params
    await initializeMCPRegistry()
    
    const server = mcpRegistry.getServer(serverSlug)
    
    if (!server) {
      return NextResponse.json(
        { success: false, error: `Server not found: ${serverSlug}` },
        { status: 404 }
      )
    }
    
    if (server.isBuiltIn) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete built-in server' },
        { status: 400 }
      )
    }
    
    await mcpRegistry.unregisterServer(serverSlug)
    
    return NextResponse.json({
      success: true,
      message: `Server "${server.name}" unregistered successfully`,
    })
  } catch (error) {
    console.error('Error deleting MCP server:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete MCP server' },
      { status: 500 }
    )
  }
}
