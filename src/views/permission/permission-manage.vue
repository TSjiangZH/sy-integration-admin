<template>
  <div class="app-container">
    <el-card shadow="hover" style="border-radius: 12px;">
      <div slot="header" class="card-header">
        <span class="header-title">权限管理</span>
        <div class="button-group">
          <el-input
            v-model="searchPermission"
            placeholder="搜索权限"
            size="small"
            prefix-icon="el-icon-search"
            style="width: 200px; margin-right: 15px;"
            @input="handleSearch"
            clearable
          />
          <el-button type="primary" @click="handleAddPermission" icon="el-icon-plus">新增权限</el-button>
        </div>
      </div>

      <el-collapse v-model="activeNames" accordion style="margin-top: 15px;">
        <el-collapse-item
          v-for="permission in filteredPermissions"
          :key="permission.id"
          :title="permission.name"
          :name="permission.id"
        >
            <div class="permission-details">
              <div class="permission-item">
                <span class="label">ID:</span>
                <span class="value">{{ permission.id }}</span>
              </div>
              <div class="permission-item">
                <span class="label">权限编码:</span>
                <span class="value">{{ permission.code }}</span>
              </div>
              <div class="permission-item">
                <span class="label">上级权限:</span>
                <span class="value">{{ permission.parentCode || 'ROOT_PERMISSION' }}</span>
              </div>
              <div class="permission-item">
                <span class="label">描述:</span>
                <span class="value">{{ permission.description || '无' }}</span>
              </div>
              <div class="permission-item">
                <span class="label">创建时间:</span>
                <span class="value">{{ permission.createTime }}</span>
              </div>
              <div class="permission-actions">
                <el-button size="mini" type="primary" icon="el-icon-edit" @click="handleEdit(permission)">编辑</el-button>
                <el-button size="mini" type="danger" icon="el-icon-delete" @click="handleDelete(permission)">删除</el-button>
              </div>
            </div>

          <!-- 子权限 -->
          <div v-if="permission.children && permission.children.length > 0" class="child-permissions">
            <el-collapse v-model="childActiveNames[permission.id]" accordion>
              <el-collapse-item
                v-for="child in permission.children"
                :key="child.id"
                :title="child.name"
                :name="child.id"
              >
                <div class="permission-details child">
                  <div class="permission-item">
                    <span class="label">ID:</span>
                    <span class="value">{{ child.id }}</span>
                  </div>
                  <div class="permission-item">
                    <span class="label">权限编码:</span>
                    <span class="value">{{ child.code }}</span>
                  </div>
                    <div class="permission-item">
                      <span class="label">上级权限:</span>
                      <span class="value">{{ child.parentCode || 'ROOT_PERMISSION' }}</span>
                    </div>
                    <div class="permission-item">
                      <span class="label">描述:</span>
                      <span class="value">{{ child.description || '无' }}</span>
                    </div>
                    <div class="permission-item">
                      <span class="label">创建时间:</span>
                      <span class="value">{{ child.createTime }}</span>
                    </div>
                    <div class="permission-actions">
                      <el-button size="mini" type="primary" icon="el-icon-edit" @click="handleEdit(child)">编辑</el-button>
                      <el-button size="mini" type="danger" icon="el-icon-delete" @click="handleDelete(child)">删除</el-button>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-dialog :visible.sync="dialogVisible" :title="dialogType==='edit'?'编辑权限':'新增权限'" width="500px" :close-on-click-modal="false">
      <el-form :model="permission" :rules="permissionRules" ref="permissionForm" label-width="100px" label-position="left">
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permission.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="permission.code" placeholder="请输入权限编码" />
        </el-form-item>
        <el-form-item label="上级权限" prop="parentId">
          <el-select v-model="permission.parentId" placeholder="请选择上级权限">
            <el-option :value="0" label="根权限"></el-option>
            <el-option v-for="item in permissionsList" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="permission.description"
            :autosize="{ minRows: 3, maxRows: 5}"
            type="textarea"
            placeholder="请输入权限描述"
          />
        </el-form-item>
      </el-form>
      <div style="text-align:right; margin-top: 20px;">
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmPermission">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { deepClone } from '@/utils'
import { getPermissions, addPermission, deletePermission, updatePermission } from '@/api/modules/permission'

const defaultPermission = {
  id: '',
  name: '',
  code: '',
  description: '',
  parentId: 0
}

export default {
  data() {
    return {
      permission: Object.assign({}, defaultPermission),
      permissionsList: [],
      allPermissions: [],
      filteredPermissions: [],
      searchPermission: '',
      dialogVisible: false,
      dialogType: 'new',
      activeNames: [], // 控制一级折叠面板展开/收起状态
      childActiveNames: {}, // 控制二级折叠面板展开/收起状态
      permissionRules: {
        name: [
          { required: true, message: '请输入权限名称', trigger: 'blur' },
          { min: 2, max: 50, message: '权限名称长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入权限编码', trigger: 'blur' },
          //{ pattern: /^[a-zA-Z0-9_:]+$/, message: '权限编码只能包含字母、数字、下划线和冒号', trigger: 'blur' },
          { min: 2, max: 50, message: '权限编码长度在 2 到 50 个字符', trigger: 'blur' },
        ],
        description: [
          { max: 200, message: '权限描述不能超过 200 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getPermissions()
  },
  methods: {
    // 获取权限列表
    async getPermissions() {
      try {
        const res = await getPermissions()
        this.allPermissions = res.data
        this.permissionsList = res.data
        // 格式化权限为树形结构
        this.filteredPermissions = this.formatPermissions(this.allPermissions)
        // 添加父权限名称
        this.addParentNames()
        // 默认展开第一个权限组
        if (this.filteredPermissions.length > 0) {
          this.activeNames = [this.filteredPermissions[0].id]
        }
      } catch (error) {
        this.$message.error('获取权限列表失败: ' + (error.message || '未知错误'))
      }
    },
    // 格式化权限为树形结构
    formatPermissions(permissions) {
      const permissionMap = {}
      const tree = []

      // 先将所有权限放入映射表
      permissions.forEach(perm => {
        permissionMap[perm.id] = { ...perm, children: [] }
      })

      // 构建树形结构
      permissions.forEach(perm => {
        if (perm.parentId === 0) {
          // 根权限直接放入树中
          tree.push(permissionMap[perm.id])
        } else if (permissionMap[perm.parentId]) {
          // 子权限添加到父权限的children中
          permissionMap[perm.parentId].children.push(permissionMap[perm.id])
        }
      })

      return tree
    },

    // 添加父权限名称
    addParentNames() {
      const permissionMap = {}
      this.allPermissions.forEach(perm => {
        permissionMap[perm.id] = perm.code
      })

      this.filteredPermissions.forEach(perm => {
        if (perm.parentId !== 0 && permissionMap[perm.parentId]) {
          perm.parentCode = permissionMap[perm.parentId]
        } else {
          perm.parentCode = ''
        }
      })
    },
    // 搜索权限
    handleSearch() {
      let filtered = this.allPermissions
      if (this.searchPermission) {
        const searchStr = this.searchPermission.toLowerCase()
        filtered = this.allPermissions.filter(perm =>
          perm.name.toLowerCase().includes(searchStr) ||
          perm.code.toLowerCase().includes(searchStr) ||
          (perm.description && perm.description.toLowerCase().includes(searchStr))
        )
      }
      this.filteredPermissions = filtered
      this.addParentNames()
      // 搜索后默认展开第一个结果
      if (this.filteredPermissions.length > 0) {
        this.activeNames = [this.filteredPermissions[0].id]
      }
    },
    // 新增权限
    handleAddPermission() {
      this.permission = Object.assign({}, defaultPermission)
      this.dialogType = 'new'
      // 重置表单验证
      if (this.$refs.permissionForm) {
        this.$refs.permissionForm.resetFields()
      }
      this.dialogVisible = true
    },
    // 编辑权限
    handleEdit(data) {
      this.dialogType = 'edit'
      this.permission = deepClone(data)
      // 重置表单验证
      if (this.$refs.permissionForm) {
        this.$refs.permissionForm.resetFields()
      }
      this.dialogVisible = true
    },
    // 删除权限
    handleDelete(data) {
      this.$confirm('确定要删除该权限吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async() => {
          try {
            await deletePermission(data.id)
            // 重新获取权限列表
            this.getPermissions()
            this.$message({
              type: 'success',
              message: '删除成功!'
            })
          } catch (error) {
            this.$message.error('删除失败: ' + (error.message || '未知错误'))
          }
        })
        .catch(() => {})
    },
    // 确认权限操作
    async confirmPermission() {
      // 表单验证
      this.$refs.permissionForm.validate(async(valid) => {
        if (valid) {
          try {
            const isEdit = this.dialogType === 'edit'

            if (isEdit) {
              await updatePermission(this.permission.id, this.permission)
            } else {
              await addPermission(this.permission)
            }
            // 重新获取权限列表
            this.getPermissions()

            const { description, code, name } = this.permission
            this.dialogVisible = false
            this.$notify({
              title: '成功',
              dangerouslyUseHTMLString: true,
              message: `
                  <div>权限编码: ${code}</div>
                  <div>权限名称: ${name}</div>
                  <div>描述: ${description || '无'}</div>
                `,
              type: 'success'
            })
          } catch (error) {
            this.$message.error('操作失败: ' + (error.message || '未知错误'))
          }
        }
      })
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

/* 折叠面板样式 */
.permission-details {
  padding: 15px;
  background-color: #f9fafc;
  border-radius: 8px;
  margin-top: 10px;
}

.child-permissions {
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px dashed #e6e6e6;
}

.permission-details.child {
  background-color: #f0f5ff;
}

.permission-item {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.permission-item:last-child {
  margin-bottom: 0;
}

.label {
  width: 100px;
  font-weight: 500;
  color: #666;
  text-align: right;
  padding-right: 15px;
}

.value {
  flex: 1;
  color: #333;
  word-break: break-word;
}

.permission-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .permission-item {
    flex-direction: column;
  }

  .label {
    width: auto;
    text-align: left;
    padding-right: 0;
    margin-bottom: 5px;
  }
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
  ::v-deep .el-table .el-table__column {
    padding: 0 8px;
  }
}

@media (max-width: 992px) {
  ::v-deep .el-table {
    font-size: 13px;
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
    width: 120px !important;
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
}
</style>
::v-deep .custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 6px 0;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.node-name {
  font-weight: 500;
}

.node-code {
  color: #666;
  font-size: 12px;
  background-color: #f0f5ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.node-desc {
  color: #999;
  font-size: 12px;
  background-color: #f9fafc;
  padding: 2px 6px;
  border-radius: 4px;
}

.node-operations {
  margin-left: 15px;
  display: flex;
  gap: 8px;
}

/* 对话框样式 */
.el-dialog__header {
  background-color: #f7f9fc;
  padding: 15px 20px;
  border-bottom: 1px solid #e6e6e6;
}

.el-dialog__title {
  font-size: 16px;
  font-weight: 600;
}

.el-form-item {
  margin-bottom: 20px;
}

/* 响应式设计 */
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

  .custom-tree-node {
    flex-direction: column;
    align-items: flex-start;
  }

  .node-operations {
    margin-top: 5px;
  }
}
