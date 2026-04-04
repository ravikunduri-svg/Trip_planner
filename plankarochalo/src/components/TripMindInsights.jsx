import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ── Heuristics ────────────────────────────────────────────────

function getMomentumInsight(lastActivityAt) {
  if (!lastActivityAt) return null
  const minsAgo = (Date.now() - new Date(lastActivityAt)) / 60000
  if (minsAgo < 60)   return { type: 'momentum', level: 'hot',     icon: '🔥', text: 'Trip energy is high — votes are flying in.' }
  if (minsAgo < 360)  return { type: 'momentum', level: 'warm',    icon: '⚡', text: 'Trip is active. Keep the momentum going.' }
  if (minsAgo < 1440) return { type: 'momentum', level: 'cooling', icon: '😐', text: `Trip is cooling down — no votes in ${Math.floor(minsAgo / 60)}h. Send a nudge.` }
  return               { type: 'momentum', level: 'cold',    icon: '🧊', text: `Trip has gone cold — ${Math.floor(minsAgo / 1440)}d since last activity. Needs a nudge now.` }
}

function getLeaningInsights(stages, members) {
  const insights = []
  for (const stage of stages) {
    if (stage.status === 'locked') continue
    const totalVotes = stage.options.reduce((s, o) => s + o.votes.length, 0)
    if (totalVotes === 0) continue
    const top = [...stage.options].sort((a, b) => b.votes.length - a.votes.length)[0]
    const pct = Math.round((top.votes.length / members.length) * 100)
    if (pct >= 60) {
      insights.push({
        type: 'leaning',
        icon: '📊',
        text: `Group is leaning toward ${top.label} for ${stage.title} — ${top.votes.length}/${members.length} votes (${pct}%).`,
      })
    }
  }
  return insights
}

function getBudgetAlert(stages, members) {
  const budget = stages.find(s => s.stage_key === 'budget' && s.status !== 'locked')
  if (!budget) return null
  const totalVoters = new Set(budget.options.flatMap(o => o.votes)).size
  if (totalVoters < Math.ceil(members.length * 0.5)) return null // need 50%+ voted
  const sorted = [...budget.options].sort((a, b) => b.votes.length - a.votes.length)
  if (sorted.length < 2) return null
  const [first, second] = sorted
  if (first.votes.length - second.votes.length <= 1) {
    return {
      type: 'budget_alert',
      icon: '⚠️',
      text: `Budget is split between ${first.label} and ${second.label}. Someone may drop out silently — lock a range soon.`,
    }
  }
  return null
}

function getGhostInsight(stages, members) {
  const openStages = stages.filter(s => s.status !== 'locked')
  if (openStages.length === 0) return null
  const memberVoteCounts = members.map(m => ({
    member: m,
    votes: openStages.reduce((sum, s) => sum + (s.options.some(o => o.votes.includes(m.id)) ? 1 : 0), 0),
  }))
  const avgVotes = memberVoteCounts.reduce((s, m) => s + m.votes, 0) / members.length
  if (avgVotes < 1) return null // nobody has voted yet
  const ghosts = memberVoteCounts.filter(m => m.votes === 0)
  if (ghosts.length === 0) return null
  const names = ghosts.map(g => g.member.name).join(', ')
  return {
    type: 'ghost',
    icon: '👻',
    text: `${names} ${ghosts.length === 1 ? 'hasn\'t' : 'haven\'t'} voted yet — trip may stall without ${ghosts.length === 1 ? 'them' : 'them'}.`,
  }
}

function getGroupDNA(groupHistory) {
  if (!groupHistory || groupHistory.length < 2) return null
  const vibes = groupHistory.map(t => t.vibe).filter(Boolean)
  const counts = vibes.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {})
  const topVibe = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (!topVibe || topVibe[1] < 2) return null
  return {
    type: 'dna',
    icon: '🧬',
    text: `Your squad has locked ${topVibe[1]} ${topVibe[0].toLowerCase()} trips. You're a ${topVibe[0]} crew.`,
  }
}

// ── Insight card ──────────────────────────────────────────────

function InsightCard({ insight }) {
  const bgMap = {
    hot:          'bg-red-50 border-red-100',
    warm:         'bg-amber-50 border-amber-100',
    cooling:      'bg-orange-50 border-orange-100',
    cold:         'bg-blue-50 border-blue-100',
    leaning:      'bg-violet-50 border-violet-100',
    budget_alert: 'bg-yellow-50 border-yellow-200',
    ghost:        'bg-gray-50 border-gray-200',
    dna:          'bg-indigo-50 border-indigo-100',
  }
  const key = insight.level || insight.type
  const bg = bgMap[key] || 'bg-gray-50 border-gray-100'

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${bg}`}>
      <div className="flex items-start gap-2">
        <span className="text-base flex-shrink-0 mt-0.5">{insight.icon}</span>
        <p className="text-xs text-gray-700 leading-relaxed">{insight.text}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function TripMindInsights({ trip, stages, members }) {
  const [lastActivityAt, setLastActivityAt] = useState(null)
  const [groupHistory, setGroupHistory] = useState([])

  useEffect(() => {
    // Fetch last activity timestamp
    supabase
      .from('activity_log')
      .select('created_at')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => { if (data?.[0]) setLastActivityAt(data[0].created_at) })

    // Fetch group trip history if this trip belongs to a group
    if (trip.group_id) {
      supabase
        .from('trips')
        .select('id, vibe')
        .eq('group_id', trip.group_id)
        .neq('id', trip.id)
        .then(({ data }) => setGroupHistory(data || []))
    }
  }, [trip.id, trip.group_id])

  // Compute all insights
  const insights = [
    getMomentumInsight(lastActivityAt),
    ...getLeaningInsights(stages, members),
    getBudgetAlert(stages, members),
    getGhostInsight(stages, members),
    getGroupDNA(groupHistory),
  ].filter(Boolean)

  if (insights.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        <span className="text-base">🧠</span>
        <div>
          <span className="font-bold text-gray-900 text-sm">TripMind™</span>
          <span className="text-[10px] text-violet-500 font-bold ml-1.5 bg-violet-50 px-1.5 py-0.5 rounded-full">BETA</span>
          <p className="text-xs text-gray-400 mt-0.5">AI insights for your group</p>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
    </div>
  )
}
