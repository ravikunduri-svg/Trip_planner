import { useState } from 'react'
import { ArrowLeft, Bell, Share2, Users } from 'lucide-react'
import StageCard from '../components/StageCard'
import TripPulse from '../components/TripPulse'
import NudgeModal from '../components/NudgeModal'

const CURRENT_USER_ID = 1 // Shravan = demo organizer

function getSurvivalMeter(progress) {
  if (progress === 100) return '🎉 Trip locked! You actually did it.'
  if (progress >= 80)  return '🔥 Almost there. One more push.'
  if (progress >= 60)  return '💪 This trip is alive and kicking.'
  if (progress >= 40)  return '😤 Making progress. Keep going.'
  if (progress >  0)   return '😰 Your Goa dreams are hanging by a thread.'
  return '👻 No votes yet. This trip is a ghost.'
}

export default function TripDashboard({ initialTrip, onLocked, onBack }) {
  const [stages, setStages] = useState(() =>
    initialTrip.stages.map(s => ({
      ...s,
      options: s.options.map(o => ({ ...o, votes: [...o.votes] })),
    }))
  )
  const [openStageId, setOpenStageId] = useState(stages[0]?.id ?? null)
  const [showNudge, setShowNudge] = useState(false)

  const members = initialTrip.members
  const lockedCount = stages.filter(s => s.status === 'locked').length
  const progress = Math.round((lockedCount / stages.length) * 100)
  const allLocked = lockedCount === stages.length

  function toggleVote(stageId, optionId) {
    setStages(prev => prev.map(stage => {
      if (stage.id !== stageId || stage.status === 'locked') return stage
      return {
        ...stage,
        options: stage.options.map(opt => {
          if (opt.id !== optionId) return opt
          const hasVoted = opt.votes.includes(CURRENT_USER_ID)
          return {
            ...opt,
            votes: hasVoted
              ? opt.votes.filter(v => v !== CURRENT_USER_ID)
              : [...opt.votes, CURRENT_USER_ID],
          }
        }),
      }
    }))
  }

  function lockStage(stageId, optionId) {
    setStages(prev => prev.map(stage =>
      stage.id !== stageId ? stage : { ...stage, status: 'locked', lockedOptionId: optionId }
    ))
  }

  function addOption(stageId, label) {
    setStages(prev => prev.map(stage => {
      if (stage.id !== stageId) return stage
      const nextId = Math.max(0, ...stage.options.map(o => o.id)) + 1
      return {
        ...stage,
        options: [...stage.options, { id: nextId, label, votes: [] }],
      }
    }))
  }

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-10 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNudge(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Bell size={12} />
              Nudge
            </button>
            <button className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <Share2 size={15} className="text-gray-600" />
            </button>
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{initialTrip.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs bg-violet-100 text-violet-700 font-medium px-2 py-0.5 rounded-full">
              {initialTrip.vibe}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Users size={10} />
              {initialTrip.groupSize} people
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-10">
        {/* Progress card */}
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
          {/* Stage dots */}
          <div className="flex gap-1.5">
            {stages.map(s => (
              <div
                key={s.id}
                title={s.title}
                className={`flex-1 h-1.5 rounded-full ${s.status === 'locked' ? 'bg-green-400' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Decision stages */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1 mb-2">Decisions</h2>
          <div className="space-y-2">
            {stages.map(stage => (
              <StageCard
                key={stage.id}
                stage={stage}
                members={members}
                currentUserId={CURRENT_USER_ID}
                onVote={toggleVote}
                onLock={lockStage}
                onAddOption={addOption}
                isOpen={openStageId === stage.id}
                onToggle={() => setOpenStageId(openStageId === stage.id ? null : stage.id)}
              />
            ))}
          </div>
        </div>

        {/* Trip Pulse */}
        <TripPulse stages={stages} members={members} />

        {/* Members */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Group</h3>
          <div className="space-y-2.5">
            {members.map(member => {
              const votedStages = stages.filter(s =>
                s.options.some(o => o.votes.includes(member.id))
              ).length
              const isInactive = votedStages === 0
              return (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${member.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                      {member.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800">{member.name}</span>
                        {member.isOrganizer && (
                          <span className="text-[9px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">ORG</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">Voted on {votedStages}/{stages.length} stages</div>
                    </div>
                  </div>
                  {isInactive && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full">
                      Needs nudge
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* View summary CTA — shown when all stages locked */}
        {allLocked && (
          <button
            onClick={() => onLocked({ ...initialTrip, stages })}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-green-200"
          >
            🎉 View Trip Summary
          </button>
        )}
      </div>

      {showNudge && <NudgeModal onClose={() => setShowNudge(false)} />}
    </div>
  )
}
