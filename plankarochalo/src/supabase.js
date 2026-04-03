import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mlohdcijyhgldizmgeyq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sb2hkY2lqeWhnbGRpem1nZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTE4ODcsImV4cCI6MjA5MDc4Nzg4N30.vYMzImQipDOSJ4Gdd6KOIoIZtXL6u2i3zgowrOt0YAM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
