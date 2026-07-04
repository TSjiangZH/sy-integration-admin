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
          <MarkdownEditor v-model="form.content" />
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
            <el-radio :label="'0'">草稿</el-radio>
            <el-radio :label="'2'">待审核</el-radio>
            <el-radio :label="'1'">已发布</el-radio>
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
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="warning" @click="handleSubmitReview">提交审核</el-button>
        <el-button type="primary" @click="handlePublish">发布</el-button>
      </div>
    </el-card>
  </div>
</template>
<script>
import { getBlogDetail, createBlog, updateBlog } from '@/api/modules/blog'
import { getTags, createTag } from '@/api/modules/tag'
import { getCategories } from '@/api/modules/category'
import MarkdownEditor from '@/components/MarkdownEditor'

export default {
  name: 'BlogEdit',
  components: { MarkdownEditor },
  data() {
    return {
      form: {
        title: '',
        summary: '',
        content: '',
        cover: '',
        authorId: 1,
        tagIds: [],
        categoryId: null,
        status: '0',
        isRecommend: 0,
        isTop: 0,
        enableComment: 1
      },
      isEdit: false,
      tagList: [],
      categoryList: []
    }
  },
  async created() {
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
        const blogData = (res && res.data) || {}
        if (blogData.title !== undefined) this.form.title = blogData.title
        if (blogData.content !== undefined) this.form.content = blogData.content
        if (blogData.summary !== undefined) this.form.summary = blogData.summary
        if (blogData.cover !== undefined) this.form.cover = blogData.cover
        if (blogData.status !== undefined) this.form.status = String(blogData.status)
        if (blogData.isRecommend !== undefined) this.form.isRecommend = blogData.isRecommend
        if (blogData.isTop !== undefined) this.form.isTop = blogData.isTop
        if (blogData.enableComment !== undefined) this.form.enableComment = blogData.enableComment
        if (Array.isArray(blogData.tags)) {
          this.form.tagIds = blogData.tags.map(t => t.id)
        }
        if (blogData.category && blogData.category.id) {
          this.form.categoryId = blogData.category.id
        }
      } catch (error) {
        console.error('获取博客详情失败:', error)
        this.$message.error('获取博客详情失败')
      }
    }
  },
  methods: {
    async handleTagChange(val) {
      const newTags = val.filter(v => typeof v === 'string')
      if (newTags.length > 0) {
        const createPromises = newTags.map(tagName => 
          createTag({ name: tagName })
        )
        try {
          const results = await Promise.all(createPromises)
          results.forEach((res, index) => {
            if (res.code === 200 && res.data && res.data.id) {
              const tagName = newTags[index]
              const idx = this.form.tagIds.indexOf(tagName)
              if (idx !== -1) {
                this.form.tagIds.splice(idx, 1, res.data.id)
              }
            }
          })
          const tagRes = await getTags()
          this.tagList = tagRes.data || []
        } catch (error) {
          this.$message.error('创建标签失败')
        }
      }
    },
    validateForm() {
      if (!this.form.title || this.form.title.trim() === '') {
        this.$message.error('请输入标题')
        return false
      }
      if (!this.form.categoryId) {
        this.$message.error('请选择分类')
        return false
      }
      if (!this.form.content || this.form.content.trim() === '') {
        this.$message.error('请输入内容')
        return false
      }
      return true
    },
    async handleSaveDraft() {
      if (!this.form.title || this.form.title.trim() === '') {
        this.$message.error('请输入标题')
        return
      }
      this.form.status = '0'
      await this.submitForm()
    },
    async handleSubmitReview() {
      if (!this.validateForm()) return
      this.form.status = '2'
      await this.submitForm()
    },
    async handlePublish() {
      if (!this.validateForm()) return
      this.form.status = '1'
      await this.submitForm()
    },
    async submitForm() {
      const submitData = { ...this.form }
      submitData.status = parseInt(this.form.status)
      if (this.isEdit) {
        submitData.id = parseInt(this.$route.params.id)
        try {
          await updateBlog(submitData)
          this.$message.success('编辑成功')
        } catch (error) {
          this.$message.error('编辑失败：' + (error.message || '未知错误'))
          return
        }
      } else {
        try {
          await createBlog(submitData)
          this.$message.success('新建成功')
        } catch (error) {
          this.$message.error('创建失败：' + (error.message || '未知错误'))
          return
        }
      }
      this.$router.back()
    },
    handleCancel() {
      this.$router.back()
    }
  }
}
</script>
<style scoped>
</style>
