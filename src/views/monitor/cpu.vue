<template>
  <div class="cpu-container">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon cpu-icon">
              <i class="el-icon-cpu"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="getCpuClass(metrics.cpu?.usagePercent)">
                {{ metrics.cpu?.usagePercent != null ? metrics.cpu.usagePercent : 0 }}%
              </div>
              <div class="stat-label">CPU使用率</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon temp-icon">
              <i class="el-icon-sunny"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="getTempClass(metrics.cpu?.temperature)">
                {{ metrics.cpu?.temperature != null ? metrics.cpu.temperature : '-' }}°C
              </div>
              <div class="stat-label">CPU温度</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon cores-icon">
              <i class="el-icon-grid"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ metrics.cpu?.cores != null ? metrics.cpu.cores : '-' }}</div>
              <div class="stat-label">物理核心</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon freq-icon">
              <i class="el-icon-data-line"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatFrequency(metrics.cpu?.currentFrequency) }}</div>
              <div class="stat-label">当前频率</div>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="16" style="margin-top: 16px;">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon load-icon">
              <i class="el-icon-trend-chart"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="getLoadClass(metrics.cpu?.loadAverage1Min)">
                {{ metrics.cpu?.loadAverage1Min != null ? metrics.cpu.loadAverage1Min.toFixed(2) : '-' }}
              </div>
              <div class="stat-label">系统负载(1min)</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon process-icon">
              <i class="el-icon-menu"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ metrics.cpu?.runningProcesses != null ? metrics.cpu.runningProcesses : '-' }}</div>
              <div class="stat-label">运行进程数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon thread-icon">
              <i class="el-icon-files"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ metrics.cpu?.threadCount != null ? metrics.cpu.threadCount : '-' }}</div>
              <div class="stat-label">线程总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon uptime-icon">
              <i class="el-icon-timer"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatUptime(metrics.cpu?.systemUptime) }}</div>
              <div class="stat-label">系统运行时间</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card v-if="activeAlerts.length > 0" class="alert-card">
      <div class="card-header">
        <span class="alert-title"><i class="el-icon-warning"></i> 活跃告警</span>
      </div>
      <el-timeline>
        <el-timeline-item v-for="alert in activeAlerts" :key="alert.id" 
                          :type="alert.alertLevel === 'HIGH' ? 'danger' : alert.alertLevel === 'MEDIUM' ? 'warning' : 'info'">
          <div class="alert-content">
            <span class="alert-metric">{{ alert.metricType }} - {{ alert.metricName }}</span>
            <span class="alert-value">当前值: {{ alert.currentValue }}</span>
            <span class="alert-message">{{ alert.alertMessage }}</span>
            <span class="alert-time">{{ formatTime(alert.createTime) }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <span>CPU使用率趋势</span>
            <el-select v-model="timeRange" size="small" @change="loadHistory">
              <el-option label="1小时" :value="1" />
              <el-option label="6小时" :value="6" />
              <el-option label="24小时" :value="24" />
              <el-option label="7天" :value="168" />
            </el-select>
          </div>
          <div ref="cpuChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>CPU核心使用率</span>
          </div>
          <div class="cpu-cores">
            <div v-for="(usage, index) in metrics.cpu?.perCoreUsage" :key="index" class="core-item">
              <span class="core-label">核心{{ index + 1 }}</span>
              <el-progress :percentage="Math.round(usage)" :color="getProgressColor(usage)" />
              <span class="core-value">{{ Math.round(usage) }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <span>系统负载趋势</span>
          </div>
          <div ref="loadChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>CPU详细信息</span>
            <el-button size="mini" @click="exportData" type="primary" icon="el-icon-download">
              导出数据
            </el-button>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="CPU名称">{{ metrics.cpu?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="厂商">{{ metrics.cpu?.vendor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="架构">{{ metrics.cpu?.architecture || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物理核心">{{ metrics.cpu?.cores || '-' }}</el-descriptions-item>
            <el-descriptions-item label="逻辑核心">{{ metrics.cpu?.logicalProcessors || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前频率">{{ formatFrequency(metrics.cpu?.currentFrequency) }}</el-descriptions-item>
            <el-descriptions-item label="最大频率">{{ formatFrequency(metrics.cpu?.maxFrequency) }}</el-descriptions-item>
            <el-descriptions-item label="最小频率">{{ formatFrequency(metrics.cpu?.minFrequency) }}</el-descriptions-item>
            <el-descriptions-item label="CPU温度">{{ metrics.cpu?.temperature != null ? metrics.cpu.temperature : '-' }}°C</el-descriptions-item>
            <el-descriptions-item label="缓存大小">{{ formatSize(metrics.cpu?.cacheSize) }}</el-descriptions-item>
            <el-descriptions-item label="系统负载(1min)">{{ metrics.cpu?.loadAverage1Min != null ? metrics.cpu.loadAverage1Min.toFixed(2) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="系统负载(5min)">{{ metrics.cpu?.loadAverage5Min != null ? metrics.cpu.loadAverage5Min.toFixed(2) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="系统负载(15min)">{{ metrics.cpu?.loadAverage15Min != null ? metrics.cpu.loadAverage15Min.toFixed(2) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="运行进程数">{{ metrics.cpu?.runningProcesses || '-' }}</el-descriptions-item>
            <el-descriptions-item label="线程总数">{{ metrics.cpu?.threadCount || '-' }}</el-descriptions-item>
            <el-descriptions-item label="系统运行时间">{{ formatUptime(metrics.cpu?.systemUptime) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getCurrentMetrics, getHourlyStats, exportData } from '@/api/modules/monitor'
import { getActiveAlerts } from '@/api/modules/alert'

export default {
  name: 'CpuMonitor',
  data() {
    return {
      metrics: {},
      timeRange: 6,
      cpuChart: null,
      loadChart: null,
      refreshInterval: null,
      alertInterval: null,
      activeAlerts: []
    }
  },
  mounted() {
    this.loadCurrentMetrics()
    this.loadHistory()
    this.loadAlerts()
    this.initCharts()
    this.startRefresh()
  },
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    if (this.alertInterval) {
      clearInterval(this.alertInterval)
    }
    if (this.cpuChart) {
      this.cpuChart.dispose()
    }
    if (this.loadChart) {
      this.loadChart.dispose()
    }
  },
  methods: {
    async loadCurrentMetrics() {
      try {
        const res = await getCurrentMetrics()
        this.metrics = res.data || res
      } catch (e) {
        console.error('加载CPU数据失败', e)
      }
    },
    async loadHistory() {
      try {
        const res = await getHourlyStats({ hours: this.timeRange })
        const data = res.data || []
        this.updateCharts(data)
      } catch (e) {
        console.error('加载历史数据失败', e)
      }
    },
    async loadAlerts() {
      try {
        const res = await getActiveAlerts()
        this.activeAlerts = res.data || []
      } catch (e) {
        console.error('加载告警数据失败', e)
      }
    },
    initCharts() {
      this.cpuChart = echarts.init(this.$refs.cpuChart)
      this.loadChart = echarts.init(this.$refs.loadChart)
      
      window.addEventListener('resize', () => {
        this.cpuChart?.resize()
        this.loadChart?.resize()
      })
    },
    updateCharts(data) {
      const xAxis = data.map(item => item.hour || item.day)
      const cpuData = data.map(item => item.avgCpu || 0)
      
      const cpuOption = {
        tooltip: { trigger: 'axis' },
        grid: { top: 30, right: 30, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: xAxis, axisLabel: { rotate: 45, fontSize: 10 } },
        yAxis: { type: 'value', max: 100 },
        series: [{
          name: 'CPU使用率',
          type: 'line',
          data: cpuData,
          smooth: true,
          areaStyle: { opacity: 0.3 },
          itemStyle: { color: '#f56c6c' }
        }]
      }
      
      this.cpuChart.setOption(cpuOption)
      
      const loadOption = {
        tooltip: { trigger: 'axis' },
        grid: { top: 30, right: 30, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: xAxis, axisLabel: { rotate: 45, fontSize: 10 } },
        yAxis: { type: 'value' },
        series: [{
          name: 'CPU使用率',
          type: 'line',
          data: cpuData,
          smooth: true,
          itemStyle: { color: '#f56c6c' }
        }]
      }
      
      this.loadChart.setOption(loadOption)
    },
    startRefresh() {
      this.refreshInterval = setInterval(() => {
        this.loadCurrentMetrics()
      }, 5000)
      
      this.alertInterval = setInterval(() => {
        this.loadAlerts()
      }, 30000)
    },
    async exportData() {
      const endTime = Date.now()
      const startTime = endTime - this.timeRange * 3600 * 1000
      
      try {
        const res = await exportData({ startTime, endTime, format: 'csv', metricType: 'cpu' })
        const blob = new Blob([res], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cpu_data_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (e) {
        console.error('导出失败', e)
        this.$message.error('导出失败')
      }
    },
    getCpuClass(percent) {
      if (percent == null) return ''
      if (percent >= 90) return 'danger'
      if (percent >= 70) return 'warning'
      return 'success'
    },
    getTempClass(temp) {
      if (temp == null || temp === 0) return ''
      if (temp >= 90) return 'danger'
      if (temp >= 70) return 'warning'
      return 'success'
    },
    getLoadClass(load) {
      if (load == null) return ''
      const cores = this.metrics.cpu?.cores || 1
      if (load >= cores * 2) return 'danger'
      if (load >= cores) return 'warning'
      return 'success'
    },
    getProgressColor(percent) {
      if (!percent) return '#67c23a'
      if (percent >= 90) return '#f56c6c'
      if (percent >= 70) return '#e6a23c'
      return '#67c23a'
    },
    formatFrequency(hz) {
      if (hz == null || hz < 0) return '-'
      if (hz < 1000) return hz + ' Hz'
      if (hz < 1000000) return (hz / 1000).toFixed(0) + ' kHz'
      if (hz < 1000000000) return (hz / 1000000).toFixed(2) + ' MHz'
      return (hz / 1000000000).toFixed(2) + ' GHz'
    },
    formatSize(bytes) {
      if (bytes == null || bytes === 0) return '-'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    },
    formatUptime(seconds) {
      if (seconds == null || seconds === 0) return '-'
      const days = Math.floor(seconds / (24 * 3600))
      const hours = Math.floor((seconds % (24 * 3600)) / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      if (days > 0) return `${days}天 ${hours}小时 ${minutes}分钟`
      if (hours > 0) return `${hours}小时 ${minutes}分钟 ${secs}秒`
      if (minutes > 0) return `${minutes}分钟 ${secs}秒`
      return `${secs}秒`
    },
    formatTime(timestamp) {
      if (!timestamp) return '-'
      return new Date(timestamp).toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.cpu-container {
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
.cpu-icon { background: #fef0f0; color: #f56c6c; }
.temp-icon { background: #fdf6ec; color: #e6a23c; }
.cores-icon { background: #f0f9eb; color: #67c23a; }
.freq-icon { background: #ecf5ff; color: #409eff; }
.load-icon { background: #f0f0f0; color: #909399; }
.process-icon { background: #faf5ff; color: #b37feb; }
.thread-icon { background: #fff7e6; color: #fa8c16; }
.uptime-icon { background: #e6fffb; color: #13c2c2; }
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
.alert-title { color: #f56c6c; }
.chart-container {
  height: 300px;
  width: 100%;
}
.cpu-cores { margin-top: 15px; }
.core-item { 
  display: flex; 
  align-items: center; 
  margin-bottom: 8px; 
}
.core-label { font-size: 12px; color: #909399; margin-right: 8px; }
.core-value { font-size: 12px; color: #606266; margin-left: 8px; }
.alert-card {
  border-left: 4px solid #f56c6c;
  margin-bottom: 20px;
}
.alert-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
}
.alert-metric { font-weight: bold; color: #606266; }
.alert-value { color: #409eff; }
.alert-message { color: #f56c6c; flex: 1; }
.alert-time { color: #909399; font-size: 12px; }
</style>