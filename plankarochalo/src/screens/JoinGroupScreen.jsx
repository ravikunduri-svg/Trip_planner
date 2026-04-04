import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { MEMBER_COLORS } from '../data/stageTemplates'

function getInitials(name) {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function JoinGroupScreen({ groupId, onJoined, onNotFound }) {
  const [group, setGroup] = useState(null)
  const [memberName, setMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchGroup() {
      const { data } = await supabase.from('groups').select('*').eq('id', groupId).single()
      if (!data) { onNotFound(); return }
      setGroup(data)
      setFetching(false)
    }
    fetchGroup()
  }, [groupId])

  async function handleJoin() {
    if (!memberName.trim()) { setError('Enter your name.'); return }
    setError('')
    setLoading(true)
    try {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      const color = MEMBER_COLORS[(count || 0) % MEMBER_COLORS.length]
      const localKey = crypto.randomUUID()

      const { data: member, error: mErr } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          name: memberName.trim(),
          initials: getInitials(memberName),
          color,
          is_admin: false,
          local_key: localKey,
        })
        .select()
        .single()
      if (mErr) throw mErr

      localStorage.setItem(`pkc_group_${groupId}`, localKey)
      onJoined(group, member)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-sm mx-auto min-h-dvh flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-3xl font-black text-violet-600 mb-2">PlanKaroChalo</div>
          <div className="text-sm text-gray-400">Loading group...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-white">
      <div className="pt-16 pb-6 px-6 text-center">
        <div className="text-3xl font-black text-violet-600 mb-1">PlanKaroChalo</div>
        <div className="text-sm text-gray-500">You've been invited to a group</div>
      </div>

      <div className="mx-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl p-5 border border-violet-100 mb-8">
        <div className="text-xs font-bold text-violet-400 uppercase tracking-wide mb-1">Group</div>
        <div className="text-xl font-black text-gray-900">{group?.name}</div>
        <div className="text-xs text-gray-400 mt-1">All trips · Full history · Real-time voting</div>
      </div>

      <div className="px-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">What's your name?</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Rahul"
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="w-full border-2 border-gray-200 focus:border-violet-400 rounded-2xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400"
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>

      <div className="px-6 pb-10 mt-auto pt-6">
        <button
          onClick={handleJoin}
          disabled={!memberName.trim() || loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-violet-200 disabled:shadow-none"
        >
          {loading ? 'Joining...' : 'Join Group ✈️'}
        </button>
      </div>
    </div>
  )
}
