<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>分类管理</span>
        <div style="float:right;">
          <!-- 批量操作按钮 -->
          <template v-if="selectedIds.length > 0">
            <el-button size="small" type="success" @click="handleBatchRestore" v-if="activeTab === 'deleted'">批量恢复</el-button>
            <el-button size="small" type="danger" @click="handleBatchPhysicalDelete" v-if="activeTab === 'deleted'">批量彻底删除</el-button>
            <el-button size="small" type="danger" @click="handleBatchDelete" v-if="activeTab === 'normal'">批量删除</el-button>
            <el-button size="small" @click="handleCancelSelect">取消选择</el-button>
          </template>
          <el-button type="primary" size="small" style="margin-left: 10px;" @click="openDialog()" v-if="activeTab === 'normal'">新增分类</el-button>
        </div>
      </div>
      
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" type="card" @tab-click="handleTabChange" style="margin-bottom: 20px;">
        <el-tab-pane label="正常分类" name="normal" />
        <el-tab-pane label="已删除分类" name="deleted" />
      </el-tabs>

      <!-- 搜索组件 -->
      <HighlightSearch
        :data-list="categoryList"
        :search-fields="['name', 'description']"
        :display-fields="['name', 'description']"
        :field-labels="{ name: '分类名', description: '描述' }"
        placeholder="搜索分类名或描述"
        @select="handleSelectCategory"
        style="margin-bottom: 20px;"
      />

      <el-table :data="categoryList" style="width: 100%" border @selection-change="handleSelectionChange" ref="categoryTable">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createTime" label="创建时间">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间">
          <template slot-scope="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template slot-scope="scope">
            <!-- 正常分类的操作 -->
            <template v-if="activeTab === 'normal'">
              <el-button size="mini" @click="openActionPanel(scope.row)">操作</el-button>
              <el-button size="mini" type="primary" @click="viewBlogs(scope.row)">查看文章</el-button>
            </template>
            <!-- 已删除分类的操作 -->
            <template v-else>
              <el-button size="mini" type="success" @click="handleRestore(scope.row)">恢复</el-button>
              <el-button size="mini" type="danger" @click="handlePhysicalDelete(scope.row)">彻底删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 新增/编辑弹窗 -->
      <el-dialog :visible.sync="dialogVisible" :title="dialogTitle">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
          <el-form-item label="分类名" prop="name">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input v-model="form.description" />
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </div>
      </el-dialog>

      <!-- 操作面板（正常分类） -->
      <ActionPanel v-model="actionPanelVisible" :title="'操作面板'" @close="closeActionPanel">
        <el-button size="mini" @click="openDialog(currentRow)">编辑</el-button>
        <el-button size="mini" type="danger" @click="handleDelete(currentRow)">删除</el-button>
      </ActionPanel>

      <!-- 文章列表弹窗 -->
      <el-dialog :visible.sync="blogDialogVisible" title="该分类下的文章">
        <el-table :data="blogList" style="width: 100%" border>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="authorId" label="作者ID" />
          <el-table-column prop="createTime" label="创建时间">
            <template slot-scope="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
        </el-table>
        <div slot="footer">
          <el-button @click="blogDialogVisible = false">关闭</el-button>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>
<script>
import { getCategories, getDeletedCategories, createCategory, updateCategory, deleteCategory, restoreCategory, physicalDeleteCategory, batchDeleteCategories, batchRestoreCategories, batchPhysicalDeleteCategories } from '@/api/modules/category'
import dayjs from 'dayjs'
import ActionPanel from '@/components/ActionPanel.vue'
import { getBlogsByCategory } from '@/api/modules/relation/categoryBlogRelation'
import HighlightSearch from '@/components/HighlightSearch/index.vue'
export default {
  components: { ActionPanel, HighlightSearch },
  data() {
    return {
      activeTab: 'normal', // 'normal' | 'deleted'
      categoryList: [],
      dialogVisible: false,
      dialogTitle: '新增分类',
      form: { id: null, name: '', description: '' },
      rules: {
        name: [{ required: true, message: '请输入分类名', trigger: 'blur' }]
      },
      actionPanelVisible: false,
      currentRow: {},
      blogDialogVisible: false,
      blogList: [],
      selectedIds: [] // 批量选择的分类ID列表
    }
  },
  created() {
    this.fetchCategories()
  },
  methods: {
    // 获取分类列表（根据当前标签页）
    async fetchCategories() {
      let res
      if (this.activeTab === 'normal') {
        res = await getCategories()
      } else {
        res = await getDeletedCategories()
      }
      this.categoryList = res.data || []
    },
    // 标签页切换处理
    handleTabChange() {
      this.fetchCategories()
    },
    // 搜索选择分类
    handleSelectCategory(category) {
      this.$message.info(`已选择分类: ${category.name}`)
      // 可以在这里添加更多处理逻辑，比如跳转到详情页或编辑弹窗
      this.openDialog(category)
    },
    // 打开弹窗（新增/编辑）
    openDialog(row) {
      if (row) {
        this.dialogTitle = '编辑分类'
        this.form = { ...row }
      } else {
        this.dialogTitle = '新增分类'
        this.form = { id: null, name: '', description: '' }
      }
      this.dialogVisible = true
    },
    // 保存分类
    async handleSave() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return
        let res
        if (this.form.id) {
          res = await updateCategory(this.form)
        } else {
          res = await createCategory(this.form)
        }
        if (res.code === 200) {
          this.dialogVisible = false
          this.$message.success('保存成功')
          this.fetchCategories()
        } else {
          this.$message.error({ message: res.message || '保存失败', duration: 3000 })
        }
      })
    },
    // 逻辑删除分类
    async handleDelete(row) {
      this.$confirm('确定要删除该分类吗？删除后可在"已删除分类"中恢复。', '提示', { type: 'warning' }).then(async () => {
        const res = await deleteCategory(row.id)
        if (res.code === 200) {
          this.$message.success('删除成功')
          this.fetchCategories()
          this.closeActionPanel()
        } else {
          this.$message.error({ message: res.message || '删除失败', duration: 3000 })
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    // 恢复已删除分类
    async handleRestore(row) {
      this.$confirm('确定要恢复该分类吗？', '提示', { type: 'info' }).then(async () => {
        const res = await restoreCategory(row.id)
        if (res.code === 200) {
          this.$message.success('恢复成功')
          this.fetchCategories()
        } else {
          this.$message.error({ message: res.message || '恢复失败', duration: 3000 })
        }
      }).catch(() => {
        this.$message.info('已取消恢复')
      })
    },
    // 物理删除分类（彻底删除）
    async handlePhysicalDelete(row) {
      this.$confirm('确定要彻底删除该分类吗？此操作不可恢复！', '警告', { 
        type: 'error',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }).then(async () => {
        const res = await physicalDeleteCategory(row.id)
        if (res.code === 200) {
          this.$message.success('彻底删除成功')
          this.fetchCategories()
        } else {
          this.$message.error({ message: res.message || '删除失败', duration: 3000 })
        }
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    // 格式化日期
    formatDate(val) {
      return val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
    },
    // 打开操作面板
    openActionPanel(row) {
      this.currentRow = row
      this.actionPanelVisible = true
    },
    // 关闭操作面板
    closeActionPanel() {
      this.actionPanelVisible = false
      this.currentRow = {}
    },
    // 查看分类下的文章
    async viewBlogs(row) {
      const res = await getBlogsByCategory(row.id)
      this.blogList = res.data || []
      this.blogDialogVisible = true
    },
    // 表格选择事件
    handleSelectionChange(val) {
      this.selectedIds = val.map(item => item.id)
    },
    // 取消选择
    handleCancelSelect() {
      this.selectedIds = []
      // 清除表格选中状态
      this.$refs.categoryTable && this.$refs.categoryTable.clearSelection()
    },
    // 批量逻辑删除分类
    async handleBatchDelete() {
      this.$confirm(`确定要删除选中的 ${this.selectedIds.length} 个分类吗？删除后可在"已删除分类"中恢复。`, '提示', { type: 'warning' }).then(async () => {
        const res = await batchDeleteCategories(this.selectedIds)
        if (res.code === 200) {
          this.$message.success('批量删除成功')
          this.fetchCategories()
          this.selectedIds = []
        } else {
          this.$message.error({ message: res.message || '批量删除失败', duration: 3000 })
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    // 批量恢复已删除分类
    async handleBatchRestore() {
      this.$confirm(`确定要恢复选中的 ${this.selectedIds.length} 个分类吗？`, '提示', { type: 'info' }).then(async () => {
        const res = await batchRestoreCategories(this.selectedIds)
        if (res.code === 200) {
          this.$message.success('批量恢复成功')
          this.fetchCategories()
          this.selectedIds = []
        } else {
          this.$message.error({ message: res.message || '批量恢复失败', duration: 3000 })
        }
      }).catch(() => {
        this.$message.info('已取消恢复')
      })
    },
    // 批量物理删除分类（彻底删除）
    async handleBatchPhysicalDelete() {
      this.$confirm(`确定要彻底删除选中的 ${this.selectedIds.length} 个分类吗？此操作不可恢复！`, '警告', { 
        type: 'error',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }).then(async () => {
        const res = await batchPhysicalDeleteCategories(this.selectedIds)
        if (res.code === 200) {
          this.$message.success('批量彻底删除成功')
          this.fetchCategories()
          this.selectedIds = []
        } else {
          this.$message.error({ message: res.message || '批量删除失败', duration: 3000 })
        }
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    }
  }
}
</script>
<style scoped>
.app-container {
  padding: 20px;
}
</style>
