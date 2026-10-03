<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ElCollapse, ElCollapseItem } from 'element-plus'
import router from '../router'

const pages = router.options.routes.flatMap((route) => {
  const title = route.meta?.header
  if (!title || title === 'Home') return []
  return [{ path: route.path, title, description: route.meta?.description ?? '' }]
})
</script>

<template>
  <p>&nbsp;</p>
  <ElCollapse>
    <ElCollapseItem v-for="page in pages" :key="page.path" :name="page.path">
      <template #title><RouterLink :to="page.path" @click.stop>{{ page.title }}</RouterLink></template>
      <div>{{ page.description }}</div>
    </ElCollapseItem>
  </ElCollapse>
</template>