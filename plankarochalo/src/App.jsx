import { useState, useEffect } from 'react'
import LandingScreen from './screens/LandingScreen'
import CreateTripScreen from './screens/CreateTripScreen'
import CreateGroupScreen from './screens/CreateGroupScreen'
import JoinScreen from './screens/JoinScreen'
import JoinGroupScreen from './screens/JoinGroupScreen'
import GroupDashboard from './screens/GroupDashboard'
import TripDashboard from './screens/TripDashboard'
import TripLockedScreen from './screens/TripLockedScreen'
import { supabase } from './supabase'

function setParam(key, value) {
  const url = new URL(window.location.href)
  if (value) url.searchParams.set(key, value)
  else url.searchParams.delete(key)
  window.history.pushState({}, '', url)
}

function getParams() {
  const p = new URLSearchParams(window.location.search)
  return { tripId: p.get('trip'), groupId: p.get('group') }
}

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [trip, setTrip] = useState(null)
  const [me, setMe] = useState(null)           // trip member
  const [group, setGroup] = useState(null)
  const [groupMe, setGroupMe] = useState(null) // group member
  const [fromGroup, setFromGroup] = useState(null) // groupId to return to

  useEffect(() => {
    const { tripId, groupId } = getParams()

    if (tripId) {
      const localKey = localStorage.getItem(`pkc_member_${tripId}`)
      if (localKey) loadTripAndMember(tripId, localKey)
      else setScreen('join')
    } else if (groupId) {
      const localKey = localStorage.getItem(`pkc_group_${groupId}`)
      if (localKey) loadGroupAndMember(groupId, localKey)
      else setScreen('join_group')
    } else {
      setScreen('landing')
    }
  }, [])

  async function loadTripAndMember(tripId, localKey) {
    const { data: tripData } = await supabase.from('trips').select('*').eq('id', tripId).single()
    if (!tripData) { setScreen('landing'); return }

    const { data: memberData } = await supabase
      .from('members').select('*').eq('trip_id', tripId).eq('local_key', localKey).single()
    if (!memberData) { setScreen('join'); return }

    const { data: stages } = await supabase
      .from('stages').select('*, options(*)').eq('trip_id', tripId).order('position')

    setTrip(tripData)
    setMe(memberData)

    // If trip belongs to a group and we're a group member, remember it for back nav
    if (tripData.group_id) {
      const gKey = localStorage.getItem(`pkc_group_${tripData.group_id}`)
      if (gKey) setFromGroup(tripData.group_id)
    }

    const allLocked = stages?.every(s => s.status === 'locked')
    setScreen(allLocked ? 'locked' : 'dashboard')
  }

  async function loadGroupAndMember(groupId, localKey) {
    const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single()
    if (!groupData) { setScreen('landing'); return }

    const { data: memberData } = await supabase
      .from('group_members').select('*').eq('group_id', groupId).eq('local_key', localKey).single()
    if (!memberData) { setScreen('join_group'); return }

    setGroup(groupData)
    setGroupMe(memberData)
    setScreen('group')
  }

  // ── Handlers ──────────────────────────────────────────────────

  function goToLanding() {
    setParam('trip', null); setParam('group', null)
    setTrip(null); setMe(null); setGroup(null); setGroupMe(null); setFromGroup(null)
    setScreen('landing')
  }

  function goToGroup(groupId) {
    setParam('trip', null); setParam('group', groupId)
    setTrip(null); setMe(null)
    const localKey = localStorage.getItem(`pkc_group_${groupId}`)
    loadGroupAndMember(groupId, localKey)
  }

  function handleGroupCreated(newGroup, member) {
    setParam('group', newGroup.id); setParam('trip', null)
    setGroup(newGroup); setGroupMe(member)
    setScreen('group')
  }

  function handleGroupJoined(groupData, member) {
    setGroup(groupData); setGroupMe(member)
    setScreen('group')
  }

  function handleTripCreated(newTrip, member) {
    setParam('trip', newTrip.id)
    setTrip(newTrip); setMe(member)
    if (newTrip.group_id) setFromGroup(newTrip.group_id)
    setScreen('dashboard')
  }

  function handleTripJoined(tripData, member) {
    setTrip(tripData); setMe(member)
    if (tripData.group_id) {
      const gKey = localStorage.getItem(`pkc_group_${tripData.group_id}`)
      if (gKey) setFromGroup(tripData.group_id)
    }
    setScreen('dashboard')
  }

  function handleAllLocked(finalTrip) {
    setTrip(finalTrip); setScreen('locked')
  }

  function handleOpenTripFromGroup(tripId) {
    setParam('trip', tripId)
    const localKey = localStorage.getItem(`pkc_member_${tripId}`)
    if (localKey) loadTripAndMember(tripId, localKey)
    else setScreen('join')
  }

  function handleBackFromTrip() {
    if (fromGroup) goToGroup(fromGroup)
    else goToLanding()
  }

  const { tripId, groupId } = getParams()

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
          onCreateGroup={() => setScreen('create_group')}
        />
      )}
      {screen === 'create_group' && (
        <CreateGroupScreen
          onBack={() => setScreen('landing')}
          onCreated={handleGroupCreated}
        />
      )}
      {screen === 'join_group' && (
        <JoinGroupScreen
          groupId={groupId}
          onJoined={handleGroupJoined}
          onNotFound={goToLanding}
        />
      )}
      {screen === 'group' && group && groupMe && (
        <GroupDashboard
          group={group}
          me={groupMe}
          onStartTrip={() => setScreen('create')}
          onOpenTrip={handleOpenTripFromGroup}
        />
      )}
      {screen === 'create' && (
        <CreateTripScreen
          onBack={() => fromGroup ? goToGroup(fromGroup) : group ? setScreen('group') : setScreen('landing')}
          onCreated={handleTripCreated}
          groupId={group?.id ?? null}
          groupMember={groupMe}
        />
      )}
      {screen === 'join' && (
        <JoinScreen
          tripId={tripId}
          onJoined={handleTripJoined}
          onNotFound={goToLanding}
        />
      )}
      {screen === 'dashboard' && trip && me && (
        <TripDashboard
          trip={trip}
          me={me}
          onAllLocked={handleAllLocked}
          onBack={handleBackFromTrip}
        />
      )}
      {screen === 'locked' && trip && me && (
        <TripLockedScreen
          trip={trip}
          onNewTrip={() => fromGroup ? goToGroup(fromGroup) : goToLanding()}
        />
      )}
    </>
  )
}
