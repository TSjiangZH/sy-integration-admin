<template>
  <el-row :gutter="24" class="overview-row">
    <el-col :xs="12" :sm="8" :md="4" v-for="(item, idx) in data" :key="idx">
      <el-card class="stat-card">
        <div class="stat-title">{{ item.title }}</div>
        <div class="stat-num">{{ item.value }}</div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
export default {
  name: 'OverviewCards',
  props: {
    data: {
      type: Array,
      required: true,
      validator: (value) => {
        return value.every(item => item.title && typeof item.value !== 'undefined')
      }
    }
  }
}
</script>

<style scoped>
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
</style>