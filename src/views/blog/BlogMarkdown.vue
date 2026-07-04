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
        <el-form-item label="封面图片" prop="coverImage">
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
            <el-input v-model="form.coverImage" placeholder="请输入图片外链" />
          </div>
          <img v-if="form.coverImage && typeof form.coverImage === 'string' && form.coverImage.trim() !== ''" :src="form.coverImage" style="max-width: 200px; margin-top: 8px;" />
        </el-form-item>

        <el-form-item label="摘要" prop="summary">
          <el-input type="textarea" v-model="form.summary" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <mavon-editor v-model="form.content" style="min-height: 400px;" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">草稿</el-radio>
            <el-radio :label="1">已发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="推荐" prop="isRecommend">
          <el-switch v-model="form.isRecommend" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="置顶" prop="isTop">
          <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <!-- 只读统计字段，仅编辑时显示 -->
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
      <!-- 博客预览弹窗 -->
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
        <img v-if="form.coverImage && typeof form.coverImage === 'string' && form.coverImage.trim() !== ''" :src="form.coverImage" style="max-width: 300px; margin-bottom: 16px;" >
        <mavon-editor :value="form.content" :subfield="false" :defaultOpen="'preview'" :editable="false" />
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import 'mavon-editor/dist/css/index.css'
import { mavonEditor } from 'mavon-editor'
import { getBlogDetail, createBlog, updateBlog } from '@/api/modules/blog'
import { getTags, addBlogTags } from '@/api/modules/tag'
import { getCategories } from '@/api/modules/category'

export default {
  components: { mavonEditor },
  data() {
    return {
      form: {
        id: null,
        title: '',
        summary: '',
        content: '',
        coverImage: '',
        authorId: this.$store.getters.userId || 1,
        status: 0,
        isRecommend: 0,
        isTop: 0,
        tags: [],
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        categoryId: null,
        enableComment: 1
      },
      tagList: [],
      categoryList: [],
      isEdit: false,
      rules: {
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
        categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
        tags: [{ required: true, type: 'array', min: 1, message: '请选择标签', trigger: 'change' }]
      },
      previewVisible: false,
      uploadAction: '/v1/image/upload/local',
      uploadHeaders: {},
      coverType: 'local'

    }
  },
  async created() {
    // 获取标签列表
    const tagRes = await getTags()
    this.tagList = tagRes.data || []
    // 获取分类列表
    const categoryRes = await getCategories()
    this.categoryList = categoryRes.data || []

    // 编辑模式加载详情
    if (this.$route.params.id) {
      this.isEdit = true
      const res = await getBlogDetail(this.$route.params.id)
      if (res.data) {
        this.form = {
          ...this.form,
          ...res.data,
          tags: (res.data.tags || []).map(t => t.id),
          categoryId: res.data.category ? res.data.category.id : null
        }
      }
    }
  },
  methods: {
    getTagName(tagId) {
      const tag = this.tagList.find(t => t.id === tagId)
      return tag ? tag.name : tagId
    },
    getCategories() {
      return this.categoryList.map(cat => ({ id: cat.id, name: cat.name }))
    },

    handleCoverSuccess(res) {
      // 兼容后端返回格式
      this.form.coverImage = res.data && res.data.url ? res.data.url : (res.url || '')
      this.coverType = 'cloud' // 上传后自动切换到外链模式，方便预览和编辑
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
            // 提交时只传 tagIds，不传 tags 字段
            const { tags, ...submitData } = this.form
            submitData.tagIds = this.form.tags
            let res
            if (this.isEdit) {
              res = await updateBlog(submitData)
            } else {
              res = await createBlog(submitData)
            }
            if (res.code === 200) {
              // 保存标签关系
              const blogId = this.isEdit ? this.form.id : res.data.id
              try {
                await addBlogTags(blogId, this.form.tags)
              } catch (e) {
                this.$message.error('标签保存失败')
              }
              this.$message.success('保存成功')
              this.$router.back()
            } else {
              this.$message.error({ message: res.message || '保存失败', duration: 3000 })
            }
          } catch (e) {
            this.$message.error('保存失败：' + (e && e.message ? e.message : '未知错误'))
          }
        })
      } catch (e) {
        this.$message.error('保存失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    handlePreview() {
      this.previewVisible = true
    }
  }
}
</script>

<style scoped>
.markdown-editor-wrapper {
  margin-top: 16px;
}
.cover-uploader {
  display: inline-block;
}
</style>
