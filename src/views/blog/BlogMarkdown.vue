<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>{{ isEdit ? '编辑博客' : '新建博客' }}</span>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select v-model="form.tags" multiple placeholder="请选择标签" style="width: 100%;">
            <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
          <div style="margin-top: 8px;">
            <el-tag
              v-for="tagId in form.tags"
              :key="tagId"
              type="success"
              style="margin-right: 4px;"
            >
              {{ getTagName(tagId) }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%;">
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图片" prop="cover">
          <el-radio-group v-model="coverType" size="small" style="margin-bottom: 8px;">
            <el-radio-button label="local">本地上传</el-radio-button>
            <el-radio-button label="cloud">云盘/外链</el-radio-button>
          </el-radio-group>
          <div v-if="coverType === 'local'">
            <el-upload
              class="cover-uploader"
              :action="uploadAction"
              :show-file-list="false"
              :on-success="handleCoverSuccess"
              :before-upload="beforeCoverUpload"
              :headers="uploadHeaders"
            >
              <el-button size="small" type="primary">本地上传</el-button>
            </el-upload>
          </div>
          <div v-else>
            <el-input v-model="form.cover" placeholder="请输入图片外链" />
          </div>
          <img v-if="form.cover && typeof form.cover === 'string' && form.cover.trim() !== ''" :src="form.cover" style="max-width: 200px; margin-top: 8px;" />
        </el-form-item>
        <el-form-item label="摘要" prop="summary">
          <el-input type="textarea" v-model="form.summary" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <MarkdownEditor v-model="form.content" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">草稿</el-radio>
            <el-radio :label="2">待审核</el-radio>
            <el-radio :label="1">已发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="推荐" prop="isRecommend">
          <el-switch v-model="form.isRecommend" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="置顶" prop="isTop">
          <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="浏览量" v-if="isEdit">
          <el-input v-model="form.viewCount" disabled />
        </el-form-item>
        <el-form-item label="点赞量" v-if="isEdit">
          <el-input v-model="form.likeCount" disabled />
        </el-form-item>
        <el-form-item label="评论量" v-if="isEdit">
          <el-input v-model="form.commentCount" disabled />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
          <el-button @click="handlePreview">预览</el-button>
        </el-form-item>
      </el-form>
      <el-dialog :visible.sync="previewVisible" width="60%" title="博客预览">
        <h2>{{ form.title }}</h2>
        <div style="color: #888; margin-bottom: 8px;">摘要：{{ form.summary }}</div>
        <div style="margin-bottom: 8px;">
          <el-tag
            v-for="tagId in form.tags"
            :key="tagId"
            type="success"
            style="margin-right: 4px;"
          >
            {{ getTagName(tagId) }}
          </el-tag>
        </div>
        <img v-if="form.cover && typeof form.cover === 'string' && form.cover.trim() !== ''" :src="form.cover" style="max-width: 300px; margin-bottom: 16px;" >
        <v-md-editor mode="preview" :value="form.content" />
      </el-dialog>
    </el-card>
  </div>
</template>
<script>
import { getBlogDetail, createBlog, updateBlog } from '@/api/modules/blog'
import { getTags, addBlogTags } from '@/api/modules/tag'
import { getCategories } from '@/api/modules/category'
import MarkdownEditor from '@/components/MarkdownEditor'

export default {
  name: 'BlogMarkdown',
  components: { MarkdownEditor },
  data() {
    return {
      form: {
        id: null,
        title: '',
        summary: '',
        content: '',
        cover: '',
        authorId: this.$store.getters.userId || 1,
        status: 0,
        isRecommend: 0,
        isTop: 0,
        tags: [],
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      },
      tagList: [],
      categoryList: [],
      coverType: 'local',
      previewVisible: false,
      uploadAction: '/v1/image/upload/local'
    }
  },
  computed: {
    uploadHeaders() {
      return {
        'Authorization': 'Bearer ' + this.$store.getters.token
      }
    },
    isEdit() {
      return !!this.$route.params.id
    },
    rules() {
      return {
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
        categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
      }
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
      try {
        const res = await getBlogDetail(this.$route.params.id)
        const blogData = res.data || {}
        Object.assign(this.form, blogData)
        if (Array.isArray(blogData.tags)) {
          this.form.tags = blogData.tags.map(t => t.id)
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
    getTagName(tagId) {
      const tag = this.tagList.find(t => t.id === tagId)
      return tag ? tag.name : tagId
    },
    handleCoverSuccess(res) {
      this.form.cover = res.data && res.data.url ? res.data.url : (res.url || '')
      this.$message.success('封面上传成功')
    },
    beforeCoverUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isImage) {
        this.$message.error({ message: '只能上传图片文件!', duration: 3000 })
      }
      if (!isLt5M) {
        this.$message.error({ message: '图片大小不能超过5MB!', duration: 3000 })
      }
      return isImage && isLt5M
    },
    async handleSubmit() {
      try {
        this.$refs.formRef.validate(async valid => {
          if (!valid) return
          try {
            const { tags, ...submitData } = this.form
            submitData.tagIds = this.form.tags
            let res
            if (this.isEdit) {
              res = await updateBlog(submitData)
            } else {
              res = await createBlog(submitData)
            }
            if (res && res.code === 200) {
              this.$message.success('保存成功')
              this.$router.back()
            } else {
              this.$message.error('保存失败')
            }
          } catch (error) {
            console.error('保存失败:', error)
            this.$message.error('保存失败：' + (error.message || '未知错误'))
          }
        })
      } catch (error) {
        console.error('验证失败:', error)
      }
    },
    handlePreview() {
      this.previewVisible = true
    }
  }
}
</script>
<style scoped>
</style>
