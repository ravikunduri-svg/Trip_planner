import { useState } from 'react'
import { Share2, Plus, Rocket } from 'lucide-react'

function Detail({ emoji, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-lg w-7 text-center flex-shrink-0">{emoji}</span>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-semibold text-gray-800">{value || 'Not decided'}</div>
      </div>
    </div>
  )
}

export default function TripLockedScreen({ trip, onNewTrip, onBook }) {
  const [copied, setCopied] = useState(false)

  // Build locked map from stages array (DB shape: locked_option_id, stage_key)
  const locked = {}
  for (const stage of (trip.stages || [])) {
    if (stage.status === 'locked' && stage.locked_option_id) {
      const opt = stage.options?.find(o => o.id === stage.locked_option_id)
      locked[stage.stage_key] = opt?.label
    }
  }

  const summary =
    `🎉 ${trip.name} — TRIP LOCKED!\n` +
    `📍 ${locked.destination || '?'}\n` +
    `📅 ${locked.dates || '?'}\n` +
    `💰 ${locked.budget || '?'} per person\n` +
    `🏠 ${locked.stay || '?'}\n` +
    `🎯 ${locked.activities || '?'}\n` +
    `👥 ${trip.group_size} friends\n\n` +
    `Planned with PlanKaroChalo ✈️`

  function handleShare() {
    navigator.clipboard.writeText(summary).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-white">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 pt-16 pb-10 px-6 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-black text-white mb-1">Trip Locked!</h1>
        <p className="text-violet-200 text-sm">Congratulations. This trip survived group planning.</p>
        <div className="mt-3 text-white font-bold text-xl">{trip.name}</div>
        <div className="mt-1 text-violet-300 text-sm">{trip.vibe} · {trip.group_size} friends</div>
      </div>

      <div className="mx-4 -mt-5 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">What's locked in</div>
        <Detail emoji="🗺️" label="Destination" value={locked.destination} />
        <Detail emoji="📅" label="Dates"        value={locked.dates}       />
        <Detail emoji="💰" label="Budget"       value={locked.budget}      />
        <Detail emoji="🏠" label="Stay"         value={locked.stay}        />
        <Detail emoji="🎯" label="Activities"   value={locked.activities}  />
        <div className="mt-3 pt-2.5 border-t border-gray-50 text-xs text-gray-400 flex items-center gap-1.5">
          <span>👥</span>
          <span>{trip.group_size} friends · Planned with PlanKaroChalo</span>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-3">
        <button
          onClick={onBook}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-violet-200"
        >
          <Rocket size={16} />
          Book Flights &amp; Hotels
        </button>
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-green-200"
        >
          <Share2 size={16} />
          {copied ? '✓ Copied to clipboard!' : 'Share Trip Summary'}
        </button>
        <button
          onClick={onNewTrip}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold py-4 rounded-2xl text-base transition-colors"
        >
          <Plus size={16} /> Plan another trip
        </button>
      </div>

      <div className="mt-auto pb-8 px-6 text-center">
        <p className="text-xs text-gray-400">
          No WhatsApp messages were harmed in the planning of this trip.
        </p>
      </div>
    </div>
  )
}
