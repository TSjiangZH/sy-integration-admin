import store from '@/store'

/**
 * @param {Array} value
 * @returns {Boolean}
 * @example see @/views/permission/directive.vue
 */
export default function checkPermission(value) {
  if (value && value instanceof Array && value.length > 0) {
    const { roles, perms } = store.getters
    const permissionRoles = value

    // 先检查角色权限
    const hasRolePermission = roles.some(role => {
      return permissionRoles.includes(role)
    })
    
    // 再检查按钮权限
    const hasPermPermission = perms.some(perm => {
      return permissionRoles.includes(perm)
    })
    
    // 角色或权限有一个匹配即可
    return hasRolePermission || hasPermPermission
  } else {
    // console.error(`need roles! Like v-permission="['admin','editor']"`)
    return false
  }
}
