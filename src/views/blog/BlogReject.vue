<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>未通过审核博客管理</span>
        <el-select v-model="orderField" size="small" style="width: 140px; margin-left: 16px;" @change="handleSortChange">
          <el-option label="ID" value="id" />
          <el-option label="提交时间" value="create_time" />
          <el-option label="更新时间" value="update_time" />
        </el-select>
        <el-button size="small" style="margin-left: 8px;" @click="toggleOrderType">
          {{ orderType === 'desc' ? '降序' : '升序' }}
        </el-button>
      </div>

      <HighlightSearch
        :data-list="rejectList"
        :search-fields="['title', 'summary', 'author', 'category.name']"
        :display-fields="['title', 'author', 'category.name']"
        :field-labels="{ title: '标题', author: '作者', 'category.name': '分类' }"
        placeholder="搜索博客标题、摘要、作者或分类"
        @select="handleSelectBlog"
        style="margin-bottom: 20px;"
      />

      <el-table :data="rejectList" style="width: 100%" border stripe size="small">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="title" label="标题" min-width="120" />
        <el-table-column prop="cover" label="封面" width="100" align="center">
          <template slot-scope="scope">
            <img v-if="scope.row.cover" :src="scope.row.cover" style="width:60px;height:40px;object-fit:cover;" >
          </template>
        </el-table-column>
        <el-table-column prop="summary" label="摘要/描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="author" label="作者" width="100" align="center" />
        <el-table-column prop="category" label="分类" min-width="100">
          <template slot-scope="scope">
            {{ scope.row.category ? scope.row.category.name : '' }}
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" min-width="120">
          <template slot-scope="scope">
            <el-tag
              v-for="tag in (scope.row.tags || [])"
              :key="tag.id || tag"
              size="mini"
              style="margin-right: 4px;"
            >
              {{ tag.name || tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewMessage" label="未通过原因" min-width="200" show-overflow-tooltip>
          <template slot-scope="scope">
            <el-tag type="danger" size="mini">{{ scope.row.reviewMessage || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="180" align="center">
          <template slot-scope="scope">
            {{ formatBlogDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="reviewTime" label="审核时间" width="180" align="center">
          <template slot-scope="scope">
            {{ formatBlogDate(scope.row.reviewTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" @click="goView(scope.row.id)">预览</el-button>
            <el-button size="mini" @click="goEdit(scope.row.id)">重新编辑</el-button>
            <el-button size="mini" type="success" @click="handleSubmitReview(scope.row.id)">重新提交</el-button>
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
import { fetchRejectList, submitReview } from '@/api/modules/blog'
import { formatBlogDate } from '@/utils/blog'
import HighlightSearch from '@/components/HighlightSearch/index.vue'
export default {
  components: {
    HighlightSearch
  },
  data() {
    return {
      rejectList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      orderField: 'id',
      orderType: 'desc'
    }
  },
  created() {
    this.fetchList()
  },
  methods: {
    formatBlogDate,
    async fetchList(page = 1) {
      try {
        this.page = page
        const res = await fetchRejectList({ page, pageSize: this.pageSize, orderField: this.orderField, orderType: this.orderType })
        const items = (res.data.items || []).map(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags = item.tags.map(tag => ({ ...tag, count: tag.count == null ? 0 : tag.count }))
          }
          if (item.category) {
            item.category.count = item.category.count == null ? 0 : item.category.count
          }
          return item
        })
        this.rejectList = items
        this.total = res.data.total || 0
      } catch (e) {
        this.$message.error('加载失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    goView(id) {
      this.$router.push({ name: 'BlogView', params: { id }})
    },
    goEdit(id) {
      if (id) {
        this.$router.push({ name: 'BlogEdit', params: { id }})
      } else {
        this.$router.push({ name: 'BlogEdit' })
      }
    },
    async handleSubmitReview(id) {
      try {
        await this.$confirm('确定要重新提交该博客进行审核吗？', '提示', { type: 'warning' })
        await submitReview(id)
        this.$message.success('重新提交审核成功')
        this.fetchList(this.page)
      } catch (e) {
        this.$message.error('操作失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    handleSortChange() {
      this.fetchList(1)
    },
    toggleOrderType() {
      this.orderType = this.orderType === 'desc' ? 'asc' : 'desc'
      this.fetchList(1)
    },
    handleSelectBlog(row) {
      this.$router.push({ name: 'BlogEdit', params: { id: row.id }})
    }
  }
}
</script>
