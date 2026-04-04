import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AdminScreen() {
  const [groups, setGroups] = useState([])
  const [trips, setTrips] = useState([])
  const [stats, setStats] = useState({ members: 0, votes: 0, activities: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('groups')

  useEffect(() => {
    async function load() {
      const [
        { data: groupsData },
        { data: tripsData },
        { count: memberCount },
        { count: voteCount },
        { count: activityCount },
      ] = await Promise.all([
        supabase.from('groups').select('*, group_members(count), trips(count)').order('created_at', { ascending: false }),
        supabase.from('trips').select('*, stages(id, status), members(count)').order('created_at', { ascending: false }),
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
        supabase.from('activity_log').select('*', { count: 'exact', head: true }),
      ])
      setGroups(groupsData || [])
      setTrips(tripsData || [])
      setStats({ members: memberCount || 0, votes: voteCount || 0, activities: activityCount || 0 })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-dvh flex items-center justify-center bg-white">
        <div className="text-sm text-gray-400">Loading admin data...</div>
      </div>
    )
  }

  const lockedTrips = trips.filter(t => t.stages?.length > 0 && t.stages.every(s => s.status === 'locked')).length

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-3">
        <div className="text-xl font-black text-violet-600">PlanKaroChalo</div>
        <div className="text-xs text-gray-400 mt-0.5">Admin Overview</div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-10">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Groups', value: groups.length, color: 'text-violet-600' },
            { label: 'Trips', value: trips.length, color: 'text-blue-600' },
            { label: 'Trips Locked', value: lockedTrips, color: 'text-green-600' },
            { label: 'Members', value: stats.members, color: 'text-amber-600' },
            { label: 'Votes Cast', value: stats.votes, color: 'text-pink-600' },
            { label: 'Activities', value: stats.activities, color: 'text-indigo-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {['groups', 'trips'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors capitalize ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {t === 'groups' ? `Groups (${groups.length})` : `Trips (${trips.length})`}
            </button>
          ))}
        </div>

        {/* Groups list */}
        {tab === 'groups' && (
          <div className="space-y-2">
            {groups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No groups yet</p>
            ) : groups.map(g => (
              <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{g.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{timeAgo(g.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{g.group_members?.[0]?.count ?? 0} members</div>
                    <div className="text-xs text-gray-500">{g.trips?.[0]?.count ?? 0} trips</div>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-300 break-all font-mono">{g.id}</div>
              </div>
            ))}
          </div>
        )}

        {/* Trips list */}
        {tab === 'trips' && (
          <div className="space-y-2">
            {trips.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No trips yet</p>
            ) : trips.map(t => {
              const locked = t.stages?.filter(s => s.status === 'locked').length ?? 0
              const total = t.stages?.length ?? 0
              const isLocked = total > 0 && locked === total
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">{t.vibe}</span>
                        <span className="text-xs text-gray-400">{timeAgo(t.created_at)}</span>
                      </div>
                    </div>
                    {isLocked
                      ? <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">🔒 Locked</span>
                      : <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{locked}/{total} locked</span>
                    }
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>👥 {t.members?.[0]?.count ?? 0} members</span>
                    {t.group_id && <span className="text-violet-400">· In a group</span>}
                  </div>
                  {total > 0 && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.round((locked / total) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
