/**
 * MCP Servers API Route
 * 
 * GET /api/mcp - List all available MCP servers
 * POST /api/mcp - Register a custom MCP server
 */

import { NextRequest, NextResponse } from 'next/server'
import { mcpRegistry, initializeMCPRegistry } from '@/lib/mcp/registry'
import { supabaseAdmin } from '@/lib/db/supabase'

// GET - List all MCP servers
export async function GET(request: NextRequest) {
  try {
    await initializeMCPRegistry()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const enabledOnly = searchParams.get('enabled') !== 'false'
    
    let servers = mcpRegistry.getAllServers()
    
    // Filter by category
    if (category) {
      servers = servers.filter(s => s.category === category)
    }
    
    // Filter by enabled
    if (enabledOnly) {
      servers = servers.filter(s => s.isEnabled)
    }
    
    // Return summary (not full tools list for performance)
    const summary = servers.map(s => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      category: s.category,
      authType: s.authType,
      toolCount: s.tools.length,
      isBuiltIn: s.isBuiltIn,
      isEnabled: s.isEnabled,
      logo: s.logo,
      website: s.website,
    }))
    
    return NextResponse.json({
      success: true,
      servers: summary,
      total: summary.length,
    })
  } catch (error) {
    console.error('Error listing MCP servers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to list MCP servers' },
      { status: 500 }
    )
  }
}

// POST - Register a custom MCP server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      slug,
      name,
      description,
      category = 'Other',
      endpoint,
      connectionType = 'http',
      authType = 'none',
      authConfig,
      tools = [],
      logo,
      website,
      docsUrl,
    } = body
    
    // Validate required fields
    if (!slug || !name || !endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: slug, name, endpoint' },
        { status: 400 }
      )
    }
    
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'Slug must be lowercase alphanumeric with hyphens' },
        { status: 400 }
      )
    }
    
    // Check if slug already exists
    const existing = mcpRegistry.getServer(slug)
    if (existing?.isBuiltIn) {
      return NextResponse.json(
        { success: false, error: 'Cannot override built-in server' },
        { status: 400 }
      )
    }
    
    // Register the server
    await mcpRegistry.registerServer({
      id: slug,
      slug,
      name,
      description,
      category,
      endpoint,
      connectionType,
      authType,
      authConfig,
      tools,
      logo,
      website,
      docsUrl,
      isEnabled: true,
    })
    
    return NextResponse.json({
      success: true,
      message: `MCP server "${name}" registered successfully`,
      server: { slug, name, toolCount: tools.length },
    })
  } catch (error) {
    console.error('Error registering MCP server:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register MCP server' },
      { status: 500 }
    )
  }
}
