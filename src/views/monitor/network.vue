<template>
  <div class="network-container">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon speed-icon">
              <i class="el-icon-s-data"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatNetworkSpeed(networkSpeed) }}</div>
              <div class="stat-label">网络速度</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon received-icon">
              <i class="el-icon-download"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(totalReceived) }}</div>
              <div class="stat-label">总接收</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon sent-icon">
              <i class="el-icon-upload"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatBytes(totalSent) }}</div>
              <div class="stat-label">总发送</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon interface-icon">
              <i class="el-icon-connection"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ metrics.networks?.length || 0 }}</div>
              <div class="stat-label">网络接口数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>网络流量趋势</span>
          </div>
          <div ref="trafficChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>网络接口列表</span>
          </div>
          <el-table :data="metrics.networks" border size="small">
            <el-table-column prop="interfaceName" label="接口名称" />
            <el-table-column prop="ipAddress" label="IP地址" />
            <el-table-column prop="macAddress" label="MAC地址" />
            <el-table-column prop="bytesReceived" label="接收" :formatter="(row, col, val) => this.formatBytes(val)" />
            <el-table-column prop="bytesSent" label="发送" :formatter="(row, col, val) => this.formatBytes(val)" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="card-header">
        <span>网络详细信息</span>
      </div>
      <div v-for="network in metrics.networks" :key="network.interfaceName" class="network-item">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="接口名称">{{ network.interfaceName }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ network.ipAddress }}</el-descriptions-item>
          <el-descriptions-item label="MAC地址">{{ network.macAddress }}</el-descriptions-item>
          <el-descriptions-item label="接收字节">{{ formatBytes(network.bytesReceived) }}</el-descriptions-item>
          <el-descriptions-item label="发送字节">{{ formatBytes(network.bytesSent) }}</el-descriptions-item>
          <el-descriptions-item label="接收包数">{{ network.packetsReceived }}</el-descriptions-item>
          <el-descriptions-item label="发送包数">{{ network.packetsSent }}</el-descriptions-item>
          <el-descriptions-item label="接收错误">{{ network.inErrors }}</el-descriptions-item>
          <el-descriptions-item label="发送错误">{{ network.outErrors }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-empty v-if="!metrics.networks || !metrics.networks.length" description="未检测到网络接口" />
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getCurrentMetrics } from '@/api/modules/monitor'

export default {
  name: 'NetworkMonitor',
  data() {
    return {
      metrics: {},
      networkSpeed: 0,
      lastNetworkStats: null,
      trafficChart: null,
      refreshInterval: null,
      trafficData: []
    }
  },
  computed: {
    totalReceived() {
      if (!this.metrics.networks) return 0
      return this.metrics.networks.reduce((sum, n) => sum + (n.bytesReceived || 0), 0)
    },
    totalSent() {
      if (!this.metrics.networks) return 0
      return this.metrics.networks.reduce((sum, n) => sum + (n.bytesSent || 0), 0)
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
    if (this.trafficChart) {
      this.trafficChart.dispose()
    }
  },
  methods: {
    async loadCurrentMetrics() {
      try {
        const res = await getCurrentMetrics()
        this.metrics = res.data || res
        
        if (this.lastNetworkStats) {
          const currentReceived = this.totalReceived
          const currentSent = this.totalSent
          const timeDiff = (this.metrics.timestamp - this.lastNetworkStats.timestamp) / 1000 || 1
          this.networkSpeed = ((currentReceived + currentSent) - (this.lastNetworkStats.received + this.lastNetworkStats.sent)) / timeDiff
          
          this.trafficData.push({
            time: new Date().toLocaleTimeString(),
            received: (currentReceived - this.lastNetworkStats.received) / timeDiff,
            sent: (currentSent - this.lastNetworkStats.sent) / timeDiff
          })
          
          if (this.trafficData.length > 20) {
            this.trafficData.shift()
          }
          
          this.updateTrafficChart()
        }
        
        this.lastNetworkStats = {
          timestamp: this.metrics.timestamp,
          received: this.totalReceived,
          sent: this.totalSent
        }
      } catch (e) {
        console.error('加载网络数据失败', e)
      }
    },
    initCharts() {
      this.trafficChart = echarts.init(this.$refs.trafficChart)
      
      window.addEventListener('resize', () => {
        this.trafficChart?.resize()
      })
    },
    updateTrafficChart() {
      const xAxis = this.trafficData.map(item => item.time)
      const receivedData = this.trafficData.map(item => Math.round(item.received / 1024))
      const sentData = this.trafficData.map(item => Math.round(item.sent / 1024))
      
      const option = {
        tooltip: { trigger: 'axis', formatter: '{b}<br/>接收: {c} KB/s<br/>发送: {d} KB/s' },
        grid: { top: 30, right: 30, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: xAxis, axisLabel: { rotate: 45, fontSize: 10 } },
        yAxis: { type: 'value', name: 'KB/s' },
        series: [
          {
            name: '接收',
            type: 'line',
            data: receivedData,
            smooth: true,
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: '#67c23a' }
          },
          {
            name: '发送',
            type: 'line',
            data: sentData,
            smooth: true,
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: '#409eff' }
          }
        ]
      }
      
      this.trafficChart.setOption(option)
    },
    startRefresh() {
      this.refreshInterval = setInterval(() => {
        this.loadCurrentMetrics()
      }, 5000)
    },
    /**
     * 格式化字节数为可读的存储单位
     * 
     * @param {number|string} bytes - 字节数，可以是数字或字符串（后端序列化为字符串以避免精度丢失）
     * @returns {string} 格式化后的字符串，如 "1.50 GB"、"256.00 MB" 或 "-"（无效值时）
     * 
     * @note 修复说明：
     *       1. 后端的long类型字段（如网络字节数）使用@JsonSerialize注解序列化为字符串，
     *          避免JavaScript安全整数范围限制导致的精度丢失问题
     *       2. 前端接收后需要使用Number()进行类型转换
     *       3. 增加了对空字符串、null、'-'等边界情况的处理
     *       4. 增加了isNaN检查，确保转换后的数值有效
     * 
     * @see NetworkDTO.java - 后端数据传输对象，使用ToStringSerializer序列化long类型
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
    },
    formatNetworkSpeed(bytesPerSec) {
      if (!bytesPerSec) return '0 KB/s'
      const k = 1024
      if (bytesPerSec < k) return bytesPerSec.toFixed(0) + ' B/s'
      if (bytesPerSec < k * k) return (bytesPerSec / k).toFixed(2) + ' KB/s'
      return (bytesPerSec / (k * k)).toFixed(2) + ' MB/s'
    }
  }
}
</script>

<style scoped>
.network-container {
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
.speed-icon { background: #ecf5ff; color: #409eff; }
.received-icon { background: #f0f9eb; color: #67c23a; }
.sent-icon { background: #fef0f0; color: #f56c6c; }
.interface-icon { background: #fdf6ec; color: #e6a23c; }
.stat-info { flex: 1; }
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
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
.network-item { margin-bottom: 15px; }
</style>