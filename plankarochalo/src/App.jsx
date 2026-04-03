import { useState } from 'react'
import LandingScreen from './screens/LandingScreen'
import CreateTripScreen from './screens/CreateTripScreen'
import TripDashboard from './screens/TripDashboard'
import TripLockedScreen from './screens/TripLockedScreen'
import { MEMBERS, INITIAL_STAGES } from './data/mockData'

function makeSampleTrip() {
  return {
    name: 'Goa Escape',
    vibe: 'Beach',
    groupSize: 6,
    members: MEMBERS,
    stages: INITIAL_STAGES.map(s => ({
      ...s,
      options: s.options.map(o => ({ ...o, votes: [...o.votes] })),
    })),
  }
}

function makeNewTrip(data) {
  return {
    ...data,
    members: MEMBERS,
    stages: INITIAL_STAGES.map(s => ({
      ...s,
      status: 'open',
      lockedOptionId: null,
      options: s.options.map(o => ({ ...o, votes: [] })),
    })),
  }
}

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [trip, setTrip] = useState(null)

  return (
    <>
      {screen === 'landing' && (
        <LandingScreen
          onStart={() => setScreen('create')}
          onJoin={() => {
            setTrip(makeSampleTrip())
            setScreen('dashboard')
          }}
        />
      )}

      {screen === 'create' && (
        <CreateTripScreen
          onBack={() => setScreen('landing')}
          onCreate={data => {
            setTrip(makeNewTrip(data))
            setScreen('dashboard')
          }}
        />
      )}

      {screen === 'dashboard' && trip && (
        <TripDashboard
          initialTrip={trip}
          onLocked={finalTrip => {
            setTrip(finalTrip)
            setScreen('locked')
          }}
          onBack={() => setScreen('landing')}
        />
      )}

      {screen === 'locked' && trip && (
        <TripLockedScreen
          trip={trip}
          onNewTrip={() => {
            setTrip(null)
            setScreen('landing')
          }}
        />
      )}
    </>
  )
}
