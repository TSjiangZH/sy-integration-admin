<template>
  <div class="app-container blog-view">
    <div class="blog-detail-page" ref="containerRef">
      <!-- 返回按钮和编辑按钮 -->
      <div class="blog-header-actions">
        <el-button size="small" @click="goBack">
          <i class="el-icon-arrow-left"></i> 返回列表
        </el-button>
        <el-button size="small" @click="goEdit">
          <i class="el-icon-edit"></i> 编辑博客
        </el-button>
      </div>

      <!-- 博客封面 -->
      <div class="blog-detail-cover" v-if="blog.cover || blog.coverImage">
        <img :src="blog.cover || blog.coverImage" alt="博客封面" />
      </div>

      <div class="blog-detail-main">
        <div class="blog-detail-content">
          <template v-if="loading">
            <el-skeleton :rows="8" animated />
          </template>
          <template v-else-if="error">
            <el-empty description="加载失败，请稍后重试" />
          </template>
          <template v-else>
            <!-- 博客标题 -->
            <h1 class="blog-title">{{ blog.title }}</h1>

            <!-- 博客信息栏 -->
            <div class="blog-meta">
              <span class="meta-item">
                <i class="el-icon-user"></i>
                {{ blog.author || '未知作者' }} 发布
              </span>
              <span class="dot"></span>
              <span class="meta-item">
                <i class="el-icon-folder"></i>
                {{ blog.category ? blog.category.name : '未分类' }}
              </span>
              <span class="dot"></span>
              <span class="meta-item">
                <i class="el-icon-time"></i>
                {{ formatDate(blog.createTime) }}
              </span>
              <span class="dot"></span>
              <span class="meta-item">
                <i class="el-icon-view"></i>
                {{ animatedViewCount }} 阅读
              </span>
              <span class="dot"></span>
              <span class="meta-item">
                <i class="el-icon-chat-dot-round"></i>
                {{ blog.commentCount || 0 }} 评论
              </span>
            </div>

            <!-- 标签 -->
            <div class="blog-tags" v-if="blog.tags && blog.tags.length > 0">
              <el-tag
                v-for="tag in blog.tags"
                :key="tag.id || tag.name"
                :style="{ backgroundColor: generateRandomColor(), color: '#fff' }"
                effect="plain"
                size="medium"
                class="tag-item"
              >
                {{ tag.name || tag }}
              </el-tag>
            </div>

            <!-- 摘要 -->
            <div class="blog-summary" v-if="blog.summary">
              <h3>摘要</h3>
              <p>{{ blog.summary }}</p>
            </div>

            <!-- 博客正文（使用markdown-it渲染） -->
            <div class="blog-content markdown-body" v-html="blogHtml"></div>

            <!-- 博客状态标识 -->
            <div class="blog-status">
              <el-tag :type="getStatusType(blog.status)">
                {{ getStatusText(blog.status) }}
              </el-tag>
              <el-tag v-if="blog.isTop" type="danger">置顶</el-tag>
              <el-tag v-if="blog.isRecommend" type="primary">推荐</el-tag>
              <el-tag :type="blog.enableComment ? 'success' : 'info'">
                {{ blog.enableComment ? '允许评论' : '禁止评论' }}
              </el-tag>
            </div>
          </template>
        </div>

        <!-- 目录 -->
        <aside
          ref="tocRef"
          class="blog-detail-toc"
          :class="{ 'is-fixed': isFixed }"
          v-if="outline && outline.length"
          :style="isFixed ? tocFixedStyle : {}"
        >
          <div class="toc-title">目录</div>
          <ul class="toc-list">
            <li v-for="item in outline" :key="item.id" :class="{ active: item.id === activeId }" :style="{ paddingLeft: (item.level - 1) * 16 + 'px' }">
              <a :href="'#' + item.id">{{ item.text }}</a>
            </li>
          </ul>
        </aside>
      </div>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { getBlogDetail } from '@/api/modules/blog'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'

// 初始化markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: undefined
})

// 给标题加 id，兼容目录锚点
md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
  const title = tokens[idx + 1] && tokens[idx + 1].content
  if (title) {
    const id = title.toLowerCase().replace(/\s+/g, '-')
    tokens[idx].attrSet('id', id)
  }
  return self.renderToken(tokens, idx, options)
}

export default {
  name: 'BlogView',
  data() {
    return {
      blog: {},
      blogHtml: '',
      outline: [],
      loading: true,
      error: false,
      tocRef: null,
      containerRef: null,
      isFixed: false,
      tocFixedStyle: {},
      activeId: '',
      animatedViewCount: 0,
      // 图片预览相关
      previewVisible: false,
      previewImages: [],
      previewIndex: 0,
      tocTop: 0
    }
  },
  async created() {
    const id = this.$route.params.id
    if (id) {
      await this.fetchBlogDetail(id)
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll)
    window.addEventListener('resize', this.calcTocTop)
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('resize', this.calcTocTop)
  },
  methods: {
    async fetchBlogDetail(id) {
      this.loading = true
      this.error = false
      try {
        const res = await getBlogDetail(id)
        if (res.data) {
          this.blog = res.data
          this.blogHtml = md.render(res.data.content || '')
          this.outline = this.parseOutline(res.data.content || '')
          // 动画显示阅读量
          this.animateViewCount(res.data.viewCount)
          
          await nextTick()
          this.calcTocTop()
          // 处理图片点击预览
          this.setupImagePreview()
        } else {
          this.error = true
        }
      } catch (e) {
        this.error = true
        this.$message.error('加载博客详情失败：' + (e && e.message ? e.message : '未知错误'))
      } finally {
        this.loading = false
      }
    },

    // 解析markdown标题生成目录
    parseOutline(markdown) {
      const lines = markdown.split('\n')
      const outlineArr = []
      lines.forEach(line => {
        const match = line.match(/^(#{1,6})\s+(.+)/)
        if (match) {
          const level = match[1].length
          const text = match[2]
          const id = text.toLowerCase().replace(/\s+/g, '-')
          outlineArr.push({ id, text, level })
        }
      })
      return outlineArr
    },

    // 动画显示阅读量
    animateViewCount(target) {
      const duration = 800 // ms
      const start = this.animatedViewCount
      const end = Number(target) || 0
      const startTime = performance.now()
      const update = (now) => {
        const elapsed = now - startTime
        if (elapsed < duration) {
          this.animatedViewCount = Math.floor(start + (end - start) * (elapsed / duration))
          requestAnimationFrame(update)
        } else {
          this.animatedViewCount = end
        }
      }
      requestAnimationFrame(update)
    },

    // 生成柔和的随机标签颜色
    generateRandomColor() {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 30 + Math.floor(Math.random() * 40); // 30-70%饱和度
      const lightness = 55 + Math.floor(Math.random() * 15); // 55-70%亮度
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },

    // 计算目录吸顶位置
    calcTocTop() {
      if (this.tocRef) {
        const rect = this.tocRef.getBoundingClientRect()
        this.tocTop = rect.top + window.scrollY
      }
    },

    // 处理滚动事件
    handleScroll() {
      if (!this.tocRef || !this.containerRef) return
      const scrollY = window.scrollY || window.pageYOffset
      this.isFixed = scrollY + 16 >= this.tocTop // 16为吸顶时的顶部间距
      
      if (this.isFixed) {
        // 计算主容器右上角的left/top
        const containerRect = this.containerRef.getBoundingClientRect()
        const tocRect = this.tocRef.getBoundingClientRect()
        const left = containerRect.right - tocRect.width
        const NAV_HEIGHT = 80; // 导航栏高度
        const top = NAV_HEIGHT + (containerRect.top > 0 ? containerRect.top : 0)
        this.tocFixedStyle = {
          position: 'fixed',
          left: left + 'px',
          top: top + 'px',
          minWidth: '180px',
          maxWidth: '260px',
          zIndex: 10
        }
      } else {
        this.tocFixedStyle = {}
      }

      // 目录高亮逻辑
      const headings = Array.from(this.containerRef.querySelectorAll('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]'))
      let current = ''
      for (let i = 0; i < headings.length; i++) {
        const el = headings[i]
        if (el.getBoundingClientRect().top + window.scrollY - 100 <= scrollY) {
          current = el.id
        }
      }
      this.activeId = current
    },

    // 设置图片预览
    setupImagePreview() {
      const imgs = this.containerRef?.querySelectorAll('.blog-content img') || []
      this.previewImages = Array.from(imgs).map(img => img.src)
      imgs.forEach((img, idx) => {
        img.style.cursor = 'pointer'
        img.onclick = () => {
          this.previewIndex = idx
          this.previewVisible = true
        }
      })
    },

    // 格式化日期
    formatDate(val) {
      return val && dayjs(val).isValid() ? dayjs(val).format('YYYY年MM月DD日 HH:mm') : ''
    },

    // 获取状态类型
    getStatusType(status) {
      const types = {
        0: 'warning',
        1: 'success',
        2: 'primary',
        3: 'danger'
      }
      return types[status] || 'info'
    },

    // 获取状态文本
    getStatusText(status) {
      const texts = {
        0: '草稿',
        1: '已发布',
        2: '待审核',
        3: '审核不通过'
      }
      return texts[status] || '未知状态'
    },

    // 返回列表
    goBack() {
      this.$router.push({ name: 'BlogList' })
    },

    // 编辑博客
    goEdit() {
      this.$router.push({ name: 'BlogEdit', params: { id: this.blog.id } })
    }
  }
}
</script>

<style scoped>
.blog-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.blog-detail-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
}

.blog-header-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.blog-detail-cover {
  width: 100%;
  max-width: 100%;
  margin-bottom: 32px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.blog-detail-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.blog-detail-main {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
}

.blog-detail-content {
  flex: 5 1 0%;
  max-width: 75%;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 32px 24px;
  margin-bottom: 32px;
  border: 1px solid #eee;
}

.blog-title {
  font-size: 2.2rem;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
  line-height: 1.4;
}

.blog-meta {
  color: #888;
  font-size: 0.98rem;
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  background: #bbb;
  border-radius: 50%;
  display: inline-block;
  margin: 0 8px;
}

.blog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.blog-tags .tag-item {
  padding: 4px 12px;
  border-radius: 8px;
}

.blog-summary {
  margin-bottom: 25px;
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-left: 4px solid #409eff;
  border-radius: 0 4px 4px 0;
}

.blog-summary h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #409eff;
}

.blog-summary p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.blog-content {
  margin-bottom: 32px;
  color: #333;
  line-height: 1.8;
  font-size: 16px;
}

/* Markdown样式 */
.blog-content :deep(h1) {
  font-size: 24px;
  margin: 25px 0 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  font-weight: bold;
}

.blog-content :deep(h2) {
  font-size: 20px;
  margin: 20px 0 12px;
  font-weight: bold;
}

.blog-content :deep(h3) {
  font-size: 18px;
  margin: 18px 0 10px;
  font-weight: bold;
}

.blog-content :deep(h4),
.blog-content :deep(h5),
.blog-content :deep(h6) {
  font-size: 16px;
  margin: 16px 0 10px;
  font-weight: bold;
}

.blog-content :deep(p) {
  margin: 12px 0;
}

.blog-content :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.blog-content :deep(a:hover) {
  text-decoration: underline;
}

.blog-content :deep(code) {
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
}

.blog-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 15px 0;
}

.blog-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.blog-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 15px;
  margin: 15px 0;
  color: #666;
  background-color: #f9f9f9;
  padding: 10px 15px;
  border-radius: 0 4px 4px 0;
}

.blog-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  cursor: pointer;
}

.blog-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.blog-content :deep(th),
.blog-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.blog-content :deep(th) {
  background-color: #f5f5f5;
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  padding-left: 25px;
  margin: 12px 0;
}

.blog-content :deep(li) {
  margin: 6px 0;
}

.blog-status {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.blog-status .el-tag {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* 目录样式 */
.blog-detail-toc {
  flex: 1 1 0%;
  min-width: 180px;
  max-width: 260px;
  width: 100%;
  position: sticky;
  top: 0;
  align-self: flex-start;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 24px 16px 24px 24px;
  min-height: 120px;
  max-height: 70vh;
  overflow-y: auto;
  transition: box-shadow 0.2s, position 0.2s;
  z-index: 10;
}

.blog-detail-toc.is-fixed {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.toc-title {
  font-weight: bold;
  font-size: 1.15em;
  margin-bottom: 16px;
  color: #222;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-list li {
  margin-bottom: 8px;
  color: #888;
  transition: color 0.2s;
  border-left: 2px solid transparent;
  padding-left: 4px;
}

.toc-list li.active > a {
  color: #409eff;
  font-weight: bold;
}

.toc-list a {
  color: inherit;
  text-decoration: none;
  font-size: 15px;
  display: block;
  padding: 2px 0;
}

.toc-list a:hover {
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 900px) {
  .blog-detail-main {
    flex-direction: column;
    gap: 0;
  }
  .blog-detail-toc {
    display: none;
  }
  .blog-detail-content {
    max-width: 100%;
    padding: 16px 12px;
  }
  .blog-detail-cover {
    height: 200px;
    margin-bottom: 16px;
  }
  .blog-title {
    font-size: 1.6rem;
  }
}

@media (max-width: 600px) {
  .blog-meta {
    font-size: 0.92rem;
    gap: 6px;
  }
  .dot {
    margin: 0 4px;
  }
}
</style>