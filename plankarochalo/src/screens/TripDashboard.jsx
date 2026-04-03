import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Bell, Copy, Check, Users } from 'lucide-react'
import posthog from 'posthog-js'
import StageCard from '../components/StageCard'
import TripPulse from '../components/TripPulse'
import NudgeModal from '../components/NudgeModal'
import { supabase } from '../supabase'

function getSurvivalMeter(progress) {
  if (progress === 100) return '🎉 Trip locked! You actually did it.'
  if (progress >= 80)  return '🔥 Almost there. One more push.'
  if (progress >= 60)  return '💪 This trip is alive and kicking.'
  if (progress >= 40)  return '😤 Making progress. Keep going.'
  if (progress >  0)   return '😰 Your trip dreams are hanging by a thread.'
  return '👻 No votes yet. This trip is a ghost.'
}

export default function TripDashboard({ trip, me, onAllLocked, onBack }) {
  const [stages, setStages] = useState([])   // each stage has .options[] with .votes[]
  const [members, setMembers] = useState([])
  const [openStageId, setOpenStageId] = useState(null)
  const [showNudge, setShowNudge] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const shareUrl = `${window.location.origin}${window.location.pathname}?trip=${trip.id}`

  // ── Initial load ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [{ data: stagesData }, { data: membersData }, { data: votesData }] = await Promise.all([
      supabase.from('stages').select('*, options(*)').eq('trip_id', trip.id).order('position'),
      supabase.from('members').select('*').eq('trip_id', trip.id),
      supabase.from('votes').select('*').in(
        'option_id',
        // We'll re-fetch votes properly below
        ['00000000-0000-0000-0000-000000000000']
      ),
    ])

    // Fetch all option IDs for this trip then get votes
    const allOptionIds = (stagesData || []).flatMap(s => (s.options || []).map(o => o.id))
    let allVotes = []
    if (allOptionIds.length > 0) {
      const { data: vd } = await supabase.from('votes').select('*').in('option_id', allOptionIds)
      allVotes = vd || []
    }

    // Attach votes to options
    const enriched = (stagesData || []).map(stage => ({
      ...stage,
      options: (stage.options || []).map(opt => ({
        ...opt,
        votes: allVotes.filter(v => v.option_id === opt.id).map(v => v.member_id),
      })),
    }))

    setStages(enriched)
    setMembers(membersData || [])
    if (enriched.length > 0) setOpenStageId(prev => prev ?? enriched[0].id)
    setLoading(false)
  }, [trip.id])

  useEffect(() => { loadData() }, [loadData])

  // ── Realtime subscriptions ─────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`trip-${trip.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stages' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'members', filter: `trip_id=eq.${trip.id}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'options' },
        () => loadData()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [trip.id, loadData])

  // ── Actions ───────────────────────────────────────────────────
  async function toggleVote(stageId, optionId) {
    const stage = stages.find(s => s.id === stageId)
    if (!stage || stage.status === 'locked') return

    const opt = stage.options.find(o => o.id === optionId)
    const hasVoted = opt?.votes.includes(me.id)

    // Optimistic update — feels instant
    setStages(prev => prev.map(s => {
      if (s.id !== stageId) return s
      return {
        ...s,
        options: s.options.map(o => {
          if (o.id !== optionId) return o
          return {
            ...o,
            votes: hasVoted ? o.votes.filter(v => v !== me.id) : [...o.votes, me.id],
          }
        }),
      }
    }))

    if (hasVoted) {
      const { error } = await supabase.from('votes').delete()
        .eq('option_id', optionId).eq('member_id', me.id)
      if (error) { console.error(error); loadData() }
    } else {
      const { error } = await supabase.from('votes').insert({ option_id: optionId, member_id: me.id })
      if (error) { console.error(error); loadData() }
      else posthog.capture('vote_cast', { stage_id: stageId })
    }
  }

  async function lockStage(stageId, optionId) {
    if (!me.is_organizer) return
    await supabase.from('stages').update({ status: 'locked', locked_option_id: optionId }).eq('id', stageId)
    posthog.capture('stage_locked', { stage_id: stageId, trip_id: trip.id })
  }

  async function addOption(stageId, label) {
    await supabase.from('options').insert({ stage_id: stageId, label })
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
    posthog.capture('share_link_copied', { trip_id: trip.id })
  }

  // ── Derived state ──────────────────────────────────────────────
  const lockedCount = stages.filter(s => s.status === 'locked').length
  const progress = stages.length ? Math.round((lockedCount / stages.length) * 100) : 0
  const allLocked = stages.length > 0 && lockedCount === stages.length

  useEffect(() => {
    if (allLocked && !loading) {
      posthog.capture('trip_locked', { trip_id: trip.id })
      onAllLocked({ ...trip, stages })
    }
  }, [allLocked])

  if (loading) {
    return (
      <div className="max-w-sm mx-auto min-h-dvh flex items-center justify-center bg-white">
        <div className="text-sm text-gray-400">Loading trip...</div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-10 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNudge(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Bell size={12} /> Nudge
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-xl text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
            >
              {linkCopied ? <Check size={12} /> : <Copy size={12} />}
              {linkCopied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{trip.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs bg-violet-100 text-violet-700 font-medium px-2 py-0.5 rounded-full">{trip.vibe}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Users size={10} /> {members.length} joined
            </span>
            {me.is_organizer && (
              <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">Organizer</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-10">
        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trip Progress</span>
            <span className="text-sm font-bold text-violet-600">{progress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 font-medium mb-2">{getSurvivalMeter(progress)}</p>
          <div className="flex gap-1.5">
            {stages.map(s => (
              <div key={s.id} title={s.title}
                className={`flex-1 h-1.5 rounded-full ${s.status === 'locked' ? 'bg-green-400' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Share link */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-violet-600 mb-0.5">Share link with your group</div>
            <div className="text-xs text-violet-400 truncate">{shareUrl}</div>
          </div>
          <button onClick={copyLink}
            className="flex-shrink-0 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            {linkCopied ? '✓' : 'Copy'}
          </button>
        </div>

        {/* Stages */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1 mb-2">Decisions</h2>
          <div className="space-y-2">
            {stages.map(stage => (
              <StageCard
                key={stage.id}
                stage={stage}
                members={members}
                currentUserId={me.id}
                isOrganizer={me.is_organizer}
                onVote={toggleVote}
                onLock={lockStage}
                onAddOption={addOption}
                isOpen={openStageId === stage.id}
                onToggle={() => setOpenStageId(openStageId === stage.id ? null : stage.id)}
              />
            ))}
          </div>
        </div>

        <TripPulse stages={stages} members={members} />

        {/* Members */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Group</h3>
          <div className="space-y-2.5">
            {members.map(member => {
              const votedStages = stages.filter(s =>
                s.options.some(o => o.votes.includes(member.id))
              ).length
              return (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${member.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                      {member.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800">{member.name}</span>
                        {member.is_organizer && (
                          <span className="text-[9px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">ORG</span>
                        )}
                        {member.id === me.id && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full">YOU</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">Voted on {votedStages}/{stages.length} stages</div>
                    </div>
                  </div>
                  {votedStages === 0 && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full">Needs nudge</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showNudge && <NudgeModal onClose={() => setShowNudge(false)} shareUrl={shareUrl} />}
    </div>
  )
}
