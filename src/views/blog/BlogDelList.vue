<template>
  <div class="blog-del-list">
    <div class="search-bar">
      <el-button type="primary" icon="el-icon-arrow-left" @click="goBack">返回博客列表</el-button>
      <el-button 
        type="danger" 
        icon="el-icon-delete" 
        @click="handleBatchPhysicalDelete"
        :disabled="selectedIds.length === 0"
        style="margin-left: 10px;"
      >
        批量物理删除
      </el-button>
    </div>
    <el-card shadow="never" class="list-card">
      <el-table
        :data="blogList"
        border
        fit
        highlight-current-row
        @selection-change="handleSelectionChange"
        @row-dblclick="showRowDetail"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="标题" prop="title" min-width="200">
          <template slot-scope="scope">
            <span class="title-text">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="作者" prop="authorName" width="100" />
        <el-table-column label="分类" prop="categoryName" width="120" />
        <el-table-column label="浏览量" prop="viewCount" width="80" />
        <el-table-column label="评论数" prop="commentCount" width="80" />
        <el-table-column label="删除时间" prop="updateTime" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template slot-scope="scope">
            <el-button size="mini" type="success" @click="handleRecover(scope.row.id)" style="margin-right: 8px;">
              恢复
            </el-button>
            <el-button size="mini" type="danger" @click="handlePhysicalDelete(scope.row.id)">
              物理删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        style="margin-top: 16px; text-align: right;"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchList"
      />
    </el-card>
  </div>
</template>
<script>
import { fetchDeletedBlogList, physicalDeleteBlog, batchPhysicalDeleteBlogs, recoverBlog } from '@/api/modules/blog'
import dayjs from 'dayjs'
export default {
  name: 'BlogDelList',
  data() {
    return {
      blogList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      selectedIds: []
    }
  },
  created() {
    this.fetchList()
  },
  methods: {
    goBack() {
      this.$router.push({ name: 'BlogList' })
    },
    async fetchList(page = 1) {
      try {
        this.page = page
        const res = await fetchDeletedBlogList({ page, pageSize: this.pageSize })
        this.blogList = res.data.items || []
        this.total = res.data.total || 0
      } catch (e) {
        this.$message.error('加载失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    formatDate(date) {
      if (!date) return '-'
      return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    async handleRecover(id) {
      try {
        await this.$confirm('确定要恢复该博客吗？', '提示', { 
          type: 'info',
          confirmButtonText: '确定恢复',
          cancelButtonText: '取消'
        })
        await recoverBlog(id)
        this.$message.success('恢复成功')
        this.fetchList(this.page)
      } catch (e) {
        if (e !== 'cancel') {
          this.$message.error('恢复失败：' + (e && e.message ? e.message : '未知错误'))
        }
      }
    },
    async handlePhysicalDelete(id) {
      try {
        await this.$confirm('确定要物理删除该博客吗？此操作不可恢复！', '警告', { 
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消'
        })
        await physicalDeleteBlog(id)
        this.$message.success('物理删除成功')
        this.fetchList(this.page)
      } catch (e) {
        if (e !== 'cancel') {
          this.$message.error('删除失败：' + (e && e.message ? e.message : '未知错误'))
        }
      }
    },
    async handleBatchPhysicalDelete() {
      try {
        await this.$confirm(`确定要物理删除选中的 ${this.selectedIds.length} 篇博客吗？此操作不可恢复！`, '警告', { 
          type: 'warning',
          confirmButtonText: '确定删除',
          cancelButtonText: '取消'
        })
        await batchPhysicalDeleteBlogs(this.selectedIds)
        this.$message.success('批量物理删除成功')
        this.selectedIds = []
        this.fetchList(this.page)
      } catch (e) {
        if (e !== 'cancel') {
          this.$message.error('删除失败：' + (e && e.message ? e.message : '未知错误'))
        }
      }
    },
    handleSelectionChange(val) {
      this.selectedIds = val.map(item => item.id)
    },
    showRowDetail(row) {
      this.$message.info(`博客ID: ${row.id}, 标题: ${row.title}`)
    }
  }
}
</script>
<style scoped>
.blog-del-list {
  padding: 20px;
}
.search-bar {
  margin-bottom: 20px;
}
.list-card {
  min-height: 400px;
}
.title-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>