<template>
  <div class="errPage-container">
    <template v-if="isBackend">
      <el-card class="stats-card">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ stats.total || 0 }}</div>
              <div class="stat-label">日志总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item error">
              <div class="stat-value">{{ stats.errorCount || 0 }}</div>
              <div class="stat-label">错误数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item warn">
              <div class="stat-value">{{ stats.warnCount || 0 }}</div>
              <div class="stat-label">警告数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item info">
              <div class="stat-value">{{ stats.infoCount || 0 }}</div>
              <div class="stat-label">信息数</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="filter-card">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="级别">
            <el-select v-model="filterForm.level" placeholder="全部" clearable>
              <el-option label="ERROR" value="ERROR" />
              <el-option label="WARN" value="WARN" />
              <el-option label="INFO" value="INFO" />
              <el-option label="DEBUG" value="DEBUG" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-input v-model="filterForm.type" placeholder="日志类型" clearable style="width: 150px;" />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="filterForm.message" placeholder="日志内容" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card>
        <div class="card-header">
          <span>后端日志列表</span>
          <div class="card-actions">
            <el-button size="mini" type="primary" @click="exportLogs('backend')">导出日志</el-button>
            <el-button size="mini" type="danger" @click="handleClear">清理日志</el-button>
          </div>
        </div>
        <el-table :data="backendLogs" border style="width: 100%" size="small" @row-click="showLogDetail">
          <el-table-column prop="createTime" label="时间" width="180">
            <template slot-scope="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="level" label="级别" width="80">
            <template slot-scope="scope">
              <el-tag :type="getLevelType(scope.row.level)" size="mini">{{ scope.row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="message" label="信息" show-overflow-tooltip />
          <el-table-column prop="context" label="上下文" width="150" show-overflow-tooltip />
          <el-table-column prop="userInfo" label="用户信息" width="120" show-overflow-tooltip />
          <el-table-column label="操作" width="120">
            <template slot-scope="scope">
              <el-button size="mini" @click.stop="copyLog(scope.row)">复制</el-button>
              <el-button size="mini" type="danger" @click.stop="handleDelete(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          :current-page="backendPage"
          :page-size="backendLimit"
          :total="backendTotal"
          @current-change="handleBackendPageChange"
          layout="total, prev, pager, next"
          style="margin-top: 10px; text-align: right;"
        />
        <el-empty v-if="!backendLogs.length" description="暂无后端日志" />
      </el-card>
    </template>
    <template v-else>
      <el-card>
        <div class="card-header">
          <span>前端日志列表</span>
          <el-button size="mini" type="primary" @click="exportLogs('frontend')">导出日志</el-button>
        </div>
        <el-table :data="frontendLogs" style="width: 100%" size="small">
          <el-table-column prop="timestamp" label="时间" width="180">
            <template slot-scope="scope">
              {{ formatDate(scope.row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="errorType" label="类型" width="100" />
          <el-table-column prop="errorLevel" label="级别" width="100">
            <template slot-scope="scope">
              <el-tag :type="getLevelType(scope.row.errorLevel)" size="mini">{{ scope.row.errorLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="err.message" label="信息" show-overflow-tooltip />
          <el-table-column prop="info" label="上下文" show-overflow-tooltip />
          <el-table-column prop="codeLocation" label="代码位置" width="320" show-overflow-tooltip />
          <el-table-column prop="requestUrl" label="请求地址" width="320" show-overflow-tooltip />
          <el-table-column label="操作" width="100">
            <template slot-scope="scope">
              <el-button size="mini" @click="copyLog(scope.row)">复制</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!frontendLogs.length" description="暂无前端日志" />
      </el-card>
    </template>

    <el-dialog title="日志详情" :visible.sync="detailVisible" width="800px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="时间">{{ formatDate(currentLog.createTime || currentLog.timestamp) }}</el-descriptions-item>
        <el-descriptions-item label="级别">
          <el-tag :type="getLevelType(currentLog.level)" size="small">{{ currentLog.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="类型">{{ currentLog.type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="信息">{{ currentLog.message || '-' }}</el-descriptions-item>
        <el-descriptions-item label="上下文">{{ currentLog.context || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户信息">{{ currentLog.userInfo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="页面信息">{{ currentLog.pageInfo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="扩展">{{ currentLog.ext || '-' }}</el-descriptions-item>
        <el-descriptions-item label="堆栈">
          <pre class="stack-content">{{ currentLog.stack || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { Empty, Descriptions } from 'element-ui'
import { fetchBackendLogs, fetchLogStats, deleteLog, clearLogs } from '@/api/modules/log'
import dayjs from 'dayjs'

export default {
  name: 'ErrorLog',
  components: {
    'el-empty': Empty,
    'el-descriptions': Descriptions,
    'el-descriptions-item': Descriptions.Item
  },
  data() {
    return {
      backendLogs: [],
      backendTotal: 0,
      backendPage: 1,
      backendLimit: 10,
      filterForm: {
        level: '',
        type: '',
        message: ''
      },
      dateRange: [],
      stats: {},
      detailVisible: false,
      currentLog: {}
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
          this.loadStats()
        }
      }
    }
  },
  methods: {
    getLevelType(level) {
      const types = {
        ERROR: 'danger',
        WARN: 'warning',
        INFO: 'info',
        DEBUG: 'success'
      }
      return types[level] || 'info'
    },
    async loadStats() {
      try {
        const res = await fetchLogStats({ appType: 'backend' })
        this.stats = res.data
      } catch (e) {
        console.error('加载统计失败', e)
      }
    },
    async loadBackendLogs() {
      const params = {
        page: this.backendPage,
        limit: this.backendLimit,
        ...this.filterForm
      }
      if (this.dateRange.length === 2) {
        params.startTime = this.dateRange[0]
        params.endTime = this.dateRange[1]
      }
      const res = await fetchBackendLogs(params)
      this.backendLogs = res.data.items
      this.backendTotal = res.data.total
    },
    handleBackendPageChange(val) {
      this.backendPage = val
      this.loadBackendLogs()
    },
    handleSearch() {
      this.backendPage = 1
      this.loadBackendLogs()
    },
    handleReset() {
      this.filterForm = { level: '', type: '', message: '' }
      this.dateRange = []
      this.backendPage = 1
      this.loadBackendLogs()
    },
    async handleDelete(id) {
      this.$confirm('确定要删除这条日志吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await deleteLog(id)
        this.$message.success('删除成功')
        this.loadBackendLogs()
        this.loadStats()
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    async handleClear() {
      this.$prompt('请输入要清理多少天前的日志（输入0清理全部）', '清理日志', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\d+$/,
        inputErrorMessage: '请输入数字'
      }).then(async ({ value }) => {
        await clearLogs({ appType: 'backend', days: parseInt(value) })
        this.$message.success('清理成功')
        this.loadBackendLogs()
        this.loadStats()
      }).catch(() => {
        this.$message.info('已取消清理')
      })
    },
    showLogDetail(row) {
      this.currentLog = row
      this.detailVisible = true
    },
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
    formatDate(val) {
      return val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
    }
  }
}
</script>

<style scoped>
.errPage-container {
  padding: 20px;
}
.stats-card {
  margin-bottom: 20px;
}
.stat-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}
.stat-item.error .stat-value { color: #f56c6c; }
.stat-item.warn .stat-value { color: #e6a23c; }
.stat-item.info .stat-value { color: #67c23a; }
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
.filter-card {
  margin-bottom: 20px;
}
.filter-form {
  margin: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}
.card-actions {
  display: flex;
  gap: 10px;
}
.stack-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
}
</style>