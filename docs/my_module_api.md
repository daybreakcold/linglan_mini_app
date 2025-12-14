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
  - `membership`：复用会员模块 `MembershipStatusResponse`，当未开通时 `active=false`，其余字段为空。
  - `entries`：前端「我的」页面的快捷入口，可根据 `code` 渲染图标并按 `badge` 展示红点。

> 依赖表：`user`、`order_info`、`favorite`、`user_membership`。若未来新增课程报名、消息中心等表，可在 `MyProfileService` 中扩展对应角标逻辑。

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
