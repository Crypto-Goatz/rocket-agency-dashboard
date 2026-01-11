// ============================================================
// MCP Registry - Manages MCP Server Connections for Ignition
// ============================================================
// Allows skills to call any registered MCP server
// Handles connection pooling, auth, and response formatting
// ============================================================

import { supabaseAdmin } from '../db/supabase'

// MCP Server Configuration
export interface MCPServerConfig {
  id: string
  slug: string
  name: string
  description: string
  category: string
  
  // Connection
  endpoint: string // HTTP endpoint or stdio command
  connectionType: 'http' | 'stdio' | 'sse'
  
  // Authentication
  authType: 'api_key' | 'oauth' | 'token' | 'pit' | 'none'
  authConfig?: {
    envKey?: string        // Environment variable name for API key
    headerName?: string    // Header name for auth (default: Authorization)
    headerPrefix?: string  // Prefix (e.g., "Bearer", "Api-Key")
  }
  
  // Available Tools
  tools: MCPTool[]
  
  // Metadata
  logo?: string
  website?: string
  docsUrl?: string
  isBuiltIn: boolean      // Shipped with platform
  isEnabled: boolean
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
  requiresAuth: boolean
}

export interface MCPCallResult {
  success: boolean
  data?: any
  error?: string
  metadata?: {
    server: string
    tool: string
    duration: number
  }
}

// Built-in MCP Servers
export const BUILTIN_MCP_SERVERS: MCPServerConfig[] = [
  {
    id: 'ghl',
    slug: 'gohighlevel',
    name: 'GoHighLevel',
    description: 'Complete CRM - contacts, blogs, workflows, Voice AI, and more',
    category: 'CRM & Sales',
    endpoint: 'internal://ghl',
    connectionType: 'http',
    authType: 'pit',
    authConfig: {
      envKey: 'GHL_LOCATION_PIT',
    },
    tools: [
      // Contacts
      { name: 'get_contacts', description: 'Get contacts from CRM', inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } }, requiresAuth: true },
      { name: 'create_contact', description: 'Create a new contact', inputSchema: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, tags: { type: 'array' } }, required: ['email'] }, requiresAuth: true },
      { name: 'update_contact', description: 'Update a contact', inputSchema: { type: 'object', properties: { contactId: { type: 'string' } }, required: ['contactId'] }, requiresAuth: true },
      { name: 'add_tags', description: 'Add tags to contact', inputSchema: { type: 'object', properties: { contactId: { type: 'string' }, tags: { type: 'array' } }, required: ['contactId', 'tags'] }, requiresAuth: true },
      
      // Communication
      { name: 'send_sms', description: 'Send SMS message', inputSchema: { type: 'object', properties: { contactId: { type: 'string' }, message: { type: 'string' } }, required: ['contactId', 'message'] }, requiresAuth: true },
      { name: 'send_email', description: 'Send email', inputSchema: { type: 'object', properties: { contactId: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['contactId', 'subject', 'body'] }, requiresAuth: true },
      
      // Blogs/Content
      { name: 'create_blog_post', description: 'Create blog post', inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, status: { type: 'string' } }, required: ['title', 'content'] }, requiresAuth: true },
      { name: 'get_blog_posts', description: 'List blog posts', inputSchema: { type: 'object', properties: { status: { type: 'string' }, limit: { type: 'number' } } }, requiresAuth: true },
      { name: 'update_blog_post', description: 'Update blog post', inputSchema: { type: 'object', properties: { blogId: { type: 'string' } }, required: ['blogId'] }, requiresAuth: true },
      
      // Voice AI
      { name: 'create_voice_agent', description: 'Create Voice AI agent', inputSchema: { type: 'object', properties: { name: { type: 'string' }, prompt: { type: 'string' }, voice: { type: 'string' } }, required: ['name', 'prompt'] }, requiresAuth: true },
      { name: 'get_voice_agents', description: 'List Voice AI agents', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      
      // Products
      { name: 'create_product', description: 'Create product', inputSchema: { type: 'object', properties: { name: { type: 'string' }, price: { type: 'number' }, description: { type: 'string' } }, required: ['name', 'price'] }, requiresAuth: true },
      { name: 'get_products', description: 'List products', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } }, requiresAuth: true },
      
      // Workflows
      { name: 'get_workflows', description: 'List workflows', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      { name: 'add_to_workflow', description: 'Add contact to workflow', inputSchema: { type: 'object', properties: { contactId: { type: 'string' }, workflowId: { type: 'string' } }, required: ['contactId', 'workflowId'] }, requiresAuth: true },
      
      // Pipelines/Opportunities
      { name: 'get_pipelines', description: 'List pipelines', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      { name: 'create_opportunity', description: 'Create opportunity', inputSchema: { type: 'object', properties: { name: { type: 'string' }, pipelineId: { type: 'string' }, stageId: { type: 'string' }, contactId: { type: 'string' } }, required: ['name', 'pipelineId', 'stageId'] }, requiresAuth: true },
      { name: 'get_opportunities', description: 'List opportunities', inputSchema: { type: 'object', properties: { pipelineId: { type: 'string' } } }, requiresAuth: true },
      
      // Calendar
      { name: 'get_calendars', description: 'List calendars', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      { name: 'get_appointments', description: 'Get appointments', inputSchema: { type: 'object', properties: { calendarId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } } }, requiresAuth: true },
      { name: 'create_appointment', description: 'Book appointment', inputSchema: { type: 'object', properties: { calendarId: { type: 'string' }, contactId: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' } }, required: ['calendarId', 'contactId', 'startTime', 'endTime'] }, requiresAuth: true },
      
      // Location/Config
      { name: 'get_location', description: 'Get location info', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      { name: 'get_custom_fields', description: 'Get custom fields', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      { name: 'get_custom_values', description: 'Get custom values', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      { name: 'get_tags', description: 'Get all tags', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      
      // Users
      { name: 'get_users', description: 'Get team users', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      
      // Forms
      { name: 'get_forms', description: 'List forms', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      { name: 'get_form_submissions', description: 'Get form submissions', inputSchema: { type: 'object', properties: { formId: { type: 'string' } }, required: ['formId'] }, requiresAuth: true },
    ],
    isBuiltIn: true,
    isEnabled: true,
  },
  
  {
    id: 'stripe',
    slug: 'stripe',
    name: 'Stripe',
    description: 'Payment processing - customers, products, subscriptions, invoices',
    category: 'Finance & Payments',
    endpoint: 'https://api.stripe.com/v1',
    connectionType: 'http',
    authType: 'api_key',
    authConfig: {
      envKey: 'STRIPE_SECRET_KEY',
      headerName: 'Authorization',
      headerPrefix: 'Bearer',
    },
    tools: [
      { name: 'list_customers', description: 'List Stripe customers', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } }, requiresAuth: true },
      { name: 'create_customer', description: 'Create customer', inputSchema: { type: 'object', properties: { email: { type: 'string' }, name: { type: 'string' } }, required: ['email'] }, requiresAuth: true },
      { name: 'create_product', description: 'Create product', inputSchema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } }, required: ['name'] }, requiresAuth: true },
      { name: 'create_price', description: 'Create price', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' } }, required: ['productId', 'amount'] }, requiresAuth: true },
      { name: 'create_checkout_session', description: 'Create checkout session', inputSchema: { type: 'object', properties: { priceId: { type: 'string' }, successUrl: { type: 'string' }, cancelUrl: { type: 'string' } }, required: ['priceId', 'successUrl', 'cancelUrl'] }, requiresAuth: true },
      { name: 'list_subscriptions', description: 'List subscriptions', inputSchema: { type: 'object', properties: { customerId: { type: 'string' } } }, requiresAuth: true },
      { name: 'create_invoice', description: 'Create invoice', inputSchema: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] }, requiresAuth: true },
    ],
    website: 'https://stripe.com',
    docsUrl: 'https://stripe.com/docs/api',
    isBuiltIn: true,
    isEnabled: true,
  },
  
  {
    id: 'canva',
    slug: 'canva',
    name: 'Canva',
    description: 'Design automation - create graphics, templates, exports',
    category: 'Design & Media',
    endpoint: 'https://api.canva.com/rest/v1',
    connectionType: 'http',
    authType: 'oauth',
    authConfig: {
      envKey: 'CANVA_ACCESS_TOKEN',
      headerName: 'Authorization',
      headerPrefix: 'Bearer',
    },
    tools: [
      { name: 'create_design', description: 'Create a new design', inputSchema: { type: 'object', properties: { title: { type: 'string' }, templateId: { type: 'string' } } }, requiresAuth: true },
      { name: 'list_designs', description: 'List designs', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } }, requiresAuth: true },
      { name: 'export_design', description: 'Export design', inputSchema: { type: 'object', properties: { designId: { type: 'string' }, format: { type: 'string' } }, required: ['designId'] }, requiresAuth: true },
      { name: 'list_templates', description: 'List templates', inputSchema: { type: 'object', properties: { category: { type: 'string' } } }, requiresAuth: true },
    ],
    website: 'https://canva.com',
    docsUrl: 'https://www.canva.dev/docs/',
    isBuiltIn: true,
    isEnabled: true,
  },
  
  {
    id: 'google-drive',
    slug: 'google-drive',
    name: 'Google Drive',
    description: 'Cloud storage - files, folders, sharing, docs',
    category: 'Storage & Files',
    endpoint: 'https://www.googleapis.com/drive/v3',
    connectionType: 'http',
    authType: 'oauth',
    authConfig: {
      envKey: 'GOOGLE_ACCESS_TOKEN',
      headerName: 'Authorization',
      headerPrefix: 'Bearer',
    },
    tools: [
      { name: 'list_files', description: 'List files', inputSchema: { type: 'object', properties: { folderId: { type: 'string' }, query: { type: 'string' } } }, requiresAuth: true },
      { name: 'upload_file', description: 'Upload file', inputSchema: { type: 'object', properties: { name: { type: 'string' }, content: { type: 'string' }, mimeType: { type: 'string' } }, required: ['name', 'content'] }, requiresAuth: true },
      { name: 'download_file', description: 'Download file', inputSchema: { type: 'object', properties: { fileId: { type: 'string' } }, required: ['fileId'] }, requiresAuth: true },
      { name: 'create_folder', description: 'Create folder', inputSchema: { type: 'object', properties: { name: { type: 'string' }, parentId: { type: 'string' } }, required: ['name'] }, requiresAuth: true },
      { name: 'share_file', description: 'Share file', inputSchema: { type: 'object', properties: { fileId: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } }, required: ['fileId', 'email'] }, requiresAuth: true },
    ],
    website: 'https://drive.google.com',
    docsUrl: 'https://developers.google.com/drive/api',
    isBuiltIn: true,
    isEnabled: true,
  },
  
  {
    id: 'notion',
    slug: 'notion',
    name: 'Notion',
    description: 'Workspace - pages, databases, blocks',
    category: 'Productivity',
    endpoint: 'https://api.notion.com/v1',
    connectionType: 'http',
    authType: 'token',
    authConfig: {
      envKey: 'NOTION_TOKEN',
      headerName: 'Authorization',
      headerPrefix: 'Bearer',
    },
    tools: [
      { name: 'search', description: 'Search pages and databases', inputSchema: { type: 'object', properties: { query: { type: 'string' } } }, requiresAuth: true },
      { name: 'create_page', description: 'Create page', inputSchema: { type: 'object', properties: { parentId: { type: 'string' }, title: { type: 'string' }, content: { type: 'array' } }, required: ['parentId', 'title'] }, requiresAuth: true },
      { name: 'get_page', description: 'Get page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] }, requiresAuth: true },
      { name: 'query_database', description: 'Query database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string' }, filter: { type: 'object' } }, required: ['databaseId'] }, requiresAuth: true },
      { name: 'create_database_item', description: 'Add database item', inputSchema: { type: 'object', properties: { databaseId: { type: 'string' }, properties: { type: 'object' } }, required: ['databaseId', 'properties'] }, requiresAuth: true },
    ],
    website: 'https://notion.so',
    docsUrl: 'https://developers.notion.com/',
    isBuiltIn: true,
    isEnabled: true,
  },
  
  {
    id: 'slack',
    slug: 'slack',
    name: 'Slack',
    description: 'Team communication - messages, channels, users',
    category: 'Communication',
    endpoint: 'https://slack.com/api',
    connectionType: 'http',
    authType: 'oauth',
    authConfig: {
      envKey: 'SLACK_BOT_TOKEN',
      headerName: 'Authorization',
      headerPrefix: 'Bearer',
    },
    tools: [
      { name: 'send_message', description: 'Send message', inputSchema: { type: 'object', properties: { channel: { type: 'string' }, text: { type: 'string' } }, required: ['channel', 'text'] }, requiresAuth: true },
      { name: 'list_channels', description: 'List channels', inputSchema: { type: 'object', properties: {} }, requiresAuth: true },
      { name: 'create_channel', description: 'Create channel', inputSchema: { type: 'object', properties: { name: { type: 'string' }, isPrivate: { type: 'boolean' } }, required: ['name'] }, requiresAuth: true },
      { name: 'search_messages', description: 'Search messages', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, requiresAuth: true },
    ],
    website: 'https://slack.com',
    docsUrl: 'https://api.slack.com/',
    isBuiltIn: true,
    isEnabled: true,
  },
]

/**
 * MCP Registry - Manages server connections
 */
export class MCPRegistry {
  private servers: Map<string, MCPServerConfig> = new Map()
  private initialized: boolean = false
  
  constructor() {
    // Load built-in servers
    for (const server of BUILTIN_MCP_SERVERS) {
      this.servers.set(server.slug, server)
    }
  }
  
  /**
   * Initialize registry - load custom servers from DB
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    try {
      const { data: customServers } = await supabaseAdmin
        .from('mcp_servers')
        .select('*')
        .eq('is_enabled', true)
      
      if (customServers) {
        for (const server of customServers) {
          this.servers.set(server.slug, {
            ...server,
            isBuiltIn: false,
          })
        }
      }
      
      this.initialized = true
    } catch (err) {
      console.error('Failed to load custom MCP servers:', err)
      this.initialized = true
    }
  }
  
  /**
   * Get a server by slug
   */
  getServer(slug: string): MCPServerConfig | undefined {
    return this.servers.get(slug)
  }
  
  /**
   * Get all registered servers
   */
  getAllServers(): MCPServerConfig[] {
    return Array.from(this.servers.values())
  }
  
  /**
   * Get servers by category
   */
  getServersByCategory(category: string): MCPServerConfig[] {
    return this.getAllServers().filter(s => s.category === category)
  }
  
  /**
   * Get tool by server and name
   */
  getTool(serverSlug: string, toolName: string): MCPTool | undefined {
    const server = this.getServer(serverSlug)
    return server?.tools.find(t => t.name === toolName)
  }
  
  /**
   * Register a custom server
   */
  async registerServer(config: Omit<MCPServerConfig, 'isBuiltIn'>): Promise<void> {
    // Save to database
    await supabaseAdmin
      .from('mcp_servers')
      .upsert({
        ...config,
        is_enabled: config.isEnabled,
      })
    
    // Add to local registry
    this.servers.set(config.slug, {
      ...config,
      isBuiltIn: false,
    })
  }
  
  /**
   * Unregister a custom server
   */
  async unregisterServer(slug: string): Promise<void> {
    const server = this.servers.get(slug)
    if (server?.isBuiltIn) {
      throw new Error('Cannot unregister built-in server')
    }
    
    await supabaseAdmin
      .from('mcp_servers')
      .delete()
      .eq('slug', slug)
    
    this.servers.delete(slug)
  }
}

// Singleton instance
export const mcpRegistry = new MCPRegistry()

/**
 * Initialize MCP registry
 */
export async function initializeMCPRegistry(): Promise<void> {
  await mcpRegistry.initialize()
}
