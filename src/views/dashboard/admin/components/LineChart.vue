<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'

export default {
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '350px'
    },
    autoResize: {
      type: Boolean,
      default: true
    },
    chartData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler(val) {
        this.setOptions(val)
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$el, 'macarons')
      this.setOptions(this.chartData)
    },
    setOptions({ xData, totalData, draftData, publishData, reviewData, rejectData } = {}) {
      const series = []
      const colors = {
        total: '#409EFF',
        draft: '#909399',
        publish: '#67C23A',
        review: '#E6A23C',
        reject: '#F56C6C'
      }

      if (totalData && totalData.length > 0) {
        series.push({
          name: '总数',
          smooth: true,
          type: 'line',
          itemStyle: { normal: { color: colors.total, lineStyle: { color: colors.total, width: 3 } } },
          data: totalData,
          animationDuration: 2800,
          animationEasing: 'cubicInOut'
        })
      }

      if (draftData && draftData.length > 0) {
        series.push({
          name: '草稿',
          smooth: true,
          type: 'line',
          itemStyle: { normal: { color: colors.draft, lineStyle: { color: colors.draft, width: 2 } } },
          data: draftData,
          animationDuration: 2800,
          animationEasing: 'quadraticOut'
        })
      }

      if (publishData && publishData.length > 0) {
        series.push({
          name: '已发布',
          smooth: true,
          type: 'line',
          itemStyle: { normal: { color: colors.publish, lineStyle: { color: colors.publish, width: 2 }, areaStyle: { color: 'rgba(103, 194, 58, 0.1)' } } },
          data: publishData,
          animationDuration: 2800,
          animationEasing: 'quadraticOut'
        })
      }

      if (reviewData && reviewData.length > 0) {
        series.push({
          name: '待审核',
          smooth: true,
          type: 'line',
          itemStyle: { normal: { color: colors.review, lineStyle: { color: colors.review, width: 2 }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } } },
          data: reviewData,
          animationDuration: 2800,
          animationEasing: 'quadraticOut'
        })
      }

      if (rejectData && rejectData.length > 0) {
        series.push({
          name: '未通过',
          smooth: true,
          type: 'line',
          itemStyle: { normal: { color: colors.reject, lineStyle: { color: colors.reject, width: 2 }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } } },
          data: rejectData,
          animationDuration: 2800,
          animationEasing: 'quadraticOut'
        })
      }

      this.chart.setOption({
        xAxis: {
          data: xData || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          boundaryGap: false,
          axisTick: { show: false }
        },
        grid: {
          left: 10,
          right: 10,
          bottom: 30,
          top: 40,
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          padding: [5, 10],
          formatter: function(params) {
            let result = '<div style="font-weight:bold;margin-bottom:5px;">' + params[0].axisValue + '</div>'
            params.forEach(item => {
              result += '<div style="display:flex;align-items:center;margin:2px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + item.color + ';margin-right:8px;"></span>' + item.seriesName + ': <b>' + item.value + '</b></div>'
            })
            return result
          }
        },
        yAxis: {
          axisTick: { show: false },
          type: 'value'
        },
        legend: {
          data: series.map(s => s.name),
          bottom: 0
        },
        series: series
      })
    }
  }
}
</script>
