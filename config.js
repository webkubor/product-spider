// 爬虫配置文件
export const scrapingConfig = {
  
  // 小米商店爬虫配置
  "xiaomi": {
    "url": "https://mistore.pk/collections/gear-devices",
    "type": "custom",
    "waitSelector": ".no_crop_image.grid-item",
    "waitTime": 8000,
    "customLogic": "xiaomi"
  },
  
  // 智能手表爬虫配置
  "xiaomi-watches": {
    "url": "https://xcessorieshub.com/product-category/mobile-xcessories/smart-watches/xiaomi-smart-watches/",
    "type": "standard",
    "waitSelector": "ul.products",
    "selectors": {
      "product": "ul.products li.product",
      "name": "h2.woocommerce-loop-product__title",
      "price": ".price",
      "image": "img",
      "link": "a.woocommerce-LoopProduct-link"
    }
  },
  
  // CopyPencil 包包爬虫配置
  "copypencil-bags": {
    "url": "https://copypencil.pk/collections/bags-amp-pouches-view-all-bags",
    "type": "custom",
    "waitSelector": ".product-collection .product-item",
    "autoScroll": true,
    "waitTime": 3000,
    "customLogic": "copypencil"
  },
  
  // DJI 图片爬虫配置
  "dji-images": {
    "url": "https://www.dji.com/cn/camera-drones?site=brandsite&from=nav",
    "type": "image",
    "waitForNetworkIdle": true
  }
};

// 可以根据需要添加更多站点配置
