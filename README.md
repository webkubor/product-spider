# 灵活的产品爬虫框架

这是一个灵活的网页爬虫框架，可以根据配置爬取不同网站的产品信息，并将结果保存为JSON文件。

## 功能特点

- 支持多站点配置
- 基于CSS选择器的灵活抓取
- 自动导出为JSON格式
- 每个站点的数据分别保存

## 安装

确保已安装Node.js，然后安装依赖：

```bash
npm install
```

## 使用方法

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

## 配置说明

每个站点配置需要包含：

- `url`: 目标网页URL
- `selectors`: CSS选择器配置
  - `product`: 产品项目的选择器
  - `name`: 产品名称的选择器
  - `price`: 产品价格的选择器
  - `image`: 产品图片的选择器

## 示例输出

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
