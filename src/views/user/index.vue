<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>用户管理</span>
        <el-button v-if="hasAddPerm" style="float: right;" type="primary" size="small"
          @click="showUserForm()">新增用户</el-button>
      </div>
      <el-input v-model="search" placeholder="搜索用户名/昵称" style="width: 200px; margin-bottom: 10px;" @input="fetchList"
        clearable />
      <el-table :data="userList" border stripe style="width: 100%">
        <el-table-column prop="username" label="用户名" width="120">
          <template slot-scope="scope">
            <span :style="scope.row.deleted ? 'color: #aaa;text-decoration: line-through;' : ''">
              {{ scope.row.username }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120">
          <template slot-scope="scope">
            <span :style="scope.row.deleted ? 'color: #aaa;text-decoration: line-through;' : ''">
              {{ scope.row.nickname }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="roleNames" label="角色" />
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.deleted" type="danger">已删除</el-tag>
            <el-tag v-else :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="scope">
            <el-button size="mini" @click="openActionPanel(scope.row)">操作</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination style="margin-top: 16px; text-align: right;" :current-page="page" :page-size="pageSize"
        :total="total" layout="total, prev, pager, next" @current-change="fetchList" />
    </el-card>
    <UserForm v-if="userFormVisible" :user="currentUser" @close="userFormVisible = false; fetchList()" />
    <AssignRoleDialog :visible="assignRoleDialogVisible" :roleList="roleList" :selectedRoleId.sync="selectedRoleId"
      @close="assignRoleDialogVisible = false" @confirm="onAssignRoleConfirm" />
    <ActionPanel v-model="actionPanelVisible" :title="'操作面板'" @close="closeActionPanel">
      <template v-if="currentRow.deleted">
        <el-button size="mini" type="warning" @click="handleRestore(currentRow)">恢复</el-button>
      </template>
      <template v-else>
        <el-button v-if="hasEditPerm" size="mini" @click="showUserForm(currentRow)">编辑</el-button>
        <el-button v-if="hasDeletePerm" size="mini" type="danger" @click="handleLogicDelete(currentRow)">删除</el-button>
        <el-button size="mini" v-if="hasRealDeletePerm" type="danger" plain
          @click="handleRealDelete(currentRow)">彻底删除</el-button>
        <el-button v-if="hasAssignRolePerm" size="mini" @click="handleAssignRole(currentRow)">分配角色</el-button>
        <el-button size="mini" @click="handleResetPwd(currentRow)">重置密码</el-button>
      </template>
    </ActionPanel>
  </div>
</template>
<script>
import { fetchUserList, deleteUser, logicDeleteUser, realDeleteUser } from '@/api/modules/user'
import UserForm from './UserForm.vue'
import { fetchRoleList } from '@/api/modules/role'
import { assignUserRole } from '@/api/modules/user'
import AssignRoleDialog from './AssignRoleDialog.vue'
import ActionPanel from '@/components/ActionPanel.vue'
// 1. 导入 mapGetters 用于从 Vuex 获取权限
import { mapGetters } from 'vuex'

export default {
  name: 'UserList',
  components: { UserForm, AssignRoleDialog, ActionPanel },
  data() {
    return {
      userList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      search: '',
      userFormVisible: false,
      currentUser: null,
      assignRoleDialogVisible: false,
      currentUserForRole: null,
      roleList: [],
      selectedRoleId: null,
      // 2. 移除本地未使用的 userPerms 数组
      // userPerms: [],
      actionPanelVisible: false,
      currentRow: {}
    }
  },
  computed: {
    // 3. 从 Vuex store 获取用户权限
    ...mapGetters(['perms']),

    // 4. 修改权限判断逻辑，使用 || 替代 &&，并使用从 Vuex 获取的 perms
    hasAddPerm() {
      return this.perms.includes('manage:user:add') || this.perms.includes('manage:user:*')
    },
    hasEditPerm() {
      return this.perms.includes('manage:user:edit') || this.perms.includes('manage:user:*')
    },
    hasDeletePerm() {
      return this.perms.includes('manage:user:delete') || this.perms.includes('manage:user:*')
    },
    hasAssignRolePerm() {
      return this.perms.includes('manage:user:assignRole') || this.perms.includes('manage:user:*')
    },
    hasRealDeletePerm() {
      return this.perms.includes('delete_user_real')
    }
  },
  created() {
    // 保持原有的初始化逻辑
    this.fetchList()
  },
  methods: {
    async fetchList(page = 1) {
      this.page = page
      const res = await fetchUserList({ page, limit: this.pageSize, search: this.search })
      this.userList = (res.data.items || []).map(user => {
        if (user.roleNames) return user
        if (user.roles && Array.isArray(user.roles)) {
          user.roleNames = user.roles.join(', ')
        } else if (user.roleIds && this.roleList.length) {
          user.roleNames = user.roleIds.map(id => {
            const role = this.roleList.find(r => r.id === id)
            return role ? role.name : id
          }).join(', ')
        } else {
          user.roleNames = ''
        }
        return user
      })
      this.total = res.data.total || 0
    },
    showUserForm(user) {
      this.currentUser = user || null
      this.userFormVisible = true
    },
    async handleLogicDelete(row) {
      await this.$confirm(`确定要删除用户【${row.username}】吗？此操作可恢复。`, '提示', { type: 'warning' })
      await logicDeleteUser(row.id)
      this.$message.success('删除成功')
      this.fetchList()
    },
    async handleRealDelete(row) {
      await this.$confirm(`确定要彻底删除用户【${row.username}】吗？此操作不可恢复！`, '危险操作', { type: 'error', confirmButtonText: '彻底删除', cancelButtonText: '取消' })
      await realDeleteUser(row.id, this.userPerms.join(','))
      this.$message.success('彻底删除成功')
      this.fetchList()
    },
    async handleAssignRole(row) {
      this.currentUserForRole = row
      const res = await fetchRoleList({ page: 1, limit: 100 })
      this.roleList = res.data.items || []
      this.selectedRoleId = (row.roleIds && row.roleIds.length > 0) ? row.roleIds[0] : null
      this.assignRoleDialogVisible = true
    },
    async onAssignRoleConfirm(localSelectedRoleId) {
      await assignUserRole(
        { userId: this.currentUserForRole.id, roleId: localSelectedRoleId }
      )
      this.$message.success('分配成功')
      this.assignRoleDialogVisible = false
      this.fetchList()
    },
    handleResetPwd(row) {
      this.$message.info('TODO: 重置密码')
    },
    async handleRestore(row) {
      await this.$confirm(`确定要恢复用户【${row.username}】吗？`, '提示', { type: 'warning' })
      await this.restoreUser(row.id)
      this.$message.success('恢复成功')
      this.fetchList()
    },
    async restoreUser(userId) {
      return Promise.resolve()
    },
    openActionPanel(row) {
      this.currentRow = row
      this.actionPanelVisible = true
    },
    closeActionPanel() {
      this.actionPanelVisible = false
      this.currentRow = {}
    }
  }
}
</script>
