<template>
  <el-form>
    <el-form-item label="昵称">
      <el-input v-model.trim="form.nickname" />
    </el-form-item>
    <el-form-item label="Email">
      <el-input v-model.trim="form.email" />
    </el-form-item>
    <el-form-item label="Description">
      <el-input type="textarea"
      :rows="2" v-model.trim="form.description" />
    </el-form-item>
    <el-form-item label="signature">
      <el-input type="textarea"
      :rows="2" v-model.trim="form.signature" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">Update</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { getUserDetail, updateProfile } from '@/api/modules/user'
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      form: {
        nickname: '',
        email: '',
        description: '',
        signature: ''
      }
    }
  },
  computed: {
    ...mapGetters(['userId'])
  },
  watch: {
    userId: {
      immediate: true,
      handler(val) {
        if (val) {
          this.fetchUserInfo()
        }
      }
    }
  },
  mounted() {
    // 不再这里直接调用 fetchUserInfo
  },
  methods: {
    async fetchUserInfo() {
      try {
        const res = await getUserDetail(this.userId)
        this.form = {
          nickname: res.data.nickname || '',
          email: res.data.email || '',
          description: res.data.description || '',
          signature: res.data.signature || ''
        }
      } catch (error) {
        this.$message.error({ message: error.message || '获取用户信息失败', duration: 3000 })
      }
    },
    async submit() {
      try {
        const payload = { ...this.form, id: this.userId }
        await updateProfile(payload)
        this.$message({
          message: '用户信息已成功更新',
          type: 'success',
          duration: 5 * 1000
        })
      } catch (error) {
        this.$message.error({ message: error.message || '更新失败', duration: 3000 })
      }
    }
  }
}
</script>
