import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qpttxbcglzocxbzzevmg.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdHR4YmNnbHpvY3hienpldm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTA4NzAsImV4cCI6MjA3OTU4Njg3MH0.RY9LeGG0RAwluLXKWzDYGGQadjx5uVo259BhOI_0faI'

console.log('[Supabase] Initializing with URL:', supabaseUrl ? 'configured' : 'missing')

// Web-compatible storage wrapper
const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return Promise.resolve(window.localStorage.getItem(key))
        }
        return Promise.resolve(null)
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value)
        }
        return Promise.resolve()
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key)
        }
        return Promise.resolve()
      },
    }
  }
  return AsyncStorage
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})