import Vue from 'vue'

import Cookies from 'js-cookie'

import 'normalize.css/normalize.css' // a modern alternative to CSS resets

import ElementUI from 'element-ui'
import './styles/element-variables.scss'

import VMdEditor from '@kangc/v-md-editor';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/theme/style/github.css';

import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/preview.css'

import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
// import locale from 'element-ui/lib/locale/lang/en' // lang i18n

import '@/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'

import '@/icons' // icon
import '@/permission' // permission control

// 导入权限指令模块并全局注册
import permission from '@/directive/permission'
Vue.use(permission)

// 导入错误处理模块
import { initGlobalErrorHandler } from '@/utils/error-handler'

import './filters'

/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online ! ! !
 */


// set ElementUI lang to EN
// Vue.use(ElementUI, { locale })
// 如果想要中文版 element-ui，按如下方式声明
Vue.use(ElementUI)

VMdEditor.use(githubTheme,{
  Hljs: hljs,
})

VMdPreview.use(githubTheme,{
  Hljs: hljs
})
Vue.use(VMdEditor)

Vue.use(VMdPreview)

Vue.config.productionTip = false

// 初始化全局错误处理
initGlobalErrorHandler()

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
