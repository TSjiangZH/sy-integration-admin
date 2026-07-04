<template> 
   <el-row :gutter="gutter" class="panel-group"> 
     <el-col 
       v-for="(item, index) in displayData" 
       :key="item.key || index" 
       :xs="colXs" 
       :sm="colSm" 
       :lg="colLg" 
       class="card-panel-col" 
     > 
       <div class="card-panel" @click="handleSetLineChartData(item.type)"> 
         <div :class="['card-panel-icon-wrapper', item.iconClass]"> 
           <svg-icon v-if="!isElementIcon(item.icon)" :icon-class="item.icon" class-name="card-panel-icon" /> 
           <i v-else :class="item.icon" class="card-panel-icon el-icon"></i> 
         </div> 
         <div class="card-panel-description"> 
           <div class="card-panel-text"> 
             {{ item.title }} 
           </div> 
           <count-to :start-val="0" :end-val="item.value" :duration="item.duration" class="card-panel-num" /> 
         </div> 
       </div> 
     </el-col> 
   </el-row> 
 </template> 
 
 
 <script> 
 import CountTo from 'vue-count-to' 
 
 
 export default { 
   components: { 
     CountTo 
   }, 
   props: { 
     // 数据列表 [{ title, value, icon, type, iconClass, duration, key }] 
     data: { 
       type: Array, 
       required: true 
     }, 
     // 列配置 
     colXs: { 
       type: Number, 
       default: 12 
     }, 
     colSm: { 
       type: Number, 
       default: 12 
     }, 
     colLg: { 
       type: Number, 
       default: 6 
     }, 
     // 间距 
     gutter: { 
       type: Number, 
       default: 40 
     }, 
     // 默认动画时长（毫秒） 
     defaultDuration: { 
       type: Number, 
       default: 2600 
     }, 
     // 默认图标样式类映射 { iconName: iconClass } 
     iconClassMap: { 
       type: Object, 
       default: () => ({ 
         'el-icon-document': 'icon-blog', 
         'list': 'icon-category', 
         'tags': 'icon-tag', 
         'eye': 'icon-view', 
         'message': 'icon-comment', 
         'peoples': 'icon-people', 
         'money': 'icon-money', 
         'shopping': 'icon-shopping' 
       }) 
     }, 
     // 默认图标颜色映射 { iconClass: color } 
     iconColorMap: { 
       type: Object, 
       default: () => ({ 
         'icon-blog': '#40c9c6', 
         'icon-category': '#36a3f7', 
         'icon-tag': '#f4516c', 
         'icon-view': '#34bfa3', 
         'icon-comment': '#ff9800', 
         'icon-people': '#40c9c6', 
         'icon-money': '#f4516c', 
         'icon-shopping': '#34bfa3' 
       }) 
     } 
   }, 
   computed: { 
     displayData() { 
       return this.data.map((item, index) => { 
         // 根据图标名称获取对应的样式类 
         const iconClass = item.iconClass || this.iconClassMap[item.icon] || `icon-${index}` 
         
         return { 
           title: item.title || '', 
           value: item.value || 0, 
           icon: item.icon || '', 
           type: item.type || `item-${index}`, 
           duration: item.duration || this.defaultDuration, 
           iconClass: iconClass, 
           key: item.key || index 
         } 
       }) 
     } 
   }, 
   methods: { 
     // 判断是否为 Element UI 图标 
     isElementIcon(icon) { 
       return icon && (icon.startsWith('el-icon-') || icon.startsWith('element-')) 
     }, 
     handleSetLineChartData(type) { 
       this.$emit('handleSetLineChartData', type) 
     } 
   } 
 } 
 </script> 
 
 
 <style lang="scss" scoped> 
 .panel-group { 
   margin-top: 18px; 
 
 
   .card-panel-col { 
     margin-bottom: 32px; 
   } 
 
 
   .card-panel { 
     height: 108px; 
     cursor: pointer; 
     font-size: 12px; 
     position: relative; 
     overflow: hidden; 
     color: #666; 
     background: #fff; 
     box-shadow: 4px 4px 40px rgba(0, 0, 0, .05); 
     border-color: rgba(0, 0, 0, .05); 
 
 
     &:hover { 
       .card-panel-icon-wrapper { 
         color: #fff; 
       } 
 
 
       .icon-blog { 
         background: #40c9c6; 
       } 
 
 
       .icon-category { 
         background: #36a3f7; 
       } 
 
 
       .icon-tag { 
         background: #f4516c; 
       } 
 
 
       .icon-view { 
         background: #34bfa3; 
       } 
 
 
       .icon-comment { 
         background: #ff9800; 
       } 
 
 
       .icon-people { 
         background: #40c9c6; 
       } 
 
 
       .icon-money { 
         background: #f4516c; 
       } 
 
 
       .icon-shopping { 
         background: #34bfa3 
       } 
     } 
 
 
     .icon-blog { 
       color: #40c9c6; 
     } 
 
 
     .icon-category { 
       color: #36a3f7; 
     } 
 
 
     .icon-tag { 
       color: #f4516c; 
     } 
 
 
     .icon-view { 
       color: #34bfa3; 
     } 
 
 
     .icon-comment { 
       color: #ff9800; 
     } 
 
 
     .icon-people { 
       color: #40c9c6; 
     } 
 
 
     .icon-money { 
       color: #f4516c; 
     } 
 
 
     .icon-shopping { 
       color: #34bfa3 
     } 
 
 
     .card-panel-icon-wrapper { 
       float: left; 
       margin: 14px 0 0 14px; 
       padding: 16px; 
       transition: all 0.38s ease-out; 
       border-radius: 6px; 
     } 
 
 
     .card-panel-icon { 
       float: left; 
       font-size: 48px; 
     } 
 
 
     .el-icon { 
       font-size: 48px; 
     } 
 
 
     .card-panel-description { 
       float: right; 
       font-weight: bold; 
       margin: 26px; 
       margin-left: 0px; 
 
 
       .card-panel-text { 
         line-height: 18px; 
         color: rgba(0, 0, 0, 0.45); 
         font-size: 16px; 
         margin-bottom: 12px; 
       } 
 
 
       .card-panel-num { 
         font-size: 20px; 
       } 
     } 
   } 
 } 
 
 
 @media (max-width:550px) { 
   .card-panel-description { 
     display: none; 
   } 
 
 
   .card-panel-icon-wrapper { 
     float: none !important; 
     width: 100%; 
     height: 100%; 
     margin: 0 !important; 
 
 
     .svg-icon { 
       display: block; 
       margin: 14px auto !important; 
       float: none !important; 
     } 
   } 
 } 
 </style>
