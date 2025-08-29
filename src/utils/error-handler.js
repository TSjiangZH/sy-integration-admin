import Vue from 'vue'
import { Message, MessageBox } from 'element-ui'
import store from '@/store'
import router from '@/router'
import { getToken} from '@/utils/auth'

/**
 * 错误类型枚举
 */
export const ErrorType = {
  NETWORK: 'NETWORK', // 网络错误
  AUTH: 'AUTH', // 认证错误
  FORBIDDEN: 'FORBIDDEN', // 权限错误
  NOT_FOUND: 'NOT_FOUND', // 资源未找到
  VALIDATION: 'VALIDATION', // 数据验证错误
  SERVER: 'SERVER', // 服务器错误
  TIMEOUT: 'TIMEOUT', // 超时错误
  ROUTE: 'ROUTE', // 路由错误
  RENDER: 'RENDER', // 渲染错误
  STATE: 'STATE', // 状态管理错误
  API: 'API', // API错误
  UNKNOWN: 'UNKNOWN' // 未知错误
}

/**
 * 错误级别枚举
 */
export const ErrorLevel = {
  LOW: 'LOW', // 低级别错误，不影响功能
  MEDIUM: 'MEDIUM', // 中级别错误，部分功能受影响
  HIGH: 'HIGH', // 高级别错误，功能无法使用
  CRITICAL: 'CRITICAL' // 严重错误，系统崩溃
}

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  constructor(type, message, originalError = null, level = ErrorLevel.MEDIUM, context = '') {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.level = level
    this.context = context
    this.originalError = originalError
    this.timestamp = new Date()
    this.id = this.generateErrorId()
    this.userInfo = this.getUserInfo()
    this.pageInfo = this.getPageInfo()
  }

  // 生成错误ID
  generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取用户信息
  getUserInfo() {
    try {
      return {
        token: getToken() ? '***' : null,
        roles: store.getters.roles || [],
        name: store.getters.name || 'anonymous'
      }
    } catch (error) {
      return { error: 'Failed to get user info' }
    }
  }

  // 获取页面信息
  getPageInfo() {
    return {
      url: window.location.href,
      path: router.currentRoute.path,
      name: router.currentRoute.name,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 错误处理配置
 */
const errorHandlers = {
  [ErrorType.NETWORK]: {
    message: '网络连接失败，请检查网络设置',
    level: ErrorLevel.HIGH,
    action: (error) => {
      Message.error({
        message: error.message || '网络连接失败，请检查网络设置',
        duration: 5000
      })
    }
  },
  [ErrorType.AUTH]: {
    message: '登录已过期，请重新登录',
    level: ErrorLevel.HIGH,
    action: (error) => {
      MessageBox.confirm(
        '登录已过期，请重新登录',
        '提示',
        {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        store.dispatch('user/resetToken').then(() => {
          router.push('/login')
        })
      }).catch(() => {
        // 用户取消操作
      })
    }
  },
  [ErrorType.FORBIDDEN]: {
    message: '您没有权限访问该资源',
    level: ErrorLevel.MEDIUM,
    action: (error) => {
      Message.error({
        message: error.message || '您没有权限访问该资源',
        duration: 4000
      })
      router.push('/error/401')
    }
  },
  [ErrorType.NOT_FOUND]: {
    message: '请求的资源不存在',
    level: ErrorLevel.MEDIUM,
    action: (error) => {
      Message.error({
        message: error.message || '请求的资源不存在',
        duration: 4000
      })
      router.push('/error/404')
    }
  },
  [ErrorType.VALIDATION]: {
    message: '数据验证失败',
    level: ErrorLevel.LOW,
    action: (error) => {
      Message.warning({
        message: error.message || '数据验证失败',
        duration: 3000
      })
    }
  },
  [ErrorType.SERVER]: {
    message: '服务器错误，请联系管理员',
    level: ErrorLevel.HIGH,
    action: (error) => {
      Message.error({
        message: error.message || '服务器错误，请联系管理员',
        duration: 5000
      })
    }
  },
  [ErrorType.TIMEOUT]: {
    message: '请求超时，请稍后重试',
    level: ErrorLevel.MEDIUM,
    action: (error) => {
      Message.warning({
        message: error.message || '请求超时，请稍后重试',
        duration: 4000
      })
    }
  },
  [ErrorType.ROUTE]: {
    message: '路由错误',
    level: ErrorLevel.MEDIUM,
    action: (error) => {
      Message.error({
        message: error.message || '路由错误',
        duration: 4000
      })
      router.push('/')
    }
  },
  [ErrorType.RENDER]: {
    message: '页面渲染错误',
    level: ErrorLevel.HIGH,
    action: (error) => {
      Message.error({
        message: error.message || '页面渲染错误',
        duration: 5000
      })
    }
  },
  [ErrorType.STATE]: {
    message: '状态管理错误',
    level: ErrorLevel.MEDIUM,
    action: (error) => {
      Message.error({
        message: error.message || '状态管理错误',
        duration: 4000
      })
    }
  },
  [ErrorType.API]: {
    message: 'API调用失败',
    level: ErrorLevel.MEDIUM,
    action: (error) => {
      Message.error({
        message: error.message || 'API调用失败',
        duration: 4000
      })
    }
  },
  [ErrorType.UNKNOWN]: {
    message: '发生未知错误，请联系管理员',
    level: ErrorLevel.MEDIUM,
    action: (error) => {
      Message.error({
        message: error.message || '发生未知错误，请联系管理员',
        duration: 5000
      })
    }
  }
}

/**
 * 错误标准化函数
 */
function normalizeError(error) {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // 网络相关错误
    if (error.message.includes('Network Error') || error.message.includes('net::')) {
      return new AppError(ErrorType.NETWORK, '网络连接失败', error, ErrorLevel.HIGH)
    }

    // 超时错误
    if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
      return new AppError(ErrorType.TIMEOUT, '请求超时', error, ErrorLevel.MEDIUM)
    }

    // 类型错误
    if (error.name === 'TypeError') {
      return new AppError(ErrorType.VALIDATION, error.message, error, ErrorLevel.LOW)
    }

    // 引用错误
    if (error.name === 'ReferenceError') {
      return new AppError(ErrorType.STATE, error.message, error, ErrorLevel.MEDIUM)
    }

    // 语法错误
    if (error.name === 'SyntaxError') {
      return new AppError(ErrorType.RENDER, error.message, error, ErrorLevel.HIGH)
    }

    // 范围错误
    if (error.name === 'RangeError') {
      return new AppError(ErrorType.VALIDATION, error.message, error, ErrorLevel.MEDIUM)
    }

    return new AppError(ErrorType.UNKNOWN, error.message, error, ErrorLevel.MEDIUM)
  }

  if (typeof error === 'string') {
    return new AppError(ErrorType.UNKNOWN, error, null, ErrorLevel.MEDIUM)
  }

  return new AppError(ErrorType.UNKNOWN, '发生未知错误', error, ErrorLevel.MEDIUM)
}

/**
 * 错误上报函数
 */
function reportError(error) {
  const errorReport = {
    id: error.id,
    type: error.type,
    level: error.level,
    message: error.message,
    context: error.context,
    timestamp: error.timestamp,
    userInfo: error.userInfo,
    pageInfo: error.pageInfo,
    stack: error.originalError?.stack,
    originalError: error.originalError ? {
      name: error.originalError.name,
      message: error.originalError.message,
      stack: error.originalError.stack
    } : null
  }

  // 开发环境打印错误信息
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Report')
    console.error('Error ID:', errorReport.id)
    console.error('Error Type:', errorReport.type)
    console.error('Error Level:', errorReport.level)
    console.error('Error Message:', errorReport.message)
    console.error('Error Context:', errorReport.context)
    console.error('Error Stack:', errorReport.stack)
    console.error('User Info:', errorReport.userInfo)
    console.error('Page Info:', errorReport.pageInfo)
    console.groupEnd()
  }

  // 生产环境上报错误
  if (process.env.NODE_ENV === 'production') {
    // 可以发送到错误监控服务，如Sentry、LogRocket等
    // 这里可以调用实际的错误上报API
    // console.error('Error Report:', errorReport)

    // 示例：发送到错误监控服务
    // sendToErrorMonitoring(errorReport)
  }

  return errorReport
}

// ========== 错误节流与去重机制 ===========
const errorCache = new Set()
let errorCount = 0
const MAX_ERROR_COUNT = 100 // 单次会话最多输出100条
const ERROR_CACHE_SIZE = 200 // 缓存最近200条，避免重复

function shouldReportError(msg) {
  if (errorCount >= MAX_ERROR_COUNT) return false
  if (errorCache.has(msg)) return false
  if (errorCache.size > ERROR_CACHE_SIZE) {
    errorCache.clear()
  }
  errorCache.add(msg)
  errorCount++
  return true
}

/**
 * 统一的错误处理函数
 */
export function handleError(error, context = '') {
  const appError = normalizeError(error)
  appError.context = context

  // 提取堆栈首行作为代码位置
  let codeLocation = ''
  if (appError.originalError && appError.originalError.stack && typeof appError.originalError.stack === 'string') {
    const stackLines = appError.originalError.stack.split('\n')
    codeLocation = stackLines.find(line => line.includes('at ')) || stackLines[1] || ''
  } else if (appError.stack && typeof appError.stack === 'string') {
    const stackLines = appError.stack.split('\n')
    codeLocation = stackLines.find(line => line.includes('at ')) || stackLines[1] || ''
  }
  appError.codeLocation = codeLocation

  // 记录 axios 请求的 URL
  if (appError.originalError && appError.originalError.config && appError.originalError.config.url) {
    appError.requestUrl = appError.originalError.config.url
  }

  // 节流与去重：同类报错只输出一次，最多100条
  const msgKey = `${appError.type}|${appError.message}`
  if (!shouldReportError(msgKey)) {
    return appError
  }

  // 获取错误处理器
  const handler = errorHandlers[appError.type] || errorHandlers[ErrorType.UNKNOWN]

  // 执行错误处理
  handler.action(appError)

  // 记录错误信息到Vuex
  store.dispatch('errorLog/addErrorLog', {
    err: appError,
    vm: null,
    info: context,
    url: window.location.href,
    errorType: appError.type,
    errorLevel: appError.level,
    errorId: appError.id,
    timestamp: (appError.timestamp instanceof Date) ? appError.timestamp.toISOString() : (appError.timestamp || new Date().toISOString()),
    codeLocation: appError.codeLocation,
    requestUrl: appError.requestUrl
  })

  // 上报错误
  reportError(appError)

  return appError
}

/**
 * 异步错误处理装饰器
 */
export function asyncErrorHandler(fn, context = '') {
  return async(...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context)
      throw error
    }
  }
}

/**
 * 组件错误处理装饰器
 */
export function componentErrorHandler(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value

  descriptor.value = function(...args) {
    try {
      return originalMethod.apply(this, args)
    } catch (error) {
      handleError(error, `${target.constructor.name}.${propertyKey}`)
      throw error
    }
  }

  return descriptor
}

/**
 * 初始化全局错误处理
 */
export function initGlobalErrorHandler() {
  // Vue全局错误处理
  Vue.config.errorHandler = function(err, vm, info) {
    Vue.nextTick(() => {
      handleError(err, `Vue Error: ${info}`)
    })
  }

  // 全局Promise错误处理
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault()
    handleError(event.reason, 'Unhandled Promise Rejection')
  })

  // 全局JS错误处理
  window.addEventListener('error', (event) => {
    event.preventDefault()
    handleError(event.error, 'Global JavaScript Error')
  })

  // 资源加载错误处理
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      event.preventDefault()
      handleError(new Error(`Resource load failed: ${event.target.src || event.target.href}`), 'Resource Load Error')
    }
  }, true)
}

export default {
  ErrorType,
  ErrorLevel,
  AppError,
  handleError,
  asyncErrorHandler,
  componentErrorHandler,
  initGlobalErrorHandler
}
