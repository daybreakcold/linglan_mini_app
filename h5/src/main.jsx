import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initAuthFromUrl } from './utils/authBridge'
import './styles/global.scss'

// 在渲染前初始化认证状态（从小程序传递的 URL 参数中读取 token）
initAuthFromUrl()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
