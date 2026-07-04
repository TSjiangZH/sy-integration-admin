<template>
  <div class="app-container image-manager-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>图片管理</span>
        <el-button style="margin-left: 10px;" type="primary" size="small" @click="openUploadDialog">上传图片</el-button>
        <div style="float: right; display: flex; gap: 10px;">
          <el-input v-model="searchName" placeholder="搜索文件名" style="width: 200px;" @keyup.enter.native="handleSearch" />
          <el-select v-model="source" placeholder="来源" style="width: 120px;" @change="handleSourceChange">
            <el-option label="全部" value="" />
            <el-option label="本地" value="local" />
            <el-option label="OSS" value="oss" />
            <el-option label="ImageHub" value="imagehub" />
            <el-option label="SMMS" value="smms" />
            <el-option label="七牛云" value="qiniu" />
          </el-select>
          <el-select v-model="fileType" placeholder="文件类型" style="width: 120px;" @change="handleFileTypeChange">
            <el-option label="全部" value="" />
            <el-option label="JPG" value="jpg" />
            <el-option label="PNG" value="png" />
            <el-option label="GIF" value="gif" />
            <el-option label="WEBP" value="webp" />
          </el-select>
          <el-button size="small" type="primary" @click="handleSearch">搜索</el-button>
        </div>
      </div>
      <div class="image-grid-wrapper">
        <el-row :gutter="16">
          <el-col :span="6" v-for="image in imageList" :key="image.id">
            <el-card class="image-card" hover>
              <div class="image-preview">
                <el-image :src="formatImageUrl(image.url)" fit="cover" @click="handlePreview(image)" />
              </div>
              <div class="image-info">
                <p class="image-name">{{ truncateName(image.name) }}</p>
                <div class="image-meta">
                  <el-tag size="mini" :type="getSourceTagType(image.source)">
                    {{ getSourceLabel(image.source) }}
                  </el-tag>
                  <span class="image-size">{{ formatSize(image.size) }}</span>
                </div>
              </div>
              <div class="image-actions">
                <el-button size="mini" @click.stop="handleCopyUrl(image)">复制链接</el-button>
                <el-button size="mini" type="danger" @click.stop="handleDelete(image)">删除</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      <div v-if="imageList.length === 0" class="empty-state">
        <el-empty description="暂无图片" />
      </div>
      <el-pagination
        style="margin-top: 16px; text-align: right;"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-dialog :visible.sync="previewVisible" width="800px" title="图片预览" append-to-body>
      <img :src="previewUrl" style="width: 100%" />
      <div slot="footer">
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleCopyUrl(currentPreviewImage)">复制链接</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="uploadDialogVisible" title="上传图片" width="500px" append-to-body>
      <div class="upload-form">
        <el-form :model="uploadForm" label-width="100px">
          <el-form-item label="存储策略">
            <el-select v-model="uploadForm.storageType" placeholder="请选择存储策略" @change="onStorageTypeChange">
              <el-option
                v-for="(strategy, key) in availableStrategies"
                :key="key"
                :label="strategy.description"
                :value="key"
                :disabled="!strategy.enabled"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="自定义文件名">
            <el-input v-model="uploadForm.customName" placeholder="可选，不含扩展名" />
          </el-form-item>
          <el-form-item label="图片描述">
            <el-input v-model="uploadForm.description" type="textarea" :rows="2" placeholder="可选" />
          </el-form-item>
          <el-form-item>
            <el-upload
              :auto-upload="false"
              :show-file-list="true"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :file-list="uploadFileList"
              :limit="10"
              action="#"
              multiple
            >
              <el-button size="small" type="primary">选择图片</el-button>
              <div slot="tip" class="el-upload__tip">支持 JPG、PNG、GIF、WEBP，单个文件不超过50MB</div>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeUploadDialog">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchImageList, deleteImage } from '@/api/modules/image'
import { listStrategies, uploadImage, uploadWithCustomName } from '@/api/modules/imageStorage'

export default {
  name: 'ImageManager',
  data() {
    return {
      imageList: [],
      total: 0,
      page: 1,
      pageSize: 12,
      source: '',
      searchName: '',
      fileType: '',
      previewVisible: false,
      previewUrl: '',
      currentPreviewImage: null,
      uploadDialogVisible: false,
      uploadForm: {
        storageType: '',
        customName: '',
        description: ''
      },
      uploadFileList: [],
      availableStrategies: {},
      uploading: false
    }
  },
  created() {
    this.fetchList()
    this.loadStrategies()
  },
  methods: {
    async loadStrategies() {
      try {
        const res = await listStrategies()
        this.availableStrategies = res.data || {}
        const firstEnabled = Object.keys(this.availableStrategies).find(key => this.availableStrategies[key].enabled)
        if (firstEnabled) {
          this.uploadForm.storageType = firstEnabled
        }
      } catch (err) {
        this.$message.error('加载存储策略失败')
      }
    },
    formatImageUrl(url) {
      if (!url) return ''
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      return process.env.VUE_APP_BASE_API + url
    },
    truncateName(name) {
      if (!name) return ''
      return name.length > 20 ? name.substring(0, 20) + '...' : name
    },
    formatSize(size) {
      if (!size) return ''
      if (size < 1024) return size + ' B'
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
      return (size / (1024 * 1024)).toFixed(1) + ' MB'
    },
    getSourceTagType(source) {
      const types = {
        local: 'info',
        oss: 'success',
        imagehub: 'warning',
        smms: 'danger',
        qiniu: 'primary'
      }
      return types[source] || 'info'
    },
    getSourceLabel(source) {
      const labels = {
        local: '本地',
        oss: 'OSS',
        imagehub: 'ImageHub',
        smms: 'SMMS',
        qiniu: '七牛云'
      }
      return labels[source] || source
    },
    async fetchList(page = this.page) {
      try {
        this.page = Number(page) || 1
        let queryType = this.fileType
        if (queryType) {
          queryType = `image/${queryType}`
        }
        const queryParams = {
          page: this.page,
          limit: this.pageSize,
          source: this.source,
          name: this.searchName,
          type: queryType
        }
        const res = await fetchImageList(queryParams)
        this.imageList = (res.data.items || []).map(item => ({
          ...item,
          url: this.formatImageUrl(item.url)
        }))
        this.total = res.data.total || 0
      } catch (err) {
        this.$message.error('图片列表加载失败')
      }
    },
    handlePageChange(val) {
      this.page = Number(val) || 1
      this.fetchList(this.page)
    },
    handleSourceChange(val) {
      this.source = val
      this.page = 1
      this.fetchList(1)
    },
    handleFileTypeChange(val) {
      this.fileType = val
      this.page = 1
      this.fetchList(1)
    },
    handleSearch() {
      this.page = 1
      this.fetchList(1)
    },
    handlePreview(image) {
      this.previewUrl = image.url
      this.currentPreviewImage = image
      this.previewVisible = true
    },
    handleCopyUrl(image) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(image.url).then(() => {
          this.$message.success('图片链接已复制')
        })
      } else {
        const input = document.createElement('input')
        input.value = image.url
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.$message.success('图片链接已复制')
      }
    },
    async handleDelete(image) {
      try {
        await this.$confirm('确定要删除该图片吗？', '删除确认', { type: 'warning' })
        await deleteImage(image.id)
        this.$message.success('删除成功')
        this.fetchList()
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    openUploadDialog() {
      this.uploadForm = {
        storageType: '',
        customName: '',
        description: ''
      }
      this.uploadFileList = []
      this.loadStrategies().then(() => {
        this.uploadDialogVisible = true
      })
    },
    closeUploadDialog() {
      this.uploadDialogVisible = false
      this.uploadForm = {
        storageType: '',
        customName: '',
        description: ''
      }
      this.uploadFileList = []
    },
    onStorageTypeChange() {
    },
    handleFileChange(file, fileList) {
      this.uploadFileList = fileList
    },
    handleFileRemove(file, fileList) {
      this.uploadFileList = fileList
    },
    async handleUpload() {
      if (!this.uploadForm.storageType) {
        this.$message.error('请选择存储策略')
        return
      }
      if (this.uploadFileList.length === 0) {
        this.$message.error('请选择要上传的图片')
        return
      }

      this.uploading = true
      let successCount = 0
      let failCount = 0

      try {
        for (const item of this.uploadFileList) {
          const formData = new FormData()
          formData.append('file', item.raw)
          formData.append('description', this.uploadForm.description)

          try {
            if (this.uploadForm.customName) {
              await uploadWithCustomName(this.uploadForm.storageType, formData, this.uploadForm.customName)
            } else {
              await uploadImage(this.uploadForm.storageType, formData)
            }
            successCount++
          } catch (err) {
            failCount++
          }
        }

        if (successCount > 0) {
          this.$message.success(`成功上传 ${successCount} 张图片${failCount > 0 ? `，失败 ${failCount} 张` : ''}`)
          this.fetchList()
          this.closeUploadDialog()
        } else {
          this.$message.error('上传全部失败')
        }
      } catch (err) {
        this.$message.error('上传失败')
      } finally {
        this.uploading = false
      }
    }
  }
}
</script>

<style scoped>
.image-manager-container {
  padding: 24px 0 0 0;
}

.image-grid-wrapper {
  padding: 0 8px;
}

.image-card {
  height: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.image-preview {
  flex: 1;
  overflow: hidden;
  border-radius: 4px;
}

.image-preview img {
  width: 100%;
  height: 140px;
  cursor: pointer;
}

.image-info {
  padding: 8px 0;
}

.image-name {
  margin: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.image-size {
  font-size: 12px;
  color: #999;
}

.image-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  padding: 40px 0;
}

.upload-form {
  max-height: 400px;
  overflow-y: auto;
}

.dialog-footer {
  text-align: right;
}
</style>