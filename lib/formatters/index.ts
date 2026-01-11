/**
 * Data Formatters for MCP Responses
 * 
 * Transform raw MCP responses into display-ready data structures
 * that can be easily rendered by React components.
 */

// ============================================
// TYPES
// ============================================

export interface FormattedData {
  type: string
  displayName: string
  data: any
  metadata?: Record<string, any>
}

export interface FormatterConfig {
  dateFormat?: 'short' | 'long' | 'relative'
  currency?: string
  locale?: string
  truncateText?: number
}

// Default config
const DEFAULT_CONFIG: FormatterConfig = {
  dateFormat: 'short',
  currency: 'USD',
  locale: 'en-US',
  truncateText: 200,
}

// ============================================
// UTILITY FORMATTERS
// ============================================

/**
 * Format a date for display
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'relative' = 'short',
  locale: string = 'en-US'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'relative') {
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }
  
  const options: Intl.DateTimeFormatOptions = format === 'long'
    ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'short', day: 'numeric' }
  
  return d.toLocaleDateString(locale, options)
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format number for display
 */
export function formatNumber(
  num: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Format percentage for display
 */
export function formatPercent(
  value: number,
  decimals: number = 1,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// ============================================
// MCP-SPECIFIC FORMATTERS
// ============================================

/**
 * Format GHL Contact for display
 */
export function formatContact(contact: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  return {
    type: 'contact',
    displayName: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
    data: {
      id: contact.id,
      name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      initials: getInitials(contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`),
      email: contact.email,
      phone: contact.phone ? formatPhone(contact.phone) : null,
      tags: contact.tags || [],
      createdAt: contact.dateAdded ? formatDate(contact.dateAdded, cfg.dateFormat, cfg.locale) : null,
    },
    metadata: {
      raw: contact,
    },
  }
}

/**
 * Format GHL Blog Post for display
 */
export function formatBlogPost(post: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const plainContent = stripHtml(post.blogContent || post.content || '')
  
  return {
    type: 'blog_post',
    displayName: post.title,
    data: {
      id: post.id,
      title: post.title,
      slug: post.urlSlug || post.slug,
      excerpt: truncateText(plainContent, cfg.truncateText),
      content: post.blogContent || post.content,
      status: post.status?.toLowerCase() || 'draft',
      author: post.author?.name || 'Unknown',
      category: post.category?.name || null,
      featuredImage: post.featuredImage,
      publishedAt: formatDate(post.createdAt || post.publishedAt, cfg.dateFormat, cfg.locale),
      publishedAtRelative: formatDate(post.createdAt || post.publishedAt, 'relative', cfg.locale),
      readTime: `${Math.max(1, Math.ceil(plainContent.split(' ').length / 200))} min read`,
    },
    metadata: {
      raw: post,
      wordCount: plainContent.split(' ').length,
    },
  }
}

/**
 * Format GHL Product for display
 */
export function formatProduct(product: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const primaryVariant = product.variants?.[0]
  
  return {
    type: 'product',
    displayName: product.name,
    data: {
      id: product.id,
      name: product.name,
      description: product.description || '',
      descriptionTruncated: truncateText(product.description || '', cfg.truncateText),
      price: primaryVariant?.priceDecimal || 0,
      priceFormatted: formatCurrency(
        primaryVariant?.priceDecimal || 0,
        primaryVariant?.currency || cfg.currency,
        cfg.locale
      ),
      currency: primaryVariant?.currency || cfg.currency,
      productType: product.productType?.toLowerCase() || 'digital',
      hasVariants: (product.variants?.length || 0) > 1,
      variants: product.variants?.map((v: any) => ({
        id: v.id,
        name: v.name,
        price: v.priceDecimal,
        priceFormatted: formatCurrency(v.priceDecimal, v.currency || cfg.currency, cfg.locale),
      })),
    },
    metadata: {
      raw: product,
    },
  }
}

/**
 * Format GHL Opportunity for display
 */
export function formatOpportunity(opp: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const statusColors: Record<string, string> = {
    open: 'blue',
    won: 'green',
    lost: 'red',
    abandoned: 'gray',
  }
  
  return {
    type: 'opportunity',
    displayName: opp.name,
    data: {
      id: opp.id,
      name: opp.name,
      status: opp.status,
      statusColor: statusColors[opp.status] || 'gray',
      value: opp.monetaryValue || 0,
      valueFormatted: formatCurrency(opp.monetaryValue || 0, cfg.currency, cfg.locale),
      pipelineId: opp.pipelineId,
      stageId: opp.pipelineStageId,
      contactId: opp.contactId,
      createdAt: formatDate(opp.dateAdded, cfg.dateFormat, cfg.locale),
    },
    metadata: {
      raw: opp,
    },
  }
}

/**
 * Format GHL Appointment for display
 */
export function formatAppointment(appt: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const start = new Date(appt.startTime)
  const end = new Date(appt.endTime)
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000)
  
  const statusColors: Record<string, string> = {
    confirmed: 'green',
    cancelled: 'red',
    showed: 'blue',
    noshow: 'orange',
  }
  
  return {
    type: 'appointment',
    displayName: appt.title || 'Appointment',
    data: {
      id: appt.id,
      title: appt.title || 'Appointment',
      status: appt.status,
      statusColor: statusColors[appt.status] || 'gray',
      date: formatDate(appt.startTime, 'long', cfg.locale),
      dateShort: formatDate(appt.startTime, 'short', cfg.locale),
      time: start.toLocaleTimeString(cfg.locale, { hour: '2-digit', minute: '2-digit' }),
      endTime: end.toLocaleTimeString(cfg.locale, { hour: '2-digit', minute: '2-digit' }),
      duration: `${durationMinutes} min`,
      durationMinutes,
      calendarId: appt.calendarId,
      contactId: appt.contactId,
    },
    metadata: {
      raw: appt,
    },
  }
}

/**
 * Format Stripe Customer for display
 */
export function formatStripeCustomer(customer: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  return {
    type: 'stripe_customer',
    displayName: customer.name || customer.email,
    data: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ? formatPhone(customer.phone) : null,
      createdAt: formatDate(new Date(customer.created * 1000), cfg.dateFormat, cfg.locale),
      balance: formatCurrency(customer.balance / 100, customer.currency || cfg.currency, cfg.locale),
      defaultPaymentMethod: customer.default_source || customer.invoice_settings?.default_payment_method,
    },
    metadata: {
      raw: customer,
    },
  }
}

/**
 * Format Stripe Subscription for display
 */
export function formatStripeSubscription(sub: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const statusColors: Record<string, string> = {
    active: 'green',
    past_due: 'orange',
    canceled: 'red',
    unpaid: 'red',
    trialing: 'blue',
    incomplete: 'yellow',
  }
  
  return {
    type: 'stripe_subscription',
    displayName: sub.items?.data?.[0]?.price?.product?.name || 'Subscription',
    data: {
      id: sub.id,
      status: sub.status,
      statusColor: statusColors[sub.status] || 'gray',
      currentPeriodStart: formatDate(new Date(sub.current_period_start * 1000), cfg.dateFormat, cfg.locale),
      currentPeriodEnd: formatDate(new Date(sub.current_period_end * 1000), cfg.dateFormat, cfg.locale),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      items: sub.items?.data?.map((item: any) => ({
        id: item.id,
        productName: item.price?.product?.name || 'Product',
        price: formatCurrency(item.price?.unit_amount / 100 || 0, item.price?.currency || cfg.currency, cfg.locale),
        quantity: item.quantity,
        interval: item.price?.recurring?.interval || 'one-time',
      })),
    },
    metadata: {
      raw: sub,
    },
  }
}

/**
 * Format Notion Page for display
 */
export function formatNotionPage(page: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  // Extract title from properties
  const titleProperty = Object.values(page.properties || {}).find(
    (prop: any) => prop.type === 'title'
  ) as any
  const title = titleProperty?.title?.[0]?.plain_text || 'Untitled'
  
  return {
    type: 'notion_page',
    displayName: title,
    data: {
      id: page.id,
      title,
      url: page.url,
      icon: page.icon?.emoji || page.icon?.external?.url,
      cover: page.cover?.external?.url || page.cover?.file?.url,
      createdAt: formatDate(page.created_time, cfg.dateFormat, cfg.locale),
      updatedAt: formatDate(page.last_edited_time, cfg.dateFormat, cfg.locale),
      archived: page.archived,
      parentType: page.parent?.type,
    },
    metadata: {
      raw: page,
    },
  }
}

/**
 * Format Google Drive File for display
 */
export function formatDriveFile(file: any, config: FormatterConfig = {}): FormattedData {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  const mimeTypeIcons: Record<string, string> = {
    'application/vnd.google-apps.document': 'file-text',
    'application/vnd.google-apps.spreadsheet': 'table',
    'application/vnd.google-apps.presentation': 'presentation',
    'application/vnd.google-apps.folder': 'folder',
    'application/pdf': 'file-text',
    'image/': 'image',
    'video/': 'video',
  }
  
  let icon = 'file'
  for (const [mime, iconName] of Object.entries(mimeTypeIcons)) {
    if (file.mimeType?.startsWith(mime)) {
      icon = iconName
      break
    }
  }
  
  return {
    type: 'drive_file',
    displayName: file.name,
    data: {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      icon,
      size: file.size ? formatFileSize(parseInt(file.size)) : null,
      webViewLink: file.webViewLink,
      downloadLink: file.webContentLink,
      thumbnail: file.thumbnailLink,
      createdAt: formatDate(file.createdTime, cfg.dateFormat, cfg.locale),
      modifiedAt: formatDate(file.modifiedTime, cfg.dateFormat, cfg.locale),
      shared: file.shared,
    },
    metadata: {
      raw: file,
    },
  }
}

// ============================================
// AUTO-FORMATTER
// ============================================

/**
 * Auto-detect and format MCP response data
 */
export function autoFormat(
  data: any,
  serverSlug?: string,
  toolName?: string,
  config: FormatterConfig = {}
): FormattedData | FormattedData[] {
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => autoFormat(item, serverSlug, toolName, config) as FormattedData)
  }
  
  // Detect type from server/tool
  if (serverSlug === 'gohighlevel' || serverSlug === 'ghl') {
    if (toolName?.includes('contact')) return formatContact(data, config)
    if (toolName?.includes('blog')) return formatBlogPost(data, config)
    if (toolName?.includes('product')) return formatProduct(data, config)
    if (toolName?.includes('opportunity')) return formatOpportunity(data, config)
    if (toolName?.includes('appointment')) return formatAppointment(data, config)
  }
  
  if (serverSlug === 'stripe') {
    if (toolName?.includes('customer')) return formatStripeCustomer(data, config)
    if (toolName?.includes('subscription')) return formatStripeSubscription(data, config)
  }
  
  if (serverSlug === 'notion') {
    if (data.object === 'page') return formatNotionPage(data, config)
  }
  
  if (serverSlug === 'google-drive') {
    if (data.mimeType) return formatDriveFile(data, config)
  }
  
  // Detect type from data shape
  if (data.blogContent || data.urlSlug) return formatBlogPost(data, config)
  if (data.variants && data.productType) return formatProduct(data, config)
  if (data.pipelineId && data.pipelineStageId) return formatOpportunity(data, config)
  if (data.startTime && data.endTime) return formatAppointment(data, config)
  if (data.email && (data.firstName || data.lastName || data.tags)) return formatContact(data, config)
  
  // Return raw data wrapped
  return {
    type: 'unknown',
    displayName: data.name || data.title || data.id || 'Data',
    data,
    metadata: { raw: data },
  }
}

// ============================================
// EXPORT
// ============================================

export const formatters = {
  // Utilities
  date: formatDate,
  currency: formatCurrency,
  number: formatNumber,
  percent: formatPercent,
  truncate: truncateText,
  stripHtml,
  phone: formatPhone,
  initials: getInitials,
  fileSize: formatFileSize,
  
  // MCP-specific
  contact: formatContact,
  blogPost: formatBlogPost,
  product: formatProduct,
  opportunity: formatOpportunity,
  appointment: formatAppointment,
  stripeCustomer: formatStripeCustomer,
  stripeSubscription: formatStripeSubscription,
  notionPage: formatNotionPage,
  driveFile: formatDriveFile,
  
  // Auto-formatter
  auto: autoFormat,
}

export default formatters
