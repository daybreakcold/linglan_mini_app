# 内容模块接口说明

## 1. 文章列表（健康科普-更多）
- **Method & Path**：`GET /api/articles`
- **用途**：为首页卡片与“健康科普-更多”页面提供可分页的文章列表，可按标签或关键字筛选。
- **请求参数**：

| 参数 | 位置 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| page | query | int | 否 | 1 | 页码，从 1 开始，小于 1 时按 1 处理 |
| size | query | int | 否 | 10 | 单页数量，最大 50，超出则按 50 处理 |
| tag | query | string | 否 | - | 标签过滤（如“养生”、“运动”），为空则返回全部已发布文章 |
| keyword | query | string | 否 | - | 标题关键字模糊搜索 |

- **响应体**：`ApiResponse<ArticleListResponse>`，`data` 结构如下：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| items | ArticleSummaryResponse[] | 当前页文章列表 |
| total | long | 满足条件的总记录数 |
| page | int | 当前页码 |
| size | int | 当前页大小 |
| hasNext | boolean | 是否存在下一页，供前端上拉加载 |

`ArticleSummaryResponse` 字段：`id`、`title`、`summary`、`coverUrl`、`tag`、`publishAt`、`viewCount`、`likeCount`，与列表卡片展示一一对应。

- **示例响应**：
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101,
        "title": "冬季养生茶饮指南",
        "summary": "来自国医大师的保暖建议",
        "coverUrl": "https://cdn.ai-tcm.com/article/101.jpg",
        "tag": "养生",
        "publishAt": "2025-11-05T09:00:00",
        "viewCount": 1288,
        "likeCount": 320
      }
    ],
    "total": 56,
    "page": 1,
    "size": 10,
    "hasNext": true
  },
  "timestamp": "2025-11-07T09:15:00"
}
```

## 2. 文章详情（健康科普-内容）
- **Method & Path**：`GET /api/articles/{articleId}`
- **用途**：渲染文章正文页，返回富文本、封面及统计数据。
- **请求参数**：

| 参数 | 位置 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| articleId | path | long | 是 | 文章主键 ID |

- **响应体**：`ApiResponse<ArticleDetailResponse>`，字段含义：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | long | 文章 ID |
| title | string | 标题 |
| summary | string | 摘要（用于分享或 SEO） |
| coverUrl | string | 封面图 |
| tag | string | 文章标签 |
| bodyHtml | string | HTML 正文，前端可直接渲染 |
| publishAt | string | 发布时间 |
| viewCount | long | 浏览量 |
| likeCount | long | 点赞数 |

- **备注**：若文章不存在或未发布，接口返回 `success=false`，`message` 提示“文章不存在或未发布”。

## 3. 评论列表与互动
UI 中的评论流、点赞、收藏能力沿用既有接口（`ArticleInteractionController`）：

| 场景 | Method & Path | 说明 |
| --- | --- | --- |
| 获取评论列表 | `GET /api/articles/{articleId}/comments?page=1&size=20` | 返回 `ArticleCommentPageResponse`，已支持分页与 `hasNext` 标记，用于“评论”面板的懒加载 |
| 发布评论 | `POST /api/articles/{articleId}/comments` | Body：`userId`、`content`、`parentId?`，用于“写评论”入口 |
| 点赞/收藏 | `POST /api/articles/{articleId}/likes`、`/favorites` 及 `/likes/delete`、`/favorites/delete` | 列表和详情页“点赞”“收藏”按钮复用 |

## 4. 计数与分页约定
- 所有列表接口均返回 `total/hasNext`，便于前端展示“共 X 条”与判断是否需要更多加载。
- `size` 超过 50 时自动截断至 50，防止一次性拉取过多数据。
- 服务端默认仅返回 `publishStatus=1`（已发布）的文章；草稿或下线文章不会出现在列表和详情中。

## 5. UI 对应关系摘要

| UI 编号 | 页面 | 依赖接口 |
| --- | --- | --- |
| 1-1 首页 | “健康科普”模块 | `GET /api/articles`（取前 N 条用于首页模块） |
| 1-2 健康科普-内容 | 文章详情页 | `GET /api/articles/{id}`、评论/点赞接口 |
| 1-2 健康科普-更多 | 列表页 | `GET /api/articles`（支持标签/搜索） |
