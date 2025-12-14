// app.js
App({
  /**
   * 小程序初始化完成时触发，全局只触发一次
   */
  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    
    // 获取设备信息
    this.globalData.statusBarHeight = systemInfo.statusBarHeight
    this.globalData.screenWidth = systemInfo.screenWidth
    this.globalData.screenHeight = systemInfo.screenHeight

    console.log('小程序启动完成')
  },

  /**
   * 小程序启动或从后台进入前台时触发
   */
  onShow(options) {
    console.log('小程序显示', options)
  },

  /**
   * 小程序从前台进入后台时触发
   */
  onHide() {
    console.log('小程序隐藏')
  },

  /**
   * 小程序发生脚本错误或 API 调用报错时触发
   */
  onError(error) {
    console.error('小程序错误:', error)
  },

  /**
   * 全局数据
   */
  globalData: {
    userInfo: null,
    systemInfo: null,
    statusBarHeight: 0,
    screenWidth: 0,
    screenHeight: 0
  }
})

