import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function getLocalHistory() {
  const groups = []
  const trips = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('pkc_group_')) groups.push(key.replace('pkc_group_', ''))
    if (key?.startsWith('pkc_member_')) trips.push(key.replace('pkc_member_', ''))
  }
  return { groupIds: groups, tripIds: trips }
}

export default function LandingScreen({ onStart, onCreateGroup, onOpenGroup, onOpenTrip }) {
  const [myGroups, setMyGroups] = useState([])
  const [myTrips, setMyTrips] = useState([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  useEffect(() => {
    async function loadHistory() {
      const { groupIds, tripIds } = getLocalHistory()
      const results = await Promise.all([
        groupIds.length
          ? supabase.from('groups').select('id, name, created_at').in('id', groupIds)
          : { data: [] },
        tripIds.length
          ? supabase.from('trips').select('id, name, vibe, group_id, created_at, stages(id, status)').in('id', tripIds)
          : { data: [] },
      ])
      // Only show standalone trips (no group_id) — group trips show in their group
      setMyGroups(results[0].data || [])
      setMyTrips((results[1].data || []).filter(t => !t.group_id))
      setHistoryLoaded(true)
    }
    loadHistory()
  }, [])

  const hasHistory = myGroups.length > 0 || myTrips.length > 0

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-white">
      {/* Top */}
      <div className="pt-14 pb-4 px-6 text-center">
        <div className="text-3xl font-black text-violet-600 tracking-tight">PlanKaroChalo</div>
        <div className="text-sm text-gray-500 mt-1">The app that stops group trips from dying</div>
      </div>

      {/* Personal history */}
      {historyLoaded && hasHistory && (
        <div className="px-4 mb-4 space-y-3">
          {myGroups.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1 mb-2">My Groups</div>
              <div className="space-y-2">
                {myGroups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => onOpenGroup(g.id)}
                    className="w-full bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 text-left hover:border-violet-300 transition-colors"
                  >
                    <div className="font-semibold text-violet-800 text-sm">{g.name}</div>
                    <div className="text-xs text-violet-400 mt-0.5">Tap to open →</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {myTrips.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1 mb-2">My Trips</div>
              <div className="space-y-2">
                {myTrips.map(t => {
                  const locked = t.stages?.filter(s => s.status === 'locked').length ?? 0
                  const total = t.stages?.length ?? 0
                  const isFullyLocked = total > 0 && locked === total
                  return (
                    <button
                      key={t.id}
                      onClick={() => onOpenTrip(t.id)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-left hover:border-violet-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-800 text-sm">{t.name}</div>
                        {isFullyLocked
                          ? <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">🔒 Locked</span>
                          : <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">⚡ Ongoing</span>
                        }
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{t.vibe}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hero mock-UI — only show if no history */}
      {!hasHistory && (
        <>
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
          <div className="px-6 mb-6 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              From <span className="font-semibold">"Guys, let's go somewhere"</span> to{' '}
              <span className="font-semibold">trip locked</span> — without 147 WhatsApp messages.
            </p>
          </div>
          <div className="px-6 mb-6 space-y-2">
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
        </>
      )}

      {/* CTAs */}
      <div className="px-6 pb-10 mt-auto space-y-3">
        <button
          onClick={onCreateGroup}
          className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-violet-200"
        >
          Create a Group 👥
        </button>
        <button
          onClick={onStart}
          className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 text-violet-600 font-bold py-4 rounded-2xl text-base transition-colors border-2 border-violet-200"
        >
          One-off Trip ✈️
        </button>
        <p className="text-center text-xs text-gray-400 pt-1">
          WhatsApp is great for chaos. This is for decisions.
        </p>
      </div>
    </div>
  )
}
