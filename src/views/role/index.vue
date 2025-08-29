<template>
  <div class="app-container">
    <el-card shadow="hover" style="border-radius: 12px;">
      <div slot="header" class="card-header">
        <span class="header-title">角色管理</span>
        <div class="button-group">
          <el-input v-model="search" placeholder="搜索角色名" size="small" prefix-icon="el-icon-search"
            style="width: 200px; margin-right: 15px;" @input="fetchList" clearable />
          <el-button type="primary" size="small" @click="showRoleForm()" icon="el-icon-plus">新增角色</el-button>
        </div>
      </div>

      <el-table :data="roleList" border stripe style="width: 100%; margin-top: 15px;"
        :row-class-name="tableRowClassName">
        <el-table-column prop="name" label="角色名" width="120" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="userCount" label="用户数" width="80" />
        <!-- 移除权限列 -->
        <el-table-column label="操作" width="80" fixed="right">
          <template slot-scope="scope">
            <el-dropdown trigger="click">
              <el-button size="mini" icon="el-icon-more"></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="showRoleForm(scope.row)">
                  <i class="el-icon-edit"></i> 编辑
                </el-dropdown-item>
                <el-dropdown-item @click.native="handleDelete(scope.row)">
                  <i class="el-icon-delete"></i> 删除
                </el-dropdown-item>
                <el-dropdown-item @click.native="handleAssignPermission(scope.row)">
                  <i class="el-icon-key"></i> 分配权限
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination style="margin-top: 16px; text-align: right;" :current-page="page" :page-size="pageSize"
        :total="total" layout="total, prev, pager, next" @current-change="fetchList" />
    </el-card>

    <RoleForm v-if="roleFormVisible" :role="currentRole" @close="roleFormVisible = false; fetchList()" />
    <AssignPermissionDialog :visible="assignPermissionDialogVisible" :permissions="allPermissions"
      :checkedPermissionIds="checkedPermissionIds" @close="assignPermissionDialogVisible = false"
      @confirm="onAssignPermissionConfirm" />
  </div>
</template>
<script>
import { fetchRoleList, deleteRole, assignRolePermission } from '@/api/modules/role'
import RoleForm from './RoleForm.vue'
import AssignPermissionDialog from './AssignPermissionDialog.vue'
import request from '@/utils/request'

export default {
  name: 'RoleList',
  components: { RoleForm, AssignPermissionDialog },
  data() {
    return {
      roleList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      search: '',
      roleFormVisible: false,
      currentRole: null,
      assignPermissionDialogVisible: false,
      currentRoleForPermission: null,
      allPermissions: [],
      loading: false,
      checkedPermissionIds: []
    }
  },
  created() {
    this.init()
  },
  methods: {
    async init() {
      // 初始化时获取权限列表和角色列表
      await Promise.all([
        this.fetchAllPermissions(),
        this.fetchList()
      ])
    },

    async fetchAllPermissions() {
      try {
        // 获取所有权限列表
        const res = await request({
          url: '/v3/authority/list',
          method: 'get'
        })
        this.allPermissions = res.data || []
        // 构建权限层级结构
        this.buildPermissionHierarchy()
      } catch (error) {
        console.error('获取权限列表失败:', error)
        this.$message.error('获取权限列表失败: ' + (error.message || '未知错误'))
      }
    },

    buildPermissionHierarchy() {
      // 构建完整的权限层级结构
      this.level1Permissions = new Set(); // 一级权限ID集合
      this.level2Permissions = new Set(); // 二级权限ID集合
      this.level3Permissions = new Set(); // 三级权限ID集合
      this.parentToChildrenMap = new Map(); // 父权限ID -> 子权限ID集合
      this.idToPermissionMap = new Map(); // 权限ID -> 权限对象映射
      this.nameToIdMap = new Map(); // 权限名称 -> 权限ID映射

      // 第一遍：建立ID映射和父-子关系
      this.allPermissions.forEach(perm => {
        this.idToPermissionMap.set(perm.id, perm);
        this.nameToIdMap.set(perm.name, perm.id);

        const parentId = perm.parentId || 0;
        if (!this.parentToChildrenMap.has(parentId)) {
          this.parentToChildrenMap.set(parentId, new Set());
        }
        this.parentToChildrenMap.get(parentId).add(perm.id);
      });

      // 第二遍：确定权限层级
      this.allPermissions.forEach(perm => {
        const parentId = perm.parentId || 0;

        if (parentId === 0) {
          // 一级权限（父ID为0）
          this.level1Permissions.add(perm.id);
        } else if (this.level1Permissions.has(parentId)) {
          // 二级权限（父ID是一级权限）
          this.level2Permissions.add(perm.id);
        } else if (this.level2Permissions.has(parentId)) {
          // 三级权限（父ID是二级权限）
          this.level3Permissions.add(perm.id);
        }
      });
    },

    async fetchList(page = 1) {
      try {
        this.page = page
        this.loading = true

        // 获取角色列表
        const res = await fetchRoleList({
          page,
          limit: this.pageSize,
          search: this.search
        })

        // 调试信息 - 查看API返回数据
        console.log('角色列表API返回:', res)

        // 检查数据结构，兼容不同格式
        this.roleList = res.data?.items || res.items || []
        this.total = res.data?.total || res.total || 0

        // 显示无数据提示
        if (this.roleList.length === 0) {
          this.$message.info('当前没有角色数据')
        }

        // 移除下面这部分代码 - 批量获取角色权限
        /*
        if (this.roleList.length > 0) {
          await this.fetchRolesPermissions()
        }
        */
      } catch (error) {
        console.error('获取角色列表失败:', error)
        this.$message.error('获取角色列表失败: ' + (error.message || '未知错误'))
        // 确保即使出错也有数据显示
        this.roleList = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    async fetchRolesPermissions() {
      try {
        await Promise.all(this.roleList.map(async (role, idx) => {
          try {
            // 修复：使用正确的API路径格式，将roleId作为路径参数
            const permRes = await request({
              url: `/v2/role-authority/authority-ids/${role.id}`,
              method: 'get'
            })

            console.log('角色权限API返回:', permRes)

            // 后续代码保持不变
            // 注意：后端返回的是权限ID列表，需要转换为权限名称显示
            const displayNames = this.getDisplayPermissionNames(permRes.data || [])

            this.$set(this.roleList, idx, {
              ...role,
              permissionIds: permRes.data || [],
              permissionNames: displayNames.length ? displayNames.join(', ') : '只有查看权限'
            })
          } catch (error) {
            console.error(`获取角色${role.id}权限失败:`, error)
            this.$set(this.roleList, idx, {
              ...role,
              permissionNames: '权限加载失败'
            })
          }
        }))
      } catch (error) {
        console.error('批量获取角色权限失败:', error)
      }
    },

    getDisplayPermissionNames(permissions) {
      // 简化权限标签显示: 直接显示所有权限名称
      if (!permissions || permissions.length === 0) {
        return ['无权限'];
      }

      // 直接返回所有权限名称
      return permissions.map(perm => perm.name);
    },

    tableRowClassName({ row, rowIndex }) {
      return rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
    },

    showRoleForm(role) {
      this.currentRole = role || null
      this.roleFormVisible = true
    },

    async handleDelete(row) {
      try {
        await this.$confirm('确定删除该角色？', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await deleteRole(row.id)
        this.$message.success('删除成功')
        this.fetchList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败: ' + (error.message || '未知错误'))
        }
      }
    },

    handleAssignPermission(row) {
      this.currentRoleForPermission = row
      this.loadRolePermissions(row.id)
    },

    async loadRolePermissions(roleId) {
      try {
        // 获取已分配权限ID
        const permRes = await request({
          url: `/v2/system/role/authority-ids`,
          method: 'get',
          params: {
            roleId: roleId
          }
        })
        const permissions = permRes.data || []
        const checkedPermissionIds = permissions.map(perm => perm.id)

        this.assignPermissionDialogVisible = true
        // 更新AssignPermissionDialog的checkedPermissionIds
        this.$set(this, 'checkedPermissionIds', checkedPermissionIds)
      } catch (error) {
        this.$message.error('加载权限数据失败: ' + (error.message || '未知错误'))
      }
    },

    async onAssignPermissionConfirm(permissionIds) {
      try {
        await assignRolePermission({
          roleId: this.currentRoleForPermission.id,
          permissionIds
        })
        this.$message.success('分配权限成功')
        this.assignPermissionDialogVisible = false
        this.fetchList()
      } catch (error) {
        this.$message.error('分配权限失败: ' + (error.message || '未知错误'))
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.button-group {
  display: flex;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

/* 操作按钮样式优化 */
::v-deep .table-actions .el-button--mini {
  padding: 4px 8px;
  font-size: 12px;
  height: 28px;
  line-height: 28px;
}

.permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 350px;
  padding: 4px 0;
}

/* 表格行样式 */
::v-deep .el-table .row-even {
  background-color: #f9fafc;
}

::v-deep .el-table .row-odd {
  background-color: #ffffff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .permission-tags {
    max-width: 250px;
  }
}

@media (max-width: 992px) {
  .permission-tags {
    max-width: 200px;
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .button-group {
    width: 100%;
    margin-top: 10px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }

  ::v-deep .el-table .el-table__fixed-right {
    width: 100px !important;
  }

  .permission-tags {
    max-width: 150px;
  }
}

@media (max-width: 576px) {
  .app-container {
    padding: 10px;
  }

  .header-title {
    font-size: 16px;
  }

  ::v-deep .el-table {
    font-size: 12px;
  }

  ::v-deep .el-table .el-table__column {
    padding: 0 5px;
  }

  .permission-tags {
    max-width: 100px;
  }
}
</style>
