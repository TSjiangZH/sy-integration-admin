const LOG_STORAGE_KEY = 'frontend_error_logs'
function saveLogsToStorage(logs) {
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs))
}
function loadLogsFromStorage() {
  try {
    const logs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY))
    return Array.isArray(logs) ? logs : []
  } catch {
    return []
  }
}

const state = {
  logs: loadLogsFromStorage(),
  errorStats: {
    total: 0,
    byType: {},
    byLevel: {},
    byDate: {}
  },
  settings: {
    maxLogs: 1000, // 最大日志数量
    autoClean: true, // 自动清理
    retentionDays: 7 // 保留天数
  }
}

const mutations = {
  ADD_ERROR_LOG: (state, log) => {
    // 添加错误日志
    state.logs.unshift(log)

    // 限制日志数量
    if (state.logs.length > state.settings.maxLogs) {
      state.logs = state.logs.slice(0, state.settings.maxLogs)
    }

    // 更新统计信息
    state.errorStats.total++

    // 按类型统计
    const errorType = log.errorType || 'UNKNOWN'
    state.errorStats.byType[errorType] = (state.errorStats.byType[errorType] || 0) + 1

    // 按级别统计
    const errorLevel = log.errorLevel || 'MEDIUM'
    state.errorStats.byLevel[errorLevel] = (state.errorStats.byLevel[errorLevel] || 0) + 1

    // 按日期统计
    const date = new Date().toDateString()
    state.errorStats.byDate[date] = (state.errorStats.byDate[date] || 0) + 1
    saveLogsToStorage(state.logs)
  },
  CLEAR_ERROR_LOG: (state) => {
    state.logs.splice(0)
    state.errorStats = {
      total: 0,
      byType: {},
      byLevel: {},
      byDate: {}
    }
    saveLogsToStorage(state.logs)
  },
  REMOVE_ERROR_LOG: (state, index) => {
    if (index >= 0 && index < state.logs.length) {
      const removedLog = state.logs.splice(index, 1)[0]

      // 更新统计信息
      state.errorStats.total--

      const errorType = removedLog.errorType || 'UNKNOWN'
      if (state.errorStats.byType[errorType]) {
        state.errorStats.byType[errorType]--
      }

      const errorLevel = removedLog.errorLevel || 'MEDIUM'
      if (state.errorStats.byLevel[errorLevel]) {
        state.errorStats.byLevel[errorLevel]--
      }

      const date = new Date(removedLog.timestamp).toDateString()
      if (state.errorStats.byDate[date]) {
        state.errorStats.byDate[date]--
      }
      saveLogsToStorage(state.logs)
    }
  },
  UPDATE_SETTINGS: (state, settings) => {
    state.settings = { ...state.settings, ...settings }
    saveLogsToStorage(state.logs)
  },
  CLEAN_OLD_LOGS: (state) => {
    if (!state.settings.autoClean) return

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - state.settings.retentionDays)

    const originalLength = state.logs.length
    state.logs = state.logs.filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate > cutoffDate
    })

    // 重新计算统计信息
    if (state.logs.length !== originalLength) {
      mutations.RECALCULATE_STATS(state)
    }
    saveLogsToStorage(state.logs)
  },
  RECALCULATE_STATS: (state) => {
    state.errorStats = {
      total: state.logs.length,
      byType: {},
      byLevel: {},
      byDate: {}
    }

    state.logs.forEach(log => {
      const errorType = log.errorType || 'UNKNOWN'
      state.errorStats.byType[errorType] = (state.errorStats.byType[errorType] || 0) + 1

      const errorLevel = log.errorLevel || 'MEDIUM'
      state.errorStats.byLevel[errorLevel] = (state.errorStats.byLevel[errorLevel] || 0) + 1

      const date = new Date(log.timestamp).toDateString()
      state.errorStats.byDate[date] = (state.errorStats.byDate[date] || 0) + 1
    })
    saveLogsToStorage(state.logs)
  }
}

const actions = {
  addErrorLog({ commit }, log) {
    commit('ADD_ERROR_LOG', {
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
      id: log.errorId || `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
  },
  clearErrorLog({ commit }) {
    commit('CLEAR_ERROR_LOG')
  },
  removeErrorLog({ commit }, index) {
    commit('REMOVE_ERROR_LOG', index)
  },
  updateSettings({ commit }, settings) {
    commit('UPDATE_SETTINGS', settings)
  },
  cleanOldLogs({ commit }) {
    commit('CLEAN_OLD_LOGS')
  },
  recalculateStats({ commit }) {
    commit('RECALCULATE_STATS')
  },
  // 获取错误统计信息
  getErrorStats({ state }) {
    return state.errorStats
  },
  // 根据类型过滤错误日志
  getErrorsByType({ state }, type) {
    return state.logs.filter(log => log.errorType === type)
  },
  // 根据级别过滤错误日志
  getErrorsByLevel({ state }, level) {
    return state.logs.filter(log => log.errorLevel === level)
  },
  // 根据时间范围过滤错误日志
  getErrorsByDateRange({ state }, { startDate, endDate }) {
    return state.logs.filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate >= startDate && logDate <= endDate
    })
  }
}

const getters = {
  errorLogs: state => state.logs,
  errorStats: state => state.errorStats,
  errorSettings: state => state.settings,
  // 获取最近的错误
  recentErrors: state => count => state.logs.slice(0, count || 10),
  // 获取高级别错误
  highLevelErrors: state => state.logs.filter(log =>
    log.errorLevel === 'HIGH' || log.errorLevel === 'CRITICAL'
  ),
  // 获取今天的错误
  todayErrors: state => {
    const today = new Date().toDateString()
    return state.logs.filter(log =>
      new Date(log.timestamp).toDateString() === today
    )
  },
  // 获取错误类型统计
  errorTypeStats: state => state.errorStats.byType,
  // 获取错误级别统计
  errorLevelStats: state => state.errorStats.byLevel,
  // 获取日期统计
  errorDateStats: state => state.errorStats.byDate,
  // 搜索错误日志（同步getter）
  searchErrors: (state) => (searchTerm) => {
    if (!searchTerm) return state.logs
    const term = searchTerm.toLowerCase()
    return state.logs.filter(log => {
      return (
        (log.err?.message && log.err.message.toLowerCase().includes(term)) ||
        (log.info && log.info.toLowerCase().includes(term)) ||
        (log.errorType && log.errorType.toLowerCase().includes(term)) ||
        (log.errorLevel && log.errorLevel.toLowerCase().includes(term)) ||
        (log.url && log.url.toLowerCase().includes(term))
      )
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
