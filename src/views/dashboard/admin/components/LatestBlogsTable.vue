<template>
  <el-card shadow="hover">
    <div class="chart-title">{{ title }}</div>
    <el-table :data="blogs" size="mini" border>
      <el-table-column prop="title" label="标题" align="center" />
      <el-table-column prop="createTime" label="时间" :formatter="formatDate" align="center" />
      <el-table-column prop="status" label="状态" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ scope.row.status === 1 ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="right" width="100">
        <template slot-scope="scope">
          <el-button size="mini" type="primary" @click="handleEdit(scope.row.id)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script>
import dayjs from 'dayjs'

export default {
  name: 'LatestBlogsTable',
  props: {
    title: {
      type: String,
      default: '最新博客'
    },
    blogs: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  methods: {
    formatDate(row, column, cellValue) {
      return cellValue && dayjs(cellValue).isValid() 
        ? dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss') 
        : ''
    },
    handleEdit(id) {
      this.$emit('edit', id)
    }
  }
}
</script>

<style scoped>
.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}
.el-table th, .el-table td {
  font-size: 14px;
}
</style>