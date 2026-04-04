import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function actionLabel(entry) {
  switch (entry.action) {
    case 'joined':       return 'joined the trip'
    case 'voted':        return `voted for ${entry.option_label} in ${entry.stage_key}`
    case 'unvoted':      return `removed vote from ${entry.option_label} in ${entry.stage_key}`
    case 'option_added': return `added "${entry.option_label}" to ${entry.stage_key}`
    case 'stage_locked': return `locked ${entry.stage_key} → ${entry.option_label} 🔒`
    case 'trip_locked':  return 'locked the full trip 🎉'
    default:             return entry.action
  }
}

function actionColor(action) {
  switch (action) {
    case 'joined':       return 'bg-blue-500'
    case 'voted':        return 'bg-violet-500'
    case 'unvoted':      return 'bg-gray-400'
    case 'option_added': return 'bg-amber-500'
    case 'stage_locked': return 'bg-green-500'
    case 'trip_locked':  return 'bg-green-600'
    default:             return 'bg-gray-400'
  }
}

export default function ActivityFeed({ tripId, members }) {
  const [entries, setEntries] = useState([])

  function getMember(id) {
    return members.find(m => m.id === id)
  }

  async function load() {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(30)
    setEntries(data || [])
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`activity-${tripId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log', filter: `trip_id=eq.${tripId}` },
        () => load()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tripId])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h3 className="font-bold text-gray-900 text-sm">🕓 Activity</h3>
        <p className="text-xs text-gray-400 mt-0.5">Everything that's happened in this trip</p>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No activity yet — start voting!</p>
        ) : entries.map(entry => {
          const member = getMember(entry.member_id)
          return (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
              <div className={`w-7 h-7 rounded-full ${member?.color || actionColor(entry.action)} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                {member?.initials || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-800">{member?.name || 'Someone'} </span>
                <span className="text-xs text-gray-500">{actionLabel(entry)}</span>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(entry.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
