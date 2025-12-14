// pages/webview/webview.js
Page({
  data: {
    url: '',
    // 是否是企业微信链接（需要特殊处理）
    isWecomLink: false,
    wecomUrl: '',
    // 企业微信名片/二维码图片（请放到此路径，或通过 query 参数 cardImage 传入）
    wecomCardImage: '/images/wecom-card.jpg'
  },

  onLoad(options) {
    const rawUrl = options.url ? decodeURIComponent(options.url) : ''
    const cardImage = options.cardImage ? decodeURIComponent(options.cardImage) : ''
    const forceWecom = String(options.wecom || '').toLowerCase() === '1' || String(options.wecom || '').toLowerCase() === 'true'
    const isWecom = forceWecom || (rawUrl && rawUrl.includes('work.weixin.qq.com'))

    // 支持通过参数传入二维码图片地址
    if (cardImage) {
      this.setData({ wecomCardImage: cardImage })
    }

    if (isWecom) {
      this.setData({
        isWecomLink: true,
        wecomUrl: rawUrl
      })

      // 只有在有链接但无法打开时才提示
      if (rawUrl) {
        wx.showToast({
          title: '请长按识别二维码添加',
          icon: 'none',
          duration: 2000
        })
      }
    } else if (rawUrl) {
      this.setData({ url: rawUrl })
    }

    if (options.title) {
      wx.setNavigationBarTitle({
        title: decodeURIComponent(options.title)
      })
    }
  },

  /**
   * 复制企业微信链接
   */
  onCopyWecomLink() {
    if (!this.data.wecomUrl) {
      wx.showToast({ title: '链接为空', icon: 'none' })
      return
    }
    wx.setClipboardData({
      data: this.data.wecomUrl,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 预览企业微信名片/二维码图片（长按可识别二维码）
   */
  onPreviewWecomCard() {
    const { wecomCardImage } = this.data
    if (!wecomCardImage) {
      wx.showToast({ title: '图片未配置', icon: 'none' })
      return
    }
    wx.previewImage({
      current: wecomCardImage,
      urls: [wecomCardImage]
    })
  }
})
