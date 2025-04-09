// 爬虫配置文件

// 忽略名单，列出不需要爬取的站点
export const ignoreList = [
];

// 全局配置
export const globalConfig = {
  productLimit: 30  // 每个站点最多爬取的产品数量
};

export const scrapingConfig = {
   "doughnut": {
    "url": "https://www.doughnut.com.tw/v2/official/SalePageCategory/445264?sortMode=PageView",
    "type": "standard",
    "waitSelector": ".column-grid-container__column",
    "autoScroll": true,
    "waitTime": 8000,
    "selectors": {
      "product": ".column-grid-container__column",
      "name": "[data-qe-id='body-meta-field-text']",
      "price": "[data-qe-id='body-price-text']",
      "image": ".product-card__vertical__media-tall",
      "link": "a.sc-hqiKlG"
    }
   }

};

