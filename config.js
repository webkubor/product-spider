// 爬虫配置文件

// 忽略名单，列出不需要爬取的站点
export const ignoreList = [
  "pakstyle"
];

export const scrapingConfig = {
  "copypencil-fineArts":{
    "url": "https://copypencil.pk/collections/fine-arts",
    "type": "standard",
    "waitSelector": "#main-collection-product-grid .product-collection",
    "autoScroll": true,
    "waitTime": 2000,
    "selectors": {
      "product": ".grid-item",
      "name": ".product-title span",
      "price": ".price-box .price-regular span",
      "oldPrice": ".price-box .compare-price",
      "image": ".product-image img.images-one",
      "link": ".product-title"
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
