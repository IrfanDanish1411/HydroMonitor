import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fetch latest sensor readings
export async function getLatestReadings(limit = 100) {
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Fetch active alerts (most recent 10)
export async function getActiveAlerts() {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('id', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching alerts:', error)
    return [] // Return empty array on error instead of throwing
  }
  return data || []
}

// Subscribe to real-time sensor data
export function subscribeToSensorData(callback) {
  return supabase
    .channel('sensor_readings')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings'
      },
      callback
    )
    .subscribe()
}

// Subscribe to real-time alerts
export function subscribeToAlerts(callback) {
  return supabase
    .channel('alerts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts'
      },
      callback
    )
    .subscribe()
}
