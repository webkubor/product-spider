# 灵活的产品爬虫框架

这是一个灵活的网页爬虫框架，可以根据配置爬取不同网站的产品信息，并将结果保存为JSON文件。同时支持监控网页加载过程中的所有网络请求和响应。

## 功能特点

- 支持多站点配置
- 基于CSS选择器的灵活抓取
- 自动导出为JSON格式
- 每个站点的数据分别保存
- 网络请求监控与分析

## 安装

确保已安装Node.js，然后安装依赖：

```bash
npm install
```

本项目使用以下库美化终端输出：

- **chalk**: 终端文本着色
- **cli-table3**: 在终端中创建表格
- **ora**: 终端加载动画
- **figlet**: 生成ASCII艺术字体
- **boxen**: 在终端中创建方框

## 使用方法

### 产品爬虫

1. 在`config.js`文件中配置目标网站：

```javascript
export const scrapingConfig = {
  "site1": {
    "url": "https://www.example.com/products",
    "selectors": {
      "product": ".product-item",
      "name": ".product-name",
      "price": ".product-price",
      "image": ".product-image img"
    }
  },
  // 可以添加更多站点...
};
```

2. 运行爬虫：

```bash
npm start
```

3. 结果将保存在`results`目录下，格式为`[站点名称]-product.json`

### 网址请求监控

监控指定网址加载过程中的所有网络请求和响应：

```bash
node requestMonitor.js <网址> [等待时间(毫秒)]
```

例如：

```bash
node requestMonitor.js https://www.example.com 5000
```

参数说明：
- **网址**: 必填，要监控的目标网址
- **等待时间**: 可选，默认为10000毫秒(10秒)，等待捕获请求的时间

监控结果将以美化的方式在终端中显示，并保存为JSON文件到`results/requests`目录。

## 配置说明

### 产品爬虫配置

每个站点配置需要包含：

- `url`: 目标网页URL
- `selectors`: CSS选择器配置
  - `product`: 产品项目的选择器
  - `name`: 产品名称的选择器
  - `price`: 产品价格的选择器
  - `image`: 产品图片的选择器

### 请求监控配置

请求监控器会跟踪以下信息：

- 所有网络请求的URL、方法、头信息和资源类型
- 所有响应的状态码、头信息和响应体(对于文本类型)
- 请求和响应的时间戳和持续时间
- 按资源类型和状态码的统计信息

## 示例输出

### 产品爬虫输出

```json
[
  {
    "id": 1,
    "name": "产品名称",
    "price": "¥199.00",
    "image": "https://example.com/image.jpg",
    "url": "https://example.com/product/1"
  },
  ...
]
```

### 请求监控输出

终端中将显示美化的请求监控结果，包括：

- 监控摘要（总请求数、总响应数、监控时长等）
- 请求类型统计（按资源类型分类）
- 响应状态码统计
- 前10个请求的详细信息

同时，完整的监控数据会保存为JSON文件，格式如下：

```json
{
  "totalRequests": 42,
  "totalResponses": 40,
  "startTime": "2025-05-21T07:00:00.000Z",
  "endTime": "2025-05-21T07:00:10.000Z",
  "duration": 10000,
  "targetUrl": "https://example.com",
  "requests": [
    {
      "id": 1,
      "url": "https://example.com",
      "method": "GET",
      "headers": { ... },
      "resourceType": "document",
      "timestamp": 1621234567890,
      "timeSinceStart": 0,
      "response": {
        "status": 200,
        "statusText": "OK",
        "headers": { ... },
        "body": "<!DOCTYPE html>..."
      }
    },
    ...
  ]
}
```
