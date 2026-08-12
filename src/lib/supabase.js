import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://avhahgquikdpobdjjtlw.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_phEu8tinedpzf8egkGtrNg_TmxsbEvs"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
