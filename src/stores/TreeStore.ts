import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { NodesStore, type NodeRow } from '@/stores/NodesStore'
import { EdgesStore, type EdgeRow } from '@/stores/EdgesStore'

export type TreeView = {
  readonly path: string
  readonly node: NodeRow
  readonly edge: EdgeRow | null
  readonly childs: readonly TreeView[]
  readonly id: string
  readonly title: string
}

function createView(path: string, node: NodeRow, edge: EdgeRow | null, childs: readonly TreeView[]): TreeView {
  return {
    path,
    node,
    edge,
    childs,
    get id() {
      return path
    },
    get title() {
      return node.nm ?? ''
    },
  }
}

export const treeProps = { value: 'path', label: 'title', children: 'childs' }

export const TreeStore = defineStore('TreeStore', () => {
  const roots = ref<readonly TreeView[]>([])
  const nodes = NodesStore()
  const edges = EdgesStore()

  function rebuild() {
    const nodeRows = nodes.held()
    const byId = new Map(nodeRows.map((node) => [String(node.id), node]))
    const childEdges = new Map<string, EdgeRow[]>()
    const hasParent = new Set<string>()
    for (const edge of edges.held()) {
      const pid = String(edge.pid)
      const cid = String(edge.cid)
      if (!byId.has(pid) || !byId.has(cid)) continue
      hasParent.add(cid)
      const list = childEdges.get(pid)
      if (list) list.push(edge)
      else childEdges.set(pid, [edge])
    }

    function walk(node: NodeRow, path: string, edge: EdgeRow | null, stack: readonly string[]): TreeView {
      const id = String(node.id)
      if (stack.includes(id)) return createView(path, node, edge, [])
      const next = [...stack, id]
      const childs: TreeView[] = []
      for (const childEdge of childEdges.get(id) ?? []) {
        const child = byId.get(String(childEdge.cid))
        if (!child) continue
        childs.push(walk(child, `${path}|${child.id}`, childEdge, next))
      }
      return createView(path, node, edge, childs)
    }

    const nextRoots: TreeView[] = []
    for (const node of nodeRows) {
      if (hasParent.has(String(node.id))) continue
      nextRoots.push(walk(node, String(node.id), null, []))
    }
    roots.value = nextRoots
  }

  watch([() => nodes.revision, () => edges.revision], rebuild, { flush: 'sync' })

  return { rows: roots }
})
