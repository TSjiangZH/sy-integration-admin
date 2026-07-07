<template>
  <div class="disk-container">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-icon disk-icon">
              <i class="el-icon-folder-opened"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="getDiskClass(totalUsage)">
                {{ totalUsage }}%
              </div>
              <div class="stat-label">磁盘总使用率</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-icon total-icon">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(totalUsed) }}</div>
              <div class="stat-label">已使用空间</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-icon free-icon">
              <i class="el-icon-delete"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(totalFree) }}</div>
              <div class="stat-label">剩余空间</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>磁盘使用分布</span>
          </div>
          <div ref="pieChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>磁盘列表</span>
          </div>
          <div v-for="disk in metrics.disks" :key="disk.name" class="disk-item">
            <div class="disk-info">
              <span class="disk-name">{{ disk.mountPoint }}</span>
              <span class="disk-size">{{ formatBytes(disk.used) }} / {{ formatBytes(disk.total) }}</span>
            </div>
            <el-progress :percentage="Math.round(disk.usagePercent)" :color="getProgressColor(disk.usagePercent)" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="card-header">
        <span>磁盘详细信息</span>
      </div>
      <el-table :data="metrics.disks" border>
        <el-table-column prop="name" label="磁盘名称" />
        <el-table-column prop="mountPoint" label="挂载点" />
        <el-table-column prop="fileSystem" label="文件系统" />
        <!-- 
         * 使用箭头函数作为formatter，确保正确传递单元格值val
         * 注意：Element UI的formatter函数接收三个参数：(row, column, cellValue)
         * 直接使用formatBytes会导致传入row对象而非单元格值，导致格式化失败
         * 另外：后端的long类型字段通过@JsonSerialize序列化为字符串，
         *       这里需要通过Number()转换后再格式化
         -->
        <el-table-column prop="total" label="总容量" :formatter="(row, col, val) => this.formatBytes(val)" />
        <el-table-column prop="used" label="已使用" :formatter="(row, col, val) => this.formatBytes(val)" />
        <el-table-column prop="free" label="剩余" :formatter="(row, col, val) => this.formatBytes(val)" />
        <el-table-column prop="usagePercent" label="使用率">
          <template slot-scope="scope">
            <span :class="getTextClass(scope.row.usagePercent)">{{ scope.row.usagePercent }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getCurrentMetrics } from '@/api/modules/monitor'

export default {
  name: 'DiskMonitor',
  data() {
    return {
      metrics: {},
      pieChart: null,
      refreshInterval: null
    }
  },
  computed: {
    totalUsed() {
      if (!this.metrics.disks) return 0
      return this.metrics.disks.reduce((sum, disk) => sum + (disk.used || 0), 0)
    },
    totalFree() {
      if (!this.metrics.disks) return 0
      return this.metrics.disks.reduce((sum, disk) => sum + (disk.free || 0), 0)
    },
    totalUsage() {
      const total = this.totalUsed + this.totalFree
      if (total === 0) return 0
      return Math.round((this.totalUsed / total) * 10000) / 100
    }
  },
  mounted() {
    this.loadCurrentMetrics()
    this.initCharts()
    this.startRefresh()
  },
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    if (this.pieChart) {
      this.pieChart.dispose()
    }
  },
  methods: {
    async loadCurrentMetrics() {
      try {
        const res = await getCurrentMetrics()
        this.metrics = res.data || res
        this.updatePieChart()
      } catch (e) {
        console.error('加载磁盘数据失败', e)
      }
    },
    initCharts() {
      this.pieChart = echarts.init(this.$refs.pieChart)
      
      window.addEventListener('resize', () => {
        this.pieChart?.resize()
      })
    },
    updatePieChart() {
      const disks = this.metrics.disks || []
      const data = disks.map(disk => ({
        value: disk.used || 0,
        name: disk.mountPoint || disk.name,
        itemStyle: { color: this.getProgressColor(disk.usagePercent) }
      }))
      
      const option = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', right: 10, top: 'center' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data
        }]
      }
      
      this.pieChart.setOption(option)
    },
    startRefresh() {
      this.refreshInterval = setInterval(() => {
        this.loadCurrentMetrics()
      }, 30000)
    },
    getDiskClass(percent) {
      if (!percent) return ''
      if (percent >= 90) return 'danger'
      if (percent >= 70) return 'warning'
      return 'success'
    },
    getProgressColor(percent) {
      if (!percent) return '#67c23a'
      if (percent >= 90) return '#f56c6c'
      if (percent >= 70) return '#e6a23c'
      return '#67c23a'
    },
    getTextClass(percent) {
      if (!percent) return ''
      if (percent >= 90) return 'text-danger'
      if (percent >= 70) return 'text-warning'
      return 'text-success'
    },
    /**
     * 格式化字节数为可读的存储单位
     * 
     * @param {number|string} bytes - 字节数，可以是数字或字符串（后端序列化为字符串以避免精度丢失）
     * @returns {string} 格式化后的字符串，如 "1.50 GB"、"256.00 MB" 或 "-"（无效值时）
     * 
     * @note 修复说明：
     *       1. 后端的long类型字段（如磁盘容量）使用@JsonSerialize注解序列化为字符串，
     *          避免JavaScript安全整数范围限制导致的精度丢失问题
     *       2. 前端接收后需要使用Number()进行类型转换
     *       3. 增加了对空字符串、null、'-'等边界情况的处理
     *       4. 增加了isNaN检查，确保转换后的数值有效
     * 
     * @see DiskDTO.java - 后端数据传输对象，使用ToStringSerializer序列化long类型
     */
    formatBytes(bytes) {
      // 处理边界情况：null、空字符串、占位符'-'
      if (bytes == null || bytes === '' || bytes === '-') return '-'
      
      // 将字符串转换为数字（后端long类型序列化为字符串）
      const numBytes = Number(bytes)
      
      // 检查转换结果是否有效
      if (isNaN(numBytes) || numBytes < 0) return '-'
      
      const k = 1024
      if (numBytes === 0) return '0 B'
      if (numBytes < k) return numBytes + ' B'
      if (numBytes < k * k) return (numBytes / k).toFixed(2) + ' KB'
      if (numBytes < k * k * k) return (numBytes / (k * k)).toFixed(2) + ' MB'
      return (numBytes / (k * k * k)).toFixed(2) + ' GB'
    }
  }
}
</script>

<style scoped>
.disk-container {
  padding: 20px;
}
.stats-card {
  margin-bottom: 20px;
}
.stat-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}
.disk-icon { background: #fdf6ec; color: #e6a23c; }
.total-icon { background: #ecf5ff; color: #409eff; }
.free-icon { background: #f0f9eb; color: #67c23a; }
.stat-info { flex: 1; }
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }
.stat-value.danger { color: #f56c6c; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}
.chart-container {
  height: 300px;
  width: 100%;
}
.disk-item { margin-bottom: 15px; }
.disk-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.disk-name { font-size: 12px; color: #606266; }
.disk-size { font-size: 12px; color: #909399; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }
</style>