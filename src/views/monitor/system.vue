<template>
  <div class="system-container">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon os-icon">
              <i class="el-icon-s-home"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ metrics.systemInfo?.osName || '-' }}</div>
              <div class="stat-label">操作系统</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon hostname-icon">
              <i class="el-icon-s-tools"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ metrics.systemInfo?.hostname || '-' }}</div>
              <div class="stat-label">主机名</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon uptime-icon">
              <i class="el-icon-clock"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatUptime(metrics.systemInfo?.uptime) }}</div>
              <div class="stat-label">运行时间</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-icon process-icon">
              <i class="el-icon-s-management"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ metrics.systemInfo?.processCount || '-' }}</div>
              <div class="stat-label">进程数</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
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

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>CPU信息</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="CPU名称">{{ metrics.cpu?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物理核心">{{ metrics.cpu?.cores || '-' }}</el-descriptions-item>
            <el-descriptions-item label="逻辑核心">{{ metrics.cpu?.logicalProcessors || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前频率">{{ formatFrequency(metrics.cpu?.currentFrequency) }}</el-descriptions-item>
            <el-descriptions-item label="最大频率">{{ formatFrequency(metrics.cpu?.maxFrequency) }}</el-descriptions-item>
            <el-descriptions-item label="CPU温度">{{ metrics.cpu?.temperature || '-' }}°C</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="card-header">
            <span>内存信息</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总内存">{{ formatBytes(metrics.memory?.total) }}</el-descriptions-item>
            <el-descriptions-item label="已使用">{{ formatBytes(metrics.memory?.used) }}</el-descriptions-item>
            <el-descriptions-item label="可用">{{ formatBytes(metrics.memory?.available) }}</el-descriptions-item>
            <el-descriptions-item label="缓存">{{ formatBytes(metrics.memory?.cached) }}</el-descriptions-item>
            <el-descriptions-item label="使用率">{{ metrics.memory?.usagePercent || 0 }}%</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getCurrentMetrics } from '@/api/modules/monitor'

export default {
  name: 'SystemMonitor',
  data() {
    return {
      metrics: {},
      refreshInterval: null
    }
  },
  mounted() {
    this.loadCurrentMetrics()
    this.startRefresh()
  },
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },
  methods: {
    async loadCurrentMetrics() {
      try {
        const res = await getCurrentMetrics()
        this.metrics = res.data
      } catch (e) {
        console.error('加载系统信息失败', e)
      }
    },
    startRefresh() {
      this.refreshInterval = setInterval(() => {
        this.loadCurrentMetrics()
      }, 30000)
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
.system-container {
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
.os-icon { background: #ecf5ff; color: #409eff; }
.hostname-icon { background: #f0f9eb; color: #67c23a; }
.uptime-icon { background: #fdf6ec; color: #e6a23c; }
.process-icon { background: #fef0f0; color: #f56c6c; }
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
.gpu-item { margin-bottom: 15px; }
</style>