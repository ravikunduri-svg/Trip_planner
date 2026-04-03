import { useState } from 'react'
import { Lock, Plus, ChevronDown, ChevronUp } from 'lucide-react'

const COLORS = {
  1: 'bg-violet-500', 2: 'bg-blue-500', 3: 'bg-pink-500',
  4: 'bg-amber-500',  5: 'bg-green-500', 6: 'bg-orange-500',
}
const INITIALS = { 1: 'S', 2: 'R', 3: 'P', 4: 'A', 5: 'M', 6: 'D' }

function Avatar({ uid }) {
  return (
    <div className={`w-5 h-5 rounded-full ${COLORS[uid] || 'bg-gray-400'} text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white`}>
      {INITIALS[uid] || '?'}
    </div>
  )
}

export default function StageCard({
  stage, members, currentUserId,
  onVote, onLock, onAddOption,
  isOpen, onToggle,
}) {
  const [newOption, setNewOption] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const isOrganizer = members.find(m => m.id === currentUserId)?.isOrganizer
  const isLocked = stage.status === 'locked'

  const sortedOptions = [...stage.options].sort((a, b) => b.votes.length - a.votes.length)
  const topOption = sortedOptions[0]
  const lockedOption = isLocked ? stage.options.find(o => o.id === stage.lockedOptionId) : null

  function handleAdd() {
    if (!newOption.trim()) return
    onAddOption(stage.id, newOption.trim())
    setNewOption('')
    setShowAdd(false)
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isLocked ? 'border border-green-200' : 'border border-gray-100'}`}>
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{stage.emoji}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{stage.title}</span>
              {isLocked && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">LOCKED</span>
              )}
            </div>
            {lockedOption && (
              <div className="text-xs text-green-600 font-medium mt-0.5">{lockedOption.label}</div>
            )}
            {!lockedOption && topOption && topOption.votes.length > 0 && (
              <div className="text-xs text-gray-400 mt-0.5">
                {topOption.votes.length} votes for {topOption.label}
              </div>
            )}
            {!lockedOption && (!topOption || topOption.votes.length === 0) && (
              <div className="text-xs text-gray-400 mt-0.5">No votes yet</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          {!isLocked && (
            <span className="text-xs">
              {stage.options.reduce((s, o) => s + o.votes.length, 0)} votes
            </span>
          )}
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-50 space-y-2">
          {stage.options.map(option => {
            const hasVoted = option.votes.includes(currentUserId)
            const isTop = option.id === topOption?.id && topOption.votes.length > 0
            const isOptionLocked = option.id === stage.lockedOptionId

            return (
              <div
                key={option.id}
                className={`rounded-xl p-3 transition-colors ${
                  isOptionLocked ? 'bg-green-50 border border-green-200'
                  : hasVoted ? 'bg-violet-50 border border-violet-200'
                  : 'bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{option.label}</span>
                    {isTop && !isOptionLocked && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">TOP</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                      {option.votes.slice(0, 4).map(uid => <Avatar key={uid} uid={uid} />)}
                      {option.votes.length > 4 && (
                        <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-700 text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
                          +{option.votes.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{option.votes.length}</span>
                  </div>
                </div>

                {option.votes.length > 0 && (
                  <div className="h-1.5 bg-gray-200 rounded-full mb-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOptionLocked ? 'bg-green-500' : 'bg-violet-400'}`}
                      style={{ width: `${Math.round((option.votes.length / members.length) * 100)}%` }}
                    />
                  </div>
                )}

                {!isLocked && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onVote(stage.id, option.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        hasVoted
                          ? 'bg-violet-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
                      }`}
                    >
                      {hasVoted ? '✓ Voted' : 'Vote'}
                    </button>
                    {isOrganizer && option.votes.length > 0 && (
                      <button
                        onClick={() => onLock(stage.id, option.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Lock size={10} />
                        Lock
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Add option */}
          {!isLocked && (
            <div className="pt-1">
              {showAdd ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Add option..."
                    className="flex-1 border border-gray-200 focus:border-violet-400 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <button onClick={handleAdd} className="px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700">
                    Add
                  </button>
                  <button onClick={() => { setShowAdd(false); setNewOption('') }} className="px-2 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs hover:bg-gray-200">
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 transition-colors py-1"
                >
                  <Plus size={12} />
                  Add option
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
