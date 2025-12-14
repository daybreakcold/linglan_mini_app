# AI 场景问答接口

> 适用于首页「场景对话」跳转的 AI 问答页面，覆盖初始化与历史查询，以及提问接口的入参扩展。

## 1. 初始化 AI 问答页面

- **Method & Path**：`GET /api/ai/dialogs/initial`
- **说明**：前端在首页选择某个场景卡片时，只需携带模板 ID 即可一次性拿到页面展示所需的全部信息（模板标题/描述、医生信息、预设脚本、首屏历史记录）。
- **请求参数**

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| templateId | Long | 是 | 首页卡片对应的模板 ID |
| historySize | Integer | 否 | 首屏加载的历史条数，默认 20，最大 50 |

- **返回体**：`AiDialogPageInitResponse`

```json
{
  "templateId": 10,
  "title": "春季养肝调理问询",
  "description": "结合春季高频症状进行自查，必要时提示就医。",
  "tag": "spring_liver",
  "tags": ["spring_liver", "liver_fatigue"],
  "doctor": {
    "name": "李涵",
    "avatar": "https://static.xxx/doctor.png"
  },
  "presetMessages": [
    {"role": "user", "content": "最近总是乏力，想咨询下"},
    {"role": "ai", "content": "请问是否伴随口干、目涩等不适？"}
  ],
  "history": [
    {
      "messageId": 1888,
      "sessionId": 512,
      "role": "user",
      "content": "春季易上火，最近咽喉疼",
      "createdTime": "2024-05-01T09:10:00"
    }
  ],
  "historyHasMore": true,
  "nextCursor": 1888
}
```

- **后端实现**：`com.ai.tcm.modules.llm.dialog.controller.AiDialogPageController#initDialogPage`、`AiDialogPageServiceImpl#initDialogPage`

## 2. 历史记录向上滚动

- **Method & Path**：`GET /api/ai/dialogs/history`
- **说明**：进入页面后，用户可以不断上拉加载基于标签聚合的历史消息；后端会按照消息 ID 倒序分页。
- **请求参数**

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| tag | String | 是 | 初始化返回的 `tag` 字段 |
| cursor | Long | 否 | 上一次返回的 `nextCursor`，为空时默认加载最近一页 |
| size | Integer | 否 | 每页条数，默认 20，最大 50 |

- **返回体**：`AiDialogHistoryResponse`

```json
{
  "messages": [
    {
      "messageId": 1777,
      "sessionId": 500,
      "role": "ai",
      "content": "请先保持清淡饮食并观察体温变化",
      "createdTime": "2024-04-30T11:05:00"
    }
  ],
  "hasMore": false,
  "nextCursor": 1777
}
```

- **后端实现**：`AiDialogPageController#loadHistory`、`AiDialogPageServiceImpl#loadHistory`

## 3. 发送 AI 问答消息

- **Method & Path**：`POST /api/consult/ai/messages`
- **说明**：AI 问答页面点击发送时调用；需额外携带 `templateId`、`tag`，方便后端记录场景并为历史查询做筛选。
- **请求体**：`AiConsultRequest`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| question | String | 是 | 当前输入的问题 |
| history | Array&lt;HistoryMessage&gt; | 否 | 前端保留的上下文列表 |
| temperature | Double | 否 | 模型随机度，默认 0.7 |
| templateId | Long | 否 | 当前页面使用的模板 ID（建议前端传入） |
| tag | String | 否 | 当前场景标签（建议前端传入） |

`HistoryMessage` 结构：`role`（`user`/`ai`）、`content`。

- **返回体**：`AiConsultResponse`

```json
{
  "reply": "请先记录 3 天体温，若持续 38℃ 以上需及时就医。",
  "generatedAt": "2024-05-03T10:20:15",
  "sessionId": 654
}
```

- **后端实现**：`com.ai.tcm.controller.AiConsultController#ask`、`AiConsultServiceImpl#consult`

> 会话持久层 (`consult_session`) 已新增 `template_id`、`scene_tag` 字段，调用该接口时传入的模板/标签会被写入，供历史查询使用。

