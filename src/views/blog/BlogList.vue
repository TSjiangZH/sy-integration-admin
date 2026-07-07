<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>博客列表</span>
        <el-button type="primary" size="small" style="float:right" @click="goEdit()">新建博客</el-button>
        <el-select v-model="status" size="small" style="width: 100px; margin-left: 16px;" @change="handleStatusChange">
          <el-option label="全部" value="" />
          <el-option label="草稿" :value="0" />
          <el-option label="已发布" :value="1" />
          <el-option label="待审核" :value="2" />
          <el-option label="审核不通过" :value="3" />
        </el-select>
        <el-select v-model="orderField" size="small" style="width: 140px; margin-left: 16px;" @change="handleSortChange">
          <el-option label="ID" value="id" />
          <el-option label="发表时间" value="create_time" />
          <el-option label="浏览次数" value="view_count" />
        </el-select>
        <el-button size="small" style="margin-left: 8px;" @click="toggleOrderType">
          {{ orderType === 'desc' ? '降序' : '升序' }}
        </el-button>
      </div>

      <!-- 搜索组件 -->
      <HighlightSearch
        :data-list="blogList"
        :search-fields="['title', 'summary', 'author', 'category.name']"
        :display-fields="['title', 'author', 'category.name']"
        :field-labels="{ title: '标题', author: '作者', 'category.name': '分类' }"
        placeholder="搜索博客标题、摘要、作者或分类"
        @select="handleSelectBlog"
        style="margin-bottom: 20px;"
      />

      <el-table :data="blogList" style="width: 100%" border stripe size="small">
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
        <el-table-column prop="likeCount" label="喜爱数" width="80" align="center" />
        <el-table-column prop="viewCount" label="浏览数" width="80" align="center" />
        <el-table-column prop="commentCount" label="评论数" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getBlogStatusType(scope.row.status)">
              {{ getBlogStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isTop" label="置顶" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.isTop ? 'warning' : 'info'">
              {{ scope.row.isTop ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isRecommend" label="推荐" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.isRecommend ? 'success' : 'info'">
              {{ scope.row.isRecommend ? '是' : '否' }}
            </el-tag>
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
        <el-table-column prop="enableComment" label="评论" width="80" align="center">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.enableComment"
              :active-value="1"
              :inactive-value="0"
              @change="handleEnableComment(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="scope">
            <el-button size="mini" @click="openActionPanel(scope.row)">操作</el-button>
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
    <ActionPanel v-model="actionPanelVisible" :title="'操作面板'" @close="closeActionPanel">
      <el-button size="mini" type="primary" @click="goView(currentRow.id)">查看</el-button>
      <el-button size="mini" @click="goEdit(currentRow.id)">编辑</el-button>
      <el-button size="mini" type="danger" @click="handleDelete(currentRow.id)">删除</el-button>
      <el-button size="mini" :type="currentRow.isTop ? 'info' : 'warning'" @click="handleTop(currentRow)">
        {{ currentRow.isTop ? '取消置顶' : '置顶' }}
      </el-button>
      <el-button size="mini" :type="currentRow.isRecommend ? 'info' : 'success'" @click="handleRecommend(currentRow)">
        {{ currentRow.isRecommend ? '取消推荐' : '推荐' }}
      </el-button>
    </ActionPanel>
  </div>
</template>
<script>
import { fetchBlogList, deleteBlog, setTopBlog, setRecommendBlog, updateBlog } from '@/api/modules/blog'
import { getBlogStatusText, getBlogStatusType, formatBlogDate } from '@/utils/blog'
import ActionPanel from '@/components/ActionPanel.vue'
import HighlightSearch from '@/components/HighlightSearch/index.vue'
export default {
  components: {
    ActionPanel,
    HighlightSearch
  },
  data() {
    return {
      blogList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      actionPanelVisible: false,
      currentRow: {},
      orderField: 'id',
      orderType: 'desc',
      status: '' // 状态筛选：空表示全部，0-草稿，1-已发布，2-待审核，3-审核不通过
    }
  },
  created() {
    this.fetchList()
  },
  methods: {
    getBlogStatusText,
    getBlogStatusType,
    formatBlogDate,
    async fetchList(page = 1) {
      try {
        this.page = page
        const params = { page, pageSize: this.pageSize, orderField: this.orderField, orderType: this.orderType }
        // 如果status有值，添加状态筛选条件
        if (this.status !== '') {
          params.status = this.status
        }
        const res = await fetchBlogList(params)
        const items = (res.data.items || []).map(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags = item.tags.map(tag => ({ ...tag, count: tag.count == null ? 0 : tag.count }))
          }
          if (item.category) {
            item.category.count = item.category.count == null ? 0 : item.category.count
          }
          return item
        })
        this.blogList = items
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
    async handleDelete(id) {
      try {
        await this.$confirm('确定要删除该博客吗？', '提示', { type: 'warning' })
        await deleteBlog(id)
        this.$message.success('删除成功')
        this.fetchList()
        this.actionPanelVisible = false
      } catch (e) {
        this.$message.error('删除失败：' + (e && e.message ? e.message : '未知错误'))
        this.fetchList()
      }
    },
    async handleTop(row) {
      try {
        const isTop = row.isTop ? 0 : 1
        await setTopBlog(row.id, isTop)
        this.$message.success(isTop ? '置顶成功' : '已取消置顶')
        this.fetchList(this.page)
      } catch (e) {
        this.$message.error('操作失败：' + (e && e.message ? e.message : '未知错误'))
        this.fetchList(this.page)
      }
    },
    async handleRecommend(row) {
      try {
        const isRecommend = row.isRecommend ? 0 : 1
        await setRecommendBlog(row.id, isRecommend)
        this.$message.success(isRecommend ? '推荐成功' : '已取消推荐')
        this.fetchList(this.page)
      } catch (e) {
        this.$message.error('操作失败：' + (e && e.message ? e.message : '未知错误'))
        this.fetchList(this.page)
      }
    },
    async handleEnableComment(row) {
      try {
        await this.$confirm('确定要修改该博客的评论状态吗？', '提示', { type: 'warning' })
        await updateBlog({ id: row.id, enableComment: row.enableComment })
        this.$message.success('评论状态已更新')
        this.fetchList(this.page)
      } catch (e) {
        this.$message.error('操作失败：' + (e && e.message ? e.message : '未知错误'))
        this.fetchList(this.page)
      }
    },
    openActionPanel(row) {
      this.currentRow = row
      this.actionPanelVisible = true
    },
    closeActionPanel() {
      this.actionPanelVisible = false
      this.currentRow = {}
    },
    handleSortChange() {
      this.fetchList(1)
    },
    handleStatusChange() {
      this.fetchList(1)
    },
    toggleOrderType() {
      this.orderType = this.orderType === 'desc' ? 'asc' : 'desc'
      this.fetchList(1)
    },
    handleSelectBlog(blog) {
      this.$message.info(`已选择博客: ${blog.title}`)
      this.goEdit(blog.id)
    }
  }
}
</script>
