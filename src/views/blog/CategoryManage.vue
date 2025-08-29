<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>分类管理</span>
        <el-button type="primary" size="small" style="float:right;" @click="openDialog()">新增分类</el-button>
      </div>
      <el-table :data="categoryList" style="width: 100%" border>
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
        <el-table-column label="操作" width="180">
          <template slot-scope="scope">
            <el-button size="mini" @click="openActionPanel(scope.row)">操作</el-button>
            <el-button size="mini" type="primary" @click="viewBlogs(scope.row)">查看文章</el-button>
          </template>
        </el-table-column>
      </el-table>
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
      <ActionPanel v-model="actionPanelVisible" :title="'操作面板'" @close="closeActionPanel">
        <el-button size="mini" @click="openDialog(currentRow)">编辑</el-button>
        <el-button size="mini" type="danger" @click="handleDelete(currentRow)">删除</el-button>
      </ActionPanel>
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
import { getCategories } from '@/api/modules/category'
import request from '@/utils/request'
import dayjs from 'dayjs'
import ActionPanel from '@/components/ActionPanel.vue'
import { getBlogsByCategory } from '@/api/modules/relation/categoryBlogRelation'
export default {
  components: { ActionPanel },
  data() {
    return {
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
      blogList: []
    }
  },
  created() {
    this.fetchCategories()
  },
  methods: {
    async fetchCategories() {
      const res = await getCategories()
      this.categoryList = res.data || []
    },
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
    async handleSave() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) return
        let res
        if (this.form.id) {
          res = await request({ url: '/v1/category', method: 'put', data: this.form })
        } else {
          res = await request({ url: '/v1/category', method: 'post', data: this.form })
        }
        if (res.code === 200) {
          this.$message.success('保存成功')
          this.dialogVisible = false
          this.fetchCategories()
        } else {
          this.$message.error({ message: res.message || '保存失败', duration: 3000 })
        }
      })
    },
    async handleDelete(row) {
      this.$confirm('确定要删除该分类吗？', '提示', { type: 'warning' }).then(async () => {
        const res = await request({ url: `/v1/category/delete/${row.id}`, method: 'delete' })
        if (res.code === 200) {
          this.$message.success('删除成功')
          this.fetchCategories()
        } else {
          this.$message.error({ message: res.message || '删除失败', duration: 3000 })
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
    },
    async viewBlogs(row) {
      const res = await getBlogsByCategory(row.id)
      this.blogList = res.data || []
      this.blogDialogVisible = true
    }
  }
}
</script>
<style scoped>
.app-container {
  padding: 20px;
}
</style>
