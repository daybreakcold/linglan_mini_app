# 会员权益模块接口

> 会员模块负责对外暴露“用户是否拥有权益、权益等级及有效期”信息，所有输出统一复用 `MembershipStatusResponse`，供「我的」页、内容播放鉴权等业务查询。接口基于 Header `x-token` 识别用户身份。

## 公共数据结构

### MembershipStatusResponse
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| active | boolean | 是否拥有有效权益，`false` 时其余字段为空。 |
| levelId | long | 会员等级主键，用于在后台跳转配置详情。 |
| levelCode | string | 等级编码，参考 `com.ai.tcm.modules.membership.domain.enums.MembershipLevelCode`（如 `MONTHLY`、`QUARTERLY`、`ANNUAL`）。 |
| levelName | string | 等级展示名称，例如“尊享年卡”。 |
| startAt | string | 权益生效时间（ISO-8601）。 |
| endAt | string | 权益到期时间（ISO-8601）。 |
| remainingDays | long | 剩余有效天数，当 `active=false` 时返回 0。 |

> 数据来源：`user_membership`、`membership_level`、`membership_product`，不依赖数据库外键，应用层负责约束。

## 1. 获取当前用户权益状态
- **Method & Path**：`GET /tmc/api/membership/status`
- **用途**：前端在初始化「我的」页、内容解锁或权益提示时调用，实时获知用户的会员权益状态。
- **请求头**：

| Header | 必填 | 说明 |
| --- | --- | --- |
| x-token | 是 | 登录接口签发的访问令牌。 |

- **响应体**：`ApiResponse<MembershipStatusResponse>`，示例：
  ```json
  {
    "success": true,
    "data": {
      "active": true,
      "levelId": 3,
      "levelCode": "ANNUAL",
      "levelName": "尊享年卡",
      "startAt": "2025-11-01T09:00:00",
      "endAt": "2026-11-01T09:00:00",
      "remainingDays": 365
    },
    "timestamp": "2025-11-10T10:00:00"
  }
  ```

- **业务约束**：
  - 若用户无有效权益，`active=false`、`remainingDays=0`，其余字段返回 `null`，以便前端统一判断。
  - 服务端根据请求上下文中的 `userId` 查询最近一条 `ACTIVE` 状态且未过期的记录；若存在多条会按结束时间倒序选择最晚到期的权益。
  - 与支付回调解耦，权益的新增或续期均由 `PaymentService` 调用 `MembershipService` 完成，接口仅负责查询输出。

## 2. 与其他模块的协作
- `GET /api/me` 会直接内嵌 `membership` 字段，数据结构完全复用 `MembershipStatusResponse`，详见《my_module_api.md》。
- 后续若课程播放或咨询订单需要校验权益，可直接调用本接口或透传 `MembershipStatusResponse`，确保对用户权益相关的输出均有文档说明。
