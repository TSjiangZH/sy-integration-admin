<template>
  <el-dialog :title="role ? '编辑角色' : '新增角色'" :visible.sync="$parent.roleFormVisible" width="400px" @close="$emit('close')">
    <el-form :model="form" label-width="80px">
      <el-form-item label="角色名">
        <el-input v-model="form.name" :disabled="!!role" />
      </el-form-item>
      <el-form-item label="角色编码">
        <el-input v-model="form.code" :disabled="!!role" placeholder="如：admin、user" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" />
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </div>
  </el-dialog>
</template>
<script>
import { createRole, updateRole } from '@/api/modules/role'
export default {
  name: 'RoleForm',
  props: { role: Object },
  data() {
    return {
      form: {
        name: '',
        code: '',
        description: '',
      }
    }
  },
  watch: {
    role: {
      immediate: true,
      handler(val) {
        if (val) {
          this.form = { name: '', code: '', description: '', ...val }
        } else {
          this.form = { name: '', code: '', description: '' }
        }
      }
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.form.code) {
        this.$message.error({ message: '请填写角色编码', duration: 3000 })
        return
      }
      if (this.role) {
        await updateRole(this.form)
        this.$message.success('编辑成功')
      } else {
        await createRole(this.form)
        this.$message.success('新增成功')
      }
      this.$emit('close')
    }
  }
}
</script>
