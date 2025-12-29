# “我的”模块接口

围绕 App「我的」页面输出个人信息和入口统计。接口默认需要登录态（Header `x-token`），认证由拦截器完成。

## GET /api/me
- **说明**：返回用户基础资料、会员状态以及常用入口的角标数。
- **请求头**：`x-token`（必填）
- **响应体**：
  ```json
  {
    "success": true,
    "data": {
      "userId": 10001,
      "nickname": "王小中",
      "avatar": "https://static.ai-tcm.com/avatar.png",
      "phone": "13800000000",
      "gender": 1,
      "stats": {
        "orderCount": 5,
        "favoriteCount": 12
      },
      "membership": {
        "active": true,
        "levelCode": "ANNUAL",
        "levelName": "尊享年卡",
        "startAt": "2025-11-01T09:00:00",
        "endAt": "2026-11-01T09:00:00",
        "remainingDays": 365
      },
      "entries": [
        { "code": "orders", "name": "我的订单", "badge": 5 },
        { "code": "courses", "name": "我的课程", "badge": 0 },
        { "code": "favorites", "name": "我的收藏", "badge": 12 },
        { "code": "messages", "name": "消息中心", "badge": 0 },
        { "code": "coupons", "name": "优惠券", "badge": 0 }
      ]
    },
    "timestamp": "2025-11-09T23:10:00"
  }
  ```
- **字段说明**：
  - `stats.orderCount`：用户历史下单总数。
  - `stats.favoriteCount`：收藏（article/content）数量。
  - `membership`：复用会员模块 `MembershipStatusResponse`，字段见《membership_module_api.md》，如 `levelCode` 对应 `MembershipLevelCode` 枚举；当未开通权益时 `active=false`、`remainingDays=0`，其余字段返回 `null`。
  - `entries`：前端「我的」页面的快捷入口，可根据 `code` 渲染图标并按 `badge` 展示红点。

> 依赖表：`user`、`order_info`、`favorite`、`user_membership`。若未来新增课程报名、消息中心等表，可在 `MyProfileService` 中扩展对应角标逻辑。

## GET /api/me/benefits
- **说明**：用于“我的权益”页面，返回头像/昵称/会员到期时间，以及固定三档商品卡片（产品ID：1=月卡、2=年卡、3=季卡）。是否拥有权益以 `membership.active` 判断。
- **请求头**：`x-token`（必填）
- **请求示例**：
  ```bash
  curl -X GET 'http://localhost:8080/api/me/benefits' \
    -H 'x-token: YOUR_TOKEN'
  ```
- **成功响应**：`ApiResponse<MyBenefitsPageResponse>`，示例：
  ```json
  {
    "success": true,
    "data": {
      "profile": {
        "avatar": "https://static.ai-tcm.com/avatar.png",
        "nickname": "北极小白熊"
      },
      "membership": {
        "active": true,
        "endAt": "2026-01-20T00:00:00",
        "endDate": "2026-01-20",
        "expireText": "会员于 2026-01-20 到期"
      },
      "products": [
        {
          "productId": 1,
          "title": "连续包月",
          "tag": "限时优惠",
          "recommend": false,
          "selected": true,
          "status": "ON_SALE",
          "priceInCent": 990,
          "show_price": 1200,
          "renewPriceInCent": 1200,
          "renewTip": "次月续费",
          "cancelTip": "可随时取消"
        },
        {
          "productId": 2,
          "title": "连续包年",
          "tag": "超值推荐",
          "recommend": true,
          "selected": false,
          "status": "ON_SALE",
          "priceInCent": 9800,
          "show_price": 23800,
          "renewPriceInCent": 23800,
          "renewTip": "次月续费",
          "cancelTip": "可随时取消"
        },
        {
          "productId": 3,
          "title": "连续包季",
          "tag": "限时优惠",
          "recommend": false,
          "selected": false,
          "status": "ON_SALE",
          "priceInCent": 2880,
          "show_price": 3600,
          "renewPriceInCent": 3600,
          "renewTip": "次月续费",
          "cancelTip": "可随时取消"
        }
      ]
    },
    "timestamp": "2025-12-26T11:06:00"
  }
  ```
- **失败响应示例**（缺少 `x-token`，HTTP 401）：
  ```json
  {
    "success": false,
    "message": "缺少登录凭证",
    "data": null,
    "timestamp": "2025-12-26T11:06:00"
  }
  ```
- **字段明细**：
  - Header：
    - `x-token` string 必填：登录态令牌。
  - Response.data.profile：
    - `avatar` string：头像 URL。
    - `nickname` string：昵称。
  - Response.data.membership：
    - `active` boolean：是否有有效会员。
    - `endAt` string：到期时间（ISO-8601）。
    - `endDate` string：到期日期（yyyy-MM-dd），便于直接渲染。
    - `expireText` string：到期提示文案。
  - Response.data.products[]：
    - `productId` long：商品 ID（固定 1/2/3）。
    - `title` string：卡片标题（通常为商品名称）。
    - `tag` string：角标文案（如“限时优惠/超值推荐”）。
    - `recommend` boolean：是否推荐。
    - `selected` boolean：默认选中。
    - `status` string：商品状态（`ON_SALE`/`OFF_SHELF`）。
    - `priceInCent` long：当前价格（分）。
    - `show_price` long：划线展示价/对比价（分，仅用于展示）。
    - `renewPriceInCent` long：次月续费价（分）。
    - `renewTip` string：次月续费提示文案（不包含金额）。
    - `cancelTip` string：取消提示文案（如“可随时取消”）。

## GET /api/me/health-profile
- **说明**：返回健康档案页所需字段（参考 UI 中“姓名/年龄/性别/身高/体重/其他”栏目）。
- **请求头**：`x-token`
- **响应体**：
  ```json
  {
    "success": true,
    "data": {
      "phone": "13800000000",
      "fullName": "张小娃",
      "age": 6,
      "gender": 0,
      "heightCm": 115.0,
      "weightKg": 20.0,
      "extra": "体温偏高时及时就医"
    }
  }
  ```
- **字段说明**：
  - 若 `user_health_profile` 中无数据，会自动使用 `user` 表的昵称、手机号、性别作为默认值，其余字段为空。
  - `gender`：0=女、1=男；与用户表保持一致。
- **依赖表**：`user_health_profile`、`user`。

## POST /api/me/health-profile
- **说明**：保存/编辑健康档案，覆盖 UI 中“姓名/年龄/性别/身高/体重/其他”字段。
- **请求头**：`x-token`
- **请求体**：
  ```json
  {
    "phone": "13800000000",
    "fullName": "张小娃",
    "age": 6,
    "gender": 0,
    "heightCm": 115.0,
    "weightKg": 20.0,
    "extra": "无过敏史"
  }
  ```
- **返回体**：`ApiResponse<HealthProfileResponse>`（同 GET）。
- **行为说明**：
  - 若用户已有档案则更新，若无则创建新档案。
  - 字段均为可选，未填写的值将覆盖为 `null`（UI 可在提交前做必填校验）。
