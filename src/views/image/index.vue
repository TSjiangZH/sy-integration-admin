<template>
  <div class="app-container image-manager-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>图片管理</span>
        <el-button style="margin-left: 10px;" type="primary" size="small" @click="uploadDialogVisible = true">上传图片</el-button>
        <div style="float: right; display: flex; gap: 10px;">
          <el-input v-model="searchName" placeholder="搜索文件名" style="width: 200px;" @keyup.enter.native="handleSearch" />
          <el-select v-model="source" placeholder="来源" style="width: 120px;" @change="handleSourceChange">
            <el-option label="全部" value="" />
            <el-option label="本地" value="local" />
            <el-option label="云盘" value="cloud" />
          </el-select>
          <el-select v-model="fileType" placeholder="文件类型" style="width: 120px;" @change="handleFileTypeChange">
            <el-option label="全部" value="" />
            <el-option label="JPG" value="jpg" />
            <el-option label="JPEG" value="jpeg" />
            <el-option label="PNG" value="png" />
            <el-option label="GIF" value="gif" />
            <el-option label="WEBP" value="webp" />
            <el-option label="BMP" value="bmp" />
            <el-option label="TIFF" value="tiff" />
          </el-select>
          <el-button size="small" type="primary" @click="handleSearch">搜索</el-button>
        </div>
      </div>
      <div class="image-table-wrapper">
        <div style="width: 100%; overflow-x: auto;">
          <el-table
            :data="imageList"
            style="width: 100%;"
            height="500"
            border
            stripe
            size="small"
          >
            <el-table-column label="缩略图" width="100" align="center">
              <template slot-scope="scope">
                <el-image :src="scope.row.url" style="width: 60px; height: 60px" :preview-src-list="[scope.row.url]" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="文件名" />
            <el-table-column prop="type" label="类型" align="center" />
            <el-table-column prop="size" label="大小" align="center">
              <template slot-scope="scope">
                {{ (scope.row.size / 1024).toFixed(1) }} KB
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" align="center">
              <template slot-scope="scope">
                <el-tag :type="scope.row.source === 'cloud' ? 'success' : 'info'">
                  {{ scope.row.source === 'cloud' ? '云盘' : '本地' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center">
              <template slot-scope="scope">
                <el-button size="mini" @click="openActionPanel(scope.row)">操作</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
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
    <el-dialog :visible.sync="previewVisible" width="600px">
      <img :src="previewUrl" style="width: 100%" />
    </el-dialog>
    <el-dialog :visible.sync="uploadDialogVisible" title="上传图片" width="400px">
      <el-radio-group v-model="uploadType" style="margin-bottom: 16px;">
        <el-radio label="local">本地上传</el-radio>
        <el-radio label="cloud">云盘地址</el-radio>
      </el-radio-group>
      <div style="margin-bottom: 16px;">
        <el-input v-model="imageName" placeholder="图片名称" />
      </div>
      <div style="margin-bottom: 16px;">
        <el-input
          v-model="imageDescription"
          type="textarea"
          placeholder="描述"
          :rows="3"
        />
      </div>
      <div v-if="uploadType === 'local'" style="text-align:center;">
        <el-upload
          :auto-upload="false"
          :show-file-list="true"
          :on-change="handleFileChange"
          :file-list="uploadFileList"
          action="#"
        >
          <el-button size="small" type="primary">选择文件</el-button>
        <div v-if="uploadFile" style="margin-top: 16px; text-align: center;">
          <img :src="uploadPreviewUrl" style="max-width: 100%; max-height: 200px;" />
        </div>
        </el-upload>
      </div>
      <div v-else style="text-align:center;">
        <el-input
          v-model="cloudUrl"
          placeholder="请输入云盘图片地址"
          @input="validateCloudUrl"
          :validate-event="false"
        />
        <div v-if="!cloudUrlValid && cloudUrl" style="color: #f56c6c; font-size: 12px; margin-top: 4px;">
          请输入有效的URL地址
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUploadConfirm">上传</el-button>
      </span>
    </el-dialog>
    <ActionPanel v-model="actionPanelVisible" :title="'操作面板'" @close="closeActionPanel">
      <el-button size="mini" type="danger" @click="handleDelete(currentRow)">删除</el-button>
      <el-button size="mini" @click="handlePreview(currentRow)">预览</el-button>
      <el-button v-if="currentRow.source === 'cloud'" size="mini" type="primary" plain @click="handleCopyUrl(currentRow)">复制地址</el-button>
    </ActionPanel>
  </div>
</template>

<script>
import { fetchImageList, fetchCloudImageList, uploadLocalImage, uploadCloudImage, deleteImage } from '@/api/modules/image'
import ActionPanel from '@/components/ActionPanel.vue'
export default {
  components: {
    ActionPanel
  },
  data() {
    return {
      imageList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      source: '',
      searchName: '',
      fileType: '',
      uploadHeaders: {}, // 如需token可加
      previewVisible: false,
      previewUrl: '',
      uploadDialogVisible: false,
      uploadType: 'local',
      uploadFile: null,
      uploadFileList: [],
      uploadPreviewUrl: '',
      cloudUrl: '',
      cloudUrlValid: false,
      actionPanelVisible: false,
      currentRow: {},
      deleteType: 'false', // 默认事实删除
      // 图片属性
      imageName: '',
      imageDescription: '',
      // 上传配置属性
      uploadConfig: {
        local: {
          maxSize: 5 * 1024 * 1024, // 5MB
          accept: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        },
        cloud: {
          validatePattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/ // URL验证正则
        }
      }
    }
  },
  created() {
    this.fetchList()
  },
  methods: {
    /**
     * 格式化图片URL，确保路径正确
     */
    formatImageUrl(url) {
      if (!url) return '';

      // 已经是完整URL的情况
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // 先移除可能存在的前导斜杠
      let processedUrl = url.replace(/^\/+|^/, '');

      // 移除可能存在的upload/前缀
      processedUrl = processedUrl.replace(/^upload\//i, '');

      // 添加正确的前缀
      return `/upload/${processedUrl}`;
    },
    async fetchList(page = this.page) {
      try {
        this.page = Number(page) || 1

        // 构建查询参数
        // 将前端简单类型转换为后端期望的MIME类型
        let queryType = this.fileType;
        if (queryType) {
          queryType = `image/${queryType}`;
        }
        const queryParams = {
          page: this.page,
          limit: this.pageSize,
          source: this.source,
          name: this.searchName,
          type: queryType
        };
        // console.log('查询参数:', queryParams);

        if (this.source === 'cloud') {
          const res = await fetchCloudImageList(queryParams)
          this.imageList = (res.data?.items || []).map(item => ({
            ...item,
            url: this.formatImageUrl(item.url)
          }))
          this.total = res.data?.total || 0
        } else {
          const res = await fetchImageList(queryParams)
          this.imageList = (res.data.items || []).map(item => {
            // 调试URL
            // console.log('原始图片URL:', item.url);
            const processedUrl = this.formatImageUrl(item.url);
            // console.log('处理后图片URL:', processedUrl);
            return {
              ...item,
              url: processedUrl
            };
          })
          this.total = res.data.total || 0
        }
      } catch (err) {
        let msg = '图片列表加载失败'
        if (typeof err?.response?.data === 'string' && err.response.data.startsWith('<!DOCTYPE')) {
          msg = '图片列表加载失败（接口404）'
        }
        this.$message.error({ message: msg, duration: 3000 })
      }
    },
    handlePageChange(val) {
      this.page = Number(val) || 1
      this.fetchList(this.page)
    },
    handleSourceChange(val) {
      // console.log('切换来源筛选:', val);
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
    handleUploadSuccess() {
      this.$message.success('上传成功')
      this.fetchList()
    },
    beforeUpload(file) {
      // 本地文件类型校验
      if (!this.uploadConfig.local.accept.includes(file.type)) {
        this.$message.error({ message: `不支持的文件类型: ${file.type}`, duration: 3000 })
        return false
      }
      // 本地文件大小校验
      if (file.size > this.uploadConfig.local.maxSize) {
        this.$message.error({ message: `文件大小不能超过 ${this.uploadConfig.local.maxSize / (1024 * 1024)}MB`, duration: 3000 })
        return false
      }
      return true
    },
    validateCloudUrl() {
      // 云盘URL格式验证
      this.cloudUrlValid = this.uploadConfig.cloud.validatePattern.test(this.cloudUrl)
      if (!this.cloudUrlValid) {
        this.$message.warning({ message: '请输入有效的云盘图片URL', duration: 2000 })
      }
      return this.cloudUrlValid
    },
    async handleDelete(row) {
      try {
        // 显示删除类型选择对话框
        // 创建删除类型选择对话框
        const dialogContent = `
          <div>
            <p>确定要删除该图片吗？</p>
            <div style="margin-top: 10px;">
              <label style="margin-right: 15px;">
                <input type="radio" name="deleteType" value="false" checked> 事实删除（删除文件和数据库记录）
              </label>
              <label>
                <input type="radio" name="deleteType" value="true"> 逻辑删除（仅标记删除状态）
              </label>
            </div>
          </div>
        `;

        const { data } = await this.$confirm(
          dialogContent,
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            dangerouslyUseHTMLString: true,
            showInput: true,
            inputPlaceholder: '请输入删除原因（选填）',
            inputValidator: (value) => {
              if (value && value.length > 50) {
                return '删除原因不能超过50个字符';
              }
              return true;
            }
          }
        );

        // 获取选中的删除类型
        this.deleteType = document.querySelector('input[name="deleteType"]:checked').value;

        // 调用删除接口，传递逻辑删除参数
        await deleteImage(row.id, this.deleteType === 'true');

        this.$message.success('删除成功');
        this.fetchList();
        this.actionPanelVisible = false;
        this.deleteType = 'false'; // 重置删除类型
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.error({ message: '删除失败', duration: 3000 });
        }
      }
    },
    handlePreview(row) {
      this.previewUrl = row.url
      this.previewVisible = true
    },
    handleCopyUrl(row) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(row.url).then(() => {
          this.$message.success('图片地址已复制')
        })
      } else {
        // 兼容性处理
        const input = document.createElement('input')
        input.value = row.url
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.$message.success('图片地址已复制')
      }
    },
    handleFileChange(file, fileList) {
      this.uploadFile = file.raw
      this.uploadFileList = fileList
      // 自动填充文件名为图片名称
      this.imageName = file.name
      // 创建图片预览URL
      this.uploadPreviewUrl = URL.createObjectURL(file.raw)
    },
    async handleUploadConfirm() {
      try {
          if (this.uploadType === 'local') {
              if (!this.uploadFile) {
                this.$message.error({ message: '请选择图片文件', duration: 3000 })
                return
              }
              // 执行文件校验
              if (!this.beforeUpload(this.uploadFile)) {
                return
              }
              const formData = new FormData()
              formData.append('file', this.uploadFile)
              formData.append('name', this.imageName)
              formData.append('description', this.imageDescription)
              await uploadLocalImage(formData)
              this.$message.success('本地上传成功')
            } else {
              if (!this.cloudUrl) {
                this.$message.error({ message: '请输入云盘图片地址', duration: 3000 })
                return
              }
              // 执行URL校验
              if (!this.validateCloudUrl()) {
                return
              }
              const formData = new FormData()
              formData.append('url', this.cloudUrl)
              formData.append('name', this.imageName)
              formData.append('description', this.imageDescription)
              await uploadCloudImage(formData)
              this.$message.success('云盘链接上传成功')
            }

            this.uploadDialogVisible = false
            this.uploadFile = null
            this.uploadFileList = []
            this.uploadPreviewUrl = ''
            this.cloudUrl = ''
            this.imageName = ''
            this.imageDescription = ''
            this.fetchList()
            this.actionPanelVisible=false;
      } catch (err) {
          this.$message.error({ message: '上传失败', duration: 3000 })
      }
    },
    openActionPanel(row) {
          this.currentRow = row
          this.actionPanelVisible = true
    },
    closeActionPanel() {
          this.actionPanelVisible = false
          this.currentRow = {}
    }
  }
}
</script>

<style scoped>
.image-manager-container {
  padding: 24px 0 0 0;
}
.image-table-wrapper {
  padding: 0 8px 0 8px;
  overflow-x: auto;
}
.image-action-btns {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  align-items: center;
}
</style>
