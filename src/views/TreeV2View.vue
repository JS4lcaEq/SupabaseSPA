<script setup lang="ts">
import { ElButton } from 'element-plus'
import { EdgesStore } from '@/stores/EdgesStore'
import { NodesStore } from '@/stores/NodesStore'
import { TreeStore } from '@/stores/TreeStore'

const nodes = NodesStore()
const edges = EdgesStore()
TreeStore()

async function load() {
  await nodes.nodeAll()
  await edges.edgeAll()
}
</script>

<template>
  <h2>TreeV2</h2>
  <div>{{ nodes.held().length }}</div>
  <div>{{ edges.held().length }}</div>
  <ElButton @click="load">Load</ElButton>
</template>