<script setup lang="ts">
import { ref } from 'vue'
import { ElButton } from 'element-plus'

type NodeRow = { id: number | string; nm: string | null }
type TreeRow = {
  path: string | null
  level: number | null
  node_id: number | string | null
  node_nm: string | null
  nn: number | null
  total: number | null
}

const nodes = ref<NodeRow[]>([])
const tree = ref<TreeRow[]>([])
const error = ref('')
const loading = ref(false)

function headers() {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function loadNodes() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/nodes?select=id,nm&limit=5`,
      { headers: headers() },
    )
    if (!response.ok) throw new Error(`nodes ${response.status}`)
    nodes.value = await response.json()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'nodes failed'
  } finally {
    loading.value = false
  }
}

async function loadTree() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/tree_view`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ p_root_id: null, p_from: 1, p_to: 5 }),
    })
    if (!response.ok) throw new Error(`tree_view ${response.status}`)
    tree.value = await response.json()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'tree_view failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2>Test Supabase</h2>
    <p>
      <ElButton :loading="loading" @click="loadNodes">nodes</ElButton>
      &nbsp;
      <ElButton :loading="loading" @click="loadTree">tree_view</ElButton>
    </p>
    <p v-if="error">{{ error }}</p>
    <h3>nodes</h3>
    <ul>
      <li v-for="row in nodes" :key="row.id">{{ row.id }} {{ row.nm }}</li>
    </ul>
    <h3>tree_view</h3>
    <ul>
      <li v-for="row in tree" :key="`${row.path}-${row.nn}`">
        {{ row.path }} {{ row.node_nm }}
      </li>
    </ul>
  </div>
</template>