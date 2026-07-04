<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>博客审核管理</span>
        <el-select v-model="reviewStatus" size="small" style="width: 140px; margin-left: 16px;" @change="fetchList(1)">
          <el-option label="全部" value="" />
          <el-option label="待审核" value="2" />
          <el-option label="审核通过" value="1" />
          <el-option label="审核不通过" value="3" />
        </el-select>
        <el-select v-model="orderField" size="small" style="width: 140px; margin-left: 16px;" @change="handleSortChange">
          <el-option label="ID" value="id" />
          <el-option label="提交时间" value="create_time" />
        </el-select>
        <el-button size="small" style="margin-left: 8px;" @click="toggleOrderType">
          {{ orderType === 'desc' ? '降序' : '升序' }}
        </el-button>
      </div>

      <!-- 搜索组件 -->
      <HighlightSearch
        :data-list="reviewList"
        :search-fields="['title', 'summary', 'author', 'category.name']"
        :display-fields="['title', 'author', 'category.name']"
        :field-labels="{ title: '标题', author: '作者', 'category.name': '分类' }"
        placeholder="搜索博客标题、摘要、作者或分类"
        @select="handleSelectBlog"
        style="margin-bottom: 20px;"
      />

      <el-table :data="reviewList" style="width: 100%" border stripe size="small">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="title" label="标题" min-width="120" />
        <el-table-column prop="coverImage" label="封面" width="100" align="center">
          <template slot-scope="scope">
            <img v-if="scope.row.coverImage" :src="scope.row.coverImage" style="width:60px;height:40px;object-fit:cover;" >
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
        <el-table-column prop="status" label="审核状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getReviewStatusType(scope.row.status)">
              {{ getReviewStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewMessage" label="审核意见" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.reviewMessage || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="180" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="审核时间" width="180" align="center">
          <template slot-scope="scope">
            {{ scope.row.updateTime ? formatDate(scope.row.updateTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" @click="goView(scope.row.id)">预览</el-button>
            <el-button v-if="scope.row.status === 2" size="mini" type="success" @click="handleApprove(scope.row.id)">通过</el-button>
            <el-button v-if="scope.row.status === 2" size="mini" type="danger" @click="handleReject(scope.row.id)">拒绝</el-button>
            <el-button v-if="scope.row.status === 3" size="mini" @click="goEdit(scope.row.id)">修改</el-button>
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

    <!-- 审核拒绝弹窗 -->
    <el-dialog title="拒绝审核" :visible.sync="rejectDialogVisible" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝理由">
          <el-textarea v-model="rejectForm.reason" rows="4" placeholder="请输入拒绝理由"></el-textarea>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { fetchReviewList, approveReview, rejectReview } from '@/api/modules/blog'
import dayjs from 'dayjs'
import HighlightSearch from '@/components/HighlightSearch/index.vue'
export default {
  components: {
    HighlightSearch
  },
  data() {
    return {
      reviewList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      orderField: 'id',
      orderType: 'desc',
      reviewStatus: '',
      rejectDialogVisible: false,
      rejectForm: {
        reason: ''
      },
      currentRejectId: null
    }
  },
  created() {
    this.fetchList()
  },
  methods: {
    async fetchList(page = 1) {
      try {
        this.page = page
        // 使用新的审核列表API
        const params = { 
          page, 
          pageSize: this.pageSize, 
          orderField: this.orderField, 
          orderType: this.orderType 
        }
        if (this.reviewStatus !== '') {
          params.status = this.reviewStatus
        }
        const res = await fetchReviewList(params)
        const items = (res.data.items || []).map(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags = item.tags.map(tag => ({ ...tag, count: tag.count == null ? 0 : tag.count }))
          }
          if (item.category) {
            item.category.count = item.category.count == null ? 0 : item.category.count
          }
          return item
        })
        this.reviewList = items
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
    async handleApprove(id) {
      try {
        await this.$confirm('确定要通过该博客的审核吗？', '提示', { type: 'success' })
        await approveReview(id)
        this.$message.success('审核通过')
        this.fetchList(this.page)
      } catch (e) {
        this.$message.error('操作失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    handleReject(id) {
      this.currentRejectId = id
      this.rejectForm.reason = ''
      this.rejectDialogVisible = true
    },
    async confirmReject() {
      if (!this.rejectForm.reason.trim()) {
        this.$message.warning('请输入拒绝理由')
        return
      }
      try {
        await rejectReview(this.currentRejectId, this.rejectForm.reason)
        this.$message.success('已拒绝审核')
        this.rejectDialogVisible = false
        this.fetchList(this.page)
      } catch (e) {
        this.$message.error('操作失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    getReviewStatusType(status) {
      // 状态码：0-草稿, 1-已发布, 2-待审核, 3-审核不通过
      switch (status) {
        case 2: return 'warning'
        case 1: return 'success'
        case 3: return 'danger'
        case 0: return 'info'
        default: return 'info'
      }
    },
    getReviewStatusText(status) {
      // 状态码：0-草稿, 1-已发布, 2-待审核, 3-审核不通过
      switch (status) {
        case 2: return '待审核'
        case 1: return '审核通过'
        case 3: return '审核不通过'
        case 0: return '草稿'
        default: return '未知'
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
      this.$router.push({ name: 'BlogView', params: { id: row.id }})
    },
    formatDate(date) {
      return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  }
}
</script>