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
import { addBlogCategory, getCategoriesByBlog } from '@/api/modules/relation/categoryBlogRelation'
import { getCategories } from '@/api/modules/category'
import { addBlogTags } from '@/api/modules/tag'
export default {
  name: 'BlogEdit',
  components: { mavonEditor },
  data() {
    return {
      form: {
        title: '',
        summary: '',
        content: '',
        coverImage: '',
        authorId: 1,
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
    // 新建时优先恢复缓存
    const cache = localStorage.getItem(this.cacheKey)
    if (cache && !this.$route.params.id) {
      Object.assign(this.form, JSON.parse(cache))
    }
    // 获取标签列表
    if (typeof getTags === 'function') {
      const tagRes = await getTags()
      this.tagList = tagRes.data || []
    }
    // 获取分类列表
    if (typeof getCategories === 'function') {
      const catRes = await getCategories()
      this.categoryList = catRes.data || []
    }
    if (this.$route.params.id) {
      this.isEdit = true
      const res = await getBlogDetail(this.$route.params.id)
      this.form = res.data || {}
      if (res.data && Array.isArray(res.data.tags)) {
        this.form.tagIds = res.data.tags.map(t => t.id)
      }
      // 分类回显：直接用详情里的 category.id
      if (res.data && res.data.category && res.data.category.id) {
        this.form.categoryId = res.data.category.id
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
        for (const tagName of newTags) {
          // 调用后端新增标签接口
          const res = await this.$axios.post('/v1/tag', { name: tagName })
          if (res.code === 200 && res.data && res.data.id) {
            // 替换为新ID
            const idx = this.form.tagIds.indexOf(tagName)
            if (idx !== -1) this.form.tagIds.splice(idx, 1, res.data.id)
            // 刷新标签列表
            const tagRes = await getTags()
            this.tagList = tagRes.data || []
          }
        }
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
        await updateBlog(submitData)
        await addBlogCategory(this.form.id, this.form.categoryId)
        await addBlogTags(this.form.id, this.form.tagIds)
        this.$message.success('编辑成功')
      } else {
        const res = await createBlog(submitData)
        if (res && res.data && res.data.id) {
          await addBlogCategory(res.data.id, this.form.categoryId)
          await addBlogTags(res.data.id, this.form.tagIds)
        }
        this.$message.success('新建成功')
        localStorage.removeItem(this.cacheKey)
      }
      this.$router.back()
    }
  }
}
</script>
