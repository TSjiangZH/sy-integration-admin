<template>
  <div class="memory-container">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon memory-icon">
              <i class="el-icon-data-line"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="getMemoryClass(metrics.memory?.usagePercent)">
                {{ metrics.memory?.usagePercent || 0 }}%
              </div>
              <div class="stat-label">内存使用率</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon total-icon">
              <i class="el-icon-folder-opened"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(metrics.memory?.total) }}</div>
              <div class="stat-label">总内存</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon used-icon">
              <i class="el-icon-s-data"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(metrics.memory?.used) }}</div>
              <div class="stat-label">已使用</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon available-icon">
              <i class="el-icon-check-circle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(metrics.memory?.available) }}</div>
              <div class="stat-label">可用内存</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <span>内存使用率趋势</span>
            <el-select v-model="timeRange" size="small" @change="loadHistory">
              <el-option label="1小时" :value="1" />
              <el-option label="6小时" :value="6" />
              <el-option label="24小时" :value="24" />
              <el-option label="7天" :value="168" />
            </el-select>
          </div>
          <div ref="memoryChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>内存使用分布</span>
          </div>
          <div ref="pieChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="card-header">
        <span>内存详细信息</span>
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="总内存">{{ formatBytes(metrics.memory?.total) }}</el-descriptions-item>
        <el-descriptions-item label="已使用">{{ formatBytes(metrics.memory?.used) }}</el-descriptions-item>
        <el-descriptions-item label="可用内存">{{ formatBytes(metrics.memory?.available) }}</el-descriptions-item>
        <el-descriptions-item label="缓存">{{ formatBytes(metrics.memory?.cached) }}</el-descriptions-item>
        <el-descriptions-item label="使用率">{{ metrics.memory?.usagePercent || 0 }}%</el-descriptions-item>
      </el-descriptions>
      <div class="memory-progress">
        <el-progress :percentage="Math.round(metrics.memory?.usagePercent || 0)" :color="getProgressColor(metrics.memory?.usagePercent)" :stroke-width="24" />
        <div class="progress-labels">
          <span>已用: {{ formatBytes(metrics.memory?.used) }}</span>
          <span>可用: {{ formatBytes(metrics.memory?.available) }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getCurrentMetrics, getHourlyStats } from '@/api/modules/monitor'

export default {
  name: 'MemoryMonitor',
  data() {
    return {
      metrics: {},
      timeRange: 6,
      memoryChart: null,
      pieChart: null,
      refreshInterval: null
    }
  },
  mounted() {
    this.loadCurrentMetrics()
    this.loadHistory()
    this.initCharts()
    this.startRefresh()
  },
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    if (this.memoryChart) {
      this.memoryChart.dispose()
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
        console.error('加载内存数据失败', e)
      }
    },
    async loadHistory() {
      try {
        const res = await getHourlyStats({ hours: this.timeRange })
        const data = res.data || []
        this.updateLineChart(data)
      } catch (e) {
        console.error('加载历史数据失败', e)
      }
    },
    initCharts() {
      this.memoryChart = echarts.init(this.$refs.memoryChart)
      this.pieChart = echarts.init(this.$refs.pieChart)
      
      window.addEventListener('resize', () => {
        this.memoryChart?.resize()
        this.pieChart?.resize()
      })
    },
    updateLineChart(data) {
      const xAxis = data.map(item => item.hour || item.day)
      const memoryData = data.map(item => item.avgMemory || 0)
      
      const option = {
        tooltip: { trigger: 'axis' },
        grid: { top: 30, right: 30, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: xAxis, axisLabel: { rotate: 45, fontSize: 10 } },
        yAxis: { type: 'value', max: 100 },
        series: [{
          name: '内存使用率',
          type: 'line',
          data: memoryData,
          smooth: true,
          areaStyle: { opacity: 0.3 },
          itemStyle: { color: '#67c23a' }
        }]
      }
      
      this.memoryChart.setOption(option)
    },
    updatePieChart() {
      const used = this.metrics.memory?.used || 0
      const available = this.metrics.memory?.available || 0
      
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
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          data: [
            { value: used, name: '已使用', itemStyle: { color: '#67c23a' } },
            { value: available, name: '可用', itemStyle: { color: '#e4e7ed' } }
          ]
        }]
      }
      
      this.pieChart.setOption(option)
    },
    startRefresh() {
      this.refreshInterval = setInterval(() => {
        this.loadCurrentMetrics()
      }, 5000)
    },
    getMemoryClass(percent) {
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
    /**
     * 格式化字节数为可读的存储单位
     * 
     * @param {number|string} bytes - 字节数，可以是数字或字符串（后端序列化为字符串以避免精度丢失）
     * @returns {string} 格式化后的字符串，如 "1.50 GB"、"256.00 MB" 或 "-"（无效值时）
     * 
     * @note 修复说明：
     *       1. 后端的long类型字段（如内存容量）使用@JsonSerialize注解序列化为字符串，
     *          避免JavaScript安全整数范围限制导致的精度丢失问题
     *       2. 前端接收后需要使用Number()进行类型转换
     *       3. 增加了对空字符串、null、'-'等边界情况的处理
     *       4. 增加了isNaN检查，确保转换后的数值有效
     * 
     * @see MemoryDTO.java - 后端数据传输对象，使用ToStringSerializer序列化long类型
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
.memory-container {
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
.memory-icon { background: #f0f9eb; color: #67c23a; }
.total-icon { background: #ecf5ff; color: #409eff; }
.used-icon { background: #fef0f0; color: #f56c6c; }
.available-icon { background: #f0f0f0; color: #909399; }
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
.chart-card { margin-bottom: 20px; }
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
.memory-progress {
  margin-top: 20px;
}
.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>