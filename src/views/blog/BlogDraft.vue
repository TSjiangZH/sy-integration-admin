<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>博客草稿管理</span>
        <el-button type="primary" size="small" style="float:right" @click="goEdit()">新建博客</el-button>
        <el-select v-model="orderField" size="small" style="width: 140px; margin-left: 16px;" @change="handleSortChange">
          <el-option label="ID" value="id" />
          <el-option label="创建时间" value="create_time" />
          <el-option label="更新时间" value="update_time" />
        </el-select>
        <el-button size="small" style="margin-left: 8px;" @click="toggleOrderType">
          {{ orderType === 'desc' ? '降序' : '升序' }}
        </el-button>
      </div>

      <!-- 搜索组件 -->
      <HighlightSearch
        :data-list="draftList"
        :search-fields="['title', 'summary', 'author', 'category.name']"
        :display-fields="['title', 'author', 'category.name']"
        :field-labels="{ title: '标题', author: '作者', 'category.name': '分类' }"
        placeholder="搜索草稿标题、摘要、作者或分类"
        @select="handleSelectBlog"
        style="margin-bottom: 20px;"
      />

      <el-table :data="draftList" style="width: 100%" border stripe size="small">
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
        <el-table-column prop="createTime" label="创建时间" width="180" align="center">
          <template slot-scope="scope">
            {{ formatBlogDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180" align="center">
          <template slot-scope="scope">
            {{ formatBlogDate(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" @click="goView(scope.row.id)">预览</el-button>
            <el-button size="mini" @click="goEdit(scope.row.id)">编辑</el-button>
            <el-button size="mini" type="success" @click="handleSubmitReview(scope.row.id)">提交审核</el-button>
            <el-button size="mini" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
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
import { fetchDraftList, deleteBlog, submitReview } from '@/api/modules/blog'
import { formatBlogDate } from '@/utils/blog'
import HighlightSearch from '@/components/HighlightSearch/index.vue'
export default {
  components: {
    HighlightSearch
  },
  data() {
    return {
      draftList: [],
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
        // 使用新的草稿列表API
        const res = await fetchDraftList({ page, pageSize: this.pageSize, orderField: this.orderField, orderType: this.orderType })
        const items = (res.data.items || []).map(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags = item.tags.map(tag => ({ ...tag, count: tag.count == null ? 0 : tag.count }))
          }
          if (item.category) {
            item.category.count = item.category.count == null ? 0 : item.category.count
          }
          return item
        })
        this.draftList = items
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
        await this.$confirm('确定要提交该博客进行审核吗？', '提示', { type: 'warning' })
        await submitReview(id)
        this.$message.success('提交审核成功')
        this.fetchList(this.page)
      } catch (e) {
        this.$message.error('提交审核失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    async handleDelete(id) {
      try {
        await this.$confirm('确定要删除该草稿吗？', '提示', { type: 'warning' })
        await deleteBlog(id)
        this.$message.success('删除成功')
        this.fetchList()
      } catch (e) {
        this.$message.error('删除失败：' + (e && e.message ? e.message : '未知错误'))
        this.fetchList()
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