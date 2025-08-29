<template>
  <div v-if="errorLogs.length>0">
    <el-badge :value="errorLogs.length" :max="99" style="line-height: 25px;margin-top: -5px;" @click.native="dialogTableVisible=true">
      <el-button style="padding: 8px 10px;" size="small" type="danger">
        <svg-icon icon-class="bug" />
      </el-button>
    </el-badge>

    <el-dialog :visible.sync="dialogTableVisible" width="90%" append-to-body>
      <div slot="title">
        <span style="padding-right: 10px;">错误日志 ({{ errorLogs.length }})</span>
        <el-button size="mini" type="primary" icon="el-icon-delete" @click="clearAll">清空所有</el-button>
        <el-button size="mini" type="success" icon="el-icon-refresh" @click="refreshStats">刷新统计</el-button>
      </div>

      <!-- 统计信息 -->
      <div class="error-stats" style="margin-bottom: 20px;">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-number">{{ errorStats && errorStats.total != null ? errorStats.total : 0 }}</div>
                <div class="stat-label">总错误数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-number">{{ todayErrors ? todayErrors.length : 0 }}</div>
                <div class="stat-label">今日错误</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-number">{{ highLevelErrors ? highLevelErrors.length : 0 }}</div>
                <div class="stat-label">高级别错误</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="stat-item">
                <div class="stat-number">{{ errorTypeStats ? Object.keys(errorTypeStats).length : 0 }}</div>
                <div class="stat-label">错误类型</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索和过滤 -->
      <div class="search-filter" style="margin-bottom: 20px;">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchTerm"
              placeholder="搜索错误信息..."
              prefix-icon="el-icon-search"
              clearable
              @input="handleSearch"
            />
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterType" placeholder="错误类型" clearable @change="handleFilter">
              <el-option
                v-for="(count, type) in (errorTypeStats || {})"
                :key="type"
                :label="`${type} (${count})`"
                :value="type"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterLevel" placeholder="错误级别" clearable @change="handleFilter">
              <el-option
                v-for="(count, level) in (errorLevelStats || {})"
                :key="level"
                :label="`${level} (${count})`"
                :value="level"
              />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="handleDateFilter"
            />
          </el-col>
        </el-row>
      </div>

      <!-- 错误日志表格 -->
      <el-table :data="filteredErrorLogs" border style="width: 100%">
        <el-table-column label="时间" width="180">
          <template slot-scope="{row}">
            <div>{{ formatTime(row.timestamp) }}</div>
            <div style="font-size: 12px; color: #999;">{{ formatDate(row.timestamp) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="错误信息" min-width="300">
          <template slot-scope="{row}">
            <div>
              <span class="message-title">消息:</span>
              <el-tag :type="getErrorTagType(row.errorLevel)" size="small">
                {{ row.err && row.err.message ? row.err.message : '未知错误' }}
              </el-tag>
            </div>
            <br>
            <div>
              <span class="message-title" style="padding-right: 10px;">类型:</span>
              <el-tag type="info" size="small">{{ row.errorType || 'UNKNOWN' }}</el-tag>
              <span style="margin-left: 10px;">
                <span class="message-title">级别:</span>
                <el-tag :type="getLevelTagType(row.errorLevel)" size="small">{{ row.errorLevel || 'MEDIUM' }}</el-tag>
              </span>
            </div>
            <br>
            <div>
              <span class="message-title" style="padding-right: 10px;">位置:</span>
              <el-tag type="warning" size="small">
                {{ (row.vm && row.vm.$vnode && row.vm.$vnode.tag) ? row.vm.$vnode.tag : 'Unknown' }} error in {{ row.info }}
              </el-tag>
            </div>
            <br>
            <div>
              <span class="message-title" style="padding-right: 16px;">URL:</span>
              <el-tag type="success" size="small">
                {{ row.url }}
              </el-tag>
            </div>
            <div v-if="row.errorId" style="margin-top: 5px;">
              <span class="message-title">ID:</span>
              <el-tag type="info" size="mini">{{ row.errorId }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="堆栈信息" width="300">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="showStack(scope.row)"
            >
              查看堆栈
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="removeError(scope.$index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" style="margin-top: 20px; text-align: right;">
        <el-pagination
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredErrorLogs.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-dialog>

    <!-- 堆栈信息对话框 -->
    <el-dialog title="错误堆栈信息" :visible.sync="stackDialogVisible" width="70%">
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; max-height: 400px; overflow-y: auto;">{{ selectedStack }}</pre>
    </el-dialog>
  </div>
</template>

<script>
import { formatDate, formatTime } from '@/utils/date'

export default {
  name: 'ErrorLog',
  data() {
    return {
      dialogTableVisible: false,
      stackDialogVisible: false,
      selectedStack: '',
      searchTerm: '',
      filterType: '',
      filterLevel: '',
      dateRange: null,
      currentPage: 1,
      pageSize: 20
    }
  },
  computed: {
    errorLogs() {
      return this.$store.getters.errorLogs
    },
    errorStats() {
      return this.$store.getters.errorStats
    },
    errorTypeStats() {
      return this.$store.getters.errorTypeStats
    },
    errorLevelStats() {
      return this.$store.getters.errorLevelStats
    },
    todayErrors() {
      return this.$store.getters.todayErrors
    },
    highLevelErrors() {
      return this.$store.getters.highLevelErrors
    },
    filteredErrorLogs() {
      let logs = this.errorLogs

      // 搜索过滤（同步getter）
      if (this.searchTerm) {
        logs = this.$store.getters['errorLog/searchErrors'](this.searchTerm)
      }

      // 类型过滤
      if (this.filterType) {
        logs = logs.filter(log => log.errorType === this.filterType)
      }

      // 级别过滤
      if (this.filterLevel) {
        logs = logs.filter(log => log.errorLevel === this.filterLevel)
      }

      // 日期过滤
      if (this.dateRange && this.dateRange.length === 2) {
        logs = logs.filter(log => {
          const logDate = new Date(log.timestamp)
          return logDate >= this.dateRange[0] && logDate <= this.dateRange[1]
        })
      }

      return logs
    }
  },
  methods: {
    clearAll() {
      this.$confirm('确定要清空所有错误日志吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.dialogTableVisible = false
        this.$store.dispatch('errorLog/clearErrorLog')
        this.$message.success('错误日志已清空')
      })
    },
    removeError(index) {
      this.$store.dispatch('errorLog/removeErrorLog', index)
      this.$message.success('错误日志已删除')
    },
    showStack(row) {
      this.selectedStack = row.err?.stack || '无堆栈信息'
      this.stackDialogVisible = true
    },
    refreshStats() {
      this.$store.dispatch('errorLog/recalculateStats')
      this.$message.success('统计信息已刷新')
    },
    handleSearch() {
      this.currentPage = 1
    },
    handleFilter() {
      this.currentPage = 1
    },
    handleDateFilter() {
      this.currentPage = 1
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    handleCurrentChange(page) {
      this.currentPage = page
    },
    formatTime(timestamp) {
      return formatTime(timestamp)
    },
    formatDate(timestamp) {
      return formatDate(timestamp)
    },
    getErrorTagType(level) {
      switch (level) {
        case 'LOW': return 'info'
        case 'MEDIUM': return 'warning'
        case 'HIGH': return 'danger'
        case 'CRITICAL': return 'danger'
        default: return 'info'
      }
    },
    getLevelTagType(level) {
      switch (level) {
        case 'LOW': return 'success'
        case 'MEDIUM': return 'warning'
        case 'HIGH': return 'danger'
        case 'CRITICAL': return 'danger'
        default: return 'info'
      }
    }
  }
}
</script>

<style scoped>
.message-title {
  font-size: 14px;
  color: #333;
  font-weight: bold;
  padding-right: 8px;
}

.error-stats .stat-item {
  text-align: center;
}

.error-stats .stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.error-stats .stat-label {
  font-size: 12px;
  color: #666;
}

.search-filter .el-input,
.search-filter .el-select,
.search-filter .el-date-picker {
  width: 100%;
}

.pagination-container {
  margin-top: 20px;
}
</style>
