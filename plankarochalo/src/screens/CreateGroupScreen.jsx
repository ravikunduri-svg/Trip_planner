import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../supabase'
import { MEMBER_COLORS } from '../data/stageTemplates'

function getInitials(name) {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function CreateGroupScreen({ onBack, onCreated }) {
  const [groupName, setGroupName] = useState('')
  const [yourName, setYourName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!groupName.trim() || !yourName.trim()) {
      setError('Please fill in both fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data: group, error: gErr } = await supabase
        .from('groups')
        .insert({ name: groupName.trim() })
        .select()
        .single()
      if (gErr) throw gErr

      const localKey = crypto.randomUUID()
      const { data: member, error: mErr } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          name: yourName.trim(),
          initials: getInitials(yourName),
          color: MEMBER_COLORS[0],
          is_admin: true,
          local_key: localKey,
        })
        .select()
        .single()
      if (mErr) throw mErr

      localStorage.setItem(`pkc_group_${group.id}`, localKey)
      onCreated(group, member)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto min-h-dvh flex flex-col bg-white">
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Create a Group</h1>
      </div>

      <div className="flex-1 px-6 py-2 space-y-6">
        <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
          <p className="text-sm font-semibold text-violet-700">👥 What's a Group?</p>
          <p className="text-xs text-violet-600 mt-1 leading-relaxed">
            A group is your crew — Mumbai Squad, College Gang, Family. All your trips live here. Share one link once, plan together forever.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Group name</label>
          <input
            type="text"
            placeholder="e.g. Mumbai Squad, College Gang"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            className="w-full border-2 border-gray-200 focus:border-violet-400 rounded-2xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Your name</label>
          <input
            type="text"
            placeholder="e.g. Shravan"
            value={yourName}
            onChange={e => setYourName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full border-2 border-gray-200 focus:border-violet-400 rounded-2xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400"
          />
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>

      <div className="px-6 pb-10 pt-4">
        <button
          onClick={handleCreate}
          disabled={!groupName.trim() || !yourName.trim() || loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-violet-200 disabled:shadow-none"
        >
          {loading ? 'Creating...' : 'Create Group & Get Link 🎯'}
        </button>
      </div>
    </div>
  )
}
