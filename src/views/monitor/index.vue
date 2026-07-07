<template>
  <div class="monitor-container">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon cpu-icon">
              <i class="el-icon-cpu"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="getCpuClass(metrics.cpu?.usagePercent)">
                {{ metrics.cpu?.usagePercent || 0 }}%
              </div>
              <div class="stat-label">CPU使用率</div>
            </div>
          </div>
        </el-col>
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
            <div class="stat-icon disk-icon">
              <i class="el-icon-folder-opened"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value" :class="getDiskClass(metrics.disks?.[0]?.usagePercent)">
                {{ metrics.disks?.[0]?.usagePercent || 0 }}%
              </div>
              <div class="stat-label">磁盘使用率</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon network-icon">
              <i class="el-icon-s-data"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatNetworkSpeed(networkSpeed) }}</div>
              <div class="stat-label">网络速度</div>
            </div>
          </div>
        </el-col>
      </el-row>
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
        <el-card class="chart-card">
          <div class="card-header">
            <span>内存使用率趋势</span>
          </div>
          <div ref="memoryChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card>
          <div class="card-header">
            <span>CPU信息</span>
          </div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="CPU名称">{{ metrics.cpu?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物理核心">{{ metrics.cpu?.cores || '-' }}</el-descriptions-item>
            <el-descriptions-item label="逻辑核心">{{ metrics.cpu?.logicalProcessors || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前频率">{{ formatFrequency(metrics.cpu?.currentFrequency) }}</el-descriptions-item>
            <el-descriptions-item label="最大频率">{{ formatFrequency(metrics.cpu?.maxFrequency) }}</el-descriptions-item>
          </el-descriptions>
          <div class="cpu-cores">
            <div v-for="(usage, index) in metrics.cpu?.perCoreUsage" :key="index" class="core-item">
              <span class="core-label">核心{{ index + 1 }}</span>
              <el-progress :percentage="Math.round(usage)" :color="getProgressColor(usage)" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="card-header">
            <span>内存信息</span>
          </div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="总内存">{{ formatBytes(metrics.memory?.total) }}</el-descriptions-item>
            <el-descriptions-item label="已使用">{{ formatBytes(metrics.memory?.used) }}</el-descriptions-item>
            <el-descriptions-item label="可用">{{ formatBytes(metrics.memory?.available) }}</el-descriptions-item>
            <el-descriptions-item label="缓存">{{ formatBytes(metrics.memory?.cached) }}</el-descriptions-item>
            <el-descriptions-item label="交换分区">{{ formatBytes(metrics.memory?.swapUsed) }} / {{ formatBytes(metrics.memory?.swapTotal) }}</el-descriptions-item>
          </el-descriptions>
          <el-progress :percentage="Math.round(metrics.memory?.usagePercent || 0)" :color="getProgressColor(metrics.memory?.usagePercent)" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <div class="card-header">
            <span>磁盘信息</span>
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

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>网络接口</span>
          </div>
          <el-table :data="metrics.networks" border size="small">
            <el-table-column prop="interfaceName" label="接口名称" />
            <el-table-column prop="ipAddress" label="IP地址" />
            <el-table-column prop="macAddress" label="MAC地址" />
            <el-table-column prop="bytesReceived" label="接收" :formatter="formatBytes" />
            <el-table-column prop="bytesSent" label="发送" :formatter="formatBytes" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>系统信息</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="操作系统">{{ metrics.systemInfo?.osName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="系统版本">{{ metrics.systemInfo?.osVersion || '-' }}</el-descriptions-item>
            <el-descriptions-item label="系统架构">{{ metrics.systemInfo?.osArch || '-' }}</el-descriptions-item>
            <el-descriptions-item label="主机名">{{ metrics.systemInfo?.hostname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Java版本">{{ metrics.systemInfo?.javaVersion || '-' }}</el-descriptions-item>
            <el-descriptions-item label="运行时间">{{ formatUptime(metrics.systemInfo?.uptime) }}</el-descriptions-item>
            <el-descriptions-item label="进程数">{{ metrics.systemInfo?.processCount || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>显卡信息</span>
          </div>
          <div v-if="metrics.gpus && metrics.gpus.length">
            <div v-for="gpu in metrics.gpus" :key="gpu.name" class="gpu-item">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="显卡名称">{{ gpu.name }}</el-descriptions-item>
                <el-descriptions-item label="厂商">{{ gpu.vendor }}</el-descriptions-item>
                <el-descriptions-item label="显存总量">{{ formatBytes(gpu.vramTotal) }}</el-descriptions-item>
                <el-descriptions-item label="温度">{{ gpu.temperature || '-' }}°C</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
          <el-empty v-else description="未检测到显卡信息" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getCurrentMetrics, getHourlyStats } from '@/api/modules/monitor'
import dayjs from 'dayjs'

export default {
  name: 'Monitor',
  data() {
    return {
      metrics: {},
      timeRange: 6,
      cpuChart: null,
      memoryChart: null,
      networkSpeed: 0,
      lastNetworkStats: null,
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
    if (this.cpuChart) {
      this.cpuChart.dispose()
    }
    if (this.memoryChart) {
      this.memoryChart.dispose()
    }
  },
  methods: {
    async loadCurrentMetrics() {
      try {
        const res = await getCurrentMetrics()
        this.metrics = res.data
        
        if (this.lastNetworkStats) {
          const currentReceived = this.metrics.networks?.[0]?.bytesReceived || 0
          const currentSent = this.metrics.networks?.[0]?.bytesSent || 0
          const timeDiff = (this.metrics.timestamp - this.lastNetworkStats.timestamp) / 1000 || 1
          this.networkSpeed = ((currentReceived + currentSent) - (this.lastNetworkStats.received + this.lastNetworkStats.sent)) / timeDiff
        }
        
        this.lastNetworkStats = {
          timestamp: this.metrics.timestamp,
          received: this.metrics.networks?.[0]?.bytesReceived || 0,
          sent: this.metrics.networks?.[0]?.bytesSent || 0
        }
      } catch (e) {
        console.error('加载监测数据失败', e)
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
    initCharts() {
      this.cpuChart = echarts.init(this.$refs.cpuChart)
      this.memoryChart = echarts.init(this.$refs.memoryChart)
      
      window.addEventListener('resize', () => {
        this.cpuChart?.resize()
        this.memoryChart?.resize()
      })
    },
    updateCharts(data) {
      const xAxis = data.map(item => item.hour || item.day)
      const cpuData = data.map(item => item.avgCpu || 0)
      const memoryData = data.map(item => item.avgMemory || 0)
      
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
      
      const memoryOption = {
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
      
      this.cpuChart.setOption(cpuOption)
      this.memoryChart.setOption(memoryOption)
    },
    startRefresh() {
      this.refreshInterval = setInterval(() => {
        this.loadCurrentMetrics()
      }, 5000)
    },
    getCpuClass(percent) {
      if (!percent) return ''
      if (percent >= 90) return 'danger'
      if (percent >= 70) return 'warning'
      return 'success'
    },
    getMemoryClass(percent) {
      if (!percent) return ''
      if (percent >= 90) return 'danger'
      if (percent >= 70) return 'warning'
      return 'success'
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
    formatBytes(bytes) {
      if (!bytes) return '-'
      const k = 1024
      if (bytes < k) return bytes + ' B'
      if (bytes < k * k) return (bytes / k).toFixed(2) + ' KB'
      if (bytes < k * k * k) return (bytes / (k * k)).toFixed(2) + ' MB'
      return (bytes / (k * k * k)).toFixed(2) + ' GB'
    },
    formatFrequency(hz) {
      if (!hz) return '-'
      if (hz < 1000) return hz + ' Hz'
      if (hz < 1000000) return (hz / 1000).toFixed(0) + ' kHz'
      if (hz < 1000000000) return (hz / 1000000).toFixed(2) + ' MHz'
      return (hz / 1000000000).toFixed(2) + ' GHz'
    },
    formatNetworkSpeed(bytesPerSec) {
      if (!bytesPerSec) return '0 KB/s'
      const k = 1024
      if (bytesPerSec < k) return bytesPerSec.toFixed(0) + ' B/s'
      if (bytesPerSec < k * k) return (bytesPerSec / k).toFixed(2) + ' KB/s'
      return (bytesPerSec / (k * k)).toFixed(2) + ' MB/s'
    },
    formatUptime(seconds) {
      if (!seconds) return '-'
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return `${days}天 ${hours}小时 ${mins}分钟`
    }
  }
}
</script>

<style scoped>
.monitor-container {
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
.memory-icon { background: #f0f9eb; color: #67c23a; }
.disk-icon { background: #fdf6ec; color: #e6a23c; }
.network-icon { background: #ecf5ff; color: #409eff; }
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
.cpu-cores { margin-top: 15px; }
.core-item { margin-bottom: 8px; }
.core-label { font-size: 12px; color: #909399; margin-right: 8px; }
.disk-item { margin-bottom: 15px; }
.disk-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.disk-name { font-size: 12px; color: #606266; }
.disk-size { font-size: 12px; color: #909399; }
.gpu-item { margin-bottom: 15px; }
</style>