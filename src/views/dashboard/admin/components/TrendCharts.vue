<template>
  <el-row :gutter="24" class="charts-row">
    <el-col :xs="24" :md="12">
      <el-card shadow="hover" class="chart-card">
        <div class="chart-title">{{ lineTitle }}</div>
        <line-chart :chart-data="lineChartData" />
      </el-card>
    </el-col>
    <el-col :xs="24" :md="12">
      <el-card shadow="hover" class="chart-card">
        <div class="chart-title">{{ pieTitle }}</div>
        <pie-chart :chart-data="pieChartData" />
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
import LineChart from './LineChart'
import PieChart from './PieChart'

export default {
  name: 'TrendCharts',
  components: {
    LineChart,
    PieChart
  },
  props: {
    lineTitle: {
      type: String,
      default: '博客发布趋势'
    },
    pieTitle: {
      type: String,
      default: '分类分布'
    },
    lineChartData: {
      type: Object,
      required: true
    },
    pieChartData: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.charts-row {
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
</style>