<template>
  <div class="highlight-search">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <el-input
        v-model="searchText"
        :placeholder="placeholder"
        class="search-input"
        @input="handleSearch"
        clearable
        prefix-icon="el-icon-search"
      />
    </div>

    <!-- 搜索结果列表 -->
    <div v-if="filteredList.length > 0 && searchText.length > 0" class="search-result">
      <div class="result-header">
        <span class="result-count">找到 {{ filteredList.length }} 条匹配结果</span>
      </div>
      <el-scrollbar class="result-list-wrapper">
        <ul class="result-list">
          <li
            v-for="(item, index) in filteredList"
            :key="item.id || index"
            class="result-item"
            @click="handleSelect(item)"
            @mouseenter="hoveredIndex = index"
            :class="{ 'hovered': hoveredIndex === index }"
          >
            <div class="result-content">
              <div v-for="(field, fieldIndex) in displayFields" :key="fieldIndex" class="result-field">
                <span class="field-label">{{ getFieldLabel(field) }}：</span>
                <span 
                  class="field-value" 
                  v-html="highlightMatch(getFieldValue(item, field), searchText)"
                ></span>
              </div>
            </div>
            <div class="result-action">
              <el-button size="mini" type="text" @click.stop="handleSelect(item)">查看</el-button>
            </div>
          </li>
        </ul>
      </el-scrollbar>
    </div>

    <!-- 空状态提示 -->
    <div v-else-if="searchText.length > 0 && filteredList.length === 0" class="empty-state">
      <el-empty description="未找到匹配的内容" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'HighlightSearch',
  props: {
    // 数据源列表
    dataList: {
      type: Array,
      default: () => []
    },
    // 搜索字段配置 - 支持多个字段
    searchFields: {
      type: Array,
      default: () => ['name']
    },
    // 显示字段配置
    displayFields: {
      type: Array,
      default: () => ['name']
    },
    // 字段标签映射
    fieldLabels: {
      type: Object,
      default: () => ({})
    },
    // 搜索占位符
    placeholder: {
      type: String,
      default: '请输入搜索内容'
    },
    // 是否开启模糊搜索
    fuzzy: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      searchText: '',
      hoveredIndex: -1,
      filteredList: []
    }
  },
  watch: {
    dataList: {
      deep: true,
      handler() {
        this.handleSearch()
      }
    }
  },
  methods: {
    /**
     * 处理搜索逻辑 - 支持多字段模糊搜索
     */
    handleSearch() {
      if (!this.searchText || this.searchText.trim() === '') {
        this.filteredList = []
        return
      }

      const keyword = this.searchText.toLowerCase().trim()

      // 过滤匹配的项
      this.filteredList = this.dataList.filter(item => {
        // 遍历所有搜索字段，只要有一个字段匹配就返回true
        return this.searchFields.some(field => {
          const value = this.getFieldValue(item, field)
          if (value === null || value === undefined) return false
          
          const valueStr = String(value).toLowerCase()
          
          if (this.fuzzy) {
            // 模糊匹配：包含关键词
            return valueStr.includes(keyword)
          } else {
            // 精确匹配：完全相等
            return valueStr === keyword
          }
        })
      })
    },

    /**
     * 获取字段值 - 支持嵌套属性如 'user.name'
     */
    getFieldValue(item, field) {
      if (!item || !field) return ''
      
      if (typeof field === 'function') {
        return field(item)
      }
      
      // 支持嵌套属性，如 'user.name'
      const keys = field.split('.')
      let value = item
      for (const key of keys) {
        if (value === null || value === undefined) {
          return ''
        }
        value = value[key]
      }
      return value
    },

    /**
     * 获取字段标签
     */
    getFieldLabel(field) {
      if (typeof field === 'function') {
        return field.name || '字段'
      }
      return this.fieldLabels[field] || field
    },

    /**
     * 高亮匹配文本 - 在文本中高亮显示搜索关键词
     */
    highlightMatch(text, keyword) {
      if (!keyword || !text) {
        return text
      }

      // 转义特殊字符，避免正则表达式问题
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedKeyword})`, 'gi')
      
      return String(text).replace(regex, '<span class="highlight">$1</span>')
    },

    /**
     * 处理选择事件
     */
    handleSelect(item) {
      this.$emit('select', item)
    }
  }
}
</script>

<style lang="scss" scoped>
.highlight-search {
  width: 100%;

  .search-input-wrapper {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .search-result {
    margin-top: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background: #ffffff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .result-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e4e7ed;
      background: #fafafa;

      .result-count {
        font-size: 13px;
        color: #606266;
      }
    }

    .result-list-wrapper {
      max-height: 300px;
    }

    .result-list {
      margin: 0;
      padding: 0;
      list-style: none;

      .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: background-color 0.2s;
        border-bottom: 1px solid #f2f6fc;

        &:last-child {
          border-bottom: none;
        }

        &:hover,
        &.hovered {
          background-color: #f5f7fa;
        }

        .result-content {
          flex: 1;
          min-width: 0;

          .result-field {
            display: flex;
            align-items: center;
            font-size: 14px;
            line-height: 1.8;

            .field-label {
              color: #909399;
              margin-right: 4px;
              flex-shrink: 0;
            }

            .field-value {
              color: #606266;
              word-break: break-all;

              .highlight {
                color: #409eff !important;
                background-color: #e8f4fd !important;
                padding: 1px 4px;
                border-radius: 3px;
                font-weight: 500;
              }
            }
          }
        }

        .result-action {
          margin-left: 16px;
          flex-shrink: 0;
        }
      }
    }
  }

  .empty-state {
    margin-top: 12px;
    padding: 40px 0;
  }
}
</style>