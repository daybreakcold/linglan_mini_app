# 铃兰小程序

基于微信小程序原生框架的基础模板项目。

## 项目结构

```
linglan_mini_app/
├── app.js                 # 小程序入口文件
├── app.json               # 小程序全局配置
├── app.wxss               # 全局样式（含 CSS 变量和工具类）
├── project.config.json    # 项目配置文件
├── sitemap.json           # 微信索引配置
├── pages/                 # 页面目录
│   └── index/             # 首页
│       ├── index.js       # 页面逻辑
│       ├── index.json     # 页面配置
│       ├── index.wxml     # 页面结构
│       └── index.wxss     # 页面样式
├── components/            # 公共组件目录
├── utils/                 # 工具函数目录
│   └── util.js            # 常用工具函数
└── images/                # 图片资源目录
```

## 快速开始

### 1. 导入项目

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具，选择「导入项目」
3. 选择本项目根目录
4. 填写 AppID（可使用测试号或申请正式 AppID）

### 2. 开发配置

在 `project.config.json` 中修改 `appid` 为你的小程序 AppID：

```json
{
  "appid": "你的AppID"
}
```

### 3. 新建页面

1. 在 `pages` 目录下创建新的页面文件夹
2. 在 `app.json` 的 `pages` 数组中添加页面路径

## 内置功能

### CSS 变量

在 `app.wxss` 中预设了常用的 CSS 变量：

- 颜色变量：`--primary-color`、`--text-color`、`--border-color` 等
- 字体大小：`--font-size-sm`、`--font-size-base`、`--font-size-lg` 等
- 间距变量：`--spacing-sm`、`--spacing-base`、`--spacing-lg` 等
- 圆角变量：`--radius-sm`、`--radius-base`、`--radius-lg` 等
- 阴影变量：`--shadow-sm`、`--shadow-base`、`--shadow-lg`

### 工具类

预设了常用的 CSS 工具类：

- Flex 布局：`.flex`、`.flex-center`、`.flex-between` 等
- 文本对齐：`.text-left`、`.text-center`、`.text-right`
- 文本溢出：`.text-ellipsis`、`.text-ellipsis-2`
- 间距类：`.mt-sm`、`.mb-base`、`.px-md` 等

### 工具函数

`utils/util.js` 提供了常用的工具函数：

- `formatTime(date)` - 格式化时间
- `formatDate(date)` - 格式化日期
- `debounce(fn, delay)` - 防抖函数
- `throttle(fn, interval)` - 节流函数
- `deepClone(obj)` - 深拷贝
- `request(options)` - 请求封装
- `showLoading(title)` / `hideLoading()` - 加载提示
- `showToast(title, icon)` - 轻提示
- `showModal(options)` - 模态对话框
- `getStorage(key)` / `setStorage(key, value)` / `removeStorage(key)` - 本地存储

## 开发指南

### 页面生命周期

```javascript
Page({
  onLoad(options) {},    // 页面加载
  onReady() {},          // 页面初次渲染完成
  onShow() {},           // 页面显示
  onHide() {},           // 页面隐藏
  onUnload() {},         // 页面卸载
  onPullDownRefresh() {},// 下拉刷新
  onReachBottom() {},    // 触底加载
  onShareAppMessage() {} // 分享
})
```

### 组件开发

在 `components` 目录下创建自定义组件：

```javascript
// components/my-component/my-component.js
Component({
  properties: {},
  data: {},
  methods: {}
})
```

## 相关文档

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信小程序 API](https://developers.weixin.qq.com/miniprogram/dev/api/)
- [微信小程序组件](https://developers.weixin.qq.com/miniprogram/dev/component/)

## License

MIT

