/**
 * GHL Content Fetcher
 * 
 * Fetches and caches content from GHL for site display:
 * - Blog posts
 * - Custom values (site config)
 * - Location info
 * - Products
 * 
 * Provides Next.js-friendly data structures with caching.
 */

import { 
  ghl, 
  GHLBlogPost, 
  GHLProduct, 
  GHLLocation, 
  GHLCustomValue,
  GHLBlogCategory 
} from '../ghl/client'

// ============================================
// TYPES
// ============================================

export interface SiteConfig {
  // Basic Info
  siteName: string
  siteTagline: string
  siteDescription: string
  siteUrl: string
  
  // Branding
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  faviconUrl?: string
  
  // Hero Section
  heroHeadline: string
  heroSubheadline: string
  heroCtaText: string
  heroCtaUrl: string
  heroBackgroundImage?: string
  
  // Contact Info
  contactEmail: string
  contactPhone: string
  contactAddress: string
  
  // Social Links
  socialTwitter?: string
  socialFacebook?: string
  socialInstagram?: string
  socialLinkedin?: string
  socialYoutube?: string
  socialTiktok?: string
  
  // Footer
  footerText: string
  footerCopyright: string
  
  // SEO
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  ogImage?: string
  
  // Analytics
  googleAnalyticsId?: string
  facebookPixelId?: string
  
  // Features
  enableBlog: boolean
  enableShop: boolean
  enableBooking: boolean
  enableChat: boolean
  
  // Custom
  [key: string]: any
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'draft' | 'published'
  author: {
    id?: string
    name: string
  }
  category?: {
    id: string
    name: string
    slug: string
  }
  featuredImage?: string
  publishedAt: string
  updatedAt: string
  seo: {
    title: string
    description: string
  }
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  priceFormatted: string
  productType: 'digital' | 'physical' | 'service'
  image?: string
  variants: Array<{
    id: string
    name: string
    price: number
    priceFormatted: string
  }>
}

export interface LocationInfo {
  id: string
  name: string
  email?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
    formatted: string
  }
  website?: string
  timezone?: string
  logo?: string
}

// ============================================
// CACHING
// ============================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<any>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  
  const isExpired = Date.now() - entry.timestamp > entry.ttl
  if (isExpired) {
    cache.delete(key)
    return null
  }
  
  return entry.data
}

function setCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  })
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// ============================================
// SITE CONFIG
// ============================================

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'My Site',
  siteTagline: 'Welcome to my site',
  siteDescription: 'A website built with Rocket Site Builder',
  siteUrl: '',
  
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  accentColor: '#F59E0B',
  
  heroHeadline: 'Welcome',
  heroSubheadline: 'Build something amazing',
  heroCtaText: 'Get Started',
  heroCtaUrl: '/contact',
  
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  
  footerText: '',
  footerCopyright: `© ${new Date().getFullYear()} All rights reserved.`,
  
  enableBlog: true,
  enableShop: false,
  enableBooking: false,
  enableChat: false,
}

/**
 * Parse custom values into site config
 */
function parseCustomValues(customValues: GHLCustomValue[]): Partial<SiteConfig> {
  const config: Partial<SiteConfig> = {}
  
  for (const cv of customValues) {
    // Convert custom value name to camelCase config key
    const key = cv.name
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
    
    // Parse boolean values
    if (cv.value === 'true') {
      config[key] = true
    } else if (cv.value === 'false') {
      config[key] = false
    } else {
      config[key] = cv.value
    }
  }
  
  return config
}

/**
 * Fetch site configuration from GHL custom values
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const cacheKey = 'site-config'
  const cached = getCached<SiteConfig>(cacheKey)
  if (cached) return cached
  
  try {
    const [{ customValues }, { location: locationInfo }] = await Promise.all([
      ghl.location.getCustomValues(),
      ghl.location.get(),
    ])
    
    const parsedConfig = parseCustomValues(customValues)
    
    const config: SiteConfig = {
      ...DEFAULT_CONFIG,
      ...parsedConfig,
      // Override with location info if not set
      siteName: parsedConfig.siteName || locationInfo.name,
      contactEmail: parsedConfig.contactEmail || locationInfo.email || '',
      contactPhone: parsedConfig.contactPhone || locationInfo.phone || '',
      logoUrl: parsedConfig.logoUrl || locationInfo.logoUrl,
      siteUrl: parsedConfig.siteUrl || locationInfo.website || '',
    }
    
    // Build address if not set
    if (!config.contactAddress && locationInfo.address) {
      config.contactAddress = [
        locationInfo.address,
        locationInfo.city,
        locationInfo.state,
        locationInfo.postalCode,
        locationInfo.country,
      ].filter(Boolean).join(', ')
    }
    
    setCache(cacheKey, config, 300000) // 5 minute cache
    return config
  } catch (error) {
    console.error('Error fetching site config:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * Get a specific config value
 */
export async function getConfigValue<K extends keyof SiteConfig>(
  key: K
): Promise<SiteConfig[K]> {
  const config = await getSiteConfig()
  return config[key]
}

// ============================================
// BLOG CONTENT
// ============================================

/**
 * Transform GHL blog post to site-friendly format
 */
function transformBlogPost(
  post: GHLBlogPost,
  categories?: GHLBlogCategory[]
): BlogPost {
  const category = categories?.find(c => c.id === post.categoryId)
  
  // Extract excerpt from content (first 160 chars, strip HTML)
  const excerpt = post.blogContent
    .replace(/<[^>]*>/g, '')
    .substring(0, 160)
    .trim() + '...'
  
  return {
    id: post.id,
    title: post.title,
    slug: post.urlSlug,
    content: post.blogContent,
    excerpt,
    status: post.status === 'PUBLISHED' ? 'published' : 'draft',
    author: {
      id: post.author?.id,
      name: post.author?.name || 'Unknown',
    },
    category: category ? {
      id: category.id,
      name: category.name,
      slug: category.slug,
    } : undefined,
    featuredImage: post.featuredImage,
    publishedAt: post.createdAt,
    updatedAt: post.updatedAt,
    seo: {
      title: post.title,
      description: post.description || excerpt,
    },
  }
}

/**
 * Get all published blog posts
 */
export async function getBlogPosts(options?: {
  limit?: number
  categoryId?: string
  includeCategories?: boolean
}): Promise<BlogPost[]> {
  const cacheKey = `blog-posts-${options?.limit || 'all'}-${options?.categoryId || 'all'}`
  const cached = getCached<BlogPost[]>(cacheKey)
  if (cached) return cached
  
  try {
    const [{ posts }, categoriesResult] = await Promise.all([
      ghl.blogs.list({
        status: 'PUBLISHED',
        limit: options?.limit,
        categoryId: options?.categoryId,
      }),
      options?.includeCategories !== false 
        ? ghl.blogs.getCategories() 
        : Promise.resolve({ categories: [] }),
    ])
    
    const blogPosts = posts.map(post => 
      transformBlogPost(post, categoriesResult.categories)
    )
    
    setCache(cacheKey, blogPosts, 60000) // 1 minute cache
    return blogPosts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const cacheKey = `blog-post-${slug}`
  const cached = getCached<BlogPost>(cacheKey)
  if (cached) return cached
  
  try {
    const [post, { categories }] = await Promise.all([
      ghl.blogs.getBySlug(slug),
      ghl.blogs.getCategories(),
    ])
    
    if (!post) return null
    
    const blogPost = transformBlogPost(post, categories)
    setCache(cacheKey, blogPost, 60000)
    return blogPost
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

/**
 * Get blog categories
 */
export async function getBlogCategories(): Promise<Array<{
  id: string
  name: string
  slug: string
  postCount?: number
}>> {
  const cacheKey = 'blog-categories'
  const cached = getCached<any[]>(cacheKey)
  if (cached) return cached
  
  try {
    const { categories } = await ghl.blogs.getCategories()
    
    const result = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    }))
    
    setCache(cacheKey, result, 300000) // 5 minute cache
    return result
  } catch (error) {
    console.error('Error fetching blog categories:', error)
    return []
  }
}

// ============================================
// PRODUCTS
// ============================================

/**
 * Format price for display
 */
function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Transform GHL product to site-friendly format
 */
function transformProduct(product: GHLProduct): Product {
  const primaryVariant = product.variants[0]
  
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: primaryVariant?.priceDecimal || 0,
    currency: primaryVariant?.currency || 'USD',
    priceFormatted: formatPrice(
      primaryVariant?.priceDecimal || 0,
      primaryVariant?.currency
    ),
    productType: product.productType.toLowerCase() as 'digital' | 'physical' | 'service',
    variants: product.variants.map(v => ({
      id: v.id,
      name: v.name,
      price: v.priceDecimal,
      priceFormatted: formatPrice(v.priceDecimal, v.currency),
    })),
  }
}

/**
 * Get all products
 */
export async function getProducts(options?: {
  limit?: number
}): Promise<Product[]> {
  const cacheKey = `products-${options?.limit || 'all'}`
  const cached = getCached<Product[]>(cacheKey)
  if (cached) return cached
  
  try {
    const { products } = await ghl.products.list({ limit: options?.limit })
    
    const result = products.map(transformProduct)
    setCache(cacheKey, result, 60000)
    return result
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<Product | null> {
  const cacheKey = `product-${id}`
  const cached = getCached<Product>(cacheKey)
  if (cached) return cached
  
  try {
    const { product } = await ghl.products.get(id)
    if (!product) return null
    
    const result = transformProduct(product)
    setCache(cacheKey, result, 60000)
    return result
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// ============================================
// LOCATION INFO
// ============================================

/**
 * Get location/business info
 */
export async function getLocationInfo(): Promise<LocationInfo> {
  const cacheKey = 'location-info'
  const cached = getCached<LocationInfo>(cacheKey)
  if (cached) return cached
  
  try {
    const { location: loc } = await ghl.location.get()
    
    const address = {
      street: loc.address,
      city: loc.city,
      state: loc.state,
      country: loc.country,
      postalCode: loc.postalCode,
      formatted: [loc.address, loc.city, loc.state, loc.postalCode, loc.country]
        .filter(Boolean)
        .join(', '),
    }
    
    const result: LocationInfo = {
      id: loc.id,
      name: loc.name,
      email: loc.email,
      phone: loc.phone,
      address: address.formatted ? address : undefined,
      website: loc.website,
      timezone: loc.timezone,
      logo: loc.logoUrl,
    }
    
    setCache(cacheKey, result, 300000) // 5 minute cache
    return result
  } catch (error) {
    console.error('Error fetching location info:', error)
    return {
      id: '',
      name: 'My Business',
    }
  }
}

// ============================================
// TESTIMONIALS (via tagged contacts)
// ============================================

export interface Testimonial {
  id: string
  name: string
  company?: string
  role?: string
  text: string
  rating?: number
  image?: string
}

/**
 * Get testimonials (contacts tagged with "testimonial")
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  const cacheKey = 'testimonials'
  const cached = getCached<Testimonial[]>(cacheKey)
  if (cached) return cached
  
  try {
    const { contacts } = await ghl.contacts.list({ query: 'tag:testimonial' })
    
    // Custom fields would need to be set up for testimonials
    // This is a simplified version
    const testimonials: Testimonial[] = contacts.map(contact => ({
      id: contact.id,
      name: contact.name || `${contact.firstName} ${contact.lastName}`.trim(),
      text: '', // Would come from custom field
      rating: 5,
    }))
    
    setCache(cacheKey, testimonials, 300000)
    return testimonials
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return []
  }
}

// ============================================
// CONTENT FETCHER EXPORT
// ============================================

export const content = {
  // Config
  getSiteConfig,
  getConfigValue,
  
  // Blog
  getBlogPosts,
  getBlogPost,
  getBlogCategories,
  
  // Products
  getProducts,
  getProduct,
  
  // Location
  getLocationInfo,
  
  // Testimonials
  getTestimonials,
  
  // Cache management
  clearCache,
}

export default content
