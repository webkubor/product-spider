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
- AJAX请求详情，包括请求URL、方式、参数和响应数据

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

## 前端开发工具

除了产品爬虫和请求监控功能外，本项目还提供了一系列基于 Playwright 的前端开发工具，帮助前端开发者提高开发效率。

### 网页截图工具

对任意网页进行截图，支持全页面或特定元素截图。

```bash
# 基本用法
npm run screenshot -- https://example.com

# 截取特定元素
npm run screenshot -- https://example.com --selector=".header-logo"

# 模拟移动设备
npm run screenshot -- https://example.com --device="iPhone 12"

# 自定义视口大小
npm run screenshot -- https://example.com --width=1280 --height=720

# 设置等待时间
npm run screenshot -- https://example.com --waitTime=5000
```

### 性能测试工具

收集和分析网页性能指标，如加载时间、首次绘制、DOM交互时间等。

```bash
# 基本用法
npm run performance -- https://example.com

# 多次运行取平均值
npm run performance -- https://example.com --runs=5

# 模拟移动设备
npm run performance -- https://example.com --device="iPhone 12"

# 模拟网络节流
npm run performance -- https://example.com --throttling="slow3G"
```

### 视觉回归测试工具

对比两个网页的视觉差异，适合用于UI变更前后的对比。

```bash
# 基本用法
npm run visual-diff -- https://production.com https://staging.com

# 设置像素匹配阈值
npm run visual-diff -- https://production.com https://staging.com --threshold=0.2

# 对比特定元素
npm run visual-diff -- https://production.com https://staging.com --selector=".hero-section"

# 模拟移动设备
npm run visual-diff -- https://production.com https://staging.com --device="iPhone 12"
```

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
