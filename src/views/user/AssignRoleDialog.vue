<template>
  <el-dialog :visible.sync="localVisible" title="分配角色" @close="handleClose">
    <el-radio-group v-model="localSelectedRoleId">
      <el-radio v-for="role in roleList" :key="role.id" :label="role.id">{{ role.name }}</el-radio>
    </el-radio-group>
    <div slot="footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="onConfirm">确定</el-button>
    </div>
  </el-dialog>
</template>
<script>
export default {
  props: {
    visible: Boolean,
    roleList: Array,
    selectedRoleId: [String, Number]
  },
  data() {
    return {
      localVisible: this.visible,
      localSelectedRoleId: this.selectedRoleId
    }
  },
  watch: {
    visible(val) {
      this.localVisible = val
    },
    localVisible(val) {
      if (!val) this.$emit('close')
    },
    selectedRoleId(val) {
      this.localSelectedRoleId = val
    }
  },
  methods: {
    handleClose() {
      this.localVisible = false
    },
    onConfirm() {
      this.$emit('confirm', this.localSelectedRoleId)
      this.localVisible = false
    }
  }
}
</script>
