'use client'

import { Building2, Users, Mail, Phone, MapPin, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'

// Demo clients - in production, fetch from Supabase/GHL
const clients = [
  {
    id: '6MSqx0trfxgLxeHBJE1k',
    name: 'RocketOpp Demo',
    email: 'demo@rocketopp.com',
    phone: '+1 (555) 123-4567',
    location: 'Pittsburgh, PA',
    status: 'active',
    contacts: 1250,
    logo: null,
  },
  {
    id: 'client-2',
    name: 'EcoSpray Solutions',
    email: 'info@ecospraysolutions.com',
    phone: '+1 (412) 555-0199',
    location: 'Murrysville, PA',
    status: 'active',
    contacts: 342,
    logo: null,
  },
  {
    id: 'client-3',
    name: 'Pittsburgh Marketing Co',
    email: 'hello@pghmarketing.com',
    phone: '+1 (412) 555-0234',
    location: 'Pittsburgh, PA',
    status: 'active',
    contacts: 856,
    logo: null,
  },
  {
    id: 'client-4',
    name: 'Steel City HVAC',
    email: 'service@steelcityhvac.com',
    phone: '+1 (412) 555-0567',
    location: 'Pittsburgh, PA',
    status: 'paused',
    contacts: 423,
    logo: null,
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Agency Dashboard</h1>
            <p className="text-gray-400 text-sm">Select a client to access their apps and integrations</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/dashboard/${client.id}`}
            className="group bg-[#2a2a2a] hover:bg-[#333333] border border-[#404040] rounded-xl p-5 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
          >
            {/* Client Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {client.name.charAt(0)}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                client.status === 'active'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {client.status}
              </span>
            </div>

            {/* Client Name */}
            <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-orange-400 transition-colors">
              {client.name}
            </h3>

            {/* Client Details */}
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{client.location}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-[#404040] flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">{client.contacts.toLocaleString()} contacts</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors" />
            </div>
          </Link>
        ))}

        {/* Add Client Card */}
        <button className="bg-[#2a2a2a]/50 border-2 border-dashed border-[#404040] hover:border-orange-500/50 rounded-xl p-5 flex flex-col items-center justify-center min-h-[240px] transition-all group">
          <div className="w-12 h-12 bg-[#333333] group-hover:bg-orange-500/20 rounded-lg flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6 text-gray-500 group-hover:text-orange-400" />
          </div>
          <span className="text-gray-500 group-hover:text-orange-400 font-medium">Add New Client</span>
          <span className="text-gray-600 text-sm mt-1">Connect a GHL location</span>
        </button>
      </div>
    </div>
  )
}
