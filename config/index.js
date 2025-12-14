/**
 * 项目配置文件
 */

// API 基础地址，根据环境切换
const ENV = 'dev' // dev | prod

const config = {
  dev: {
    // baseUrl: 'http://119.91.208.65:8080/tmc', // 开发环境
    baseUrl: 'https://tmc.u9d.net/tmc', // 开发环境
    appId: '' // 小程序 AppID
  },
  prod: {
    // baseUrl: 'http://119.91.208.65:8080/tmc', // 生产环境（后续替换为正式域名）
    baseUrl: 'https://tmc.u9d.net/tmc', // 生产环境
    appId: '' // 小程序 AppID
  }
}

module.exports = {
  baseUrl: config[ENV].baseUrl,
  appId: config[ENV].appId,
  
  // Token 存储 key
  TOKEN_KEY: 'x_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_INFO_KEY: 'user_info',
  
  // 验证码用途
  OTP_PURPOSE: {
    LOGIN: 'LOGIN',
    BIND_PHONE: 'BIND_PHONE'
  },
  
  // 验证码倒计时（秒）
  OTP_COUNTDOWN: 60,
  
  // 验证码长度
  OTP_LENGTH: 6
}

