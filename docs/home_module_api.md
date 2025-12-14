# 首页模块 API

面向小程序/APP 首页聚合展示的接口集合，主要涵盖“高亮卡片”“课程标签”“场景对话”三个区块。接口全部为只读请求，不需要登录认证（无需携带 `x-token`），返回结构统一使用 `ApiResponse<T>`。

## 1. GET /api/home/highlights
- **用途**：渲染首页顶部“养生课/正在学习/正在提问”等高亮卡片。
- **请求参数**：无（后续如需按渠道区分，可在 Query 补充扩展）。
- **响应体**：`ApiResponse<List<HomeHighlightResponse>>`

示例：
```json
{
  "success": true,
  "data": [
    { "name": "养生第一课", "type": "课程", "courseSectionId": 1001 },
    { "name": "268正在学习", "type": "文章", "courseSectionId": null },
    { "name": "325467正在提问", "type": "AI", "courseSectionId": null }
  ],
  "timestamp": "2025-11-10T12:00:00"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 前端展示文案，固定或随机数字 + 后缀。 |
| `type` | string | 卡片所属场景，例如 `课程` / `文章` / `AI`。 |
| `courseSectionId` | long | 关联课程章节 ID（仅课程类卡片返回值，其他场景为 `null`）。 |

## 2. GET /api/home/course-tags
- **用途**：在首页“热门课程”区块展示若干一级标签及其代表课程。
- **请求参数**：无。
- **响应体**：`ApiResponse<List<HomeCourseTagResponse>>`

示例：
```json
{
  "success": true,
  "data": [
    {
      "tagName": "脊柱护理",
      "courses": [
        {
          "courseId": 1,
          "title": "脊柱养护基础课",
          "summary": "AI 健康讲解脊柱健康",
          "firstSectionId": 11,
          "firstSectionArticleId": 201,
          "firstSectionTitle": "绪论：了解脊柱",
          "firstSectionSummary": "脊柱结构与常见问题"
        }
      ]
    }
  ]
}
```

### HomeCourseTagResponse 字段
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `tagName` | string | 一级标签名称（后端根据课程 `primaryTag` 归并）。 |
| `courses` | `HomeCourseSummaryResponse[]` | 标签下的课程列表，最多返回 3 组标签。 |

### HomeCourseSummaryResponse 字段
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `courseId` | long | 课程 ID。 |
| `title` | string | 课程标题。 |
| `summary` | string | 课程简介。 |
| `firstSectionId` | long | 首节章节 ID（按 `seq` 升序获取）。 |
| `firstSectionArticleId` | long | 若首节是文章，返回文章 ID，否则为 `null`。 |
| `firstSectionTitle` | string | 首节标题（文章则取文章标题）。 |
| `firstSectionSummary` | string | 首节摘要（文章则取文章摘要）。 |

> 数据来源：`course`、`course_section`、`content_article`。仅 `status=ONLINE` 的课程会参与计算。

## 3. GET /api/home/dialog-scenarios
- **用途**：为首页“场景对话”组件提供推荐标签、虚拟医生以及预设问答。
- **请求参数**：无。
- **响应体**：`ApiResponse<List<HomeDialogScenarioResponse>>`

示例：
```json
{
  "success": true,
  "data": [
    {
      "tag": "体质调理",
      "templateId": 3001,
      "title": "秋冬体质调养问诊",
      "description": "帮助家长识别孩子体虚症状",
      "doctor": {
        "name": "程若兰医师",
        "avatar": "https://static.ai-tcm.com/doctor/cheng.png"
      },
      "messages": [
        {"role": "SYSTEM", "content": "你是一名儿科健康师..."},
        {"role": "USER", "content": "孩子最近夜间盗汗，很怕冷"},
        {"role": "ASSISTANT", "content": "请描述孩子的作息与饮食"}
      ]
    }
  ]
}
```

### HomeDialogScenarioResponse 字段
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `tag` | string | 展示标签（来自模板标签去重后取前 3 个）。 |
| `templateId` | long | 关联的对话模板 ID。 |
| `title` | string | 模板标题。 |
| `description` | string | 模板描述。 |
| `doctor` | `DialogDoctorProfileDto` | 虚拟医生信息。 |
| `messages` | `DialogMessageDto[]` | 预设多轮问答脚本，按 sequence 升序排列。 |

### DialogDoctorProfileDto 字段
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 虚拟医生称谓。 |
| `avatar` | string | 虚拟医生头像 URL。 |

### DialogMessageDto 字段
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `role` | string | 消息角色：`SYSTEM` / `USER` / `ASSISTANT`。 |
| `content` | string | 对应的提示词或消息文本。 |

> 数据来源：`dialog_template`、`dialog_template_tag`、`dialog_template_message`、`dialog_virtual_doctor`。仅 `status=ACTIVE` 的模板及医生会返回，每次最多 3 组场景。
