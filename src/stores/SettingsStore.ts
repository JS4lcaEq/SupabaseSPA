import { reactive } from 'vue'
import { defineStore } from 'pinia'

export type Ping = {
  request: number
  response: number
}

export type Live = {
  prev: Ping
  last: Ping
}

export type Supabase = {
  url: string
  available: boolean
  live?: Live
}

export type Settings = {
  supabase: Supabase
}

export const SettingsStore = defineStore('SettingsStore', () => {
  const settings = reactive<Settings>({
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL,
      available: false,
    },
  })

  async function PingSupabase() {
    const live = settings.supabase.live
    if (live) live.prev = { request: live.last.request, response: live.last.response }
    const request = Math.floor(Date.now() / 1000)
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    const response = await fetch(`${settings.supabase.url}/rest/v1/rpc/db_ping`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    if (!response.ok) throw new Error(`db_ping ${response.status}`)
    const value = Number(await response.json())
    const last = { request, response: value }
    if (settings.supabase.live) settings.supabase.live.last = last
    else settings.supabase.live = { prev: last, last }
  }

  return { settings, PingSupabase }
})