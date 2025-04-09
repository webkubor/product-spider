// 爬虫配置文件

// 忽略名单，列出不需要爬取的站点
export const ignoreList = [
];

// 全局配置
export const globalConfig = {
  productLimit: 50  // 每个站点最多爬取的产品数量
};

export const scrapingConfig = {
   "boboshop": {
    "url": "https://shop.samsonite.com/sale/",
    "type": "standard",
    "waitSelector": ".container.search-results",
    "autoScroll": true,
    "waitTime": 6000,
    "selectors": {
      "product": ".product",
      "name": ".link",
      "price": ".default-pricing .sales .value",
      "image": ".product-tile-image-link img"
    }
   }

};

// 可以根据需要添加更多站点配置
