<template>
  <div class="app-container">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ stats.total || 0 }}</div>
            <div class="stat-label">操作总次数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item success">
            <div class="stat-value">{{ stats.successCount || 0 }}</div>
            <div class="stat-label">成功次数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item danger">
            <div class="stat-value">{{ stats.failCount || 0 }}</div>
            <div class="stat-label">失败次数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ (stats.successRate || 0).toFixed(1) }}%</div>
            <div class="stat-label">成功率</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <div slot="header" class="clearfix">
        <span>操作审计日志</span>
      </div>

      <el-form :inline="true" :model="filterForm" class="filter-form" label-width="80px">
        <el-form-item label="模块">
          <el-input v-model="filterForm.module" placeholder="请输入模块" clearable style="width: 150px;"></el-input>
        </el-form-item>
        <el-form-item label="操作">
          <el-input v-model="filterForm.operation" placeholder="请输入操作" clearable style="width: 150px;"></el-input>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" placeholder="请输入用户名" clearable style="width: 150px;"></el-input>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="logs" border style="width: 100%" size="small" @row-click="showDetail">
        <el-table-column prop="createTime" label="时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="operation" label="操作" width="120" />
        <el-table-column prop="requestMethod" label="方法" width="80">
          <template slot-scope="scope">
            <el-tag :type="getMethodType(scope.row.requestMethod)" size="mini">{{ scope.row.requestMethod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requestUrl" label="路径" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" show-overflow-tooltip />
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button size="mini" @click.stop="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
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

    <el-dialog title="操作详情" :visible.sync="detailVisible" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="时间">{{ formatDate(currentLog.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentLog.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ currentLog.operation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">
          <el-tag :type="getMethodType(currentLog.requestMethod)" size="small">{{ currentLog.requestMethod }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="请求路径">{{ currentLog.requestUrl || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="json-content">{{ currentLog.requestParams || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应数据" :span="2">
          <pre class="json-content">{{ currentLog.responseData || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentLog.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'" size="small">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">{{ currentLog.errorMessage || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { fetchOperationLogs, fetchOperationLogStats, deleteOperationLog } from '@/api/modules/operationLog'
import dayjs from 'dayjs'

export default {
  name: 'OperationLog',
  data() {
    return {
      logs: [],
      total: 0,
      page: 1,
      pageSize: 10,
      filterForm: {
        module: '',
        operation: '',
        username: ''
      },
      dateRange: [],
      stats: {},
      detailVisible: false,
      currentLog: {}
    }
  },
  created() {
    this.fetchLogs(this.page)
    this.loadStats()
  },
  methods: {
    getMethodType(method) {
      const types = {
        GET: 'success',
        POST: 'primary',
        PUT: 'warning',
        DELETE: 'danger'
      }
      return types[method] || 'info'
    },
    async loadStats() {
      try {
        const res = await fetchOperationLogStats()
        const data = res.data
        this.stats.total = data.total || 0
        this.stats.successCount = data.successCount || 0
        this.stats.failCount = data.failCount || 0
        this.stats.successRate = this.stats.total > 0 ? (this.stats.successCount / this.stats.total * 100) : 0
      } catch (e) {
        console.error('加载统计失败', e)
      }
    },
    async fetchLogs(page) {
      const params = {
        page,
        limit: this.pageSize,
        ...this.filterForm
      }
      if (this.dateRange.length === 2) {
        params.startTime = this.dateRange[0]
        params.endTime = this.dateRange[1]
      }
      try {
        const res = await fetchOperationLogs(params)
        this.logs = res.data.items || []
        this.total = res.data.total || 0
      } catch (error) {
        console.error('获取操作日志失败:', error)
        this.$message.error('获取操作日志失败')
      }
    },
    formatDate(val) {
      return val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
    },
    handleSearch() {
      this.page = 1
      this.fetchLogs(this.page)
    },
    handleReset() {
      this.filterForm = { module: '', operation: '', username: '' }
      this.dateRange = []
      this.page = 1
      this.fetchLogs(this.page)
    },
    async handleDelete(id) {
      this.$confirm('确定要删除这条操作日志吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await deleteOperationLog(id)
        this.$message.success('删除成功')
        this.fetchLogs(this.page)
        this.loadStats()
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    showDetail(row) {
      this.currentLog = row
      this.detailVisible = true
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 24px;
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

.stat-item.success .stat-value { color: #67c23a; }
.stat-item.danger .stat-value { color: #f56c6c; }

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

.filter-form {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.json-content {
  max-height: 150px;
  overflow-y: auto;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
}
</style>