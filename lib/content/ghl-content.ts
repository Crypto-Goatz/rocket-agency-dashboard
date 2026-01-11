// ============================================================
// GHL Content Fetcher
// ============================================================
// Pulls structured content from GHL for deployed sites:
// - Blog posts
// - Custom Values (site config, text content)
// - Forms/Surveys
// - Products
// - Testimonials (from contacts with tag)
// ============================================================

import { ghl } from '../ghl/client'

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache: Map<string, { data: any; timestamp: number }> = new Map()

function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

// ============================================================
// BLOG POSTS
// ============================================================

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  featuredImage?: string
  author?: string
  category?: string
  categoryId?: string
  tags?: string[]
  status: 'PUBLISHED' | 'DRAFT'
  publishedAt?: string
  createdAt: string
  updatedAt?: string
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

/**
 * Fetch all published blog posts
 */
export async function getBlogPosts(options?: {
  status?: 'PUBLISHED' | 'DRAFT'
  category?: string
  limit?: number
  offset?: number
}): Promise<BlogPost[]> {
  const cacheKey = `blogs:${JSON.stringify(options)}`
  const cached = getCached<BlogPost[]>(cacheKey)
  if (cached) return cached

  const GHL_API_BASE = 'https://services.leadconnectorhq.com'
  const locationId = process.env.GHL_LOCATION_ID!
  const token = process.env.GHL_LOCATION_PIT!

  const searchParams = new URLSearchParams({ locationId })
  if (options?.status) searchParams.set('status', options.status)
  if (options?.limit) searchParams.set('limit', String(options.limit))
  if (options?.offset) searchParams.set('offset', String(options.offset))

  const res = await fetch(`${GHL_API_BASE}/blogs/posts?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
    },
  })

  const data = await res.json()
  
  const posts: BlogPost[] = (data.posts || []).map((post: any) => ({
    id: post.id,
    title: post.title,
    slug: post.urlSlug,
    content: post.blogContent,
    excerpt: post.description,
    featuredImage: post.imageUrl,
    author: post.author,
    category: post.categoryName,
    categoryId: post.categoryId,
    status: post.status,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    seo: {
      title: post.seoTitle,
      description: post.seoDescription,
      keywords: post.seoKeywords,
    },
  }))

  // Filter by category if specified
  const filtered = options?.category
    ? posts.filter(p => p.category?.toLowerCase() === options.category?.toLowerCase())
    : posts

  setCache(cacheKey, filtered)
  return filtered
}

/**
 * Fetch a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const cacheKey = `blog:${slug}`
  const cached = getCached<BlogPost>(cacheKey)
  if (cached) return cached

  // GHL doesn't have a direct slug lookup, so we fetch all and filter
  const posts = await getBlogPosts({ status: 'PUBLISHED' })
  const post = posts.find(p => p.slug === slug)

  if (post) {
    setCache(cacheKey, post)
  }

  return post || null
}

/**
 * Get blog categories
 */
export async function getBlogCategories(): Promise<{ id: string; name: string }[]> {
  const cacheKey = 'blog:categories'
  const cached = getCached<{ id: string; name: string }[]>(cacheKey)
  if (cached) return cached

  const GHL_API_BASE = 'https://services.leadconnectorhq.com'
  const locationId = process.env.GHL_LOCATION_ID!
  const token = process.env.GHL_LOCATION_PIT!

  const res = await fetch(`${GHL_API_BASE}/blogs/categories?locationId=${locationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
    },
  })

  const data = await res.json()
  const categories = data.categories || []

  setCache(cacheKey, categories)
  return categories
}

// ============================================================
// SITE CONFIGURATION (Custom Values)
// ============================================================

export interface SiteConfig {
  siteName?: string
  tagline?: string
  description?: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  analytics?: {
    googleAnalyticsId?: string
    facebookPixelId?: string
  }
  [key: string]: any
}

/**
 * Fetch site configuration from GHL Custom Values
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const cacheKey = 'site:config'
  const cached = getCached<SiteConfig>(cacheKey)
  if (cached) return cached

  const { customValues } = await ghl.location.getCustomValues()

  const config: SiteConfig = {}
  const socialLinks: Record<string, string> = {}
  const analytics: Record<string, string> = {}

  for (const cv of customValues) {
    const key = cv.name.toLowerCase().replace(/\s+/g, '_')
    
    // Parse social links
    if (key.startsWith('social_')) {
      const platform = key.replace('social_', '')
      socialLinks[platform] = cv.value
    }
    // Parse analytics
    else if (key.startsWith('analytics_')) {
      const type = key.replace('analytics_', '')
      analytics[type] = cv.value
    }
    // Parse general config
    else {
      switch (key) {
        case 'site_name':
          config.siteName = cv.value
          break
        case 'tagline':
          config.tagline = cv.value
          break
        case 'description':
          config.description = cv.value
          break
        case 'logo_url':
          config.logoUrl = cv.value
          break
        case 'favicon_url':
          config.faviconUrl = cv.value
          break
        case 'primary_color':
          config.primaryColor = cv.value
          break
        case 'secondary_color':
          config.secondaryColor = cv.value
          break
        case 'contact_email':
          config.contactEmail = cv.value
          break
        case 'contact_phone':
          config.contactPhone = cv.value
          break
        case 'address':
          config.address = cv.value
          break
        default:
          config[key] = cv.value
      }
    }
  }

  if (Object.keys(socialLinks).length > 0) {
    config.socialLinks = socialLinks as any
  }
  if (Object.keys(analytics).length > 0) {
    config.analytics = analytics as any
  }

  setCache(cacheKey, config)
  return config
}

/**
 * Get a specific custom value
 */
export async function getCustomValue(name: string): Promise<string | null> {
  const { customValues } = await ghl.location.getCustomValues()
  const cv = customValues.find(v => 
    v.name.toLowerCase() === name.toLowerCase() ||
    v.name.toLowerCase().replace(/\s+/g, '_') === name.toLowerCase()
  )
  return cv?.value || null
}

// ============================================================
// PRODUCTS
// ============================================================

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  image?: string
  type: 'DIGITAL' | 'PHYSICAL'
  category?: string
  inStock?: boolean
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  name: string
  price: number
  sku?: string
}

/**
 * Fetch products
 */
export async function getProducts(options?: {
  limit?: number
  category?: string
}): Promise<Product[]> {
  const cacheKey = `products:${JSON.stringify(options)}`
  const cached = getCached<Product[]>(cacheKey)
  if (cached) return cached

  const GHL_API_BASE = 'https://services.leadconnectorhq.com'
  const locationId = process.env.GHL_LOCATION_ID!
  const token = process.env.GHL_LOCATION_PIT!

  const searchParams = new URLSearchParams({ locationId })
  if (options?.limit) searchParams.set('limit', String(options.limit))

  const res = await fetch(`${GHL_API_BASE}/products/?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Version': '2021-07-28',
    },
  })

  const data = await res.json()
  
  const products: Product[] = (data.products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.variants?.[0]?.priceDecimal * 100 || 0,
    currency: p.variants?.[0]?.currency || 'USD',
    image: p.imageUrl,
    type: p.productType,
    inStock: p.availableInStock !== false,
    variants: p.variants?.map((v: any) => ({
      id: v.id,
      name: v.name,
      price: v.priceDecimal * 100,
      sku: v.sku,
    })),
  }))

  setCache(cacheKey, products)
  return products
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(productId: string): Promise<Product | null> {
  const products = await getProducts()
  return products.find(p => p.id === productId) || null
}

// ============================================================
// TESTIMONIALS (Contacts with testimonial tag)
// ============================================================

export interface Testimonial {
  id: string
  name: string
  company?: string
  role?: string
  content: string
  rating?: number
  image?: string
  date?: string
}

/**
 * Fetch testimonials from contacts with "testimonial" tag
 */
export async function getTestimonials(limit?: number): Promise<Testimonial[]> {
  const cacheKey = `testimonials:${limit}`
  const cached = getCached<Testimonial[]>(cacheKey)
  if (cached) return cached

  // Search for contacts with testimonial tag
  // Note: GHL search doesn't filter by tag, so we get all and filter
  const { contacts } = await ghl.contacts.list({ limit: 100 })
  
  const testimonialContacts = contacts.filter(c => 
    c.tags?.includes('testimonial') || c.tags?.includes('testimonials')
  )

  const testimonials: Testimonial[] = testimonialContacts.map(c => ({
    id: c.id,
    name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
    company: c.customFields?.company as string,
    role: c.customFields?.role as string,
    content: c.customFields?.testimonial_text as string || '',
    rating: Number(c.customFields?.testimonial_rating) || 5,
    image: c.customFields?.profile_image as string,
    date: c.dateAdded,
  })).filter(t => t.content) // Only include those with testimonial text

  const result = limit ? testimonials.slice(0, limit) : testimonials
  setCache(cacheKey, result)
  return result
}

// ============================================================
// TEAM MEMBERS (for About page)
// ============================================================

export interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  role?: string
  bio?: string
  image?: string
  socialLinks?: {
    linkedin?: string
    twitter?: string
  }
}

/**
 * Fetch team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const cacheKey = 'team:members'
  const cached = getCached<TeamMember[]>(cacheKey)
  if (cached) return cached

  const { users } = await ghl.users.list()
  
  const members: TeamMember[] = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    // Additional fields would come from custom values or extended user data
  }))

  setCache(cacheKey, members)
  return members
}

// ============================================================
// FORMS
// ============================================================

export interface Form {
  id: string
  name: string
  fields?: any[]
}

/**
 * Fetch forms
 */
export async function getForms(): Promise<Form[]> {
  const cacheKey = 'forms:all'
  const cached = getCached<Form[]>(cacheKey)
  if (cached) return cached

  const { forms } = await ghl.forms.list()
  setCache(cacheKey, forms)
  return forms
}

// ============================================================
// SERVICES/OFFERINGS (from Custom Values)
// ============================================================

export interface Service {
  id: string
  name: string
  description: string
  price?: string
  features?: string[]
  icon?: string
  image?: string
  order?: number
}

/**
 * Fetch services from custom values
 * Expects custom values named: service_1_name, service_1_description, etc.
 */
export async function getServices(): Promise<Service[]> {
  const cacheKey = 'services:all'
  const cached = getCached<Service[]>(cacheKey)
  if (cached) return cached

  const { customValues } = await ghl.location.getCustomValues()
  
  // Group by service number
  const serviceData: Record<string, Record<string, string>> = {}
  
  for (const cv of customValues) {
    const match = cv.name.match(/^service_(\d+)_(.+)$/i)
    if (match) {
      const [, num, field] = match
      if (!serviceData[num]) serviceData[num] = {}
      serviceData[num][field.toLowerCase()] = cv.value
    }
  }

  const services: Service[] = Object.entries(serviceData).map(([id, data]) => ({
    id,
    name: data.name || `Service ${id}`,
    description: data.description || '',
    price: data.price,
    features: data.features?.split(',').map(f => f.trim()),
    icon: data.icon,
    image: data.image,
    order: parseInt(id),
  })).sort((a, b) => (a.order || 0) - (b.order || 0))

  setCache(cacheKey, services)
  return services
}

// ============================================================
// FAQ (from Custom Values)
// ============================================================

export interface FAQ {
  id: string
  question: string
  answer: string
  category?: string
  order?: number
}

/**
 * Fetch FAQs from custom values
 * Expects: faq_1_question, faq_1_answer, etc.
 */
export async function getFAQs(): Promise<FAQ[]> {
  const cacheKey = 'faqs:all'
  const cached = getCached<FAQ[]>(cacheKey)
  if (cached) return cached

  const { customValues } = await ghl.location.getCustomValues()
  
  const faqData: Record<string, Record<string, string>> = {}
  
  for (const cv of customValues) {
    const match = cv.name.match(/^faq_(\d+)_(.+)$/i)
    if (match) {
      const [, num, field] = match
      if (!faqData[num]) faqData[num] = {}
      faqData[num][field.toLowerCase()] = cv.value
    }
  }

  const faqs: FAQ[] = Object.entries(faqData)
    .filter(([, data]) => data.question && data.answer)
    .map(([id, data]) => ({
      id,
      question: data.question,
      answer: data.answer,
      category: data.category,
      order: parseInt(id),
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  setCache(cacheKey, faqs)
  return faqs
}

// ============================================================
// CONTENT SECTIONS (Generic)
// ============================================================

/**
 * Fetch any content section by prefix
 * Example: getContentSection('hero') returns all custom values starting with "hero_"
 */
export async function getContentSection(prefix: string): Promise<Record<string, string>> {
  const cacheKey = `section:${prefix}`
  const cached = getCached<Record<string, string>>(cacheKey)
  if (cached) return cached

  const { customValues } = await ghl.location.getCustomValues()
  
  const section: Record<string, string> = {}
  
  for (const cv of customValues) {
    if (cv.name.toLowerCase().startsWith(`${prefix.toLowerCase()}_`)) {
      const key = cv.name.substring(prefix.length + 1).toLowerCase()
      section[key] = cv.value
    }
  }

  setCache(cacheKey, section)
  return section
}
