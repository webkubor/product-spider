// 爬虫配置文件

// 忽略名单，列出不需要爬取的站点
export const ignoreList = [
  "doughnut"
];

// 全局配置
export const globalConfig = {
  productLimit: 30,  // 每个站点最多爬取的产品数量
  reindexProducts: true  // 是否重新生成连续的产品ID
};

export const scrapingConfig = {
   "usasnackshop": {
    "url": "https://usasnackshop.com/collections/all",
    "type": "standard",
    "waitSelector": "#product-grid",
    "autoScroll": true,
    "waitTime": 8000,
    "pagination": {
      "enabled": true,
      "nextSelector": ".pagination__item-arrow.link",
      "pageSelector": ".pagination__item:not(.pagination__item--current):not(.pagination__item-arrow)",
      "maxPages": 14
    },
    "selectors": {
      "product": ".grid__item",
      "name": ".full-unstyled-link",
      "price": ".price-item.price-item--regular",
      "image": ".media.media--transparent.media--hover-effect img",
    }
   },
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

