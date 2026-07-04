<template>
  <div class="markdown-editor">
    <div class="toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left"></slot>
      </div>
      <span class="word-count">
        字数: {{ wordCount }} | 字符: {{ charCount }}
      </span>
      <div class="toolbar-right">
        <slot name="toolbar-right"></slot>
      </div>
    </div>
    <div class="editor-wrapper">
      <div class="editor-panel">
        <v-md-editor
          ref="editorRef"
          v-model="content"
          :toolbar-config="toolbarConfig"
          :height="editorHeight"
          @input="handleInput"
          @on-get-catalog="handleGetCatalog"
          @scroll="handleEditorScroll"
        />
      </div>
      <div class="preview-panel">
        <div class="panel-header">预览</div>
        <v-md-preview 
          ref="previewRef"
          :text="content" 
          :height="editorHeight"
        />
      </div>
      <div class="side-panel">
        <div class="panel-header">大纲</div>
        <div class="outline-list">
          <div
            v-for="(header, index) in outlineHeaders"
            :key="index"
            class="outline-item"
            :class="'h' + header.level"
            @click="scrollToHeader(header)"
          >
            {{ header.text }}
          </div>
          <div v-if="outlineHeaders.length === 0" class="empty-outline">
            暂无大纲
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MarkdownEditor',
  props: {
    value: {
      type: String,
      default: ''
    },
    editorHeight: {
      type: String,
      default: '1000px'
    },
    toolbarConfig: {
      type: Object,
      default: () => ({
        toolbar: [
          'bold',
          'italic',
          'strikeThrough',
          'divider',
          'heading',
          'heading1',
          'heading2',
          'heading3',
          'divider',
          'quote',
          'list',
          'orderedList',
          'divider',
          'code',
          'codeBlock',
          'divider',
          'link',
          'image',
          'table',
          'divider',
          'undo',
          'redo',
          'divider',
          'fullscreen',
          'github'
        ]
      })
    }
  },
  data() {
    return {
      content: this.value,
      editorRef: null,
      previewRef: null
    }
  },
  watch: {
    value(newVal) {
      this.content = newVal
    }
  },
  computed: {
    wordCount() {
      if (!this.content) return 0
      const text = this.content.replace(/[#*`~\[\]()>-]/g, '')
      const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
      const englishWords = text.match(/[a-zA-Z]+/g) || []
      return chineseChars.length + englishWords.length
    },
    charCount() {
      return this.content.length || 0
    },
    outlineHeaders() {
      if (!this.content) return []
      const regex = /^(#{1,3})\s+(.+)$/gm
      const headers = []
      let match
      while ((match = regex.exec(this.content)) !== null) {
        headers.push({
          level: match[1].length,
          text: match[2].trim(),
          index: match.index
        })
      }
      return headers
    }
  },
  methods: {
    handleInput() {
      this.$emit('input', this.content)
      this.$emit('change', this.content)
    },
    handleGetCatalog(catalog) {
      this.$emit('catalog', catalog)
    },
    handleEditorScroll(event) {
      const editorScrollTop = event.target.scrollTop
      const editorScrollHeight = event.target.scrollHeight
      const editorClientHeight = event.target.clientHeight
      
      const previewContent = this.$el.querySelector('.v-md-preview-content')
      if (previewContent) {
        const previewScrollHeight = previewContent.scrollHeight
        const previewClientHeight = previewContent.clientHeight
        
        const scrollRatio = editorScrollTop / (editorScrollHeight - editorClientHeight)
        previewContent.scrollTop = scrollRatio * (previewScrollHeight - previewClientHeight)
      }
    },
    scrollToHeader(header) {
      const textarea = this.$el.querySelector('.v-md-editor textarea')
      if (!textarea) return

      textarea.scrollTop = 0
      let charCount = 0
      const lines = this.content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (charCount >= header.index) {
          textarea.scrollTop = i * 24
          textarea.focus()
          break
        }
        charCount += lines[i].length + 1
      }
    }
  }
}
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
.toolbar-left {
  display: flex;
  gap: 8px;
}
.word-count {
  margin-left: auto;
  margin-right: 16px;
  color: #909399;
  font-size: 12px;
}
.toolbar-right {
  display: flex;
  gap: 8px;
}
.editor-wrapper {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 500px;
}
.editor-panel {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}
.side-panel {
  width: 200px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}
.outline-list {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}
.outline-item {
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  color: #606266;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.outline-item:hover {
  background-color: #f5f7fa;
}
.outline-item.h1 {
  font-weight: bold;
  font-size: 13px;
  padding-left: 8px;
}
.outline-item.h2 {
  padding-left: 16px;
}
.outline-item.h3 {
  padding-left: 24px;
}
.empty-outline {
  padding: 16px;
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
}
.panel-header {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}
</style>
