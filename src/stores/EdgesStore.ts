import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

export type EdgeRow = {
  pid: number
  cid: number
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

function edgeKey(pid: number, cid: number) {
  return `${pid}|${cid}`
}

export const EdgesStore = defineStore('EdgesStore', () => {
  const revision = ref(0)
  const index = reactive(new Map<string, EdgeRow>())

  function remember(row: EdgeRow): EdgeRow {
    const key = edgeKey(row.pid, row.cid)
    const existing = index.get(key)
    if (existing) return existing
    index.set(key, row)
    return row
  }

  function publish() {
    revision.value += 1
  }

  function held() {
    return [...index.values()]
  }

  async function edgeAll() {
    const data = (await rpc('edge_all', {})) as EdgeRow[]
    const heldRows = data.map(remember)
    publish()
    return heldRows
  }

  async function edgeList(pPid: number) {
    const data = (await rpc('edge_list', { p_pid: pPid })) as EdgeRow[]
    const heldRows = data.map(remember)
    publish()
    return heldRows
  }

  async function edgeAdd(pPid: number, pCid: number) {
    const data = await rpc('edge_add', { p_pid: pPid, p_cid: pCid })
    const row = (Array.isArray(data) ? data[0] : data) as EdgeRow
    const heldRow = remember(row)
    publish()
    return heldRow
  }

  async function edgeDelete(pPid: number, pCid: number) {
    await rpc('edge_delete', { p_pid: pPid, p_cid: pCid })
    index.delete(edgeKey(pPid, pCid))
    publish()
  }

  async function edgeDeleteEnd(pId: number) {
    await rpc('edge_delete_end', { p_id: pId })
    for (const [key, row] of [...index]) {
      if (row.pid === pId || row.cid === pId) index.delete(key)
    }
    publish()
  }

  return { revision, edgeAll, edgeList, edgeAdd, edgeDelete, edgeDeleteEnd, held }
})
