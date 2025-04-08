// 爬虫配置文件
export const scrapingConfig = {
  "pakstyle": {
    "url": "https://www.pakstyle.pk/",
    "type": "standard",
    "waitSelector": ".kalles-otp-01__feature.container",
    "selectors": {
      "product": "ul.products li.product> a",
      "name": "h3.product-title > a",
      "oldPrice": ".price del b",
      "newPrice": ".price  ins b",
      "image": ".product-image",
      "link": "a.woocommerce-LoopProduct-link"
    }
  }
};

// 可以根据需要添加更多站点配置
