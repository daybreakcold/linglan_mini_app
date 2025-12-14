  # 课程模块接口

## GET /api/courses
- **用途**：课程列表页，支持按难度等级筛选。
- **Query 参数**：
  | 参数 | 说明 |
  | --- | --- |
  | `level` | 可选，课程等级（BEGINNER/INTERMEDIATE/ADVANCED 等） |
  | `primaryTag` | 可选，一级标签编码 |
  | `secondaryTag` | 可选，二级标签编码（若填写建议同步提供一级标签以便端上联动） |
- **返回**：`ApiResponse<List<CourseListItemResponse>>`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "title": "脊柱养护基础课",
        "coverUrl": "https://static.ai-tcm.com/courses/1.png",
        "level": "BEGINNER",
        "primaryTag": "SPINE",
        "secondaryTag": "SPINE_CARE_CHILD",
        "price": 199.0,
        "totalDuration": 120
      }
    ]
  }
  ```

## GET /api/courses/{id}
- **用途**：课程详情，包含章节列表。
- **返回**：`ApiResponse<CourseDetailResponse>`
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "脊柱养护基础课",
      "coverUrl": "https://static.ai-tcm.com/courses/1.png",
      "intro": "AI 健康师带你认识脊柱健康",
      "level": "BEGINNER",
      "primaryTag": "SPINE",
      "secondaryTag": "SPINE_CARE_CHILD",
      "price": 199.0,
      "totalDuration": 120,
      "sections": [
        {
          "id": 10,
          "seq": 1,
          "title": "绪论",
          "duration": 15,
          "preview": true,
          "contentType": "VIDEO",
          "videoUrl": "https://static.ai-tcm.com/videos/intro.mp4",
          "article": null
        },
        {
          "id": 11,
          "seq": 2,
          "title": "理论延伸",
          "duration": 8,
          "preview": false,
          "contentType": "ARTICLE",
          "videoUrl": null,
          "article": {
            "id": 101,
            "title": "脊柱发育基础",
            "summary": "课内图文内容",
            "coverUrl": "https://static.ai-tcm.com/articles/101.jpg",
            "tag": "脊柱",
            "publishAt": "2025-11-01T09:00:00",
            "viewCount": 128,
            "likeCount": 32
          }
        }
      ],
      "relatedArticles": [
        {
          "id": 101,
          "title": "脊柱发育基础",
          "summary": "课外延伸阅读",
          "coverUrl": "https://static.ai-tcm.com/articles/101.jpg",
          "tag": "脊柱",
          "publishAt": "2025-11-01T09:00:00",
          "viewCount": 128,
          "likeCount": 32
        }
      ]
    }
  }
  ```
- **异常**：若课程不存在或 `status != 1` 返回 400（IllegalArgumentException）。

> 数据来源：`course`、`course_section`（章节内容类型字段决定视频/文章）、`course_article` + `content_article`（复用内容模块文章）。章节顺序按 `seq` 升序，关联文章按配置顺序返回；当 `course_section.content_type = ARTICLE` 时，会直接加载 `content_article` 并注入到章节里。

## GET /api/course-tags
- **用途**：为课程筛选提供一级/二级标签联动字典。
- **返回**：`ApiResponse<List<CourseTagResponse>>`
  ```json
  {
    "success": true,
    "data": [
      {
        "primaryTag": "SPINE",
        "primaryName": "脊柱护理",
        "primaryOrder": 1,
        "secondaryTags": [
          {"code": "SPINE_BASIC", "name": "基础调理", "order": 1},
          {"code": "SPINE_CARE_CHILD", "name": "小儿脊柱", "order": 2}
        ]
      },
      {
        "primaryTag": "MASSAGE",
        "primaryName": "推拿理疗",
        "primaryOrder": 2,
        "secondaryTags": []
      }
    ]
  }
  ```
- **备注**：返回值根据当前有效课程动态计算，只有 `status = 1` 且配置了标签的课程才会出现在字典中；若系统预置了标签名称、排序，也会同步返回用于前端展示。

## POST /api/courses
- **用途**：运营侧创建课程，支持一次性配置标签及关联文章顺序。
- **请求头**：`x-token`（需具备运营权限）
- **请求体**：
  ```json
  {
    "title": "脊柱养护基础课",
    "coverUrl": "https://static.ai-tcm.com/courses/1.png",
    "intro": "入门介绍",
    "level": "BEGINNER",
    "price": 199.0,
    "status": 1,
    "totalDuration": 120,
    "primaryTag": "SPINE",
    "secondaryTag": "SPINE_BASIC",
    "relatedArticleIds": [101, 102]
  }
  ```
- **说明**：
  - `relatedArticleIds`：可选，按数组顺序同步到 `course_article.display_order`，用于课程详情页“扩展阅读”展示顺序。
  - 返回体与 `GET /api/courses/{id}` 一致，可直接用于创建完成后的详情回显。

## POST /api/courses/{id}/update
- **用途**：编辑课程基础信息及关联文章，字段含义同创建接口。
- **行为**：若 `relatedArticleIds` 为空数组或缺省，表示清空关联文章；标签字段允许置空。

## POST /api/courses/{id}/delete
- **用途**：删除课程，会级联清理 `course_section` 与 `course_article` 中的关联数据。
- **响应**：`ApiResponse<Void>`，成功即返回 `{"success":true}`。

## POST /api/courses/{courseId}/sections
- **用途**：新增章节，可配置视频或图文章节。
- **请求体**：
  ```json
  {
    "seq": 1,
    "title": "绪论",
    "duration": 12,
    "preview": true,
    "contentType": "VIDEO",
    "videoUrl": "https://static.ai-tcm.com/video/intro.mp4"
  }
  ```
- **规则**：
  - `contentType` 仅支持 `VIDEO`/`ARTICLE`，视频章节必填 `videoUrl`，图文章节必填 `articleId`。
  - `seq` 用于排序；同课程内允许更新。
- **返回**：`CourseSectionResponse`，包含创建后的章节详情。

## POST /api/courses/{courseId}/sections/{sectionId}/update
- **用途**：编辑章节内容、排序或预览状态；字段与创建接口一致。
- **说明**：当类型由 VIDEO 切换为 ARTICLE 时会自动清空旧的视频地址，反之亦然。

## POST /api/courses/{courseId}/sections/{sectionId}/delete
- **用途**：删除章节；删除后自动重新拉取课程详情即可得到最新章节列表。

## POST /api/courses/{courseId}/enrollments
- **用途**：用户报名课程（需登录），会写入 `course_enrollment`，默认进度 0。
- **返回**：
  ```json
  {
    "success": true,
    "data": {
      "courseId": 1,
      "userId": 10001,
      "enrolled": true,
      "progress": 0,
      "completed": false,
      "enrolledAt": "2025-11-05T09:00:00",
      "completedAt": null,
      "updatedAt": "2025-11-05T09:00:00"
    }
  }
  ```

## GET /api/courses/{courseId}/enrollments/me
- **用途**：查询当前用户的报名状态与进度。若未报名，返回 `enrolled=false` 且进度为 0。

## POST /api/courses/{courseId}/enrollments/progress/update
- **用途**：更新学习进度，取值范围 0~100，支持小数。
- **请求体**：
  ```json
  {
    "progress": 86.5
  }
  ```
- **行为**：当进度达到 100 时自动写入 `completedAt` 时间戳；若后续再次将进度调低，会将 `completedAt` 置空。

## 后续规划
- 课程评论评分/Q&A 以及章节问答体系仍在方案设计中，暂不对外提供接口。
- 播放鉴权、临时凭证与权益校验依赖订单/会员模块，当前版本仅输出报名态；上线前会在文档中新增对应接口。
