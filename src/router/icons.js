/**
 * ============================================
 * 【图标常量管理】路由图标统一配置
 * ============================================
 * 
 * 该文件集中管理系统路由中使用的所有图标，分为两类：
 * 1. SVG图标 - 自定义SVG图标，对应src/icons/svg目录下的文件
 * 2. Element图标 - Element UI自带图标，以el-icon-开头
 * 
 * 使用方式：
 * import { Icons } from '@/router/icons'
 * meta: { title: '首页', icon: Icons.DASHBOARD }
 * 
 * 优点：
 * - 集中管理，便于维护和查找
 * - 避免拼写错误
 * - 统一命名规范
 * - 提高代码可维护性
 * 
 * @author router-module
 */

export const Icons = {
  // ==================== SVG图标 ====================
  DASHBOARD: 'dashboard',           // 仪表盘
  LIST: 'list',                     // 列表
  TAGS: 'tags',                     // 标签
  PEOPLES: 'peoples',               // 人群/用户组
  BUG: 'bug',                       // Bug/错误
  USER_SVG: 'user',                 // 用户(SVG)
  LOCK_SVG: 'lock',                 // 锁(SVG)
  
  // ==================== Element UI图标 ====================
  USER_SOLID: 'el-icon-user-solid', // 用户(实心)
  USER: 'el-icon-user',             // 用户(空心)
  DOCUMENT: 'el-icon-document',     // 文档
  IMAGE: 'el-icon-picture',         // 图片/媒体 (修复：使用el-icon-picture替代el-icon-image)
  DATA_ANALYSIS: 'el-icon-data-analysis', // 数据分析/监测
}

// 图标分类枚举，便于按模块管理（仅保留业务相关分类）
export const IconCategory = {
  COMMON: [
    Icons.DASHBOARD,
    Icons.LIST
  ],
  USER: [
    Icons.USER,
    Icons.USER_SOLID,
    Icons.PEOPLES
  ],
  CONTENT: [
    Icons.DOCUMENT,
    Icons.TAGS
  ],
  MEDIA: [
    Icons.IMAGE
  ],
  SYSTEM: [
    Icons.BUG,
    Icons.LOCK_SVG
  ]
}