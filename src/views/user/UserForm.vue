<template>
  <el-dialog :title="user ? '编辑用户' : '新增用户'" :visible.sync="$parent.userFormVisible" width="400px" @close="$emit('close')">
    <el-form :model="form" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" :disabled="!!user" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="form.phone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item label="头像">
        <el-input v-model="form.avatar" placeholder="图片URL" />
      </el-form-item>
      <el-form-item label="密码" v-if="!user">
        <el-input v-model="form.password" type="password" autocomplete="new-password" />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item label="个性签名">
        <el-input v-model="form.signature" placeholder="请输入个性签名" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="form.gender" placeholder="请选择性别">
          <el-option label="未知" :value="0" />
          <el-option label="男" :value="1" />
          <el-option label="女" :value="2" />
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </div>
  </el-dialog>
</template>
<script>
import { createUser, updateUser } from '@/api/modules/user'
export default {
  name: 'UserForm',
  props: { user: Object },
  data() {
    return {
      form: {
        username: '',
        nickname: '',
        status: 1,
        password: '',
        email: '',
        phone: '',
        avatar: '',
        remark: '',
        description: '',
        signature: '',
        gender: 0
      }
    }
  },
  watch: {
    user: {
      immediate: true,
      handler(val) {
        if (val) {
          this.form = { ...val, password: '', description: val.description || '', signature: val.signature || '', gender: val.gender || 0 }
        } else {
          this.form = { username: '', nickname: '', status: 1, password: '', email: '', phone: '', avatar: '', remark: '', description: '', signature: '', gender: 0 }
        }
      }
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.user && !this.form.password) {
        this.$message.error({ message: '请填写密码', duration: 3000 })
        return
      }
      if (!this.form.username) {
        this.$message.error({ message: '请填写用户名', duration: 3000 })
        return
      }
      if (!this.form.nickname) {
        this.$message.error({ message: '请填写昵称', duration: 3000 })
        return
      }
      if (this.form.email && !/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(this.form.email)) {
        this.$message.error({ message: '邮箱格式不正确', duration: 3000 })
        return
      }
      if (this.form.phone && !/^1[3-9]\d{9}$/.test(this.form.phone)) {
        this.$message.error({ message: '手机号格式不正确', duration: 3000 })
        return
      }
      const submitData = { ...this.form }
      if (this.user && !submitData.password) {
        delete submitData.password
      }
      delete submitData.deleted
      if (this.user) {
        await updateUser(submitData)
        this.$message.success('编辑成功')
      } else {
        await createUser(submitData)
        this.$message.success('新增成功')
      }
      this.$emit('close')
    }
  }
}
</script>
