<script setup lang="ts">
import { ElButton } from 'element-plus'
import { SettingsStore } from '@/stores/SettingsStore'

const settings = SettingsStore()
</script>

<template>
  <h2>Settings</h2>
  <div v-if="settings.settings.supabase.live">
    prev = {{ settings.settings.supabase.live.prev.response - settings.settings.supabase.live.prev.request }}
    last = {{ settings.settings.supabase.live.last.response - settings.settings.supabase.live.last.request }}
  </div>
  <div>
    <ElButton @click="settings.PingSupabase()">Ping</ElButton>
  </div>
</template>