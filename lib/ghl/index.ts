/**
 * GHL Module Exports
 */

// Client exports
export * from './client'
export { ghl, isGHLConfigured } from './client'
export type {
  GHLContact,
  GHLConversation,
  GHLMessage,
  GHLOpportunity,
  GHLPipeline,
  GHLCalendar,
  GHLAppointment,
  GHLWorkflow,
  GHLBlogPost,
  GHLBlogCategory,
  GHLProduct,
  GHLLocation,
  GHLCustomField,
  GHLCustomValue,
  GHLTag,
  GHLUser,
  GHLForm,
  GHLFormSubmission,
  GHLVoiceAgent,
} from './client'

// Auth exports
export * from './auth'
export { auth } from './auth'
export type { SessionUser, UserRole, AuthResult } from './auth'
