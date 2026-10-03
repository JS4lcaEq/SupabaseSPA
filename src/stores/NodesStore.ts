import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

export type NodeRow = {
  id: number | string
  nm: string | null
}

async function rpc(name: string, body: unknown) {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`${name} ${response.status}`)
  }
  if (response.status === 204) return null
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function idKey(id: number | string) {
  return String(id)
}

export const NodesStore = defineStore('NodesStore', () => {
  const revision = ref(0)
  const index = reactive(new Map<string, NodeRow>())

  function remember(row: NodeRow) {
    const key = idKey(row.id)
    const existing = index.get(key)
    if (existing) {
      existing.nm = row.nm
      return existing
    }
    index.set(key, row)
    return row
  }

  function publish() {
    revision.value += 1
  }

  function held() {
    return [...index.values()]
  }

  async function nodeList(pPid: number | null) {
    const data = (await rpc('node_list', { p_pid: pPid })) as NodeRow[]
    const heldRows = data.map(remember)
    publish()
    return heldRows
  }

  async function nodeSave(pId: number | null, pNm: string) {
    const data = await rpc('node_save', { p_id: pId, p_nm: pNm })
    const row = (Array.isArray(data) ? data[0] : data) as NodeRow
    const heldRow = remember(row)
    publish()
    return heldRow
  }

  async function nodeAll() {
    const data = (await rpc('node_all', {})) as NodeRow[]
    const heldRows = data.map(remember)
    publish()
    return heldRows
  }

  async function nodeDelete(pId: number) {
    await rpc('node_delete', { p_id: pId })
    index.delete(idKey(pId))
    publish()
  }

  return { revision, nodeList, nodeSave, nodeDelete, nodeAll, held }
})
