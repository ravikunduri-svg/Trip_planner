import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import { supabase } from '../supabase'
import { MEMBER_COLORS } from '../data/stageTemplates'
import { logActivity } from '../lib/activity'

function getInitials(name) {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function JoinScreen({ tripId, onJoined, onNotFound }) {
  const [trip, setTrip] = useState(null)
  const [memberName, setMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchTrip() {
      const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
      if (!data) { onNotFound(); return }
      setTrip(data)
      setFetching(false)
    }
    fetchTrip()
  }, [tripId])

  async function handleJoin() {
    if (!memberName.trim()) { setError('Enter your name.'); return }
    setError('')
    setLoading(true)

    try {
      // Pick a color based on existing member count
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripId)

      const color = MEMBER_COLORS[(count || 0) % MEMBER_COLORS.length]
      const localKey = crypto.randomUUID()

      const { data: member, error: memberErr } = await supabase
        .from('members')
        .insert({
          trip_id: tripId,
          name: memberName.trim(),
          initials: getInitials(memberName),
          color,
          is_organizer: false,
          local_key: localKey,
        })
        .select()
        .single()
      if (memberErr) throw memberErr

      localStorage.setItem(`pkc_member_${tripId}`, localKey)
      posthog.capture('member_joined', { trip_id: tripId })
      logActivity(tripId, member.id, 'joined')
      onJoined(trip, member)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-sm mx-auto min-h-dvh flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-3xl font-black text-violet-600 mb-2">PlanKaroChalo</div>
          <div className="text-sm text-gray-400">Loading trip...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-white">
      <div className="pt-16 pb-6 px-6 text-center">
        <div className="text-3xl font-black text-violet-600 mb-1">PlanKaroChalo</div>
        <div className="text-sm text-gray-500">You've been invited to a trip</div>
      </div>

      <div className="mx-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl p-5 border border-violet-100 mb-8">
        <div className="text-xs font-bold text-violet-400 uppercase tracking-wide mb-1">Trip</div>
        <div className="text-xl font-black text-gray-900">{trip?.name}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs bg-violet-100 text-violet-700 font-medium px-2 py-0.5 rounded-full">{trip?.vibe}</span>
          <span className="text-xs text-gray-400">· {trip?.group_size} people</span>
        </div>
      </div>

      <div className="px-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">What's your name?</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Rahul"
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="w-full border-2 border-gray-200 focus:border-violet-400 rounded-2xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400"
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>

      <div className="px-6 pb-10 mt-auto pt-6">
        <button
          onClick={handleJoin}
          disabled={!memberName.trim() || loading}
          className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-violet-200 disabled:shadow-none"
        >
          {loading ? 'Joining...' : 'Join & Start Voting ✈️'}
        </button>
      </div>
    </div>
  )
}
