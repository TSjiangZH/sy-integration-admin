<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>标签管理</span>
        <div style="float:right;">
          <el-button type="primary" size="small" @click="openDialog()">新增标签</el-button>
          <el-button type="danger" size="small" v-if="selectedIds.length > 0 && activeTab === 'normal'" @click="handleBatchDelete">批量删除</el-button>
          <el-button type="success" size="small" v-if="selectedIds.length > 0 && activeTab === 'deleted'" @click="handleBatchRestore">批量恢复</el-button>
          <el-button type="danger" size="small" v-if="selectedIds.length > 0 && activeTab === 'deleted'" @click="handleBatchPhysicalDelete">批量彻底删除</el-button>
          <el-button size="small" v-if="selectedIds.length > 0" @click="handleCancelSelect">取消选择</el-button>
        </div>
      </div>
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane label="正常标签" name="normal"></el-tab-pane>
        <el-tab-pane label="已删除标签" name="deleted"></el-tab-pane>
      </el-tabs>

      <!-- 搜索组件 -->
      <HighlightSearch
        :data-list="tagList"
        :search-fields="['name', 'description']"
        :display-fields="['name', 'description']"
        :field-labels="{ name: '标签名', description: '描述' }"
        placeholder="搜索标签名或描述"
        @select="handleSelectTag"
        style="margin-bottom: 20px;"
      />

      <el-table :data="tagList" style="width: 100%" border ref="tagTable" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="标签名" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="count" label="关联文章数" width="120" />
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
        <el-table-column label="操作" width="200">
          <template slot-scope="scope">
            <el-button size="mini" @click="openDialog(scope.row)">编辑</el-button>
            <el-button size="mini" type="primary" v-if="activeTab === 'normal'" @click="viewBlogs(scope.row)">查看文章</el-button>
            <el-button size="mini" type="danger" v-if="activeTab === 'normal'" @click="handleDelete(scope.row)">删除</el-button>
            <el-button size="mini" type="success" v-if="activeTab === 'deleted'" @click="handleRestore(scope.row)">恢复</el-button>
            <el-button size="mini" type="danger" v-if="activeTab === 'deleted'" @click="handlePhysicalDelete(scope.row)">彻底删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-dialog :visible.sync="dialogVisible" :title="dialogTitle">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
          <el-form-item label="标签名" prop="name">
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
      <ActionPanel v-model="actionPanelVisible" :title="'操作面板'" @close="closeActionPanel">
        <el-button size="mini" @click="openDialog(currentRow)">编辑</el-button>
        <el-button size="mini" type="danger" @click="handleDelete(currentRow)">删除</el-button>
      </ActionPanel>

      <!-- 博客列表弹窗 -->
      <el-dialog :visible.sync="blogDialogVisible" title="该标签下的文章" width="800px">
        <el-table :data="blogList" style="width: 100%" border>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="authorName" label="作者" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === 'PUBLISHED' ? 'success' : 'warning'">
                {{ scope.row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="viewCount" label="阅读量" width="100" />
          <el-table-column prop="createTime" label="创建时间">
            <template slot-scope="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>
    </el-card>
  </div>
</template>
<script>
import { getTags, getDeletedTags, createTag, updateTag, deleteTag, restoreTag, physicalDeleteTag, batchDeleteTags, batchRestoreTags, batchPhysicalDeleteTags, getBlogsByTag } from '@/api/modules/tag'
import dayjs from 'dayjs'
import ActionPanel from '@/components/ActionPanel.vue'
import HighlightSearch from '@/components/HighlightSearch/index.vue'
export default {
  components: { ActionPanel, HighlightSearch },
  data() {
    return {
      tagList: [],
      dialogVisible: false,
      dialogTitle: '新增标签',
      form: { id: null, name: '', description: '' },
      rules: {
        name: [{ required: true, message: '请输入标签名', trigger: 'blur' }]
      },
      actionPanelVisible: false,
      currentRow: {},
      activeTab: 'normal',
      selectedIds: [],
      blogDialogVisible: false,
      blogList: []
    }
  },
  created() {
    this.fetchTags()
  },
  methods: {
    async fetchTags() {
      const res = this.activeTab === 'normal' ? await getTags() : await getDeletedTags()
      this.tagList = res.data || []
    },
    // 查看该标签下的博客列表
    async viewBlogs(row) {
      this.blogDialogVisible = true
      const res = await getBlogsByTag(row.id)
      this.blogList = res.data || []
    },
    handleTabChange() {
      this.selectedIds = []
      this.fetchTags()
    },
    // 搜索选择标签
    handleSelectTag(tag) {
      this.$message.info(`已选择标签: ${tag.name}`)
      // 可以在这里添加更多处理逻辑，比如跳转到详情页或编辑弹窗
      this.openDialog(tag)
    },
    openDialog(row) {
      if (row) {
        this.dialogTitle = '编辑标签'
        this.form = { ...row }
      } else {
        this.dialogTitle = '新增标签'
        this.form = { id: null, name: '', description: '' }
      }
      this.dialogVisible = true
    },
    async handleSave() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return
        let res
        if (this.form.id) {
          res = await updateTag(this.form)
        } else {
          res = await createTag(this.form)
        }
        if (res.code === 200) {
          this.$message.success('保存成功')
          this.dialogVisible = false
          this.fetchTags()
        } else {
          this.$message.error({ message: res.message || '保存失败', duration: 3000 })
        }
      })
    },
    async handleDelete(row) {
      this.$confirm('确定要删除该标签吗？', '提示', { type: 'warning' }).then(async () => {
        const res = await deleteTag(row.id)
        if (res.code === 200) {
          this.$message.success('删除成功')
          this.fetchTags()
        } else {
          this.$message.error({ message: res.message || '删除失败', duration: 3000 })
        }
      })
    },
    async handleRestore(row) {
      this.$confirm('确定要恢复该标签吗？', '提示', { type: 'warning' }).then(async () => {
        const res = await restoreTag(row.id)
        if (res.code === 200) {
          this.$message.success('恢复成功')
          this.fetchTags()
        } else {
          this.$message.error({ message: res.message || '恢复失败', duration: 3000 })
        }
      })
    },
    async handlePhysicalDelete(row) {
      this.$confirm('确定要彻底删除该标签吗？此操作不可恢复！', '提示', { type: 'danger' }).then(async () => {
        const res = await physicalDeleteTag(row.id)
        if (res.code === 200) {
          this.$message.success('彻底删除成功')
          this.fetchTags()
        } else {
          this.$message.error({ message: res.message || '彻底删除失败', duration: 3000 })
        }
      })
    },
    handleSelectionChange(val) {
      this.selectedIds = val.map(item => item.id)
    },
    handleCancelSelect() {
      this.$refs.tagTable.clearSelection()
      this.selectedIds = []
    },
    async handleBatchDelete() {
      this.$confirm(`确定要删除选中的${this.selectedIds.length}个标签吗？`, '提示', { type: 'warning' }).then(async () => {
        const res = await batchDeleteTags(this.selectedIds)
        if (res.code === 200) {
          this.$message.success('批量删除成功')
          this.handleCancelSelect()
          this.fetchTags()
        } else {
          this.$message.error({ message: res.message || '批量删除失败', duration: 3000 })
        }
      })
    },
    async handleBatchRestore() {
      this.$confirm(`确定要恢复选中的${this.selectedIds.length}个标签吗？`, '提示', { type: 'warning' }).then(async () => {
        const res = await batchRestoreTags(this.selectedIds)
        if (res.code === 200) {
          this.$message.success('批量恢复成功')
          this.handleCancelSelect()
          this.fetchTags()
        } else {
          this.$message.error({ message: res.message || '批量恢复失败', duration: 3000 })
        }
      })
    },
    async handleBatchPhysicalDelete() {
      this.$confirm(`确定要彻底删除选中的${this.selectedIds.length}个标签吗？此操作不可恢复！`, '提示', { type: 'danger' }).then(async () => {
        const res = await batchPhysicalDeleteTags(this.selectedIds)
        if (res.code === 200) {
          this.$message.success('批量彻底删除成功')
          this.handleCancelSelect()
          this.fetchTags()
        } else {
          this.$message.error({ message: res.message || '批量彻底删除失败', duration: 3000 })
        }
      })
    },
    formatDate(val) {
      return val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : ''
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
<style scoped>
.app-container {
  padding: 20px;
}
</style>
