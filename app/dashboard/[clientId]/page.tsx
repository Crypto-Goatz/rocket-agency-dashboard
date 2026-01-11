'use client'

import {
  Users, MessageSquare, GitBranch, Calendar, Workflow, Settings,
  Tags, Mail, Phone, Globe, Database, Webhook, Zap, FileJson,
  BarChart3, Bot, FileText, Rocket, Store, Shield, Key, Clock,
  ArrowLeft, Building2, MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// App/Tool definitions with icons and colors
const apps = [
  // GHL Core
  { id: 'contacts', name: 'Contacts', description: 'Manage CRM contacts', icon: Users, color: 'bg-blue-500', category: 'GHL Core' },
  { id: 'conversations', name: 'Conversations', description: 'SMS, Email, Chat threads', icon: MessageSquare, color: 'bg-green-500', category: 'GHL Core' },
  { id: 'pipelines', name: 'Pipelines', description: 'Sales pipelines & opportunities', icon: GitBranch, color: 'bg-purple-500', category: 'GHL Core' },
  { id: 'calendars', name: 'Calendars', description: 'Appointments & scheduling', icon: Calendar, color: 'bg-orange-500', category: 'GHL Core' },
  { id: 'workflows', name: 'Workflows', description: 'Automation workflows', icon: Workflow, color: 'bg-pink-500', category: 'GHL Core' },
  { id: 'tags', name: 'Tags', description: 'Contact tags management', icon: Tags, color: 'bg-yellow-500', category: 'GHL Core' },
  { id: 'custom-values', name: 'Custom Values', description: 'Location custom values', icon: Database, color: 'bg-cyan-500', category: 'GHL Core' },
  { id: 'custom-fields', name: 'Custom Fields', description: 'Contact custom fields', icon: FileJson, color: 'bg-indigo-500', category: 'GHL Core' },

  // Communication
  { id: 'send-sms', name: 'Send SMS', description: 'Send text messages', icon: Phone, color: 'bg-emerald-500', category: 'Communication' },
  { id: 'send-email', name: 'Send Email', description: 'Send email messages', icon: Mail, color: 'bg-red-500', category: 'Communication' },
  { id: 'webhooks', name: 'Webhooks', description: 'Incoming webhooks', icon: Webhook, color: 'bg-amber-500', category: 'Communication' },

  // Automation
  { id: 'rocketflow', name: 'RocketFlow', description: 'JSON workflow automation', icon: Zap, color: 'bg-orange-600', category: 'Automation' },
  { id: 'triggers', name: 'Triggers', description: 'Automation triggers', icon: Clock, color: 'bg-violet-500', category: 'Automation' },
  { id: 'rocket-agents', name: 'Rocket Agents', description: 'AI agent workflows', icon: Bot, color: 'bg-fuchsia-500', category: 'Automation' },

  // AI & Content
  { id: 'content-ai', name: 'Content AI', description: 'AI content generation', icon: FileText, color: 'bg-teal-500', category: 'AI & Content' },
  { id: 'ai-insights', name: 'AI Insights', description: 'Analytics & predictions', icon: BarChart3, color: 'bg-sky-500', category: 'AI & Content' },

  // Integrations
  { id: 'api-test', name: 'API Tester', description: 'Test GHL API endpoints', icon: Globe, color: 'bg-gray-500', category: 'Integrations' },
  { id: 'mcp-tools', name: 'MCP Tools', description: 'Model Context Protocol', icon: Rocket, color: 'bg-rose-500', category: 'Integrations' },
  { id: 'skills', name: 'Skills', description: 'Import/export skills', icon: Store, color: 'bg-lime-500', category: 'Integrations' },

  // Settings
  { id: 'api-keys', name: 'API Keys', description: 'Manage API keys', icon: Key, color: 'bg-slate-500', category: 'Settings' },
  { id: 'permissions', name: 'Permissions', description: 'Access control', icon: Shield, color: 'bg-zinc-500', category: 'Settings' },
  { id: 'settings', name: 'Settings', description: 'Client settings', icon: Settings, color: 'bg-neutral-500', category: 'Settings' },
]

// Group apps by category
const categories = [...new Set(apps.map(app => app.category))]

export default function ClientDashboard() {
  const params = useParams()
  const clientId = params.clientId as string

  // In production, fetch client data from API
  const clientName = clientId === '6MSqx0trfxgLxeHBJE1k' ? 'RocketOpp Demo' :
                     clientId === 'client-2' ? 'EcoSpray Solutions' :
                     clientId === 'client-3' ? 'Pittsburgh Marketing Co' :
                     clientId === 'client-4' ? 'Steel City HVAC' : 'Client'

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-[#222222] border-b border-[#333333] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-[#333333] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{clientName}</h1>
              <p className="text-gray-400 text-sm">Location ID: {clientId}</p>
            </div>
          </div>
          <button className="p-2 hover:bg-[#333333] rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="p-6">
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {apps
                .filter(app => app.category === category)
                .map((app) => (
                  <Link
                    key={app.id}
                    href={`/dashboard/${clientId}/${app.id}`}
                    className="group bg-[#2a2a2a] hover:bg-[#333333] border border-[#404040] hover:border-[#505050] rounded-xl p-4 transition-all hover:shadow-lg"
                  >
                    <div className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <app.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1 truncate">
                      {app.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {app.description}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
