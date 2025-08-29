<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>标签管理</span>
        <el-button type="primary" size="small" style="float:right;" @click="openDialog()">新增标签</el-button>
      </div>
      <el-table :data="tagList" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="标签名" />
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
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button size="mini" @click="openActionPanel(scope.row)">操作</el-button>
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
    </el-card>
  </div>
</template>
<script>
import { getTags } from '@/api/modules/tag'
import request from '@/utils/request'
import dayjs from 'dayjs'
import ActionPanel from '@/components/ActionPanel.vue'
export default {
  components: { ActionPanel },
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
      currentRow: {}
    }
  },
  created() {
    this.fetchTags()
  },
  methods: {
    async fetchTags() {
      const res = await getTags()
      this.tagList = res.data || []
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
          res = await request({ url: '/v1/tag', method: 'put', data: this.form })
        } else {
          res = await request({ url: '/v1/tag', method: 'post', data: this.form })
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
        const res = await request({ url: `/v1/tag/${row.id}`, method: 'delete' })
        if (res.code === 200) {
          this.$message.success('删除成功')
          this.fetchTags()
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
    }
  }
}
</script>
<style scoped>
.app-container {
  padding: 20px;
}
</style>
