<template>
  <div class="dashboard-editor-container">
    <!-- 数据总览卡片 -->
    <el-row :gutter="24" class="overview-row">
      <el-col :xs="12" :sm="8" :md="4" v-for="(item, idx) in overviewList" :key="idx">
        <el-card class="stat-card">
          <div class="stat-title">{{ item.title }}</div>
          <div class="stat-num">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-row class="quick-actions" justify="center" style="margin: 32px 0 24px 0;">
      <el-button type="primary" icon="el-icon-edit" @click="goTo('BlogEdit')">新建博客</el-button>
      <el-button icon="el-icon-document" @click="goTo('BlogList')">博客管理</el-button>
      <el-button icon="el-icon-menu" @click="goTo('CategoryList')">分类管理</el-button>
      <el-button icon="el-icon-collection" @click="goTo('TagManage')">标签管理</el-button>
    </el-row>

    <!-- 数据趋势图表 -->
    <el-row :gutter="24" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-title">博客发布趋势</div>
          <line-chart :chart-data="blogTrendData" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-title">分类分布</div>
          <pie-chart :chart-data="categoryPieData" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新博客 -->
    <el-row class="latest-row" style="margin-top: 32px;">
      <el-col :xs="24" :md="16" :lg="12">
        <el-card shadow="hover">
          <div class="chart-title">最新博客</div>
          <el-table :data="latestBlogs" size="mini" border>
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
                <el-button size="mini" type="primary" @click="goToEdit(scope.row.id)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
// 这里假设你有相关接口，实际可根据你的 api 路径调整
import { fetchBlogList, fetchBlogStats, fetchBlogTrend } from '@/api/modules/blog'
import { fetchCategoryCount, fetchCategoryDistribution } from '@/api/modules/category'
import { fetchTagCount } from '@/api/modules/tag'
import LineChart from './components/LineChart'
import PieChart from './components/PieChart'
import dayjs from 'dayjs'

export default {
  name: 'DashboardAdmin',
  components: {
    LineChart,
    PieChart
  },
  data() {
    return {
      stats: {
        blogCount: 0,
        categoryCount: 0,
        tagCount: 0,
        viewCount: 0,
        commentCount: 0
      },
      blogTrendData: {
        expectedData: [],
        actualData: [],
        xData: []
      },
      categoryPieData: {},
      latestBlogs: []
    }
  },
  computed: {
    overviewList() {
      return [
        { title: '博客总数', value: this.stats.blogCount },
        { title: '分类总数', value: this.stats.categoryCount },
        { title: '标签总数', value: this.stats.tagCount },
        { title: '总浏览量', value: this.stats.viewCount },
        { title: '总评论数', value: this.stats.commentCount }
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
      // 博客总数、总浏览量、总评论数
      const blogStatsRes = await fetchBlogStats()
      this.stats.blogCount = blogStatsRes.data.blogCount || 0
      this.stats.viewCount = blogStatsRes.data.viewCount || 0
      this.stats.commentCount = blogStatsRes.data.commentCount || 0
      // 分类总数
      const categoryRes = await fetchCategoryCount()
      this.stats.categoryCount = categoryRes.data || 0
      // 标签总数
      const tagRes = await fetchTagCount()
      this.stats.tagCount = tagRes.data || 0
    },
    async loadTrend() {
      // 博客发布趋势
      const res = await fetchBlogTrend({ days: 7 })
      // 假设后端返回 [{date: '2024-06-01', count: 3}, ...]
      const xData = res.data.map(item => item.date)
      const yData = res.data.map(item => item.count)
      this.blogTrendData = {
        expectedData: yData,
        actualData: yData,
        xData: xData
      }
    },
    async loadPie() {
      // 分类分布
      const res = await fetchCategoryDistribution()
      // 假设后端返回 [{name: '前端', value: 10}, ...]
      this.categoryPieData = {
        legend: res.data.map(item => item.name),
        series: res.data
      }
    },
    async loadLatestBlogs() {
      try {
        const res = await fetchBlogList({ page: 1, pageSize: 5, orderField: 'create_time', orderType: 'desc' })
        this.latestBlogs = res.data.items || []
      } catch (e) {}
    },
    goTo(name) {
      this.$router.push({ name })
    },
    goToEdit(id) {
      this.$router.push({ name: 'BlogEdit', params: { id } })
    },
    formatDate(row, column, cellValue) {
      return cellValue && dayjs(cellValue).isValid() ? dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss') : ''
    }
  }
}
</script>

<style scoped>
.dashboard-editor-container {
  padding: 32px 16px;
  background: #f5f7fa;
}
.overview-row {
  margin-bottom: 24px;
}
.stat-card {
  text-align: center;
  padding: 18px 0;
  border-radius: 10px;
  min-height: 100px;
}
.stat-title {
  font-size: 16px;
  color: #888;
  margin-bottom: 8px;
}
.stat-num {
  font-size: 2.2em;
  font-weight: bold;
  color: #409EFF;
}
.quick-actions {
  text-align: center;
  margin-bottom: 24px;
}
.chart-card {
  min-height: 340px;
  border-radius: 10px;
}
.chart-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}
.el-table th, .el-table td {
  font-size: 14px;
}
@media (max-width: 768px) {
  .stat-card, .chart-card {
    min-height: 120px;
  }
  .chart-title {
    font-size: 16px;
  }
}
</style>
