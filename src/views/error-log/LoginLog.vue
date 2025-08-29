<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>登录日志</span>
      </div>
      <el-table :data="logs" border style="width: 100%">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="loginTime" label="登录时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.loginTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="device" label="设备" width="120" />
        <el-table-column prop="browser" label="浏览器" width="120" />
        <el-table-column prop="environment" label="环境" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="备注/失败原因" />
      </el-table>
      <el-pagination
        style="margin-top: 16px; text-align: right;"
        background
        layout="total, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page.sync="page"
        @current-change="fetchLogs"
      />
    </el-card>
  </div>
</template>

<script>
import { fetchLoginLogs } from '@/api/modules/loginLog'
import dayjs from 'dayjs'

export default {
  name: 'LoginLog',
  data() {
    return {
      logs: [],
      total: 0,
      page: 1,
      pageSize: 10
    }
  },
  created() {
    this.fetchLogs(this.page)
  },
  methods: {
    async fetchLogs(page) {
      const params = { page, limit: this.pageSize }
      const res = await fetchLoginLogs(params)
      if (res && res.data) {
        this.logs = res.data.items || []
        this.total = res.data.total || 0
      }
    },
    formatDate(val) {
      return val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 24px;
}
</style>
