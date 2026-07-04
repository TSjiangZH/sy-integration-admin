<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>登录日志</span>
      </div>
      
      <!-- 筛选表单 -->
      <el-form :inline="true" :model="filterForm" class="filter-form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="filterForm.username" placeholder="请输入用户名" clearable style="width: 180px;"></el-input>
        </el-form-item>
        
        <el-form-item label="登录状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option :value="1" label="成功"></el-option>
            <el-option :value="0" label="失败"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="IP地址">
          <el-input v-model="filterForm.ip" placeholder="请输入IP地址" clearable style="width: 180px;"></el-input>
        </el-form-item>
        
        <el-form-item label="浏览器">
          <el-input v-model="filterForm.browser" placeholder="请输入浏览器" clearable style="width: 150px;"></el-input>
        </el-form-item>
        
        <el-form-item label="环境">
          <el-input v-model="filterForm.environment" placeholder="请输入环境" clearable style="width: 150px;"></el-input>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 320px;"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 日志表格 -->
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
      
      <!-- 分页 -->
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
      pageSize: 10,
      filterForm: {
        username: '',
        status: '',
        ip: '',
        browser: '',
        environment: '',
        timeRange: []
      }
    }
  },
  created() {
    this.fetchLogs(this.page)
  },
  methods: {
    async fetchLogs(page) {
      // 构建查询参数
      const params = {
        page,
        limit: this.pageSize,
        username: this.filterForm.username,
        status: this.filterForm.status,
        ip: this.filterForm.ip,
        browser: this.filterForm.browser,
        environment: this.filterForm.environment
      }
      
      // 添加时间范围参数
      if (this.filterForm.timeRange && this.filterForm.timeRange.length === 2) {
        params.startTime = this.filterForm.timeRange[0]
        params.endTime = this.filterForm.timeRange[1]
      }
      
      try {
        const res = await fetchLoginLogs(params)
        if (res && res.data) {
          this.logs = res.data.items || []
          this.total = res.data.total || 0
        }
      } catch (error) {
        console.error('获取登录日志失败:', error)
        this.$message.error('获取登录日志失败: ' + (error.message || '未知错误'))
      }
    },
    
    // 格式化日期
    formatDate(val) {
      return val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
    },
    
    // 查询
    handleSearch() {
      this.page = 1 // 重置到第一页
      this.fetchLogs(this.page)
    },
    
    // 重置筛选条件
    handleReset() {
      this.filterForm = {
        username: '',
        status: '',
        ip: '',
        browser: '',
        environment: '',
        timeRange: []
      }
      this.page = 1
      this.fetchLogs(this.page)
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 24px;
}

.filter-form {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
