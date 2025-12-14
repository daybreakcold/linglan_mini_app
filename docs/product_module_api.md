# 商品模块 API

> 适用于“商品中心”后台配置场景，用于创建/更新商品并关联可兑换的课程权益。所有接口需运营角色登录（`x-token`），更新与删除均采用 `POST` + 动作后缀的方式。

## 公共字段

### ProductResponse
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | long | 商品 ID |
| name | string | 商品名称 |
| description | string | 描述 |
| priceInCent | long | 单价（分） |
| status | string | 状态：`ON_SALE` / `OFF_SHELF` |
| courseIds | long[] | 关联课程 ID 列表 |
| createdTime / updatedTime | string | 创建/更新时间 |

### ProductCreateRequest
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | ≤128 字符 |
| description | string | 否 | ≤512 字符 |
| priceInCent | long | 是 | 大于 0，单位：分 |
| status | string | 否 | 默认 `ON_SALE` |
| courseIds | long[] | 否 | 关联权益课程 ID 列表 |

## 1. 创建商品
- **Method & Path**：`POST /api/products`
- **请求体**：`ProductCreateRequest`
- **响应**：`ApiResponse<ProductResponse>`
- **行为说明**：
  - `name` 全局唯一，重复会报错。
  - 若提供 `courseIds`，会写入 `product_course` 关联表，可配置多个课程权益。

## 2. 更新商品
- **Method & Path**：`POST /api/products/{id}/update`
- **请求体**：与创建接口一致。
- **响应**：`ApiResponse<ProductResponse>`
- **备注**：
  - 更新时同样会校验名称唯一性（排除自身）。
  - `courseIds` 会整体覆盖原有配置；传空数组或缺省表示清空关联课程。

## 3. 商品下线
- **Method & Path**：`POST /api/products/{id}/delete`
- **说明**：逻辑删除，将 `status` 置为 `OFF_SHELF`，不会移除历史订单引用；响应 `ApiResponse<Void>`。

## 4. 商品列表
- **Method & Path**：`GET /api/products`
- **说明**：返回所有商品（默认按创建时间顺序），无分页参数；响应 `ApiResponse<List<ProductResponse>>`。

## 5. 商品详情
- **Method & Path**：`GET /api/products/{id}`
- **说明**：返回指定商品详情，含课程关联；不存在会抛出 “商品不存在” 错误。
