<template>
  <el-row :gutter="24" class="overview-row">
    <el-col :xs="12" :sm="8" :md="4" v-for="(item, idx) in data" :key="idx">
      <el-card :class="['stat-card', `stat-card-${item.type}`]">
        <div class="stat-icon" :class="`icon-${item.type}`">
          <i :class="getIconClass(item.icon)"></i>
        </div>
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
  },
  methods: {
    getIconClass(icon) {
      const iconMap = {
        'el-icon-document': 'el-icon-document',
        'el-icon-check': 'el-icon-check',
        'el-icon-circle-check': 'el-icon-circle-check',
        'el-icon-document-copy': 'el-icon-document-copy',
        'el-icon-circle-close': 'el-icon-circle-close',
        'list': 'el-icon-menu',
        'tags': 'el-icon-collection',
        'eye': 'el-icon-view',
        'message': 'el-icon-chat-dot-round'
      }
      return iconMap[icon] || 'el-icon-document'
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
  padding: 24px 0;
  border-radius: 12px;
  min-height: 140px;
  transition: all 0.3s ease;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}
.stat-num {
  font-size: 2em;
  font-weight: bold;
}

.stat-card-blog .stat-num, .stat-card-blog .icon-blog { color: #409EFF; background: #ecf5ff; }
.stat-card-publish .stat-num, .stat-card-publish .icon-publish { color: #67C23A; background: #f0f9eb; }
.stat-card-review .stat-num, .stat-card-review .icon-review { color: #E6A23C; background: #fdf6ec; }
.stat-card-draft .stat-num, .stat-card-draft .icon-draft { color: #909399; background: #f4f4f5; }
.stat-card-reject .stat-num, .stat-card-reject .icon-reject { color: #F56C6C; background: #fef0f0; }
.stat-card-category .stat-num, .stat-card-category .icon-category { color: #667EEA; background: #f0f0ff; }
.stat-card-tag .stat-num, .stat-card-tag .icon-tag { color: #B37FEB; background: #f5f0ff; }
.stat-card-view .stat-num, .stat-card-view .icon-view { color: #10B981; background: #ecfdf5; }
.stat-card-comment .stat-num, .stat-card-comment .icon-comment { color: #06B6D4; background: #ecfeff; }
</style>