const LOG_STORAGE_KEY = 'operation_logs'
function saveLogs(logs) {
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs))
}
function loadLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY))
    return Array.isArray(logs) ? logs : []
  } catch {
    return []
  }
}

const state = {
  logs: loadLogs()
}
const mutations = {
  ADD_OPERATION_LOG(state, log) {
    state.logs.unshift(log)
    if (state.logs.length > 1000) state.logs = state.logs.slice(0, 1000)
    saveLogs(state.logs)
  },
  CLEAR_OPERATION_LOG(state) {
    state.logs = []
    saveLogs(state.logs)
  }
}
const actions = {
  addOperationLog({ commit }, log) {
    commit('ADD_OPERATION_LOG', log)
  },
  clearOperationLog({ commit }) {
    commit('CLEAR_OPERATION_LOG')
  }
}
const getters = {
  operationLogs: state => state.logs
}
export default { namespaced: true, state, mutations, actions, getters }
