import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'
const RefreshTokenKey = 'Admin-RefreshToken'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export function getRefreshToken() {
  return Cookies.get(RefreshTokenKey)
}

export function setRefreshToken(refreshToken) {
  // 设置HttpOnly和Secure标志增强安全性
  return Cookies.set(RefreshTokenKey, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  })
}

export function removeRefreshToken() {
  return Cookies.remove(RefreshTokenKey)
}

export function clearAuthTokens() {
  removeToken()
  removeRefreshToken()
}
