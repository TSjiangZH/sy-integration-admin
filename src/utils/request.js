import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken, getRefreshToken, setToken, clearAuthTokens } from '@/utils/auth'
import { handleError, ErrorType, AppError } from '@/utils/error-handler'

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000, // request timeout
  // 添加：重试配置
  retry: 3, // 最大重试次数
  retryDelay: 1000 // 重试延迟时间(ms)
})

// 添加：请求重试逻辑
const shouldRetry = (error) => {
  // 只对GET请求重试
  if (error.config.method.toLowerCase() !== 'get') {
    return false
  }
  // 只对特定错误重试
  const retryErrorTypes = [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER]
  return retryErrorTypes.includes(error.type) && error.config.retry > 0
}

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      // let each request carry token
      // use Authorization header with Bearer scheme for backend compatibility
      config.headers['Authorization'] = 'Bearer ' + getToken()
    }
    return config
  },
  error => {
    // do something with request error
    // console.log(error) // for debug
    handleError(error, 'Request Interceptor Error')
    return Promise.reject(error)
  }
)

// response interceptor
const handleResponse = response => {
  const res = response.data

  // 修复：放宽成功状态码判断，允许200-299范围
  if (res.code >= 200 && res.code < 300) {
    return res
  } else {
    Message({ message: res.message || 'Error', type: 'error', duration: 5 * 1000 })
    return Promise.reject(new Error(res.message || 'Error'))
  }
}

// 新增：令牌刷新标志和队列
let isRefreshing = false
let requests = []

const handleResponseError = error => {
  // console.log('err' + error) // for debug

  // 处理令牌过期情况
  if (error.response && error.response.status === 401) {
    const originalRequest = error.config

    // 如果不是刷新令牌请求本身
    if (!originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新令牌，则将请求加入队列
        return new Promise(resolve => {
          requests.push(() => {
            resolve(service(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      // 调用刷新令牌接口
      return new Promise((resolve, reject) => {
        store.dispatch('user/refreshToken')
          .then(() => {
            isRefreshing = false
            // 重试所有排队的请求
            requests.forEach(cb => cb())
            requests = []
            // 重试当前请求
            resolve(service(originalRequest))
          })
          .catch(err => {
            isRefreshing = false
            requests = []
            // 刷新失败，清除令牌并跳转登录
            clearAuthTokens()
            MessageBox.confirm('令牌已过期，请重新登录', '确认退出', {
              confirmButtonText: '重新登录',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              store.dispatch('user/resetToken').then(() => {
                location.reload()
              })
            })
            reject(err)
          })
      })
    }
  }

  let errorType = ErrorType.API
  let errorMessage = error.message || '请求失败'

  // 根据HTTP状态码和错误类型进行分类
  if (error.response) {
    const { status, data } = error.response

    // 新增：如果 data 是 HTML（如404页面），只给简短提示
    if (typeof data === 'string' && data.startsWith('<!DOCTYPE')) {
      errorType = ErrorType.NOT_FOUND
      errorMessage = '资源不存在或接口404'
    } else {
      switch (status) {
        case 400:
          errorType = ErrorType.VALIDATION
          errorMessage = data?.message || '请求参数错误'
          break
        case 401:
          errorType = ErrorType.AUTH
          errorMessage = data?.message || '未授权访问'
          break
        case 403:
          errorType = ErrorType.FORBIDDEN
          errorMessage = data?.message || '禁止访问'
          break
        case 404:
          errorType = ErrorType.NOT_FOUND
          errorMessage = data?.message || '资源不存在'
          break
        case 408:
          errorType = ErrorType.TIMEOUT
          errorMessage = '请求超时'
          break
        case 429:
          errorType = ErrorType.API
          errorMessage = '请求过于频繁，请稍后重试'
          break
        case 500:
          errorType = ErrorType.SERVER
          errorMessage = data?.message || '服务器内部错误'
          break
        case 502:
          errorType = ErrorType.SERVER
          errorMessage = '网关错误'
          break
        case 503:
          errorType = ErrorType.SERVER
          errorMessage = '服务不可用'
          break
        case 504:
          errorType = ErrorType.TIMEOUT
          errorMessage = '网关超时'
          break
        default:
          if (status >= 500) {
            errorType = ErrorType.SERVER
            errorMessage = '服务器错误'
          } else if (status >= 400) {
            errorType = ErrorType.API
            errorMessage = '客户端错误'
          }
      }
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    if (error.code === 'ECONNABORTED') {
      errorType = ErrorType.TIMEOUT
      errorMessage = '请求超时'
    } else {
      errorType = ErrorType.NETWORK
      errorMessage = '网络连接失败'
    }
  } else {
    // 请求配置出错
    errorType = ErrorType.API
    errorMessage = '请求配置错误'
  }

  const appError = new AppError(errorType, errorMessage, error, 'MEDIUM', 'HTTP Request Error')
  handleError(appError, `HTTP Error - Status: ${error.response?.status || 'No Response'}`)

  return Promise.reject(appError)
}

// 修改响应拦截器
service.interceptors.response.use(
  handleResponse,
  async error => {
    const originalRequest = error.config
    // 实现重试逻辑
    if (shouldRetry(error)) {
      originalRequest.retry -= 1
      const delay = originalRequest.retryDelay
      // 使用指数退避策略
      const backoffDelay = delay * Math.pow(2, 3 - originalRequest.retry) - 1000
      await new Promise(resolve => setTimeout(resolve, backoffDelay))
      return service(originalRequest)
    }
    return handleResponseError(error)
  }
)

export default service
