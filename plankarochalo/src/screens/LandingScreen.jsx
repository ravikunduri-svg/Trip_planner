export default function LandingScreen({ onStart }) {
  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-white">
      {/* Top */}
      <div className="pt-14 pb-4 px-6 text-center">
        <div className="text-3xl font-black text-violet-600 tracking-tight">PlanKaroChalo</div>
        <div className="text-sm text-gray-500 mt-1">The app that stops group trips from dying</div>
      </div>

      {/* Hero mock-UI */}
      <div className="mx-4 mb-5 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl p-4 border border-violet-100">
        <div className="bg-white rounded-2xl p-3 shadow-sm mb-2">
          <div className="text-xs font-bold text-gray-500 mb-2">🗺️ Where to go?</div>
          {[
            { name: 'Goa', w: 'w-20', votes: 3 },
            { name: 'Manali', w: 'w-10', votes: 1 },
            { name: 'Jaipur', w: 'w-6', votes: 1 },
          ].map(({ name, w, votes }) => (
            <div key={name} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <div className={`h-1.5 rounded-full bg-violet-400 ${w}`} />
              <span className="text-xs text-gray-700 flex-1">{name}</span>
              <span className="text-xs text-gray-400">{votes} votes</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Trip progress</span>
            <span className="font-bold text-violet-600">72%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
            <div className="h-full w-3/4 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
          </div>
          <div className="text-xs text-amber-600 font-medium">🔥 This trip is alive and kicking</div>
        </div>
      </div>

      {/* Tagline */}
      <div className="px-6 mb-6 text-center">
        <p className="text-sm text-gray-600 leading-relaxed">
          From <span className="font-semibold">"Guys, let's go somewhere"</span> to{' '}
          <span className="font-semibold">trip locked</span> — without 147 WhatsApp messages.
        </p>
      </div>

      {/* Feature chips */}
      <div className="px-6 mb-8 space-y-2">
        {[
          { icon: '🗳️', text: 'Vote on destination, dates, budget' },
          { icon: '🔗', text: 'Share a link — anyone can join and vote' },
          { icon: '⚡', text: 'See votes update live as your group decides' },
          { icon: '🎉', text: 'Lock the plan. Actually go.' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span>{icon}</span>
            <span className="text-sm text-gray-700">{text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 mt-auto space-y-3">
        <button
          onClick={onStart}
          className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-violet-200"
        >
          Start a Trip ✈️
        </button>
        <p className="text-center text-xs text-gray-400 pt-1">
          WhatsApp is great for chaos. This is for decisions.
        </p>
      </div>
    </div>
  )
}
