import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import posthog from 'posthog-js'
import { supabase } from '../supabase'
import { STAGE_TEMPLATES, MEMBER_COLORS } from '../data/stageTemplates'
import { logActivity } from '../lib/activity'

const VIBES = ['Beach', 'Mountains', 'City', 'Heritage', 'Road Trip', 'Backpacking']

function getInitials(name) {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function CreateTripScreen({ onBack, onCreated }) {
  const [organizerName, setOrganizerName] = useState('')
  const [name, setName] = useState('')
  const [vibe, setVibe] = useState('')
  const [groupSize, setGroupSize] = useState(6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!organizerName.trim() || !name.trim() || !vibe) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)

    try {
      // 1. Create trip
      const { data: trip, error: tripErr } = await supabase
        .from('trips')
        .insert({ name: name.trim(), vibe, group_size: groupSize })
        .select()
        .single()
      if (tripErr) throw tripErr

      // 2. Create organizer member
      const localKey = crypto.randomUUID()
      const { data: member, error: memberErr } = await supabase
        .from('members')
        .insert({
          trip_id: trip.id,
          name: organizerName.trim(),
          initials: getInitials(organizerName),
          color: MEMBER_COLORS[0],
          is_organizer: true,
          local_key: localKey,
        })
        .select()
        .single()
      if (memberErr) throw memberErr

      // 3. Persist identity locally
      localStorage.setItem(`pkc_member_${trip.id}`, localKey)

      // 4. Create stages + default options
      for (const tmpl of STAGE_TEMPLATES) {
        const { data: stage, error: stageErr } = await supabase
          .from('stages')
          .insert({
            trip_id: trip.id,
            stage_key: tmpl.stage_key,
            title: tmpl.title,
            emoji: tmpl.emoji,
            position: tmpl.position,
          })
          .select()
          .single()
        if (stageErr) throw stageErr

        const { error: optsErr } = await supabase
          .from('options')
          .insert(tmpl.defaultOptions.map(label => ({ stage_id: stage.id, label })))
        if (optsErr) throw optsErr
      }

      posthog.capture('trip_created', { vibe, group_size: groupSize })
      logActivity(trip.id, member.id, 'joined')
      onCreated(trip, member)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const canCreate = organizerName.trim() && name.trim() && vibe

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-white">
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Plan a new trip</h1>
      </div>

      <div className="flex-1 px-6 py-2 space-y-6">
        {/* Organizer name */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Your name</label>
          <input
            type="text"
            placeholder="e.g. Shravan"
            value={organizerName}
            onChange={e => setOrganizerName(e.target.value)}
            className="w-full border-2 border-gray-200 focus:border-violet-400 rounded-2xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400"
          />
        </div>

        {/* Trip name */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Trip name</label>
          <input
            type="text"
            placeholder="e.g. Goa Escape, Manali Mission"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border-2 border-gray-200 focus:border-violet-400 rounded-2xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400"
          />
        </div>

        {/* Vibe */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Trip vibe</label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(v => (
              <button
                key={v}
                onClick={() => setVibe(v)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  vibe === v
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Group size */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">
            Group size: <span className="text-violet-600">{groupSize} people</span>
          </label>
          <input
            type="range" min={2} max={20} value={groupSize}
            onChange={e => setGroupSize(Number(e.target.value))}
            className="w-full accent-violet-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2</span><span>20</span>
          </div>
        </div>

        <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
          <p className="text-sm font-semibold text-violet-700">🚀 How it works</p>
          <p className="text-xs text-violet-600 mt-1 leading-relaxed">
            Create the trip, share the link, your group votes in real-time — you lock decisions. Trip planned.
          </p>
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>

      <div className="px-6 pb-10 pt-4">
        <button
          onClick={handleCreate}
          disabled={!canCreate || loading}
          className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-violet-200 disabled:shadow-none"
        >
          {loading ? 'Creating...' : !organizerName.trim() ? 'Enter your name' : !name.trim() ? 'Enter a trip name' : !vibe ? 'Pick a vibe' : 'Create Trip & Get Link 🎯'}
        </button>
      </div>
    </div>
  )
}
