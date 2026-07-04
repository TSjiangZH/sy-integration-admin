<template>
  <div class="login-container">
    <div class="login-bg"></div>
    <div class="login-content">
      <el-form 
        ref="loginForm" 
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form" 
        autocomplete="on" 
        label-position="left"
      >
        <div class="title-container">
          <div class="logo">
            <svg-icon icon-class="dashboard" class="logo-icon" />
          </div>
          <h3 class="title">欢迎登录</h3>
          <p class="subtitle">请输入您的账号信息</p>
        </div>

        <el-form-item prop="username">
          <span class="svg-container">
            <svg-icon icon-class="user" />
          </span>
          <el-input
            ref="username"
            v-model="loginForm.username"
            placeholder="用户名"
            name="username"
            type="text"
            tabindex="1"
            autocomplete="username"
            @input="onInput"
          />
        </el-form-item>

        <el-tooltip v-model="capsTooltip" content="大写锁定已开启" placement="right" manual>
          <el-form-item prop="password">
            <span class="svg-container">
              <svg-icon icon-class="password" />
            </span>
            <el-input
              :key="passwordType"
              ref="password"
              v-model="loginForm.password"
              :type="passwordType"
              placeholder="密码"
              name="password"
              tabindex="2"
              autocomplete="current-password"
              @keyup.native="checkCapslock"
              @blur="capsTooltip = false"
              @keyup.enter.native="handleLogin"
              @input="onInput"
            />
            <span class="show-pwd" @click="showPwd">
              <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
            </span>
          </el-form-item>
        </el-tooltip>

        <!-- 密码强度指示器 -->
        <div v-if="loginForm.password" class="password-strength">
          <span class="strength-label">密码强度：</span>
          <div class="strength-bars">
            <span :class="['bar', { active: passwordStrength >= 1 }, { strong: passwordStrength >= 2 }]"></span>
            <span :class="['bar', { active: passwordStrength >= 2 }, { strong: passwordStrength >= 3 }]"></span>
            <span :class="['bar', { active: passwordStrength >= 3 }, { strong: passwordStrength === 4 }]"></span>
          </div>
          <span :class="['strength-text', getStrengthClass()]">
            {{ ['弱', '一般', '中等', '强'][passwordStrength] || '' }}
          </span>
        </div>

        <!-- 记住我和忘记密码 -->
        <el-form-item class="remember-me">
          <el-checkbox v-model="rememberMe" class="remember-checkbox">记住我</el-checkbox>
          <a href="#" class="forget-pwd" @click.prevent="handleForgetPwd">忘记密码？</a>
        </el-form-item>

        <el-button 
          :loading="loading" 
          type="primary" 
          class="login-btn"
          @click.native.prevent="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>

        <div class="third-party">
          <span class="divider">或者</span>
          <el-button class="thirdparty-button" type="text" @click="showDialog=true">
            使用第三方账号登录
          </el-button>
        </div>
      </el-form>

      <el-dialog title="第三方登录" :visible.sync="showDialog" width="400px">
        <p class="dialog-tip">本地环境暂不支持第三方登录演示，请结合实际业务实现！</p>
        <social-sign />
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { validUsername } from '@/utils/validate'
import SocialSign from './components/SocialSignin'

export default {
  name: 'Login',
  components: { SocialSign },
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入用户名'))
      } else if (!validUsername(value)) {
        callback(new Error('请输入正确的用户名'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < 6) {
        callback(new Error('密码长度不能少于6位'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ required: true, trigger: ['blur', 'change'], validator: validateUsername }],
        password: [{ required: true, trigger: ['blur', 'change'], validator: validatePassword }]
      },
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      showDialog: false,
      redirect: undefined,
      otherQuery: {},
      rememberMe: false,
      passwordStrength: 0
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        const query = route.query
        if (query) {
          this.redirect = query.redirect
          this.otherQuery = this.getOtherQuery(query)
        }
      },
      immediate: true
    },
    'loginForm.password': function(val) {
      this.checkPasswordStrength(val)
    }
  },
  mounted() {
    // 恢复记住的用户名
    const rememberMe = localStorage.getItem('rememberMe') === 'true'
    const username = localStorage.getItem('username')
    if (rememberMe && username) {
      this.loginForm.username = username
      this.rememberMe = true
    }
    
    // 设置焦点
    if (this.loginForm.username === '') {
      this.$nextTick(() => {
        this.$refs.username && this.$refs.username.focus()
      })
    } else if (this.loginForm.password === '') {
      this.$nextTick(() => {
        this.$refs.password && this.$refs.password.focus()
      })
    }

    // 移动端键盘适配
    if (/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)) {
      window.addEventListener('resize', this.handleResize)
    }
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    checkCapslock(e) {
      const { key } = e
      this.capsTooltip = key && key.length === 1 && (key >= 'A' && key <= 'Z')
    },
    showPwd() {
      this.passwordType = this.passwordType === 'password' ? '' : 'password'
      this.$nextTick(() => {
        this.$refs.password && this.$refs.password.focus()
      })
    },
    checkPasswordStrength(password) {
      let strength = 0
      if (password.length >= 8) strength++
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
      if (/[0-9]/.test(password)) strength++
      if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) strength++
      this.passwordStrength = strength
    },
    getStrengthClass() {
      const classes = ['weak', 'normal', 'medium', 'strong']
      return classes[this.passwordStrength] || ''
    },
    onInput() {
      // 输入时的额外处理逻辑
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/login', this.loginForm)
            .then(() => {
              // 保存记住我状态
              if (this.rememberMe) {
                localStorage.setItem('rememberMe', true)
                localStorage.setItem('username', this.loginForm.username)
              } else {
                localStorage.removeItem('rememberMe')
                localStorage.removeItem('username')
              }
              // 添加成功动画
              const loginFormEl = this.$refs.loginForm?.$el || this.$refs.loginForm
              if (loginFormEl && loginFormEl.classList) {
                loginFormEl.classList.add('login-success')
              }
              setTimeout(() => {
                this.$router.push({ path: this.redirect || '/dashboard', query: this.otherQuery })
              }, 500)
            })
            .catch((error) => {
              this.loading = false
              this.$message.error({ message: error.message || '登录失败', duration: 3000 })
            })
        }
      })
    },
    handleForgetPwd() {
      this.$message.info('请联系管理员重置密码')
    },
    handleResize() {
      const form = document.querySelector('.login-form')
      const keyboardHeight = window.innerHeight - document.documentElement.clientHeight
      if (keyboardHeight > 100) {
        form.style.paddingTop = '40px'
      } else {
        form.style.paddingTop = '60px'
      }
    },
    getOtherQuery(query) {
      return Object.keys(query).reduce((acc, cur) => {
        if (cur !== 'redirect') {
          acc[cur] = query[cur]
        }
        return acc
      }, {})
    }
  }
}
</script>

<style lang="scss">
/* 全局样式重置 */
$primary: #409EFF;
$success: #67C23A;
$warning: #E6A23C;
$danger: #F56C6C;

/* 修复input背景和光标颜色 */
.login-container {
  .el-input input {
    color: #fff;
    caret-color: $primary;
  }

  .el-input {
    display: inline-block;
    height: 48px;
    width: calc(100% - 50px);

    input {
      background: transparent;
      border: none;
      -webkit-appearance: none;
      border-radius: 0;
      padding: 12px 15px;
      color: #fff;
      height: 48px;
      font-size: 14px;
      caret-color: $primary;

      &:-webkit-autofill {
        box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.2) inset !important;
        -webkit-text-fill-color: #fff !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
    position: relative;

    &.is-focused {
      border-color: $primary;
      box-shadow: 0 0 15px rgba(64, 158, 255, 0.3);
      transform: translateY(-2px);
    }

    &.is-error {
      border-color: $danger;
      box-shadow: 0 0 10px rgba(245, 108, 108, 0.2);
    }
  }

  .el-form-item__error {
    color: $danger;
    font-size: 12px;
    margin-top: 4px;
    padding-left: 10px;
  }

  .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: $primary;
    border-color: $primary;
  }

  .el-checkbox__label {
    color: #889aa4;
    font-size: 13px;
  }
}
</style>

<style lang="scss" scoped>
$bg-dark: #1a1a2e;
$bg-light: #16213e;
$dark-gray: #889aa4;
$light-gray: #eee;
$primary: #409EFF;
$success: #67C23A;
$warning: #E6A23C;
$danger: #F56C6C;

.login-container {
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .login-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, $bg-dark 0%, $bg-light 50%, #0f3460 100%);
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at center, rgba(64, 158, 255, 0.1) 0%, transparent 70%);
      animation: pulse 15s ease-in-out infinite;
    }

    &::after {
      content: '';
      position: absolute;
      top: 20%;
      left: 20%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(64, 158, 255, 0.15) 0%, transparent 70%);
      border-radius: 50%;
      animation: float 8s ease-in-out infinite;
    }
  }

  .login-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 420px;
  }

  .login-form {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 60px 40px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    transition: all 0.5s ease;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    }

    &.login-success {
      animation: fadeOut 0.5s ease forwards;
    }
  }

  .title-container {
    text-align: center;
    margin-bottom: 40px;

    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, $primary, #67C23A);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(64, 158, 255, 0.4);

      .logo-icon {
        width: 40px;
        height: 40px;
        color: #fff;
      }
    }

    .title {
      font-size: 28px;
      color: $light-gray;
      margin: 0 0 10px 0;
      font-weight: 600;
    }

    .subtitle {
      font-size: 14px;
      color: $dark-gray;
      margin: 0;
    }
  }

  .svg-container {
    padding: 14px 12px;
    color: $dark-gray;
    vertical-align: middle;
    width: 44px;
    display: inline-block;
    transition: color 0.3s;

    &:hover {
      color: $primary;
    }
  }

  .show-pwd {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: $dark-gray;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s;

    &:hover {
      color: $primary;
      transform: translateY(-50%) scale(1.1);
    }
  }

  .password-strength {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    margin-bottom: 15px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    font-size: 12px;

    .strength-label {
      color: $dark-gray;
      margin-right: 10px;
    }

    .strength-bars {
      display: flex;
      gap: 6px;
      flex: 1;

      .bar {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        transition: all 0.3s ease;

        &.active {
          background: $warning;
        }

        &.strong {
          background: $success;
        }
      }
    }

    .strength-text {
      margin-left: 10px;
      font-weight: 500;
      min-width: 30px;
      text-align: right;

      &.weak { color: $danger; }
      &.normal { color: $warning; }
      &.medium { color: #409EFF; }
      &.strong { color: $success; }
    }
  }

  .remember-me {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding: 0;
    border: none;
    background: transparent;

    .forget-pwd {
      color: $primary;
      font-size: 13px;
      text-decoration: none;
      transition: color 0.3s;

      &:hover {
        color: #66b1ff;
        text-decoration: underline;
      }
    }
  }

  .login-btn {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 10px;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, $primary, #67C23A);
    border: none;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }

  .third-party {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 25px;
    padding-top: 25px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .divider {
      color: $dark-gray;
      font-size: 13px;
    }

    .thirdparty-button {
      color: $primary;
      padding: 0;
      font-size: 13px;
      transition: color 0.3s;

      &:hover {
        color: #66b1ff;
        text-decoration: underline;
      }
    }
  }

  .dialog-tip {
    color: #999;
    margin-bottom: 20px;
    font-size: 14px;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(50px, -20px);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media only screen and (max-width: 470px) {
  .login-container {
    padding: 10px;

    .login-form {
      padding: 40px 25px;
    }

    .third-party {
      flex-direction: column;
      gap: 10px;
    }
  }
}
</style>
