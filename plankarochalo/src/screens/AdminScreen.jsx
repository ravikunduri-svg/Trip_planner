import { useState, useEffect } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { supabase } from '../supabase'

function timeAgo(ts) {
  if (!ts) return 'never'
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getMomentumColor(lastActivity) {
  if (!lastActivity) return 'text-gray-400'
  const hrs = (Date.now() - new Date(lastActivity)) / 3600000
  if (hrs < 1)  return 'text-green-600'
  if (hrs < 6)  return 'text-amber-500'
  if (hrs < 24) return 'text-orange-500'
  return 'text-red-500'
}

function getMomentumLabel(lastActivity) {
  if (!lastActivity) return '👻 No activity'
  const hrs = (Date.now() - new Date(lastActivity)) / 3600000
  if (hrs < 1)  return '🔥 Hot'
  if (hrs < 6)  return '⚡ Active'
  if (hrs < 24) return '😐 Cooling'
  return '🧊 Cold'
}

function NudgeButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : 'Copy nudge'}
    </button>
  )
}

function TripCard({ trip, votes }) {
  const [open, setOpen] = useState(false)

  const stages = trip.stages || []
  const members = trip.members || []
  const lockedCount = stages.filter(s => s.status === 'locked').length
  const total = stages.length
  const isFullyLocked = total > 0 && lockedCount === total
  const progress = total ? Math.round((lockedCount / total) * 100) : 0
  const tripUrl = `${window.location.origin}${window.location.pathname}?trip=${trip.id}`

  // Compute per-member vote counts across open stages
  const openStages = stages.filter(s => s.status !== 'locked')
  const memberStats = members.map(m => {
    const votedOn = openStages.filter(s =>
      s.options?.some(o => (votes[o.id] || []).includes(m.id))
    )
    const notVotedOn = openStages.filter(s =>
      !s.options?.some(o => (votes[o.id] || []).includes(m.id))
    )
    return { member: m, votedOn, notVotedOn, isGhost: votedOn.length === 0 && openStages.length > 0 }
  })

  const ghosts = memberStats.filter(ms => ms.isGhost)
  const partial = memberStats.filter(ms => !ms.isGhost && ms.notVotedOn.length > 0)
  const fullyVoted = memberStats.filter(ms => ms.notVotedOn.length === 0)

  // Find blocking stage — the open stage fewest members have voted on
  const blockingStage = openStages.length > 0
    ? openStages.reduce((min, s) => {
        const voterCount = members.filter(m => s.options?.some(o => (votes[o.id] || []).includes(m.id))).length
        const minCount = members.filter(m => min.options?.some(o => (votes[o.id] || []).includes(m.id))).length
        return voterCount < minCount ? s : min
      }, openStages[0])
    : null

  const blockingMembers = blockingStage
    ? members.filter(m => !blockingStage.options?.some(o => (votes[o.id] || []).includes(m.id)))
    : []

  // Generate nudge message
  function getNudge(name) {
    return `Hey ${name}! 👋 "${trip.name}" needs your vote on ${blockingStage?.title || 'a stage'}. Takes 30 seconds. ${tripUrl}`
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isFullyLocked ? 'border-green-200' : 'border-gray-100'}`}>
      {/* Trip header */}
      <button onClick={() => setOpen(o => !o)} className="w-full text-left p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">{trip.name}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">{trip.vibe}</span>
              <span className={`text-xs font-medium ${getMomentumColor(trip.lastActivity)}`}>
                {getMomentumLabel(trip.lastActivity)}
              </span>
              <span className="text-xs text-gray-400">{timeAgo(trip.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            {isFullyLocked
              ? <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">🔒 Locked</span>
              : <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{lockedCount}/{total} locked</span>
            }
            {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${isFullyLocked ? 'bg-green-400' : 'bg-gradient-to-r from-violet-500 to-indigo-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Quick member summary */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-400">👥 {members.length} members</span>
          {ghosts.length > 0 && !isFullyLocked && (
            <span className="text-red-500 font-medium">👻 {ghosts.length} silent</span>
          )}
          {partial.length > 0 && !isFullyLocked && (
            <span className="text-amber-500 font-medium">⚡ {partial.length} partial</span>
          )}
          {fullyVoted.length > 0 && !isFullyLocked && (
            <span className="text-green-600 font-medium">✓ {fullyVoted.length} done</span>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-50 p-4 space-y-4">

          {/* Stage breakdown */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Stages</div>
            <div className="space-y-1.5">
              {stages.map(s => {
                const voterCount = s.status === 'locked'
                  ? members.length
                  : members.filter(m => s.options?.some(o => (votes[o.id] || []).includes(m.id))).length
                return (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{s.emoji || '📋'}</span>
                      <span className="text-xs text-gray-700">{s.title}</span>
                    </div>
                    {s.status === 'locked'
                      ? <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">🔒 Locked</span>
                      : <span className="text-[10px] text-gray-500">{voterCount}/{members.length} voted</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>

          {/* Member participation */}
          {!isFullyLocked && members.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Member Status</div>
              <div className="space-y-2">
                {memberStats.map(({ member, votedOn, notVotedOn, isGhost }) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${member.color} text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0`}>
                        {member.initials}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-800">{member.name}</span>
                        {member.is_organizer && <span className="text-[9px] text-violet-500 ml-1">org</span>}
                      </div>
                    </div>
                    {isGhost
                      ? <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">No votes</span>
                      : notVotedOn.length > 0
                        ? <span className="text-[10px] bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full">
                            Missing: {notVotedOn.map(s => s.title).join(', ')}
                          </span>
                        : <span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full">✓ All voted</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nudge section */}
          {!isFullyLocked && blockingMembers.length > 0 && blockingStage && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                Blocking on {blockingStage.title}
              </div>
              <div className="space-y-2">
                {blockingMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${m.color} text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0`}>
                        {m.initials}
                      </div>
                      <span className="text-xs font-medium text-gray-800">{m.name}</span>
                    </div>
                    <NudgeButton text={getNudge(m.name)} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Copy nudge → paste into WhatsApp for each person</p>
            </div>
          )}

          {/* Trip link */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
            <span className="text-[10px] text-gray-400 truncate flex-1">{tripUrl}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(tripUrl).catch(() => {}) }}
              className="ml-2 flex-shrink-0 text-[10px] text-violet-600 font-semibold"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminScreen() {
  const [groups, setGroups] = useState([])
  const [trips, setTrips] = useState([])
  const [votes, setVotes] = useState({})       // { option_id: [member_id, ...] }
  const [stats, setStats] = useState({ members: 0, votes: 0, activities: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('trips')
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    setRefreshing(true)
    const [
      { data: groupsData },
      { data: tripsData },
      { count: memberCount },
      { count: voteCount },
      { count: activityCount },
    ] = await Promise.all([
      supabase.from('groups').select('*, group_members(count), trips(count)').order('created_at', { ascending: false }),
      supabase.from('trips').select(`
        *,
        members(*),
        stages(id, stage_key, title, emoji, status, locked_option_id, position, options(id, label))
      `).order('created_at', { ascending: false }),
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('activity_log').select('*', { count: 'exact', head: true }),
    ])

    // Sort stages by position inside each trip
    const enrichedTrips = (tripsData || []).map(t => ({
      ...t,
      stages: (t.stages || []).sort((a, b) => a.position - b.position),
    }))

    // Fetch last activity per trip
    const tripIds = enrichedTrips.map(t => t.id)
    let activityMap = {}
    if (tripIds.length > 0) {
      const { data: activities } = await supabase
        .from('activity_log')
        .select('trip_id, created_at')
        .in('trip_id', tripIds)
        .order('created_at', { ascending: false })
      activities?.forEach(a => {
        if (!activityMap[a.trip_id]) activityMap[a.trip_id] = a.created_at
      })
    }

    const tripsWithActivity = enrichedTrips.map(t => ({
      ...t,
      lastActivity: activityMap[t.id] || null,
    }))

    // Fetch all votes for all options
    const allOptionIds = enrichedTrips.flatMap(t =>
      (t.stages || []).flatMap(s => (s.options || []).map(o => o.id))
    )
    let votesMap = {}
    if (allOptionIds.length > 0) {
      const { data: votesData } = await supabase
        .from('votes')
        .select('option_id, member_id')
        .in('option_id', allOptionIds)
      votesData?.forEach(v => {
        if (!votesMap[v.option_id]) votesMap[v.option_id] = []
        votesMap[v.option_id].push(v.member_id)
      })
    }

    setGroups(groupsData || [])
    setTrips(tripsWithActivity)
    setVotes(votesMap)
    setStats({ members: memberCount || 0, votes: voteCount || 0, activities: activityCount || 0 })
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-dvh flex items-center justify-center bg-white">
        <div className="text-sm text-gray-400">Loading admin data...</div>
      </div>
    )
  }

  const lockedTrips = trips.filter(t => t.stages?.length > 0 && t.stages.every(s => s.status === 'locked')).length
  const activeTrips = trips.filter(t => !t.stages?.every(s => s.status === 'locked'))
  const coldTrips = activeTrips.filter(t => t.lastActivity && (Date.now() - new Date(t.lastActivity)) > 86400000).length

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-3 flex items-center justify-between">
        <div>
          <div className="text-xl font-black text-violet-600">PlanKaroChalo</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin Overview</div>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={14} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-10">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Groups', value: groups.length, color: 'text-violet-600' },
            { label: 'Trips', value: trips.length, color: 'text-blue-600' },
            { label: 'Locked', value: lockedTrips, color: 'text-green-600' },
            { label: 'Members', value: stats.members, color: 'text-amber-600' },
            { label: 'Votes', value: stats.votes, color: 'text-pink-600' },
            { label: 'Gone Cold', value: coldTrips, color: coldTrips > 0 ? 'text-red-500' : 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {[
            { key: 'trips', label: `Trips (${trips.length})` },
            { key: 'groups', label: `Groups (${groups.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Trips — rich cards */}
        {tab === 'trips' && (
          <div className="space-y-2">
            {trips.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No trips yet</p>
            ) : trips.map(t => (
              <TripCard key={t.id} trip={t} votes={votes} />
            ))}
          </div>
        )}

        {/* Groups */}
        {tab === 'groups' && (
          <div className="space-y-2">
            {groups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No groups yet</p>
            ) : groups.map(g => (
              <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{g.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{timeAgo(g.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600 font-medium">{g.group_members?.[0]?.count ?? 0} members</div>
                    <div className="text-xs text-gray-400">{g.trips?.[0]?.count ?? 0} trips</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[10px] text-gray-300 font-mono truncate flex-1">{g.id}</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?group=${g.id}`).catch(() => {})}
                    className="ml-2 flex-shrink-0 text-[10px] text-violet-600 font-semibold"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
