# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

铃兰小程序 (Linglan Mini App) - 灵壹健康 (Lingyi Health) is a WeChat Mini Program for a traditional Chinese medicine consultation platform. The app provides health courses, AI-powered inquiry/consultation, and user management features.

## Development Environment

This is a native WeChat Mini Program project. Development requires:
- **WeChat Developer Tools** (微信开发者工具) - download from https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- Import the project root directory in WeChat Developer Tools
- Configure AppID in [project.config.json](project.config.json)

There is no npm, no build commands, and no test framework. All development and preview happens through WeChat Developer Tools.

## Architecture

### File Structure Pattern
Each page/component follows the standard WeChat Mini Program four-file structure:
- `.js` - Logic and data
- `.json` - Configuration
- `.wxml` - Template (HTML-like)
- `.wxss` - Styles (CSS-like)

### Key Directories
- `pages/` - App pages (15 total, see [app.json](app.json) for full list)
- `services/` - API service modules (auth, home, course, content, ai, my, request)
- `utils/` - Utility functions including `markdown.js` for AI chat message rendering
- `config/` - Environment configuration
- `custom-tab-bar/` - Custom bottom navigation component with CDN images
- `docs/` - Backend API documentation (8 API docs)

### Service Layer Architecture
API calls are structured in two layers:
1. **[services/request.js](services/request.js)** - Base HTTP client with:
   - Automatic token injection via `x-token` header
   - Token refresh on 401 responses
   - Redirect to login on auth failure
   - Unified error handling

2. **Domain services** - Business-specific API calls that use the base request module:
   - [services/auth.js](services/auth.js) - Authentication (login, token refresh, WeChat code2session). Login also fetches `/api/me` for full user profile including nickname.
   - [services/home.js](services/home.js) - Home page data, including `getLeadAssistant()` for WeChat Work contact assistant
   - [services/course.js](services/course.js) - Courses, tags, enrollment, progress tracking
   - [services/content.js](services/content.js) - Articles, comments, likes, favorites
   - [services/ai.js](services/ai.js) - AI consultation (dialog init, history, send message)
   - [services/my.js](services/my.js) - User profile and health records (health profile fields: `phone`, `fullName`, `age`, `gender` (0=女,1=男), `heightCm`, `weightKg`, `extra`)

### Authentication Flow
The app uses a two-step WeChat + phone verification flow:

1. **WeChat Login**: Call `wx.login()` to get `code` → send to `/api/auth/mini-program/code2session` → receive `unionId`
2. **Phone Binding**: Get phone via OTP verification or WeChat's `getPhoneNumber` button
3. **Final Login**: Send `unionId` + `phone` to `/api/auth/login` → receive access token + refresh token

**Token storage** (keys defined in [config/index.js](config/index.js)):
- `x_token` - Access token (30min validity)
- `refresh_token` - Refresh token (7 days validity)
- `user_info` - User profile data

**Token refresh**: Automatic via [services/request.js](services/request.js) when receiving 401 responses. Token refresh requires both `token` and `refreshToken` in response data; otherwise redirects to login.

### Login State Checking
Use `authService.checkLogin()` or `authService.isLoggedIn()` from [services/auth.js](services/auth.js) for login checks:

```javascript
const authService = require('../../services/auth')

// For click handlers - shows login page if not logged in, returns boolean
onSomeAction() {
  if (!authService.checkLogin()) return
  // ... proceed with action
}

// For page lifecycle - redirects and stops execution
onShow() {
  if (!authService.isLoggedIn()) {
    wx.redirectTo({ url: '/pages/login/login' })
    return
  }
}
```

**Pages requiring login:**
- 问询TAB页 (inquiry) - checks in `onShow()`
- 问询聊天页 (inquiry-chat) - checks in `onLoad()`
- 我的页面二级功能 (membership, health profile) - checks on tap

**Pages NOT requiring login:**
- 首页 (index) - freely accessible
- 课堂TAB页 (lesson) - freely accessible
- 课程详情页 (course-detail) - freely accessible

### API Configuration
Environment configuration in [config/index.js](config/index.js):
- `ENV` variable controls dev/prod environment (change this to switch environments)
- `baseUrl` points to backend API server
- Token storage keys and OTP constants

### Custom Tab Bar
Uses WeChat's custom tabBar feature (`"custom": true` in [app.json](app.json)). The component is in [custom-tab-bar/](custom-tab-bar/) and uses CDN-hosted icon images.

**Tab indices:**
- 0 = index (首页)
- 1 = inquiry (问询)
- 2 = lesson (课程)
- 3 = mine (我的)

**Icon images** are hosted on COS CDN at `https://cn-bundigit-1331637075.cos.ap-guangzhou.myqcloud.com/linlanmini/static/`:
- `tab-home.png` / `tab-home-active.png`
- `tab-inquiry.png` / `tab-inquiry-active.png`
- `tab-lesson.png` / `tab-lesson-active.png`
- `tab-mine.png` / `tab-mine-active.png`

Must manually sync `selected` state in each tab page's `onShow` lifecycle:

```javascript
onShow() {
  if (typeof this.getTabBar === 'function' && this.getTabBar()) {
    this.getTabBar().setData({ selected: 0 }) // Update index for each tab page
  }
}
```

## API Documentation

Backend API documentation is in `docs/`:
- [api-auth.md](docs/api-auth.md) - Authentication endpoints
- [home_module_api.md](docs/home_module_api.md) - Home page APIs
- [ai_dialog_api.md](docs/ai_dialog_api.md) - AI consultation APIs
- [course_module_api.md](docs/course_module_api.md) - Course APIs
- [content_module_api.md](docs/content_module_api.md) - Content APIs
- [my_module_api.md](docs/my_module_api.md) - User profile APIs
- [membership_module_api.md](docs/membership_module_api.md) - Membership/VIP APIs
- [product_module_api.md](docs/product_module_api.md) - Product APIs

All APIs return unified `ApiResponse<T>` format: `{ success, message, data, timestamp }`

## Code Conventions

### HTTP Requests
**IMPORTANT**: Always use [services/request.js](services/request.js) for API calls, NOT [utils/util.js](utils/util.js). The request service provides:
- Automatic token injection and refresh
- Unified error handling
- Automatic login redirect on auth failure

Use domain-specific services ([services/auth.js](services/auth.js), [services/home.js](services/home.js), etc.) which wrap the base request module.

### CSS Utilities
Global styles in [app.wxss](app.wxss) provide extensive utility classes:
- **Flex layout**: `.flex-row`, `.flex-col`, `.justify-center`, `.items-center`, `.flex-1`
- **Spacing**: `.mt-{n}`, `.ml-{n}` (where n = 2, 4, 6, 8, ... 100 in even increments)
- **Position**: `.relative`, `.self-start`, `.self-center`

**CSS Variables** (defined in `page` selector):
- Colors: `--primary-color`, `--text-color`, `--text-secondary`, `--border-color`, `--bg-color`
- Font sizes: `--font-size-sm`, `--font-size-base`, `--font-size-lg`, `--font-size-xl`
- Spacing: `--spacing-sm`, `--spacing-base`, `--spacing-md`, `--spacing-lg`
- Border radius: `--radius-sm`, `--radius-base`, `--radius-lg`

Use these utilities instead of writing custom CSS where possible.

### Data Transformation Patterns
Common pattern used throughout the app for normalizing backend data:
- **Tag name mapping**: Convert English tags to Chinese (e.g., `PHYSIQUE` → `体质调理`)
- **Role normalization**: Standardize message roles with `.toUpperCase()` to handle case inconsistencies
- **Null handling**: Always provide fallback values for nullable fields (e.g., `avatar || ''`)

See [pages/index/index.js](pages/index/index.js) for examples.

### Module Exports
Uses CommonJS (`module.exports` / `require()`) - not ES modules

## Page Features

### Inquiry (问询) Pages
1. **[pages/inquiry/inquiry.js](pages/inquiry/inquiry.js)** - Inquiry TAB page (tab bar index 1)
   - Main AI consultation interface with chat functionality
   - Dynamic scroll area height calculation (title to input box)
   - Quick question shortcuts, message history loading
   - Uses `aiService.initDialogPage(templateId)` for initialization

2. **[pages/inquiry-chat/inquiry-chat.js](pages/inquiry-chat/inquiry-chat.js)** - Standalone AI chat page
   - URL parameters: `templateId`, `title` for scenario-based consultations
   - Features real-time chat with AI assistant (灵医生), quick question shortcuts, auto-scroll
   - Uses `parseMarkdown()` from `utils/markdown.js` for message rendering

### Lesson & Course (课程) Pages
1. **[pages/lesson/lesson.js](pages/lesson/lesson.js)** - Lesson tab page (tab bar index 2)
   - Main course browsing interface with tag-based filtering
   - Displays course tags (primary/secondary), hot courses, and article list
   - Uses both `courseService` and `contentService`

2. **[pages/course/course.js](pages/course/course.js)** - Course catalog page (non-tab)
   - Features search, category filtering, content types (视频/生活/母婴/睡眠)
   - Shows course cards with instructor info and tags

3. **[pages/course-detail/course-detail.js](pages/course-detail/course-detail.js)** - Course detail page
   - URL parameters: `courseId` (required), `sectionId` (optional)
   - Course sections with VIDEO or ARTICLE content types
   - Enrollment system and progress tracking (0-100%)

### Content (文章) Pages
1. **[pages/article-list/article-list.js](pages/article-list/article-list.js)** - Article list page
   - Tag filtering, keyword search, pagination
   - Supports like and favorite actions via `contentService`
   - URL parameter: `tag` for pre-selected tag filter

2. **[pages/article-detail/article-detail.js](pages/article-detail/article-detail.js)** - Article detail page
   - URL parameters: `id` or `articleId`
   - Features: like, favorite, comment, font size adjustment, share
   - Comment system with pagination

### Membership (会员) Pages
1. **[pages/membership/membership.js](pages/membership/membership.js)** - VIP membership page
   - Displays membership status, level, expiry date
   - Subscription plans: monthly, quarterly, yearly
   - Uses `myService.getMembershipStatus()` for membership data
   - Level mapping: `MONTHLY` → 1, `QUARTERLY` → 2, `ANNUAL` → 3

### Mine (我的) Page
**[pages/mine/mine.js](pages/mine/mine.js)** - User profile TAB page (tab bar index 3)
- Displays user profile, membership status, health profile
- Entry points to membership and health profile pages (require login via `authService.checkLogin()`)
- Health profile form with fields: phone, fullName, age, gender, heightCm, weightKg, extra

### Login (登录) Page
**[pages/login/login.js](pages/login/login.js)** - WeChat authorization login with avatar/nickname
- Uses WeChat's avatar/nickname filling capability (`open-type="chooseAvatar"`, `type="nickname"`)
- Avatar and nickname are optional, passed to `/api/auth/login` on submit
- After login success, calls `/api/me` to get full user profile including nickname

### Other Pages
- **[pages/webview/webview.js](pages/webview/webview.js)** - Generic WebView for external links
- **[pages/agreement/agreement.js](pages/agreement/agreement.js)** - User agreement/privacy policy
- **[pages/phone-login/phone-login.js](pages/phone-login/phone-login.js)** - Phone number login with OTP
- **[pages/register/register.js](pages/register/register.js)** - User registration (mock implementation)

### URL Parameters Quick Reference
| Page | Parameters |
|------|------------|
| inquiry-chat | `templateId`, `title` |
| course-detail | `courseId` (required), `sectionId` (optional) |
| article-detail | `id` or `articleId` |
| article-list | `tag` (optional, pre-select filter) |
| webview | `url` (required, URL-encoded), `title` (optional) |
| agreement | `type=user` or `type=privacy` |

## Styling Notes

### Global CSS Utilities
The global utilities in [app.wxss](app.wxss) are already comprehensive. **Do not duplicate these styles** in page-specific WXSS files:
- Already included: `.flex-row`, `.flex-col`, `.justify-*`, `.items-*`, `.self-*`, `.flex-1`, `.relative`
- Already included: `.ml-{2-100}` and `.mt-{2-100}` (even increments from 2-100)
- Page-specific WXSS should only contain unique styles not covered by global utilities

### Custom Margin Classes
Some pages may use non-standard margins (e.g., `.mt-103`, `.mt-102`). These should be:
- Added to page-specific WXSS files only when needed
- Documented why the standard increment doesn't work
- Converted to standard increments when possible during refactoring

### Dynamic Height Calculation Pattern
For TAB pages with fixed input areas (like inquiry), use this pattern:

```javascript
calculateScrollAreaHeight() {
  const query = wx.createSelectorQuery()
  query.select('.header-fixed').boundingClientRect()
  query.select('.input-area').boundingClientRect()
  query.exec((res) => {
    const headerRect = res[0]
    const inputRect = res[1]
    const scrollHeight = inputRect.top - headerRect.bottom
    this.setData({ scrollAreaHeight: scrollHeight > 0 ? scrollHeight : 300 })
  })
}
```

Call in both `onReady()` and `onShow()` with a small delay (`setTimeout(..., 100)`) to ensure fixed elements are rendered.

## Known Issues & TODOs

### High Priority (Affects functionality)
- **[pages/membership/membership.js](pages/membership/membership.js)**: `loadCourses()` uses hardcoded data, `onSubscribe()` payment not implemented
- **[pages/register/register.js](pages/register/register.js)**: Registration is mock implementation, doesn't call real API

### Medium Priority (Incomplete features)
- **Search**: `onSearch()` not implemented in [lesson.js](pages/lesson/lesson.js) and [course.js](pages/course/course.js)
- **VIP Feature**: `onHealthAssistantTap()` in [inquiry.js](pages/inquiry/inquiry.js) not implemented
- **Share/Favorite**: Not implemented in article-list and course pages

### Low Priority (Code cleanup)
- Multiple files contain `console.log` debug statements (~54 occurrences)
- Some pages use `ide.code.fun` placeholder image URLs from design mockups
- [inquiry.wxml](pages/inquiry/inquiry.wxml) contains ~90 lines of commented legacy code

## Special Features

### Lead Assistant (获客助手)
Home page's "添加专属微信群" banner is controlled by `/api/home/lead-assistant` API. If `enabled: true` and `url` exists, banner shows and links to WebView page. See [pages/index/index.js](pages/index/index.js) `loadHomeData()` and `onAddWechat()`.
