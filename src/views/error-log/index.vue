<template>
  <div class="errPage-container">
    <template v-if="isBackend">
      <el-button size="mini" type="primary" style="margin-bottom: 10px;" @click="exportLogs('backend')">导出后端日志</el-button>
      <el-table :data="backendLogs" border style="width: 100%" size="small">
        <el-table-column prop="timestamp" label="时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="message" label="信息" />
        <el-table-column prop="stack" label="堆栈" />
        <el-table-column prop="context" label="上下文" />
        <el-table-column prop="userInfo" label="用户信息" />
        <el-table-column prop="pageInfo" label="页面信息" />
        <el-table-column prop="ext" label="扩展" />
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button size="mini" @click="copyLog(scope.row)">复制</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        :current-page="backendPage"
        :page-size="backendLimit"
        :total="backendTotal"
        @current-change="handleBackendPageChange"
        layout="total, prev, pager, next"
        style="margin-top: 10px;"
      />
      <el-empty v-if="!backendLogs.length" description="暂无后端日志" />
    </template>
    <template v-else>
      <el-button size="mini" type="primary" style="margin-bottom: 10px;" @click="exportLogs('frontend')">导出前端日志</el-button>
      <el-table :data="frontendLogs" style="width: 100%" size="small">
        <el-table-column prop="timestamp" label="时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="errorType" label="类型" width="100" />
        <el-table-column prop="errorLevel" label="级别" width="100" />
        <el-table-column prop="err.message" label="信息" />
        <el-table-column prop="info" label="上下文" />
        <el-table-column prop="codeLocation" label="代码位置" width="320" />
        <el-table-column prop="requestUrl" label="请求地址" width="320" />
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button size="mini" @click="copyLog(scope.row)">复制</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!frontendLogs.length" description="暂无前端日志" />
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { Empty } from 'element-ui'
import { fetchBackendLogs } from '@/api/modules/log'
import dayjs from 'dayjs'

export default {
  name: 'ErrorLog',
  components: {
    'el-empty': Empty
  },
  data() {
    return {
      backendLogs: [],
      backendTotal: 0,
      backendPage: 1,
      backendLimit: 10
    }
  },
  computed: {
    ...mapGetters(['errorLogs']),
    frontendLogs() {
      return this.errorLogs
    },
    isBackend() {
      return this.$route.name === 'BackendLog'
    }
  },
  watch: {
    '$route.name': {
      immediate: true,
      handler(name) {
        if (name === 'BackendLog') {
          this.loadBackendLogs()
        }
      }
    }
  },
  methods: {
    exportLogs(type) {
      const data = type === 'backend' ? this.backendLogs : this.frontendLogs
      if (!data || !data.length) {
        this.$message.warning('暂无可导出的日志')
        return
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = (type === 'backend' ? 'backend-logs.json' : 'frontend-logs.json')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      this.$message.success('日志已导出')
    },
    copyLog(log) {
      const text = typeof log === 'string' ? log : JSON.stringify(log, null, 2)
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
        this.$message.success('日志已复制到剪贴板')
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$message.success('日志已复制到剪贴板')
      }
    },
    loadBackendLogs() {
      fetchBackendLogs({ page: this.backendPage, limit: this.backendLimit }).then(res => {
        this.backendLogs = res.data.items
        this.backendTotal = res.data.total
      })
    },
    handleBackendPageChange(val) {
      this.backendPage = val
      this.loadBackendLogs()
    },
    formatDate(val) {
      return val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
    }
  }
}
</script>

<style scoped>
  .errPage-container {
    padding: 30px;
  }
</style>
