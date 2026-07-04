<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>{{ isEdit ? '编辑博客' : '新建博客' }}</span>
      </div>
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" />
        </el-form-item>
        <el-form-item label="内容">
          <mavon-editor v-model="form.content" style="min-height: 400px;" />
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="form.coverImage" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="form.tagIds"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择标签"
            style="width: 100%;"
            @change="handleTagChange"
          >
            <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%;">
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">草稿</el-radio>
            <el-radio :label="2">待审核</el-radio>
            <el-radio :label="1">已发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="form.isRecommend" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="开启评论">
          <el-switch v-model="form.enableComment" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <div style="text-align:right;">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </div>
    </el-card>
  </div>
</template>
<script>
import 'mavon-editor/dist/css/index.css'
import { mavonEditor } from 'mavon-editor'
import { getBlogDetail, createBlog, updateBlog } from '@/api/modules/blog'
import { getTags } from '@/api/modules/tag'
import { getCategoriesByBlog } from '@/api/modules/relation/categoryBlogRelation'
import { getCategories } from '@/api/modules/category'
export default {
  name: 'BlogEdit',
  components: { mavonEditor },
  computed: {
    // 从 store 获取当前登录用户ID
    currentUserId() {
      return this.$store.getters.userId || 1
    }
  },
  data() {
    return {
      form: {
        title: '',
        summary: '',
        content: '',
        coverImage: '',
        authorId: null, // 不再硬编码，在 created 中从用户信息获取
        tagIds: [],
        categoryId: null,
        status: 0,
        isRecommend: 0,
        isTop: 0,
        enableComment: 1
      },
      tagList: [],
      categoryList: [],
      isEdit: false,
      cacheKey: 'blog-edit-cache'
    }
  },
  async created() {
    // 设置当前登录用户为作者
    this.form.authorId = this.currentUserId
    
    // 新建时优先恢复缓存
    const cache = localStorage.getItem(this.cacheKey)
    if (cache && !this.$route.params.id) {
      const cachedData = JSON.parse(cache)
      Object.assign(this.form, cachedData)
      // 缓存中的 authorId 不覆盖，始终使用当前登录用户
      this.form.authorId = this.currentUserId
    }
    
    // 并行获取标签和分类列表，提升性能
    const [tagRes, catRes] = await Promise.all([
      typeof getTags === 'function' ? getTags() : { data: [] },
      typeof getCategories === 'function' ? getCategories() : { data: [] }
    ])
    this.tagList = tagRes.data || []
    this.categoryList = catRes.data || []
    
    if (this.$route.params.id) {
      this.isEdit = true
      try {
        const res = await getBlogDetail(this.$route.params.id)
        const blogData = res.data || {}
        
        // 逐个字段赋值，保留form的初始默认值（特别是tagIds数组）
        if (blogData.title !== undefined) this.form.title = blogData.title
        if (blogData.content !== undefined) this.form.content = blogData.content
        if (blogData.summary !== undefined) this.form.summary = blogData.summary
        if (blogData.cover !== undefined) this.form.cover = blogData.cover
        if (blogData.status !== undefined) this.form.status = blogData.status
        if (blogData.authorId !== undefined) this.form.authorId = blogData.authorId
        
        // 标签回显：确保tagIds始终为数组类型
        if (Array.isArray(blogData.tags)) {
          this.form.tagIds = blogData.tags.map(t => t.id)
        } else {
          // 如果tags不是数组，保持初始空数组
          this.form.tagIds = []
        }
        
        // 分类回显：直接用详情里的 category.id
        if (blogData.category && blogData.category.id) {
          this.form.categoryId = blogData.category.id
        }
      } catch (error) {
        console.error('获取博客详情失败:', error)
        this.$message.error('获取博客详情失败')
      }
    }
  },
  watch: {
    form: {
      handler(val) {
        // 只在新建时缓存，编辑模式不缓存
        if (!this.isEdit) {
          localStorage.setItem(this.cacheKey, JSON.stringify(val))
        }
      },
      deep: true
    }
  },
  methods: {
    async handleTagChange(val) {
      // 检查是否有新标签（字符串类型）
      const newTags = val.filter(v => typeof v === 'string')
      if (newTags.length > 0) {
        // 使用 Promise.all 并行创建标签，提升性能
        const createPromises = newTags.map(tagName => 
          this.$axios.post('/v1/tag', { name: tagName })
        )
        
        const results = await Promise.all(createPromises)
        
        // 批量替换新标签名称为ID
        results.forEach((res, index) => {
          if (res.code === 200 && res.data && res.data.id) {
            const tagName = newTags[index]
            const idx = this.form.tagIds.indexOf(tagName)
            if (idx !== -1) {
              this.form.tagIds.splice(idx, 1, res.data.id)
            }
          }
        })
        
        // 只刷新一次标签列表
        const tagRes = await getTags()
        this.tagList = tagRes.data || []
      }
    },
    async handleSubmit() {
      if (!this.form.title) {
        this.$message.error({ message: '请输入标题', duration: 3000 })
        return
      }
      // 保证 categoryId 一定传递到主表
      const { tags, categories, ...submitData } = this.form
      submitData.categoryId = this.form.categoryId
      submitData.tagIds = this.form.tagIds // 保证 tagIds 一定传递
      if (this.isEdit) {
        // 编辑模式必须传递博客 id
        submitData.id = parseInt(this.$route.params.id)
        await updateBlog(submitData)
        this.$message.success('编辑成功')
      } else {
        await createBlog(submitData)
        this.$message.success('新建成功')
        localStorage.removeItem(this.cacheKey)
      }
      this.$router.back()
    }
  }
}
</script>
