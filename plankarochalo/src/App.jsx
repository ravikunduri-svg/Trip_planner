import { useState, useEffect } from 'react'
import LandingScreen from './screens/LandingScreen'
import CreateTripScreen from './screens/CreateTripScreen'
import JoinScreen from './screens/JoinScreen'
import TripDashboard from './screens/TripDashboard'
import TripLockedScreen from './screens/TripLockedScreen'
import { supabase } from './supabase'

function getLocalKey(tripId) {
  return localStorage.getItem(`pkc_member_${tripId}`)
}

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [tripId, setTripId] = useState(null)
  const [trip, setTrip] = useState(null)
  const [me, setMe] = useState(null) // current member row

  // On mount: check URL for ?trip=uuid
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('trip')
    if (id) {
      setTripId(id)
      // Check if we've already joined this trip
      const localKey = getLocalKey(id)
      if (localKey) {
        loadTripAndMember(id, localKey)
      } else {
        setScreen('join')
      }
    } else {
      setScreen('landing')
    }
  }, [])

  async function loadTripAndMember(id, localKey) {
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()

    if (!tripData) { setScreen('landing'); return }

    const { data: memberData } = await supabase
      .from('members')
      .select('*')
      .eq('trip_id', id)
      .eq('local_key', localKey)
      .single()

    if (!memberData) { setScreen('join'); return }

    setTrip(tripData)
    setMe(memberData)

    const { data: stages } = await supabase
      .from('stages')
      .select('*, options(*)')
      .eq('trip_id', id)
      .order('position')

    const allLocked = stages?.every(s => s.status === 'locked')
    setScreen(allLocked ? 'locked' : 'dashboard')
  }

  function handleTripCreated(newTrip, member) {
    const url = new URL(window.location.href)
    url.searchParams.set('trip', newTrip.id)
    window.history.pushState({}, '', url)
    setTripId(newTrip.id)
    setTrip(newTrip)
    setMe(member)
    setScreen('dashboard')
  }

  function handleJoined(tripData, member) {
    setTrip(tripData)
    setMe(member)
    setScreen('dashboard')
  }

  function handleAllLocked(finalTrip) {
    setTrip(finalTrip)
    setScreen('locked')
  }

  function handleNewTrip() {
    const url = new URL(window.location.href)
    url.searchParams.delete('trip')
    window.history.pushState({}, '', url)
    setTripId(null)
    setTrip(null)
    setMe(null)
    setScreen('landing')
  }

  if (screen === 'loading') {
    return (
      <div className="max-w-sm mx-auto min-h-dvh flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-3xl font-black text-violet-600 mb-2">PlanKaroChalo</div>
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {screen === 'landing' && (
        <LandingScreen
          onStart={() => setScreen('create')}
        />
      )}
      {screen === 'create' && (
        <CreateTripScreen
          onBack={() => setScreen('landing')}
          onCreated={handleTripCreated}
        />
      )}
      {screen === 'join' && (
        <JoinScreen
          tripId={tripId}
          onJoined={handleJoined}
          onNotFound={() => setScreen('landing')}
        />
      )}
      {screen === 'dashboard' && trip && me && (
        <TripDashboard
          trip={trip}
          me={me}
          onAllLocked={handleAllLocked}
          onBack={handleNewTrip}
        />
      )}
      {screen === 'locked' && trip && me && (
        <TripLockedScreen
          trip={trip}
          onNewTrip={handleNewTrip}
        />
      )}
    </>
  )
}
