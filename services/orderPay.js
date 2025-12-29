// services/orderPay.js
const { get, post } = require('./request')

/**
 * 创建订单
 * POST /api/orders
 * @param {Object} data 订单创建请求
 * @param {number} data.productId 商品 ID
 * @param {number} data.quantity 购买数量
 * @param {string} data.remarks 订单备注
 * @returns {Promise} 返回 OrderResponse
 */
const createOrder = (data = {}) => post('/api/orders', data)

/**
 * 查询订单详情
 * GET /api/orders/{id}
 * @param {number} id 订单 ID
 * @returns {Promise} 返回 OrderResponse
 */
const getOrder = (id) => get(`/api/orders/${id}`)

/**
 * 取消订单
 * POST /api/orders/{id}/cancel
 * @param {number} id 订单 ID
 * @returns {Promise} 返回最新 OrderResponse
 */
const cancelOrder = (id) => post(`/api/orders/${id}/cancel`)

/**
 * 获取支付应用配置
 * GET /payRoute/getPayApp
 * @param {Object} params 查询参数
 * @param {number} params.lessonId 课程 ID（可选，用于按课程维度路由）
 * @param {number} params.productId 商品 ID（可选，用于按商品维度路由）
 * @returns {Promise} 返回 PayAppRouteResponse (wxPayAppId, gzhId, zfbPayAppId)
 */
const getPayApp = (params = {}) => get('/payRoute/getPayApp', params)

/**
 * 创建订单并发起支付
 * POST /api/payments/createAndPayOrder
 * @param {Object} data 支付请求
 * @param {number} data.productId 商品 ID
 * @param {number} data.quantity 购买数量（可选，默认1）
 * @param {string} data.remarks 订单备注（可选）
 * @param {number} data.amountInCent 支付金额（分）（可选，若传入则必须与订单金额一致）
 * @param {string} data.channel 支付方式编码（Jeepay wayCode），如 WX_JSAPI
 * @param {string} data.openId 小程序 openId
 * @param {string} data.payAppId 支付应用 AppId（来自 getPayApp）
 * @param {string} data.orgCode 机构编码，如 WECHAT
 * @param {string} data.clientIp 客户端 IP（可选）
 * @param {string} data.returnUrl 支付完成跳转地址（可选）
 * @param {number} data.couponId 优惠券 ID（可选）
 * @param {number} data.lessonId 课程 ID（可选）
 * @returns {Promise} 返回 { order: OrderResponse, payment: PaymentResponse }
 */
const createAndPayOrder = (data = {}) => post('/api/payments/createAndPayOrder', data)

/**
 * 对已有订单发起支付
 * POST /api/payments/payOrder
 * @param {Object} data 支付请求
 * @param {number} data.orderId 订单 ID
 * @param {number} data.amountInCent 支付金额（分）（可选，若传入则必须与订单金额一致）
 * @param {string} data.channel 支付方式编码（Jeepay wayCode），如 WX_JSAPI
 * @param {string} data.openId 小程序 openId
 * @param {string} data.payAppId 支付应用 AppId
 * @param {string} data.orgCode 机构编码，如 WECHAT
 * @param {string} data.clientIp 客户端 IP（可选）
 * @param {string} data.returnUrl 支付完成跳转地址（可选）
 * @param {number} data.couponId 优惠券 ID（可选）
 * @param {number} data.lessonId 课程 ID（可选）
 * @param {number} data.productId 商品 ID（可选，不传则使用订单中的商品 ID）
 * @returns {Promise} 返回 PaymentResponse
 */
const payOrder = (data = {}) => post('/api/payments/payOrder', data)

/**
 * 查询支付详情
 * GET /api/payments/{id}
 * @param {number} id 支付记录 ID
 * @returns {Promise} 返回 PaymentResponse
 */
const getPayment = (id) => get(`/api/payments/${id}`)

/**
 * 按 paymentId 查询支付单（并同步支付中心最新状态）
 * GET /api/payments/queryByPaymentId/{paymentId}
 * @param {string} paymentId 支付中心商户订单号
 * @returns {Promise} 返回 PaymentResponse
 */
const queryPaymentByPaymentId = (paymentId) => get(`/api/payments/queryByPaymentId/${paymentId}`)

/**
 * 更新支付状态
 * POST /api/payments/{id}/status
 * @param {number} id 支付记录 ID
 * @param {Object} data 状态更新请求
 * @param {string} data.status 支付状态 (SUCCESS/FAILED)
 * @param {string} data.transactionId 渠道流水号
 * @param {string} data.message 更新消息
 * @returns {Promise} 返回最新 PaymentResponse
 */
const updatePaymentStatus = (id, data = {}) => post(`/api/payments/${id}/status`, data)

module.exports = {
  createOrder,
  getOrder,
  cancelOrder,
  getPayApp,
  createAndPayOrder,
  payOrder,
  getPayment,
  queryPaymentByPaymentId,
  updatePaymentStatus
}
