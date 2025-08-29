import store from '@/store'

/**
 * 记录操作日志
 * @param {Object} log { type, action, target, detail, result, message }
 */
export function recordOperationLog({ type, action, target, detail, result = 'success', message = '' }) {
  const user = store.getters.name || 'anonymous'
  const logEntry = {
    user,
    type,      // 操作类型，如 user/role/article
    action,    // 操作动作，如 create/edit/delete/assign
    target,    // 操作对象，如 用户ID/角色ID
    detail,    // 详细内容（如表单快照）
    result,    // success/fail
    message,   // 失败原因或补充说明
    timestamp: new Date().toISOString(),
    page: window.location.href
  }
  store.dispatch('operationLog/addOperationLog', logEntry)
}
