<template>
  <div class="app-container">
    <div class="search-and-add">
      <el-input
        v-model="searchRole"
        placeholder="搜索角色"
        size="small"
        prefix-icon="el-icon-search"
        style="width: 200px; margin-right: 15px;"
        @input="handleSearch"
        clearable
      />
      <el-button type="primary" icon="el-icon-plus" @click="handleAddRole">新增角色</el-button>
    </div>

    <el-table :data="filteredRolesList" style="width: 100%;margin-top:30px;" border>
      <el-table-column align="center" label="角色Key" width="220">
        <template slot-scope="scope">
          {{ scope.row.key }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="角色名称" width="220">
        <template slot-scope="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column align="header-center" label="描述">
        <template slot-scope="scope">
          {{ scope.row.description || '无' }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="权限数量">
        <template slot-scope="scope">
          {{ (scope.row.permissions && scope.row.permissions.length) || 0 }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作">
        <template slot-scope="scope">
          <el-button type="primary" size="small" icon="el-icon-edit" @click="handleEdit(scope)">编辑</el-button>
          <el-button type="danger" size="small" icon="el-icon-delete" @click="handleDelete(scope)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :visible.sync="dialogVisible" :title="dialogType==='edit'?'编辑角色':'新增角色'" width="600px">
      <el-form :model="role" :rules="roleRules" ref="roleForm" label-width="100px" label-position="left">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="role.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="role.description"
            :autosize="{ minRows: 2, maxRows: 4}"
            type="textarea"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="菜单权限">
          <div class="tree-controls">
            <el-button size="mini" @click="handleCheckAllMenu">全选</el-button>
            <el-button size="mini" @click="handleUncheckAllMenu">取消全选</el-button>
          </div>
          <el-tree
            ref="tree"
            :check-strictly="checkStrictly"
            :data="routesData"
            :props="defaultProps"
            show-checkbox
            node-key="path"
            class="permission-tree"
            :loading="menuLoading"
          />
        </el-form-item>
        <el-form-item label="功能权限">
          <div class="tree-controls">
            <el-button size="mini" @click="handleCheckAllPerm">全选</el-button>
            <el-button size="mini" @click="handleUncheckAllPerm">取消全选</el-button>
            <el-input
              v-model="permSearch"
              placeholder="搜索权限"
              size="small"
              prefix-icon="el-icon-search"
              style="width: 200px; margin-left: 10px;"
              @input="handlePermSearch"
              clearable
            />
          </div>
          <el-tree
            ref="permTree"
            :check-strictly="permCheckStrictly"
            :data="filteredPermissionsList"
            :props="permDefaultProps"
            show-checkbox
            node-key="id"
            class="permission-tree"
            :loading="permLoading"
          />
          <div class="permission-count">已选择 {{ checkedPermCount }} 个权限</div>
        </el-form-item>
      </el-form>
      <div style="text-align:right;">
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmRole">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import path from 'path'
import { deepClone } from '@/utils'
import { getRoutes, getRoles, addRole, deleteRole, updateRole, assignRolePermission } from '@/api/modules/role'
import { getPermissions } from '@/api/modules/permission'

const defaultRole = {
  key: '',
  name: '',
  description: '',
  routes: [],
  permissions: []
}

// 表单验证规则
const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '角色描述不能超过 200 个字符', trigger: 'blur' }
  ]
}

export default {
  data() {
      return {
        role: Object.assign({}, defaultRole),
        routes: [],
        rolesList: [],
        filteredRolesList: [],
        permissionsList: [],
        filteredPermissionsList: [],
        dialogVisible: false,
        dialogType: 'new',
        checkStrictly: false,
        permCheckStrictly: false,
        defaultProps: {
          children: 'children',
          label: 'title'
        },
        permDefaultProps: {
          children: 'children',
          label: 'name'
        },
        searchRole: '',
        permSearch: '',
        menuLoading: false,
        permLoading: false,
        roleRules
      }
    },
  computed: {
      routesData() {
        return this.routes
      },
      checkedPermCount() {
        if (!this.$refs.permTree) return 0
        return this.$refs.permTree.getCheckedKeys().length
      }
    },
  created() {
    // Mock: get all routes and roles list from server
    this.getRoutes()
    this.getRoles()
    this.getPermissions()
  },
  methods: {
      // 搜索角色
      handleSearch() {
        if (!this.searchRole) {
          this.filteredRolesList = this.rolesList
          return
        }
        const searchStr = this.searchRole.toLowerCase()
        this.filteredRolesList = this.rolesList.filter(role =>
          role.name.toLowerCase().includes(searchStr) ||
          role.key.toLowerCase().includes(searchStr) ||
          (role.description && role.description.toLowerCase().includes(searchStr))
        )
      },
      // 搜索权限
      handlePermSearch() {
        if (!this.permSearch) {
          this.filteredPermissionsList = this.permissionsList
          return
        }
        const searchStr = this.permSearch.toLowerCase()
        // 递归过滤权限树
        const filterPerms = (perms) => {
          return perms.map(perm => {
            const children = perm.children ? filterPerms(perm.children) : []
            const match = perm.name.toLowerCase().includes(searchStr) ||
                          (perm.code && perm.code.toLowerCase().includes(searchStr)) ||
                          (perm.description && perm.description.toLowerCase().includes(searchStr)) ||
                          children.length > 0
            return match ? { ...perm, children } : null
          }).filter(Boolean)
        }
        this.filteredPermissionsList = filterPerms(this.permissionsList)
      },
      // 全选菜单
      async handleCheckAllMenu() {
        if (this.$refs.tree) {
          const checkedNodes = await this.generateArr(this.routes);
          this.$refs.tree.setCheckedNodes(checkedNodes);
        }
      },
      // 取消全选菜单
      handleUncheckAllMenu() {
        if (this.$refs.tree) {
          this.$refs.tree.setCheckedNodes([])
        }
      },
      // 全选权限
      handleCheckAllPerm() {
        if (this.$refs.permTree) {
          // 递归获取所有权限ID
          const getAllPermIds = (perms) => {
            let ids = []
            perms.forEach(perm => {
              ids.push(perm.id)
              if (perm.children) {
                ids = [...ids, ...getAllPermIds(perm.children)]
              }
            })
            return ids
          }
          const allPermIds = getAllPermIds(this.permissionsList)
          this.$refs.permTree.setCheckedKeys(allPermIds)
        }
      },
      // 取消全选权限
      handleUncheckAllPerm() {
        if (this.$refs.permTree) {
          this.$refs.permTree.setCheckedKeys([])
        }
      },
      async getRoutes() {
        const res = await getRoutes()
        this.serviceRoutes = res.data
        this.routes = this.generateRoutes(res.data)
      },
    async getRoles() {
        const res = await getRoles()
        this.rolesList = res.data
        this.filteredRolesList = res.data
      },
    async getPermissions() {
        this.permLoading = true
        try {
          const res = await getPermissions()
          // 格式化权限数据为树形结构
          this.permissionsList = this.formatPermissions(res.data)
          this.filteredPermissionsList = this.permissionsList
        } finally {
          this.permLoading = false
        }
      },
    formatPermissions(permissions) {
      // 构建权限树形结构
      const tree = []
      const map = {}

      // 创建ID到节点的映射
      permissions.forEach(perm => {
        map[perm.id] = { ...perm, children: [] }
      })

      // 构建树形结构
      permissions.forEach(perm => {
        if (perm.parentId === 0) {
          tree.push(map[perm.id])
        } else if (map[perm.parentId]) {
          map[perm.parentId].children.push(map[perm.id])
        }
      })

      return tree
    },

    // Reshape the routes structure so that it looks the same as the sidebar
    generateRoutes(routes, basePath = '/') {
      const res = []

      for (let route of routes) {
        // skip some route
        if (route.hidden) { continue }

        const onlyOneShowingChild = this.onlyOneShowingChild(route.children, route)

        if (route.children && onlyOneShowingChild && !route.alwaysShow) {
          route = onlyOneShowingChild
        }

        const data = {
          path: path.resolve(basePath, route.path),
          title: route.meta && route.meta.title

        }

        // recursive child routes
        if (route.children) {
          data.children = this.generateRoutes(route.children, data.path)
        }
        res.push(data)
      }
      return res
    },
    // 将方法改为返回Promise，确保所有错误都能被捕获
    // 重构为正确处理异步递归的版本
    generateArr(routes) {
      return new Promise((resolve) => {
        try {
          if (!Array.isArray(routes)) {
            console.error('generateArr: routes is not an array', routes)
            resolve([])
            return
          }

          // 使用map和Promise.all处理所有递归调用
          const promises = routes.map(route => {
            if (!route) {
              console.error('generateArr: route is null or undefined')
              return Promise.resolve(null)
            }

            // 处理当前路由
            const currentRoutePromise = Promise.resolve(route);

            // 处理子路由
            if (Array.isArray(route.children)) {
              return currentRoutePromise.then(currentRoute => {
                return this.generateArr(route.children).then(children => {
                  // 合并当前路由和子路由结果
                  return [currentRoute, ...children];
                })
              })
            } else if (route.children) {
              console.error('generateArr: route.children is not an array', route.children)
              return currentRoutePromise;
            }

            return currentRoutePromise;
          });

          // 等待所有Promise完成
          Promise.all(promises).then(results => {
            // 过滤掉null值并展平数组
            const data = results.filter(Boolean).flat();
            resolve(data);
          }).catch(error => {
            console.error('Error in Promise.all:', error);
            resolve([]);
          });
        } catch (error) {
          console.error('Error in generateArr:', error);
          resolve([]);
        }
      })
    },
    handleAddRole() {
      this.role = Object.assign({}, defaultRole)
      if (this.$refs.tree) {
        this.$refs.tree.setCheckedNodes([])
      }
      this.dialogType = 'new'
      this.dialogVisible = true
    },
    handleEdit(scope) {
      this.dialogType = 'edit'
      this.dialogVisible = true
      this.checkStrictly = true
      this.permCheckStrictly = true
      this.role = deepClone(scope.row)
      this.$nextTick(async () => {
          // 设置菜单权限
          const routes = this.generateRoutes(this.role.routes);
          const checkedNodes = await this.generateArr(routes);
          this.$refs.tree.setCheckedNodes(checkedNodes);
          // 设置功能权限
          if (this.role.permissions && this.role.permissions.length > 0) {
            this.$refs.permTree.setCheckedKeys(this.role.permissions.map(p => p.id))
          }
          // 关闭严格模式
          this.checkStrictly = false
          this.permCheckStrictly = false
        })
    },
    handleDelete({ $index, row }) {
      this.$confirm('Confirm to remove the role?', 'Warning', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      })
        .then(async() => {
          await deleteRole(row.key)
          this.rolesList.splice($index, 1)
          this.$message({
            type: 'success',
            message: 'Delete succed!'
          })
        })
        .catch(err => { /* console.error(err) */ })
    },
    generateTree(routes, basePath = '/', checkedKeys) {
      const res = []

      for (const route of routes) {
        const routePath = path.resolve(basePath, route.path)

        // recursive child routes
        if (route.children) {
          route.children = this.generateTree(route.children, routePath, checkedKeys)
        }

        if (checkedKeys.includes(routePath) || (route.children && route.children.length >= 1)) {
          res.push(route)
        }
      }
      return res
    },
    async confirmRole() {
        // 表单验证
        this.$refs.roleForm.validate(async(valid) => {
          if (valid) {
            const isEdit = this.dialogType === 'edit'

            // 获取选中的菜单权限
            const checkedKeys = this.$refs.tree.getCheckedKeys()
            this.role.routes = this.generateTree(deepClone(this.serviceRoutes), '/', checkedKeys)

            // 获取选中的功能权限
            const checkedPermIds = this.$refs.permTree.getCheckedKeys()
            this.role.permissions = this.permissionsList.filter(perm => checkedPermIds.includes(perm.id))

            if (isEdit) {
              await updateRole(this.role.key, this.role)
              // 分配权限
              await assignRolePermission({
                roleId: this.role.key,
                permissionIds: checkedPermIds
              })
              for (let index = 0; index < this.rolesList.length; index++) {
                if (this.rolesList[index].key === this.role.key) {
                  this.rolesList.splice(index, 1, Object.assign({}, this.role))
                  this.filteredRolesList = [...this.rolesList]
                  break
                }
              }
            } else {
              const { data } = await addRole(this.role)
              this.role.key = data.key
              this.rolesList.push(this.role)
              this.filteredRolesList = [...this.rolesList]
              // 分配权限
              await assignRolePermission({
                roleId: this.role.key,
                permissionIds: checkedPermIds
              })
            }

            const { description, key, name } = this.role
            this.dialogVisible = false
            this.$notify({
              title: '成功',
              dangerouslyUseHTMLString: true,
              message: `
                  <div>角色Key: ${key}</div>
                  <div>角色名称: ${name}</div>
                  <div>描述: ${description || '无'}</div>
                  <div>权限数量: ${checkedPermIds.length}</div>
                `,
              type: 'success'
            })
          }
        })
      },
    // reference: src/view/layout/components/Sidebar/SidebarItem.vue
    onlyOneShowingChild(children = [], parent) {
      let onlyOneChild = null
      const showingChildren = children.filter(item => !item.hidden)

      // When there is only one child route, the child route is displayed by default
      if (showingChildren.length === 1) {
        onlyOneChild = showingChildren[0]
        onlyOneChild.path = path.resolve(parent.path, onlyOneChild.path)
        return onlyOneChild
      }

      // Show parent if there are no child route to display
      if (showingChildren.length === 0) {
        onlyOneChild = { ... parent, path: '', noShowingChildren: true }
        return onlyOneChild
      }

      return false
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  .search-and-add {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  .roles-table {
    margin-top: 30px;
  }
  .permission-tree {
    margin-bottom: 15px;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 10px;
  }
  .tree-controls {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
  }
  .permission-count {
    text-align: right;
    margin-top: 5px;
    color: #606266;
    font-size: 12px;
  }
}
</style>
