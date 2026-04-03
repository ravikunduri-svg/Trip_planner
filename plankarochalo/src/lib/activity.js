import { supabase } from '../supabase'

export async function logActivity(tripId, memberId, action, extras = {}) {
  const { error } = await supabase.from('activity_log').insert({
    trip_id: tripId,
    member_id: memberId,
    action,
    stage_key: extras.stage_key ?? null,
    option_label: extras.option_label ?? null,
  })
  if (error) console.error('activity_log write failed:', error)
}
