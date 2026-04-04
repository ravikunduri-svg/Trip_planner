import { useState, useEffect } from 'react'
import { Plus, Copy, Check, Users } from 'lucide-react'
import { supabase } from '../supabase'

function TripStatusBadge({ stages }) {
  if (!stages || stages.length === 0) return <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">No stages</span>
  const locked = stages.filter(s => s.status === 'locked').length
  if (locked === stages.length) return <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">🔒 Locked</span>
  if (locked > 0) return <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">⚡ {locked}/{stages.length} locked</span>
  return <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">🗳️ Voting</span>
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function GroupDashboard({ group, me, onStartTrip, onOpenTrip }) {
  const [members, setMembers] = useState([])
  const [trips, setTrips] = useState([])
  const [linkCopied, setLinkCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const shareUrl = `${window.location.origin}${window.location.pathname}?group=${group.id}`

  async function load() {
    const [{ data: membersData }, { data: tripsData }] = await Promise.all([
      supabase.from('group_members').select('*').eq('group_id', group.id).order('created_at'),
      supabase.from('trips').select('*, stages(id, status, locked_option_id)').eq('group_id', group.id).order('created_at', { ascending: false }),
    ])
    setMembers(membersData || [])
    setTrips(tripsData || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`group-${group.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `group_id=eq.${group.id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${group.id}` }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [group.id])

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-10 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users size={10} /> {members.length} members
              </span>
              {me.is_admin && (
                <span className="text-[9px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">ADMIN</span>
              )}
            </div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-xl text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
          >
            {linkCopied ? <Check size={12} /> : <Copy size={12} />}
            {linkCopied ? 'Copied!' : 'Invite'}
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-10">
        {/* Members */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Members</h3>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full ${m.color} text-white text-[10px] font-bold flex items-center justify-center`}>
                  {m.initials}
                </div>
                <span className="text-xs text-gray-700">{m.name}</span>
                {m.id === me.id && <span className="text-[9px] text-gray-400">(you)</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Trips */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trips</h2>
            <span className="text-xs text-gray-400">{trips.length} total</span>
          </div>

          {loading ? (
            <div className="text-xs text-gray-400 text-center py-6">Loading...</div>
          ) : trips.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <div className="text-3xl mb-2">✈️</div>
              <p className="text-sm font-semibold text-gray-700">No trips yet</p>
              <p className="text-xs text-gray-400 mt-1">Start your first trip below</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map(trip => {
                const lockedCount = trip.stages?.filter(s => s.status === 'locked').length ?? 0
                const totalStages = trip.stages?.length ?? 0
                const progress = totalStages ? Math.round((lockedCount / totalStages) * 100) : 0

                return (
                  <button
                    key={trip.id}
                    onClick={() => onOpenTrip(trip.id)}
                    className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:border-violet-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{trip.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs bg-violet-100 text-violet-700 font-medium px-1.5 py-0.5 rounded-full">{trip.vibe}</span>
                          <span className="text-xs text-gray-400">{timeAgo(trip.created_at)}</span>
                        </div>
                      </div>
                      <TripStatusBadge stages={trip.stages} />
                    </div>
                    {totalStages > 0 && (
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Start new trip */}
        <button
          onClick={onStartTrip}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-violet-200"
        >
          <Plus size={18} /> Start New Trip
        </button>
      </div>
    </div>
  )
}
