# 订单与支付 API

> 该模块覆盖商品下单、订单查询/取消，以及支付发起、状态更新流程，接口均位于 `modules.payment`。

## 公共结构

### OrderResponse
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | long | 订单 ID |
| orderNo | string | 订单号 |
| userId | long | 用户 ID |
| productId | long | 商品 ID |
| quantity | int | 购买数量 |
| totalAmount | long | 总金额（分） |
| status | string | `CREATED` / `PENDING_PAYMENT` / `PAID` / `CANCELLED` |
| remarks | string | 备注 |
| createdTime / updatedTime | string | 创建/更新时间 |

### PaymentResponse
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | long | 支付记录 ID |
| paymentId | string | 支付中心订单号（`payment_info.payment_id`） |
| orderId | long | 关联订单 |
| amountInCent | long | 支付金额（分） |
| payChannel | string | 支付方式编码（Jeepay wayCode），如 `WX_JSAPI` |
| status | string | `INITIAL` / `PENDING` / `SUCCESS` / `FAILED` |
| payAppId | string | 支付应用 AppId（来自 `/payRoute/getPayApp`） |
| thirdPayId | string | 支付中心返回的三方流水号 |
| payData | string | 支付中心透传的 `payData`，前端根据渠道自行解析 |
| createdTime / updatedTime | string | 创建/更新时间 |

### 支付方式（wayCode）
| 支付方式 | wayCode |
| --- | --- |
| 微信 JSAPI | `WX_JSAPI` |
| 微信 Native | `WX_NATIVE` |
| 支付宝 WAP | `ALI_WAP` |
| 支付宝 PC | `ALI_PC` |
| 云闪付 | `UNIONPAY` |

### PayAppRouteResponse
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| wxPayAppId | string | 微信支付应用 AppId（可能为空）。 |
| gzhId | string | 公众号标识（可能为空）。 |
| zfbPayAppId | string | 支付宝支付应用 AppId（可能为空）。 |

## 1. 创建订单
- **Method & Path**：`POST /api/orders`
- **请求头**：`x-token`（登录态注入 `userId`）
- **请求体**：`OrderCreateRequest`
  ```json
  {
    "productId": 11,
    "quantity": 1,
    "remarks": "希望尽快发货"
  }
  ```
- **行为**：校验商品与库存（如有），计算总金额并生成订单号，状态默认为 `CREATED`。返回 `OrderResponse`。

## 2. 查询订单
- **Method & Path**：`GET /api/orders/{id}`
- **请求头**：`x-token`
- **说明**：根据订单 ID 返回 `OrderResponse`，若不存在则返回业务异常。

## 3. 取消订单
- **Method & Path**：`POST /api/orders/{id}/cancel`
- **请求头**：`x-token`
- **说明**：将订单状态置为 `CANCELLED`，仅允许未支付订单调用；返回最新 `OrderResponse`。

## 4. 发起支付
- **Method & Path**：`POST /api/payments/payOrder`
- **请求头**：`x-token`（必填）
- **请求体**：JSON（字段同「11.2 对订单发起支付」）
  ```json
  {
    "orderId": 501,
    "amountInCent": 19900,
    "channel": "WX_JSAPI",
    "orgCode": "WEIXIN",
    "payAppId": "675ad12251f4d77432c9fc69",
    "openId": "wx-open-id",
    "clientIp": "1.2.3.4",
    "returnUrl": "https://m.ai-tcm.com/pay-success",
    "couponId": 9001,
    "lessonId": 30001,
    "productId": 11
  }
  ```
- **前置步骤**：调用 `GET /tmc/payRoute/getPayApp` 获取 `payAppId` 与公众号 `gzhId`；若按课程或商品区分，可传入 `lessonId`/`productId`。
- **说明**：后端会从 `pay_mch_app` / `pay_mch_info` 中补齐商户、回调地址，并调用支付中心统一下单。响应中的 `payData` 就是支付中心返回的 `payData`。

## 5. 查询支付
- **Method & Path**：`GET /api/payments/{id}`
- **说明**：返回支付详情 `PaymentResponse`。

## 6. 更新支付状态
- **Method & Path**：`POST /api/payments/{id}/status`
- **请求体**：`PaymentStatusUpdateRequest`
  ```json
  {
    "status": "SUCCESS",
    "transactionId": "WX1234567890",
    "message": "回调成功"
  }
  ```
- **说明**：用于支付回调或人工修复，支持将状态更新为 `SUCCESS`/`FAILED` 等，并记录渠道流水号；返回最新 `PaymentResponse`。

## 7. 获取支付应用
- **Method & Path**：`GET /tmc/payRoute/getPayApp`
- **Query 参数**：
  | 参数 | 说明 |
  | --- | --- |
  | lessonId | 可选，课程 ID（用于按课程维度路由） |
  | productId | 可选，商品 ID（用于按商品维度路由） |
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "wxPayAppId": "675ad12251f4d77432c9fc69",
      "gzhId": "gh_xxx",
      "zfbPayAppId": null
    }
  }
  ```
- **说明**：返回符合路由策略的 `payAppId`，调用 `/api/payments/payOrder` 或 `/api/payments/createAndPayOrder` 时必须携带该值，确保支付请求命中正确商户与渠道。

## 8. Jeepay 支付回调

> 用途：Jeepay 支付中心向本服务异步通知支付结果，用于更新 `payment_info` 与 `order_info` 状态。

- **Method & Path**：`POST /jeeQuan/pay/callback`
- **Content-Type**：`application/x-www-form-urlencoded`
- **鉴权**：无（由签名校验保证合法性）

### 8.1 请求示例（curl，可直接执行）

> `sign` 需要按 Jeepay 规则计算（下文有字段说明），这里用占位符展示。

```bash
curl -X POST 'https://tmc.u9d.net/jeeQuan/pay/callback' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'mchNo=M1763965962' \
  --data-urlencode 'appId=6923fc0ad55490c6a976b22b' \
  --data-urlencode 'payOrderId=P202512230001' \
  --data-urlencode 'mchOrderNo=PAYWXORG202512230001' \
  --data-urlencode 'state=2' \
  --data-urlencode 'successTime=1734940800000' \
  --data-urlencode 'sign=__REPLACE_WITH_REAL_SIGN__'
```

### 8.2 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| mchNo | string | 是 | 商户号，对应 `pay_mch_info.mch_no`。 |
| appId | string | 是 | 应用ID，对应 `pay_mch_app.app_id`。 |
| payOrderId | string | 是 | Jeepay 支付单号，会回写到 `payment_info.third_pay_id`。 |
| mchOrderNo | string | 是 | 商户订单号，本项目对应 `payment_info.payment_id`。 |
| state | string | 是 | 支付单状态：`2`=支付成功；`3/4/5/6`=失败/撤销/退款/关闭；`0/1`=非终态（忽略）。 |
| successTime | string | 否 | 支付成功时间戳（毫秒）。 |
| sign | string | 是 | 签名字段。签名计算时需**剔除** `sign` 与可选的 `tenantId` 字段。 |
| tenantId | string | 否 | 兼容外部系统回调透传租户标识；本服务仅用于签名计算时剔除，不参与业务处理。 |

### 8.3 成功响应示例

```text
success
```

### 8.4 失败响应示例

```text
fail
```

### 8.5 业务处理说明

- 回调处理入口：`com.ai.tcm.modules.payment.controller.JeeQuanController`
- 签名校验：使用 `appId` 对应的 `pay_mch_app.app_secret`，调用 Jeepay SDK 的 `JeepayKit.getSign` 计算签名并与 `sign` 比对。
- 状态更新：
  - `state=2`：将 `payment_info.status` 更新为成功，同时将 `order_info.status` 更新为 `PAID`，并触发会员权益发放（若该订单为会员商品）。
  - `state in (3,4,5,6)`：将 `payment_info.status` 更新为失败，同时将 `order_info.status` 更新为 `CANCELLED`（支付失败类终态按取消处理）。
  - 其他状态：仅记录回调内容，不改变支付状态。

## 9. Jeepay 退款回调

> 用途：Jeepay 支付中心向本服务异步通知退款结果；当前版本只做签名校验与回调落库（`payment_refund_info`），便于对账与后续业务侧退款状态同步。

- **Method & Path**：`POST /jeeQuan/pay/refundCallback`
- **Content-Type**：`application/x-www-form-urlencoded`
- **鉴权**：无（由签名校验保证合法性）

### 9.1 请求示例（curl，可直接执行）

> `sign` 需要按 Jeepay 规则计算（下文有字段说明），这里用占位符展示。

```bash
curl -X POST 'https://tmc.u9d.net/jeeQuan/pay/refundCallback' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'mchNo=M1763965962' \
  --data-urlencode 'appId=6923fc0ad55490c6a976b22b' \
  --data-urlencode 'mchRefundNo=R202512230001' \
  --data-urlencode 'mchOrderNo=PAYWXORG202512230001' \
  --data-urlencode 'payOrderId=P202512230001' \
  --data-urlencode 'refundOrderId=R202512230001' \
  --data-urlencode 'state=2' \
  --data-urlencode 'refundAmount=19900' \
  --data-urlencode 'successTime=1734940800000' \
  --data-urlencode 'tenantId=10086' \
  --data-urlencode 'errMsg=' \
  --data-urlencode 'sign=__REPLACE_WITH_REAL_SIGN__'
```

### 9.2 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| mchNo | string | 是 | 商户号，对应 `pay_mch_info.mch_no`。 |
| appId | string | 是 | 应用ID，对应 `pay_mch_app.app_id`。 |
| mchRefundNo | string | 是 | 商户退款单号（业务方退款单号），本服务以此做幂等落库（`payment_refund_info.mch_refund_no`）。 |
| mchOrderNo | string | 否 | 商户订单号（原支付单号），通常对应 `payment_info.payment_id`。 |
| payOrderId | string | 否 | Jeepay 支付单号（原支付单）。 |
| refundOrderId | string | 否 | Jeepay 退款单号。 |
| state | string | 是 | 退款状态：`0`=订单生成；`1`=退款中；`2`=退款成功；`3`=退款失败；`4`=退款关闭。 |
| refundAmount | string | 否 | 退款金额（分）。 |
| successTime | string | 否 | 退款成功时间戳（毫秒）。 |
| errMsg | string | 否 | 退款失败原因（退款失败/关闭时可能返回）。 |
| sign | string | 是 | 签名字段。签名计算时需**剔除** `sign` 与可选的 `tenantId` 字段。 |
| tenantId | string | 否 | 兼容外部系统回调透传租户标识；本服务会写入 `TenantContext` 并在签名计算前剔除。 |

### 9.3 成功响应示例

```text
success
```

### 9.4 失败响应示例

```text
error
```

### 9.5 业务处理说明

- 回调处理入口：`com.ai.tcm.modules.payment.controller.JeeQuanController#refundCallback`
- 签名校验：使用 `appId` 对应的 `pay_mch_app.app_secret`，调用 Jeepay SDK 的 `JeepayKit.getSign` 计算签名并与 `sign` 比对（验签时会剔除 `sign`、`tenantId`）。
- 回调落库：以 `mchRefundNo` 为唯一键插入/更新 `payment_refund_info`，保留 `state`、`refundAmount`、`successTime`、`errMsg` 及 `callback_payload`（原文 JSON）。

## 10. 自动化测试
- `src/test/java/com/ai/tcm/modules/payment/controller/JeeQuanControllerTest.java`：覆盖支付回调、退款回调的成功/签名失败链路。

## 11. 下单并支付

> 用途：聚合下单+支付能力，支持创建订单并支付、对已有订单发起支付，以及按 `paymentId` 查询并同步支付中心最新状态。
>
> 实现入口：`com.ai.tcm.modules.payment.controller.PaymentController`

### 11.1 创建订单并发起支付
- **Method & Path**：`POST /api/payments/createAndPayOrder`
- **请求头**：`x-token`（必填）
- **请求体**：JSON（字段如下）

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| productId | long | 是 | 商品 ID |
| quantity | int | 否 | 购买数量，默认 1 |
| remarks | string | 否 | 订单备注 |
| amountInCent | long | 否 | 若传入则必须与订单金额一致（防篡改） |
| channel | string | 是 | 支付方式编码（Jeepay wayCode），如 `WX_JSAPI` |
| openId | string | 是 | 小程序 openId |
| payAppId | string | 是 | 支付应用 AppId（来自 `/tmc/payRoute/getPayApp`） |
| orgCode | string | 是 | 机构编码，如 `WECHAT` |
| clientIp | string | 否 | 客户端 IP |
| returnUrl | string | 否 | 支付完成跳转地址 |
| couponId | long | 否 | 优惠券 ID |
| lessonId | long | 否 | 课程 ID |

- **响应**：`ApiResponse`，其中 `data` 结构为 `{ "order": OrderResponse, "payment": PaymentResponse }`。

#### 11.1.1 请求示例（curl，可直接执行）
```bash
curl -X POST 'https://tmc.u9d.net/api/payments/createAndPayOrder' \
  -H 'Content-Type: application/json' \
  -H 'x-token: __REPLACE_WITH_TOKEN__' \
  -d '{
    "productId": 11,
    "quantity": 1,
    "remarks": "下单并支付",
    "channel": "WX_JSAPI",
    "openId": "wx-open-id",
    "payAppId": "675ad12251f4d77432c9fc69",
    "orgCode": "WECHAT",
    "returnUrl": "https://m.ai-tcm.com/pay-success"
  }'
```

#### 11.1.2 成功响应示例
```json
{
  "success": true,
  "message": null,
  "data": {
    "order": {
      "id": 501,
      "orderNo": "ORD202512240001",
      "userId": 10001,
      "productId": 11,
      "productName": "AI 诊疗卡",
      "quantity": 1,
      "totalAmountInCent": 19900,
      "status": "PENDING_PAYMENT",
      "remarks": "下单并支付",
      "createdTime": "2025-12-24T10:00:00",
      "updatedTime": "2025-12-24T10:00:01"
    },
    "payment": {
      "id": 9001,
      "paymentId": "PAYWX_JSAPIWECHAT202512240001001",
      "orderId": 501,
      "amountInCent": 19900,
      "payChannel": "WX_JSAPI",
      "status": "PENDING",
      "payAppId": "675ad12251f4d77432c9fc69",
      "thirdPayId": "P202512240001",
      "payData": "{\"mock\":true}",
      "createdTime": "2025-12-24T10:00:01",
      "updatedTime": "2025-12-24T10:00:01"
    }
  },
  "timestamp": "2025-12-24T10:00:01"
}
```

#### 11.1.3 失败响应示例（金额不一致）
```json
{
  "success": false,
  "message": "支付金额与订单金额不一致",
  "data": null,
  "timestamp": "2025-12-24T10:00:01"
}
```

### 11.2 对订单发起支付
- **Method & Path**：`POST /api/payments/payOrder`
- **请求头**：`x-token`（必填）
- **请求体**：JSON（字段如下）

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| orderId | long | 是 | 订单 ID |
| amountInCent | long | 否 | 若传入则必须与订单金额一致（防篡改） |
| channel | string | 是 | 支付方式编码（Jeepay wayCode），如 `WX_JSAPI` |
| openId | string | 是 | 小程序 openId |
| payAppId | string | 是 | 支付应用 AppId |
| orgCode | string | 是 | 机构编码，如 `WECHAT` |
| clientIp | string | 否 | 客户端 IP |
| returnUrl | string | 否 | 支付完成跳转地址 |
| couponId | long | 否 | 优惠券 ID |
| lessonId | long | 否 | 课程 ID |
| productId | long | 否 | 商品 ID（不传则使用订单中的商品 ID） |

- **响应**：`ApiResponse<PaymentResponse>`，字段结构见 `PaymentResponse`。

#### 11.2.1 请求示例（curl，可直接执行）
```bash
curl -X POST 'https://tmc.u9d.net/api/payments/payOrder' \
  -H 'Content-Type: application/json' \
  -H 'x-token: __REPLACE_WITH_TOKEN__' \
  -d '{
    "orderId": 501,
    "channel": "WX_JSAPI",
    "openId": "wx-open-id",
    "payAppId": "675ad12251f4d77432c9fc69",
    "orgCode": "WECHAT"
  }'
```

#### 11.2.2 成功响应示例
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 9001,
    "paymentId": "PAYWX_JSAPIWECHAT202512240001001",
    "orderId": 501,
    "amountInCent": 19900,
    "payChannel": "WX_JSAPI",
    "status": "PENDING",
    "payAppId": "675ad12251f4d77432c9fc69",
    "thirdPayId": "P202512240001",
    "payData": "{\"mock\":true}",
    "createdTime": "2025-12-24T10:00:01",
    "updatedTime": "2025-12-24T10:00:01"
  },
  "timestamp": "2025-12-24T10:00:01"
}
```

#### 11.2.3 失败响应示例（未登录）
```json
{
  "success": false,
  "message": "缺少登录凭证",
  "data": null,
  "timestamp": "2025-12-24T10:00:01"
}
```

### 11.3 按 paymentId 查询支付单（并同步状态）
- **Method & Path**：`GET /api/payments/queryByPaymentId/{paymentId}`
- **请求头**：`x-token`（必填）
- **Path 参数**：
  | 参数 | 类型 | 必填 | 说明 |
  | --- | --- | --- | --- |
  | paymentId | string | 是 | 支付中心商户订单号（对应 `payment_info.payment_id`） |

- **响应**：`ApiResponse<PaymentResponse>`，字段结构见 `PaymentResponse`。
- **说明**：若本地支付单未处于终态，会携带 `payAppId` 调用支付中心查询最新状态，并回写 `payment_info` 与 `order_info`。

#### 11.3.1 请求示例（curl，可直接执行）
```bash
curl -X GET 'https://tmc.u9d.net/api/payments/queryByPaymentId/PAYWX_JSAPIWECHAT202512240001001' \
  -H 'x-token: __REPLACE_WITH_TOKEN__'
```

#### 11.3.2 成功响应示例（支付已完成）
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 9001,
    "paymentId": "PAYWX_JSAPIWECHAT202512240001001",
    "orderId": 501,
    "amountInCent": 19900,
    "payChannel": "WX_JSAPI",
    "status": "SUCCESS",
    "payAppId": "675ad12251f4d77432c9fc69",
    "thirdPayId": "P202512240001",
    "payData": "{\"mock\":true}",
    "createdTime": "2025-12-24T10:00:01",
    "updatedTime": "2025-12-24T10:00:03"
  },
  "timestamp": "2025-12-24T10:00:03"
}
```

---
> 更多字段及状态定义可参考 `src/main/java/com/ai/tcm/modules/payment/domain/entity/Order.java` 与 `PaymentInfo.java`。

## 12. 支付中心对接方案（整合）

> 本章节用于将“对外接口说明”和“对接方案/落地说明”收敛到同一份文档，避免重复维护。

### 12.1 接入目标
1. **统一路由与配置**：商户（`pay_mch_info`）与应用（`pay_mch_app`）由支付中心统一维护，业务只需传入 `payAppId` 即可命中正确的渠道与回调配置。
2. **能力复用**：下单、查询、退款等动作均通过支付中心 API 完成，避免在业务系统中堆积多渠道 SDK。
3. **扩展性**：支持直播/CRM 等多支付场景的路由（`routePayType`）、按商品维度区分的限额策略（`productRouteType`）、权重/随机/轮询等策略。

### 12.2 核心表结构

> 表结构 DDL 统一见：`doc/sql/payment_center_tables.sql`

#### 12.2.1 pay_mch_info – 商户配置
| 字段 | 说明 |
| --- | --- |
| `mch_no` | 商户号，支付中心中的唯一主键。 |
| `mch_name` / `mch_short_name` | 商户展示信息。 |
| `wx_pay_route_type` / `zfb_pay_route_type` | 平台级路由策略（轮询/随机/权重）。 |
| `api_base` | 支付中心对外 API 网关地址。 |
| `notify_url` / `return_url` / `refund_notify_url` | 支付与退款回调地址，支付中心会回调到这些 URL。 |

> 回调地址建议：
> - `notify_url`：配置为本服务 `POST /jeeQuan/pay/callback`
> - `refund_notify_url`：配置为本服务 `POST /jeeQuan/pay/refundCallback`
> - `return_url`：前端支付完成跳转地址

#### 12.2.2 pay_mch_app – 应用配置
| 字段 | 说明 |
| --- | --- |
| `app_id` / `app_name` | 应用唯一标识与名称。 |
| `mch_no` | 归属商户。 |
| `app_secret` | 业务签名或私钥。 |
| `wx_pay_route_weight` / `zfb_pay_route_weight` | 不同支付渠道的权重。 |
| `product_route_type` | 商品路由类型（0=全部，1=小额，2=大额）。 |
| `route_pay_type` | 场景类型（1=直播，2=CRM...）。 |

### 12.3 业务接入流程（链路说明）

#### 12.3.1 获取可用支付 AppId
```
GET /tmc/payRoute/getPayApp
```
- 入参：商户号、商品/课程信息、支付渠道偏好等。
- 策略：`PayRouteStrategyFactory` 会结合 `pay_mch_info` 的路由类型 + `pay_mch_app` 的权重/约束，选出一个符合条件的 `appId`（以及 `gzhId` 等信息）。
- 要求：在创建订单或初始化支付前，务必调用一次路由接口并把获得的 `payAppId` 贯穿整个支付生命周期。

#### 12.3.2 创建并发起支付
```
POST /api/payments/createAndPayOrder
```
1. 控制器接收请求并完成参数校验（字段定义见「11. 下单并支付」）。
2. 调用 `OrderService#createOrder` 创建订单。
3. 组装 `PaymentInitInfoRequest`（包含 `payAppId`、支付通道、openId、金额等），调用 `PaymentService#initiatePayment(orderId, amountInCent, request, clientIp)` 发起支付。

#### 12.3.3 支付中心下单
`PaymentService#initiatePayment()` 关键逻辑：
1. 基于 `uid` 与 `orderId` 校验订单与支付状态，若有未完成的 `PaymentInfo` 会自动取消。
2. 保存一条新的 `PaymentInfo`（包含 `payAppId`、渠道、机构编码、coupon 等信息）。
3. 根据 `mch_no` 查 `pay_mch_info`，填充 `notify_url`、`return_url`、`api_base` 等。
4. 组装 `PayOrderCreateReqModel` 并通过 Jeepay SDK（`JeepayClient`）调用统一下单，SDK 自动完成签名。
5. 成功后写入支付中心返回的 `payOrderId` / `payData`，同步给前端调起支付。

#### 12.3.4 结果查询
```
GET /api/payments/queryByPaymentId/{paymentId}
```
- 通过 `PaymentService#refreshPaymentStatusByPaymentId(paymentId)` 读取 `payAppId`，携带到支付中心查询接口，并使用 `pay_mch_info.api_base` + `pay_mch_app.app_secret` 完成签名与调用。
- 查询完成后回写本地订单状态；支付回调同样触发 `PaymentService` 进行状态流转。

### 12.4 关键注意事项
1. **幂等**：支付中心通常要求 `paymentId` 在商户范围内唯一，业务侧需保证生成策略不重复。
2. **回调地址**：`pay_mch_info.notify_url` 等由支付中心调用，本服务需确保公网可达并完成签名校验。
3. **安全**：`app_secret` 仅在服务端保存；调用 `/tmc/payRoute/*` 与支付中心接口建议走内网或 mTLS。
4. **路由降级**：若 `/tmc/payRoute/*` 未返回可用应用，应阻断支付流程并提示“暂无可用支付通道”，避免依赖兜底值。
5. **字段贯穿**：`payAppId`、`orgCode`、`channel(wayCode)` 等字段需在客户端/前端贯穿整个支付生命周期，避免错配商户与渠道。
6. **签名密钥**：`pay_mch_app.app_secret` 用作 Jeepay SDK 的 `apiKey`，必须与支付中心保持一致。
