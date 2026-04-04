export default function TripPulse({ stages, members }) {
  const locked = stages.filter(s => s.status === 'locked')
  const open = stages.filter(s => s.status !== 'locked')

  const pendingActions = open.map(stage => {
    const voted = new Set(stage.options.flatMap(o => o.votes))
    const notVoted = members.filter(m => !voted.has(m.id))
    return { stage, notVoted }
  }).filter(({ notVoted }) => notVoted.length > 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h3 className="font-bold text-gray-900 text-sm">⚡ Trip Pulse</h3>
        <p className="text-xs text-gray-400 mt-0.5">What's decided · What's pending</p>
      </div>

      <div className="p-4 space-y-3">
        {locked.map(stage => {
          const opt = stage.options.find(o => o.id === stage.locked_option_id)
          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">✓</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">{stage.title} locked: </span>
                <span className="font-semibold text-gray-800">{opt?.label || '—'}</span>
              </div>
            </div>
          )
        })}

        {pendingActions.map(({ stage, notVoted }) => (
          <div key={stage.id} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center mt-0.5">
              <span className="text-amber-600 text-[10px] font-bold">!</span>
            </div>
            <div>
              <div className="text-sm font-medium text-amber-700">
                {notVoted.length} {notVoted.length === 1 ? "person hasn't" : "people haven't"} voted on {stage.title}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {notVoted.slice(0, 3).map(m => m.name).join(', ')}
                {notVoted.length > 3 ? ` +${notVoted.length - 3} more` : ''}
              </div>
            </div>
          </div>
        ))}

        {open.length > 0 && pendingActions.length === 0 && (
          <p className="text-sm text-violet-600 font-medium text-center py-1">
            Everyone voted! Organizer can now lock the stages.
          </p>
        )}

        {open.length === 0 && (
          <p className="text-sm text-green-600 font-semibold text-center py-1">
            🎉 All stages locked. Trip is ready!
          </p>
        )}
      </div>
    </div>
  )
}
