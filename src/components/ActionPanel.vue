<template>
  <el-dialog :visible.sync="visible" :title="title" width="400px" @close="$emit('close')">
    <div class="action-panel-content">
      <slot />
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ActionPanel',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '操作面板'
    }
  },
  data() {
    return {
      visible: this.value
    }
  },
  watch: {
    value(val) {
      this.visible = val
    },
    visible(val) {
      this.$emit('input', val)
    }
  }
}
</script>

<style scoped>
.action-panel-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
  align-items: center;
  min-height: 60px;
  padding: 8px 0 4px 0;
}
.action-panel-content .el-button {
  min-width: 90px;
  font-size: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
}
.action-panel-content .el-button:hover {
  box-shadow: 0 2px 8px rgba(64,158,255,0.15);
}
@media (max-width: 480px) {
  .action-panel-content {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  .action-panel-content .el-button {
    width: 100%;
    min-width: 0;
  }
}
</style>
