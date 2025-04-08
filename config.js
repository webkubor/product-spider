// 爬虫配置文件

// 忽略名单，列出不需要爬取的站点
export const ignoreList = [
  "pakstyle",
  "copypencil-fineArts"
];

// 全局配置
export const globalConfig = {
  productLimit: 50  // 每个站点最多爬取的产品数量
};

export const scrapingConfig = {
  "hp-flash-sale":{
    "url": "https://www.daraz.pk/#hp-categories",
    "type": "standard",
    "waitSelector": ".card-jfy-wrapper",
    "autoScroll": true,
    "waitTime": 5000,
    "selectors": {
      "product": ".pc-custom-link.jfy-item",
      "name": ".card-jfy-title",
      "price": ".hp-mod-price-first-line .price",
      "oldPrice": ".hp-mod-price-first-line .original",
      "image": ".picture-wrapper img",
      "link": ".pc-custom-link.jfy-item"
    }
  },
  "copypencil-fineArts":{
    "url": "https://copypencil.pk/collections/fine-arts",
    "type": "standard",
    "waitSelector": "#main-collection-product-grid .product-collection",
    "autoScroll": true,
    "waitTime": 3000,
    "selectors": {
      "product": ".grid-item .inner.product-item",
      "name": ".product-title a",
      "price": ".price-regular span",
      "oldPrice": ".price-box .compare-price",
      "image": ".product-image picture img",
      "link": ".product-title a"
    }
  },
  "pakstyle": {
    "url": "https://www.pakstyle.pk/",
    "type": "standard",
    "waitSelector": ".kalles-otp-01__feature.container",
    "autoScroll": true,
    "waitTime": 2000,
    "selectors": {
      "product": ".col-lg-3.col-md-3.col-6.pr_grid_item.product-load-more",
      "name": ".product-title a",
      "price": ".price ins b",
      "oldPrice": ".price del b",
      "image": ".pr_lazy_img.main-img",
      "link": ".product-title a"
    }
  }
};

// 可以根据需要添加更多站点配置
