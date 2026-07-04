<template>
  <div class="highlight-search-demo">
    <div class="page-header">
      <h2>动态高亮搜索组件演示</h2>
      <p class="description">搜索组件支持模糊匹配和动态高亮显示匹配内容</p>
    </div>

    <div class="demo-section">
      <div class="section-title">
        <span class="title">基础用法</span>
        <span class="subtitle">单字段搜索，匹配内容自动高亮</span>
      </div>
      <div class="demo-card">
        <HighlightSearch
          :data-list="mockData"
          :search-fields="['name']"
          :display-fields="['name']"
          :field-labels="{ name: '名称' }"
          placeholder="请输入名称进行搜索"
          @select="handleSelect"
        />
      </div>
    </div>

    <div class="demo-section">
      <div class="section-title">
        <span class="title">多字段搜索</span>
        <span class="subtitle">同时搜索多个字段，匹配内容自动高亮</span>
      </div>
      <div class="demo-card">
        <HighlightSearch
          :data-list="mockData"
          :search-fields="['name', 'category', 'description']"
          :display-fields="['name', 'category', 'description']"
          :field-labels="{ name: '名称', category: '分类', description: '描述' }"
          placeholder="搜索名称、分类或描述"
          @select="handleSelect"
        />
      </div>
    </div>

    <div class="demo-section">
      <div class="section-title">
        <span class="title">精确匹配模式</span>
        <span class="subtitle">关闭模糊搜索，仅匹配完全相等的内容</span>
      </div>
      <div class="demo-card">
        <HighlightSearch
          :data-list="mockData"
          :search-fields="['category']"
          :display-fields="['name', 'category']"
          :field-labels="{ name: '名称', category: '分类' }"
          :fuzzy="false"
          placeholder="精确搜索分类名称"
          @select="handleSelect"
        />
      </div>
    </div>

    <div class="demo-section">
      <div class="section-title">
        <span class="title">选中结果</span>
      </div>
      <div class="result-card" v-if="selectedItem">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">{{ selectedItem.name }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ selectedItem.category }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ selectedItem.description }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ selectedItem.status ? '启用' : '禁用' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else class="result-card empty">
        <el-empty description="请选择搜索结果查看详情" />
      </div>
    </div>
  </div>
</template>

<script>
import HighlightSearch from '@/components/HighlightSearch/index.vue'

export default {
  name: 'HighlightSearchDemo',
  components: {
    HighlightSearch
  },
  data() {
    return {
      selectedItem: null,
      mockData: [
        {
          id: 1,
          name: 'Vue.js 入门指南',
          category: '前端框架',
          description: '学习 Vue.js 的基础知识和核心概念',
          status: true
        },
        {
          id: 2,
          name: 'Element UI 组件库',
          category: 'UI组件',
          description: '基于 Vue 2.0 的桌面端组件库',
          status: true
        },
        {
          id: 3,
          name: 'React Hooks 实践',
          category: '前端框架',
          description: '深入理解 React Hooks 的使用方法',
          status: true
        },
        {
          id: 4,
          name: 'Node.js 后端开发',
          category: '后端技术',
          description: '使用 Node.js 构建 RESTful API',
          status: true
        },
        {
          id: 5,
          name: 'TypeScript 类型系统',
          category: '编程语言',
          description: '掌握 TypeScript 的类型系统和高级特性',
          status: false
        },
        {
          id: 6,
          name: 'Docker 容器化部署',
          category: 'DevOps',
          description: '学习 Docker 容器化技术和最佳实践',
          status: true
        },
        {
          id: 7,
          name: 'MySQL 数据库优化',
          category: '数据库',
          description: 'MySQL 性能优化和索引设计',
          status: true
        },
        {
          id: 8,
          name: 'Redis 缓存技术',
          category: '数据库',
          description: '使用 Redis 实现高性能缓存',
          status: false
        },
        {
          id: 9,
          name: 'Git 版本控制',
          category: '工具',
          description: 'Git 工作流和团队协作最佳实践',
          status: true
        },
        {
          id: 10,
          name: 'Webpack 构建优化',
          category: '工具',
          description: '优化 Webpack 构建速度和打包体积',
          status: true
        }
      ]
    }
  },
  methods: {
    handleSelect(item) {
      this.selectedItem = item
      this.$message.success(`已选择：${item.name}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.highlight-search-demo {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .page-header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    .description {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }

  .demo-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .title {
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }

      .subtitle {
        margin-left: 12px;
        font-size: 13px;
        color: #909399;
      }
    }

    .demo-card {
      background: #ffffff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
    }
  }

  .result-card {
    background: #ffffff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);

    &.empty {
      padding: 40px;
    }
  }
}
</style>