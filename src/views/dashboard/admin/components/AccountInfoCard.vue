<template>
  <el-card class="account-info-card">
    <!-- 头部背景图 -->
    <div class="card-header-bg">
      <img :src="headerBg" alt="背景图" class="header-bg-img" />
      <div class="header-overlay"></div>
    </div>
    
    <!-- 头像区域 -->
    <div class="avatar-section">
      <div class="avatar-wrapper">
        <img :src="userInfo.avatar || defaultAvatar" :alt="userInfo.name" class="avatar" />
        <el-badge 
          v-if="userInfo.status === 'online'" 
          class="status-badge" 
          type="success" 
          :is-dot="true" 
        />
      </div>
      <div class="user-info">
        <h3 class="user-name">{{ userInfo.name || '未登录' }}</h3>
        <p class="user-role">{{ userInfo.role || '普通用户' }}</p>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stat-item" v-for="stat in stats" :key="stat.label">
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 详细信息 -->
    <div class="detail-section">
      <div class="detail-item" v-if="userInfo.email">
        <i class="el-icon-mail detail-icon"></i>
        <span class="detail-text">{{ userInfo.email }}</span>
      </div>
      <div class="detail-item" v-if="userInfo.phone">
        <i class="el-icon-phone detail-icon"></i>
        <span class="detail-text">{{ userInfo.phone }}</span>
      </div>
      <div class="detail-item" v-if="userInfo.joinDate">
        <i class="el-icon-calendar detail-icon"></i>
        <span class="detail-text">{{ userInfo.joinDate }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <el-button type="primary" class="action-btn" @click="handleEditProfile">
        <i class="el-icon-user"></i>
        编辑资料
      </el-button>
      <el-button class="action-btn" @click="handleSettings">
        <i class="el-icon-setting"></i>
        账号设置
      </el-button>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'AccountInfoCard',
  props: {
    // 用户信息对象
    userInfo: {
      type: Object,
      default: () => ({
        name: '',
        avatar: '',
        role: '',
        email: '',
        phone: '',
        status: 'offline',
        joinDate: ''
      })
    },
    // 统计数据
    stats: {
      type: Array,
      default: () => [
        { label: '博客数', value: 0 },
        { label: '粉丝数', value: 0 },
        { label: '获赞数', value: 0 }
      ]
    },
    // 头部背景图
    headerBg: {
      type: String,
      default: 'https://wpimg.wallstcn.com/e7d23d71-cf19-4b90-a1cc-f56af8c0903d.png'
    },
    // 默认头像
    defaultAvatar: {
      type: String,
      default: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
    }
  },
  methods: {
    // 编辑资料
    handleEditProfile() {
      this.$emit('edit-profile', this.userInfo)
    },
    // 账号设置
    handleSettings() {
      this.$emit('settings', this.userInfo)
    }
  }
}
</script>

<style lang="scss" scoped>
.account-info-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;

  .card-header-bg {
    position: relative;
    height: 140px;
    overflow: hidden;

    .header-bg-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .header-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.5));
    }
  }

  .avatar-section {
    position: relative;
    display: flex;
    align-items: center;
    padding: 20px;
    margin-top: -50px;

    .avatar-wrapper {
      position: relative;
      margin-right: 16px;

      .avatar {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        border: 4px solid #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        object-fit: cover;
      }

      .status-badge {
        position: absolute;
        bottom: 4px;
        right: 4px;
      }
    }

    .user-info {
      flex: 1;

      .user-name {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 8px 0;
      }

      .user-role {
        font-size: 14px;
        color: #909399;
        margin: 0;
      }
    }
  }

  .stats-section {
    display: flex;
    justify-content: space-around;
    padding: 20px 0;
    border-top: 1px solid #ebf0f5;
    border-bottom: 1px solid #ebf0f5;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #409eff;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .detail-section {
    padding: 16px 20px;

    .detail-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      font-size: 14px;

      .detail-icon {
        color: #c0c4cc;
        margin-right: 12px;
        font-size: 16px;
      }

      .detail-text {
        color: #606266;
      }
    }
  }

  .action-section {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    padding-top: 0;

    .action-btn {
      flex: 1;
      height: 40px;
      border-radius: 8px;
      font-size: 14px;
    }
  }
}
</style>