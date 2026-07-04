<template>
  <el-row class="quick-actions" justify="center">
    <el-button
      v-for="(action, idx) in actions"
      :key="idx"
      :type="action.type || 'default'"
      :icon="action.icon"
      @click="handleClick(action)"
    >
      {{ action.label }}
    </el-button>
  </el-row>
</template>

<script>
export default {
  name: 'QuickActions',
  props: {
    actions: {
      type: Array,
      required: true,
      default: () => [],
      validator: (value) => {
        return value.every(item => item.label && item.name)
      }
    }
  },
  methods: {
    handleClick(action) {
      this.$emit('action-click', action)
    }
  }
}
</script>

<style scoped>
.quick-actions {
  margin: 32px 0 24px 0;
  text-align: center;
}
.quick-actions .el-button {
  margin: 0 8px;
}
</style>