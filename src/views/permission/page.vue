<template>
  <div class="app-container">
    <!-- 用户信息卡片 -->
    <el-card class="user-card" shadow="hover">
      <div class="user-info">
        <div class="user-avatar">
          <img :src="avatar" alt="User Avatar" class="avatar-img">
        </div>
        <div class="user-details">
          <h2 class="user-name">{{ name }}</h2>
          <p class="user-intro">{{ introduction }}</p>
          <p class="user-email">{{ email }}</p>
        </div>
      </div>
    </el-card>

    <!-- 角色信息 -->
    <el-card class="role-card" shadow="hover" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span class="header-title">角色信息</span>
      </div>
      <div class="role-details-container">
        <div v-for="role in roles" :key="role" class="role-detail-card">
          <div class="role-name">{{ role }}</div>
          <div class="role-description">
            <p>角色名称: <span class="role-id">{{ role.toLowerCase().replace(/\s+/g, '-') }}</span></p>
            <p>角色描述: <span class="role-desc">该角色拥有系统相关权限</span></p>
            <p>创建时间: <span class="role-created">2023-01-01</span></p>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 权限列表 -->
    <el-card class="permission-card" shadow="hover" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span class="header-title">权限列表</span>
        <el-input
          v-model="searchPermission"
          placeholder="搜索权限"
          size="small"
          prefix-icon="el-icon-search"
          style="width: 200px; margin-left: auto;"
        />
      </div>
      <div class="permission-collapse-container">
        <el-collapse v-model="activeNames" accordion>
          <el-collapse-item
            v-for="group in filteredPermissions"
            :key="group.id"
            :title="group.name"
            :name="group.id"
          >
            <div class="permission-group-header">
              <span class="group-desc">{{ group.description }}</span>
            </div>
            <div class="permission-items">
              <div v-for="permission in group.children" :key="permission.id" class="permission-item">
                <div class="permission-info">
                  <div class="permission-name">{{ permission.name }}</div>
                  <div class="permission-desc">{{ permission.description }}</div>
                </div>

              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'UserPermissionSummary',
  data() {
      return {
        searchPermission: '',
        activeNames: [] // 用于控制折叠面板的展开/收起状态
      }
    },

    created() {
      // 默认展开第一个权限组
      if (this.filteredPermissions.length > 0) {
        this.activeNames = [this.filteredPermissions[0].id]
      }
    },
  computed: {
    ...mapState('user', ['name', 'avatar', 'introduction', 'roles', 'perms','email']),
    permissionsTree() {
      // 格式化权限数据为树形结构
      return this.formatPermissions(this.perms)
    },
    filteredPermissions() {
      if (!this.searchPermission) {
        return this.permissionsTree
      }
      const searchStr = this.searchPermission.toLowerCase()
      return this.filterTree(this.permissionsTree, searchStr)
    },
    defaultProps() {
      return {
        children: 'children',
        label: 'name'
      }
    }
  },
  methods: {
    formatPermissions(permissions) {
      // 添加调试日志
      console.log('原始权限数据:', permissions)
      // 处理权限数据
      if (!permissions || permissions.length === 0) {
        // 当权限为空时，显示提示信息
        this.$nextTick(() => {
          this.$message({
            message: '当前用户没有分配任何权限',
            type: 'info'
          })
        })
        return []
      }

      // 创建权限分组映射
      const permissionGroups = {}
      permissions.forEach(permStr => {
        // 尝试按冒号或下划线分割权限字符串以创建层级
        const parts = permStr.includes(':') ? permStr.split(':') : permStr.split('_')
        if (parts.length > 1) {
          const groupName = parts[0]
          const permissionName = parts.slice(1).join(' ')

          if (!permissionGroups[groupName]) {
            permissionGroups[groupName] = {
              id: groupName,
              name: groupName,
              code: groupName,
              description: `权限组: ${groupName}`,
              children: []
            }
          }

          permissionGroups[groupName].children.push({
            id: permStr,
            name: permissionName,
            code: permStr,

            description: `权限: ${permissionName}`,
            children: []
          })
        } else {
          // 无法分组的权限直接添加
          if (!permissionGroups['other']) {
            permissionGroups['other'] = {
              id: 'other',
              name: '其他权限',
              code: 'other',
              description: '未分类的权限',
              children: []
            }
          }
          permissionGroups['other'].children.push({
            id: permStr,
            name: permStr,
            code: permStr,

            description: `权限: ${permStr}`,
            children: []
          })
        }
      })

      // 转换为数组并返回
      return Object.values(permissionGroups)
    },
    filterTree(tree, searchStr) {
      return tree
        .map(node => {
          const newNode = { ...node }
          if (newNode.children && newNode.children.length) {
            newNode.children = this.filterTree(newNode.children, searchStr)
          }
          const matchesSearch =
            newNode.name.toLowerCase().includes(searchStr) ||
            (newNode.description && newNode.description.toLowerCase().includes(searchStr)) ||
            (newNode.code && newNode.code.toLowerCase().includes(searchStr))
          return (matchesSearch || (newNode.children && newNode.children.length)) ? newNode : null
        })
        .filter(node => node !== null)
    }
  },
  mounted() {
    // 确保已加载用户信息和权限
    if (this.$store.dispatch) {
      // 无论name是否存在，都确保获取用户信息，因为可能name存在但perms为空
      this.$store.dispatch('user/getInfo').catch(error => {
        console.error('获取用户信息失败:', error)
        this.$message.error('获取用户信息失败，请刷新页面重试')
      })
    }
  }
}
</script>

<style scoped>
/* 通用样式 */
.app-container {
  padding: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

/* 用户信息卡片 */
.user-card {
  border-radius: 12px;
  overflow: hidden;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 20px;
}

.user-avatar {
  margin-right: 20px;
}

.avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f2f5;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2c3e50;
}

.user-intro, .user-email {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  max-width: 800px;
}

/* 角色卡片 */
.role-card {
  border-radius: 12px;
}

.role-details-container {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.role-detail-card {
  padding: 15px;
  background-color: #f9fafc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.role-name {
  font-size: 17px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.role-description {
  font-size: 14px;
  color: #666;
}

.role-description p {
  margin-bottom: 12px;
  line-height: 1.6;
}

.role-description span {
  font-weight: 500;
  color: #333;
}

/* 权限卡片 */
.permission-card {
  border-radius: 12px;
}

.permission-collapse-container {
  margin-top: 15px;
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9fafc;
  border-radius: 8px;
}

.permission-group-header {
  padding: 10px 15px;
  background-color: #f0f5ff;
  border-radius: 4px;
  margin-bottom: 10px;
}

.group-desc {
  font-size: 14px;
  color: #666;
}

.permission-items {
  padding: 0 15px;
}

.permission-item {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-info {
  flex: 1;
}

.permission-actions {
  display: flex;
  gap: 5px;
}

.permission-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 5px;
}

.permission-desc {
  font-size: 13px;
  color: #7f8c8d;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
    text-align: center;
  }

  .user-avatar {
    margin-right: 0;
    margin-bottom: 15px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .el-input {
    width: 100% !important;
    margin-left: 0 !important;
    margin-top: 10px;
  }
}
</style>
