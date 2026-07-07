<template>
  <div class="dashboard-editor-container">
    <account-info-card :user-info="userInfo" :stats="accountStats" />
    <!-- 面板组 (PanelGroup) - 接入 overviewList 数据源 -->
    <panel-group :data="overviewList" @handleSetLineChartData="handleSetLineChartData" />
    <!-- 快捷操作 (QuickActions) -->
        <el-card title="快捷操作" style="margin-bottom: 20px;">
      <quick-actions :actions="actionList" @action-click="handleActionClick" />
    </el-card>
    
    <!-- 数据趋势图表 (TrendCharts) - 包含LineChart和PieChart -->
    <trend-charts 
      :line-chart-data="blogTrendData" 
      :pie-chart-data="categoryPieData" 
      pie-title="分类分布"
    />
    
    <!-- 标签分布饼图 -->
    <el-row class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card title="标签分布" class="chart-card">
          <pie-chart :chart-data="tagPieData" title="标签分布" />
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 条形图 (BarChart) -->
    <el-row class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card title="页面访问量统计" class="chart-card">
          <bar-chart className="bar-chart" />
        </el-card>
      </el-col>
      

    </el-row>

    
    <!-- 最新博客和事务表格 -->
    <el-row class="table-row">
      <el-col :xs="24" :md="16" :lg="12">
        <latest-blogs-table :blogs="latestBlogs" @edit="goToEdit" />
      </el-col>
      
      <!-- 事务表格 (TransactionTable) -->
      <el-col :xs="24" :md="8" :lg="12">
        <el-card title="交易记录">
          <transaction-table />
        </el-card>
      </el-col>
    </el-row>
    
    <!-- BoxCard和TodoList -->
    <el-row class="bottom-row">
      
      <el-col :xs="24" :lg="8">
        <box-card />
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-card title="待办事项">
          <todo-list />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { fetchBlogList, fetchBlogStats, fetchBlogTrend, fetchTagDistribution } from '@/api/modules/blog'
import { fetchCategoryCount, fetchCategoryDistribution } from '@/api/modules/category'
import { fetchTagCount } from '@/api/modules/tag'
import QuickActions from './components/QuickActions'
import TrendCharts from './components/TrendCharts'
import LatestBlogsTable from './components/LatestBlogsTable'
import BarChart from './components/BarChart'
import RaddarChart from './components/RaddarChart'
import PanelGroup from './components/PanelGroup'
import TransactionTable from './components/TransactionTable'
import BoxCard from './components/BoxCard'
import TodoList from './components/TodoList'
import AccountInfoCard from './components/AccountInfoCard'
import PieChart from './components/PieChart'

export default {
  name: 'DashboardAdmin',
  components: {
    QuickActions,
    TrendCharts,
    LatestBlogsTable,
    BarChart,
    RaddarChart,
    PanelGroup,
    TransactionTable,
    BoxCard,
    TodoList,
    AccountInfoCard,
    PieChart
  },
  data() {
    return {
      stats: {
        blogCount: 0,
        categoryCount: 0,
        tagCount: 0,
        viewCount: 0,
        commentCount: 0,
        draftCount: 0,
        reviewCount: 0,
        rejectCount: 0,
        publishCount: 0
      },
      blogTrendData: { xData: [], totalData: [], draftData: [], publishData: [], reviewData: [], rejectData: [] },
      categoryPieData: {},
      tagPieData: {},
      latestBlogs: [],
      actionList: [
        { label: '新建博客', name: 'BlogEdit', type: 'primary', icon: 'el-icon-edit' },
        { label: '博客管理', name: 'BlogList', icon: 'el-icon-document' },
        { label: '分类管理', name: 'CategoryList', icon: 'el-icon-menu' },
        { label: '标签管理', name: 'TagManage', icon: 'el-icon-collection' },
        { label: '审核管理', name: 'BlogReview', type: 'warning', icon: 'el-icon-circle-check' },
        { label: '草稿管理', name: 'BlogDraft', icon: 'el-icon-document-copy' },
        { label: '未通过博客', name: 'BlogReject', type: 'danger', icon: 'el-icon-circle-close' }
      ],
      // 用户信息
      userInfo: {
        name: 'Admin',
        avatar: '',
        role: '超级管理员',
        email: 'admin@example.com',
        phone: '138****8888',
        status: 'online',
        joinDate: '2024-01-01'
      },
      
    }
  },
  computed: {
    overviewList() {
      return [
        { title: '博客总数', value: this.stats.blogCount, icon: 'el-icon-document', type: 'blog' },
        { title: '已发布', value: this.stats.publishCount, icon: 'el-icon-check', type: 'publish' },
        { title: '待审核', value: this.stats.reviewCount, icon: 'el-icon-circle-check', type: 'review' },
        { title: '草稿', value: this.stats.draftCount, icon: 'el-icon-document-copy', type: 'draft' },
        { title: '未通过', value: this.stats.rejectCount, icon: 'el-icon-circle-close', type: 'reject' },
        { title: '分类总数', value: this.stats.categoryCount, icon: 'list', type: 'category' },
        { title: '标签总数', value: this.stats.tagCount, icon: 'tags', type: 'tag' },
        { title: '总浏览量', value: this.stats.viewCount, icon: 'eye', type: 'view' }
      ]
    },
    accountStats() {
      return [
        { label: '博客数', value: this.stats.blogCount },
        { label: '粉丝数', value: 128 },
        { label: '获赞数', value: 356 }
      ]
    }
  },
  created() {
    this.loadStats()
    this.loadTrend()
    this.loadPie()
    this.loadLatestBlogs()
  },
  methods: {
    async loadStats() {
      const blogStatsRes = await fetchBlogStats()
      this.stats.blogCount = blogStatsRes.data.blogCount || 0
      this.stats.viewCount = blogStatsRes.data.viewCount || 0
      this.stats.commentCount = blogStatsRes.data.commentCount || 0
      this.stats.draftCount = blogStatsRes.data.draftCount || 0
      this.stats.reviewCount = blogStatsRes.data.reviewCount || 0
      this.stats.rejectCount = blogStatsRes.data.rejectCount || 0
      this.stats.publishCount = blogStatsRes.data.publishCount || 0
      
      const categoryRes = await fetchCategoryCount()
      this.stats.categoryCount = categoryRes.data || 0
      
      const tagRes = await fetchTagCount()
      this.stats.tagCount = tagRes.data || 0
    },
    async loadTrend() {
      const res = await fetchBlogTrend({ days: 7 })
      this.blogTrendData = {
        xData: res.data.map(item => item.date),
        totalData: res.data.map(item => item.total),
        draftData: res.data.map(item => item.draft),
        publishData: res.data.map(item => item.publish),
        reviewData: res.data.map(item => item.review),
        rejectData: res.data.map(item => item.reject)
      }
    },
    async loadPie() {
      const categoryRes = await fetchCategoryDistribution()
      this.categoryPieData = {
        legend: categoryRes.data.map(item => item.name),
        series: categoryRes.data
      }
      
      const tagRes = await fetchTagDistribution()
      this.tagPieData = {
        legend: tagRes.data.map(item => item.name),
        series: tagRes.data
      }
    },
    async loadLatestBlogs() {
      const res = await fetchBlogList({ page: 1, pageSize: 5, orderField: 'create_time', orderType: 'desc' })
      this.latestBlogs = res.data.items || []
    },
    handleActionClick(action) {
      this.$router.push({ name: action.name })
    },
    goToEdit(id) {
      this.$router.push({ name: 'BlogEdit', params: { id } })
    },
    handleSetLineChartData(type) {
      console.log('Line chart data type:', type)
    }
  }
}
</script>

<style scoped>
.dashboard-editor-container {
  padding: 32px 16px;
  background: #f5f7fa;
  min-height: 100vh;
}
.chart-row, .table-row, .bottom-row {
  margin-top: 32px;
}
.chart-card {
  height: 100%;
}
.bar-chart, .radar-chart {
  width: 100%;
  height: 300px;
}
@media (max-width: 768px) {
  .dashboard-editor-container {
    padding: 16px 8px;
  }
}
</style>
