import store from '@/store'

/**
 * ============================================
 * 【权限控制模块】前端元素级权限指令
 * ============================================
 * 
 * 该指令用于实现细粒度的元素级权限控制
 * 通过 v-permission 指令可以控制页面上按钮、菜单等元素的显示/隐藏
 * 
 * 使用方式：
 * v-permission="'manage:user:add'"    - 单权限判断
 * v-permission="['manage:user:add', 'manage:user:edit']" - 多权限判断
 * 
 * @author security-module
 */

export default {
  /**
   * 指令绑定到元素时触发
   * @param {HTMLElement} el - 绑定指令的DOM元素
   * @param {Object} binding - 指令绑定信息，包含value（权限值）
   * @param {VNode} vnode - Vue虚拟节点
   */
  inserted(el, binding, vnode) {
    const { value } = binding
    // 执行权限检查
    const hasPermission = checkPermission(value)
    // 如果没有权限，则移除元素
    if (!hasPermission) {
      removeElement(el)
    }
  },
  /**
   * 组件更新时触发（处理权限动态变化场景）
   * @param {HTMLElement} el - 绑定指令的DOM元素
   * @param {Object} binding - 指令绑定信息
   * @param {VNode} vnode - Vue虚拟节点
   */
  update(el, binding, vnode) {
    const { value } = binding
    // 执行权限检查
    const hasPermission = checkPermission(value)
    // 如果没有权限，则移除元素
    if (!hasPermission) {
      removeElement(el)
    }
  }
}

/**
 * 安全移除DOM元素
 * @param {HTMLElement} el - 要移除的DOM元素
 */
function removeElement(el) {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

/**
 * 权限检查核心函数
 * @param {String|Array} value - 权限标识，可以是单个权限字符串或权限数组
 * @returns {Boolean} - 是否具有权限
 */
function checkPermission(value) {
  // 验证参数有效性
  if (!value) {
    console.error('v-permission directive requires a permission value!')
    return false
  }

  // 获取当前用户的角色和权限信息
  const roles = store.getters && store.getters.roles
  const perms = store.getters && store.getters.perms

  // 统一处理为数组格式
  const permissionList = Array.isArray(value) ? value : [value]

  // 检查是否有匹配的角色权限
  const hasRolePermission = roles && roles.some(role => permissionList.includes(role))
  
  // 检查是否有匹配的按钮权限
  const hasPermPermission = perms && perms.some(perm => {
    // 支持通配符匹配，如 'user:*' 匹配 'user:add', 'user:edit' 等
    return permissionList.some(p => {
      if (p.endsWith('*')) {
        return perm.startsWith(p.slice(0, -1))
      }
      return perm === p
    })
  })

  // 角色权限或按钮权限任一满足即可
  return hasRolePermission || hasPermPermission
}
