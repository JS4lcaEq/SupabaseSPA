<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElButton, ElCol, ElForm, ElFormItem, ElInput, ElRow, ElTreeV2 } from 'element-plus'
import { EdgesStore, type EdgeRow } from '@/stores/EdgesStore'
import { NodesStore } from '@/stores/NodesStore'
import { TreeStore as useTreeStore, treeProps, type TreeView } from '@/stores/TreeStore'

const TreeStore = useTreeStore()
const nodes = NodesStore()
const edges = EdgesStore()
const current = ref<TreeView | null>(null)
const nodeForm = reactive({ id: '', nm: '' })
const manualNewEdge = reactive<EdgeRow>({ pid: 0, cid: 0 })
const dndNewEdge = reactive<EdgeRow>({ pid: 0, cid: 0 })
const dndOldEdge = reactive<EdgeRow>({ pid: 0, cid: 0 })
const dropKey = ref('')

function nodeName(id: number) {
  if (!id) return ''
  const row = nodes.held().find((item) => String(item.id) === String(id))
  return row?.nm ?? ''
}

const parentNm = computed(() => nodeName(manualNewEdge.pid))
const childNm = computed(() => nodeName(manualNewEdge.cid))

const treeRef = ref<InstanceType<typeof ElTreeV2> | null>(null)
const expanded = ref<string[]>([])
const treeHeight = ref(Math.round(window.innerHeight * 0.7))

function onResize() {
  treeHeight.value = Math.round(window.innerHeight * 0.7)
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
void nodes.nodeList(null)

async function linkEdge() {
  if (!manualNewEdge.pid || !manualNewEdge.cid) return
  await edges.edgeAdd(manualNewEdge.pid, manualNewEdge.cid)
}

async function unlinkEdge() {
  const cid = Number(nodeForm.id)
  const pid = current.value?.edge?.pid
  if (!cid || pid == null) return
  await edges.edgeDelete(Number(pid), cid)
}

function setAsParent() {
  if (!nodeForm.id) return
  manualNewEdge.pid = Number(nodeForm.id)
}

function setAsChild() {
  if (!nodeForm.id) return
  manualNewEdge.cid = Number(nodeForm.id)
}

async function saveNode() {
  if (!nodeForm.id) return
  const pid = current.value?.edge?.pid
  await nodes.nodeSave(Number(nodeForm.id), nodeForm.nm)
  void nodes.nodeList(pid ?? null)
}

async function deleteNode() {
  if (!nodeForm.id) return
  const id = Number(nodeForm.id)
  await edges.edgeDeleteEnd(id)
  await nodes.nodeDelete(id)
  current.value = null
  nodeForm.id = ''
  nodeForm.nm = ''
}

async function addNode() {
  if (!nodeForm.id) return
  const pid = Number(nodeForm.id)
  const parentPath = current.value?.id
  const created = await nodes.nodeSave(null, 'New Node')
  await edges.edgeAdd(pid, Number(created.id))
  if (parentPath && !expanded.value.includes(parentPath)) expanded.value = [...expanded.value, parentPath]
  const createdId = String(created.id)
  function find(list: readonly TreeView[]): TreeView | null {
    for (const item of list) {
      if (String(item.node.id) === createdId) return item
      const nested = find(item.childs)
      if (nested) return nested
    }
    return null
  }
  const next = find(TreeStore.rows)
  if (!next) return
  current.value = next
  nodeForm.id = createdId
  nodeForm.nm = next.node.nm ?? 'New Node'
}
const opened = new Set<number>()

function onDragOver(data: TreeView) {
  dropKey.value = data.id
}

function onDragEnd() {
  dropKey.value = ''
}

function onDragStart(data: TreeView) {
  dndNewEdge.cid = Number(data.node.id)
  dndOldEdge.pid = Number(data.edge?.pid ?? 0)
  dndOldEdge.cid = Number(data.edge?.cid ?? 0)
}

async function onNodeDrop(data: TreeView) {
  dndNewEdge.pid = Number(data.node.id)
  if (dndOldEdge.pid && dndOldEdge.cid) await edges.edgeDelete(dndOldEdge.pid, dndOldEdge.cid)
  if (dndNewEdge.pid && dndNewEdge.cid) await edges.edgeAdd(dndNewEdge.pid, dndNewEdge.cid)
  if (!expanded.value.includes(data.id)) expanded.value = [...expanded.value, data.id]
  const droppedPath = `${data.id}|${dndNewEdge.cid}`
  function find(list: readonly TreeView[]): TreeView | null {
    for (const item of list) {
      if (item.path === droppedPath) return item
      const nested = find(item.childs)
      if (nested) return nested
    }
    return null
  }
  const next = find(TreeStore.rows)
  if (!next) return
  current.value = next
  nodeForm.id = String(next.node.id)
  nodeForm.nm = next.node.nm ?? ''
  dropKey.value = ''
}

function onNodeClick(data: TreeView) {
  current.value = data
  nodeForm.id = String(data.node.id)
  nodeForm.nm = data.node.nm ?? ''
  const id = Number(data.node.id)
  if (data.childs.length > 0 || opened.has(id)) return
  opened.add(id)
  void loadBranch(id)
}

async function loadBranch(id: number) {
  try {
    await Promise.all([nodes.nodeList(id), edges.edgeList(id)])
  } catch {
    opened.delete(id)
  }
}


function onNodeExpand(data: TreeView) {
  if (!expanded.value.includes(data.id)) expanded.value = [...expanded.value, data.id]
}

function onNodeCollapse(data: TreeView) {
  expanded.value = expanded.value.filter((id) => id !== data.id)
}

watch(
  () => TreeStore.rows,
  async () => {
    await nextTick()
    treeRef.value?.setExpandedKeys(expanded.value)
  },
)
</script>

<template>
  <h2>Tree</h2>
  <ElRow>
    <ElCol :span="12" >
      <ElTreeV2
        ref="treeRef"
        :data="TreeStore.rows"
        :props="treeProps"
        :height="treeHeight"
        highlight-current
        :current-node-key="current?.id"
        :expand-on-click-node="true"
        @node-click="onNodeClick"
        @node-expand="onNodeExpand"
        @node-collapse="onNodeCollapse"
        @node-drop="onNodeDrop"
      >
        <template #default="{ data }">
          <div draggable="true" :class="{ 'is-drop': dropKey === data.id }" @dragstart="onDragStart(data)" @dragover="onDragOver(data)" @dragend="onDragEnd">{{ data.title }}</div>
        </template>
      </ElTreeV2>
      <div>{{ nodes.held().length }}</div>
    </ElCol>
    <ElCol :span="12">
      <h3 v-if="current">Node</h3>
      <ElForm v-if="current" label-position="top">
        <ElFormItem label="id">
          <ElInput v-model="nodeForm.id" disabled />
        </ElFormItem>
        <ElFormItem label="nm">
          <ElInput v-model="nodeForm.nm" />
        </ElFormItem>
        <ElButton @click="addNode">Add</ElButton> <ElButton @click="saveNode">Save</ElButton> <ElButton type="danger" @click="deleteNode">Delete</ElButton> <ElButton @click="setAsParent">Set as parent</ElButton> <ElButton @click="setAsChild">Set as child</ElButton> <ElButton @click="unlinkEdge">UnLink</ElButton>
      </ElForm>
      <hr />
      <h3>Link</h3>
      <ElForm label-position="top">
        <ElFormItem label="Parent">
          <ElRow :gutter="8">
            <ElCol :span="6"><ElInput :model-value="String(manualNewEdge.pid)" disabled placeholder="id" /></ElCol>
            <ElCol :span="18"><ElInput :model-value="parentNm" disabled placeholder="nm" /></ElCol>
          </ElRow>
        </ElFormItem>
        <ElFormItem label="Child">
          <ElRow :gutter="8">
            <ElCol :span="6"><ElInput :model-value="String(manualNewEdge.cid)" disabled placeholder="id" /></ElCol>
            <ElCol :span="18"><ElInput :model-value="childNm" disabled placeholder="nm" /></ElCol>
          </ElRow>
        </ElFormItem>
        <ElButton @click="linkEdge">Link</ElButton>
      </ElForm>
    </ElCol>
  </ElRow>
</template>
<style scoped>
.is-drop {
  background-color: #409eff;
  color: #fff;
}
</style>
