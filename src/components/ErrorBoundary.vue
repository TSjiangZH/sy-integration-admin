<template>
  <div class="error-boundary">
    <slot v-if="!error"></slot>
    <div v-else class="error-fallback">
      <el-card class="error-card" shadow="hover">
        <div slot="header" class="error-header">
          <i class="el-icon-warning" style="color: #E6A23C; margin-right: 8px;"></i>
          <span>组件渲染错误</span>
        </div>
        <div class="error-content">
          <div class="error-message">
            <strong>错误信息：</strong>{{ error.message }}
          </div>
          <div class="error-type" v-if="error.type">
            <strong>错误类型：</strong>{{ error.type }}
          </div>
          <div class="error-level" v-if="error.level">
            <strong>错误级别：</strong>
            <el-tag :type="getLevelTagType(error.level)" size="small">
              {{ error.level }}
            </el-tag>
          </div>
          <div class="error-actions">
            <el-button type="primary" size="small" @click="handleRetry">
              <i class="el-icon-refresh"></i>
              重试
            </el-button>
            <el-button type="info" size="small" @click="handleReport">
              <i class="el-icon-warning"></i>
              报告错误
            </el-button>
            <el-button type="default" size="small" @click="handleClose">
              <i class="el-icon-close"></i>
              关闭
            </el-button>
          </div>
          <div class="error-stack" v-if="showStack">
            <el-button type="text" size="small" @click="toggleStack">
              隐藏堆栈信息
            </el-button>
            <pre class="stack-trace">{{ error.stack }}</pre>
          </div>
          <div class="error-stack-toggle" v-else>
            <el-button type="text" size="small" @click="toggleStack">
              显示堆栈信息
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { handleError } from '@/utils/error-handler'

export default {
  name: 'ErrorBoundary',
  props: {
    onRetry: {
      type: Function,
      default: null
    },
    onReport: {
      type: Function,
      default: null
    },
    fallback: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      error: null,
      showStack: false
    }
  },
  methods: {
    handleRetry() {
      this.error = null
      if (this.onRetry) {
        this.onRetry()
      } else {
        // 默认重试逻辑：重新渲染组件
        this.$forceUpdate()
      }
    },
    handleReport() {
      if (this.onReport) {
        this.onReport(this.error)
      } else {
        // 默认报告逻辑：使用统一的错误处理
        handleError(this.error, 'ErrorBoundary Report')
      }
    },
    handleClose() {
      this.error = null
    },
    toggleStack() {
      this.showStack = !this.showStack
    },
    getLevelTagType(level) {
      switch (level) {
        case 'LOW': return 'success'
        case 'MEDIUM': return 'warning'
        case 'HIGH': return 'danger'
        case 'CRITICAL': return 'danger'
        default: return 'info'
      }
    },
    captureError(error, vm, info) {
      this.error = {
        message: error.message || '组件渲染错误',
        type: error.name || 'RenderError',
        level: 'MEDIUM',
        stack: error.stack,
        component: vm?.$options?.name || 'Unknown',
        info: info
      }

      // 阻止错误继续传播
      return false
    }
  },
  errorCaptured(error, vm, info) {
    return this.captureError(error, vm, info)
  }
}
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-fallback {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.error-card {
  max-width: 600px;
  width: 100%;
}

.error-header {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: #E6A23C;
}

.error-content {
  line-height: 1.6;
}

.error-message,
.error-type,
.error-level {
  margin-bottom: 12px;
}

.error-actions {
  margin: 20px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.error-stack,
.error-stack-toggle {
  margin-top: 15px;
}

.stack-trace {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 10px;
  border: 1px solid #e4e7ed;
}

.error-stack-toggle {
  text-align: center;
}
</style>
