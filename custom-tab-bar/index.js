const CDN_BASE = 'https://cn-bundigit-1331637075.cos.ap-guangzhou.myqcloud.com/linlanmini/static'

Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#2B85E4",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: `${CDN_BASE}/tab-home.png`,
        selectedIconPath: `${CDN_BASE}/tab-home-active.png`
      },
      {
        pagePath: "/pages/inquiry/inquiry",
        text: "问询",
        iconPath: `${CDN_BASE}/tab-inquiry.png`,
        selectedIconPath: `${CDN_BASE}/tab-inquiry-active.png`
      },
      {
        pagePath: "/pages/lesson/lesson",
        text: "课程",
        iconPath: `${CDN_BASE}/tab-lesson.png`,
        selectedIconPath: `${CDN_BASE}/tab-lesson-active.png`
      },
      {
        pagePath: "/pages/mine/mine",
        text: "我的",
        iconPath: `${CDN_BASE}/tab-mine.png`,
        selectedIconPath: `${CDN_BASE}/tab-mine-active.png`
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
    }
  }
})

