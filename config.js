// 爬虫配置文件

// 忽略名单，列出不需要爬取的站点
export const ignoreList = [
  "pakstyle",
  "fineArts",
  "shoptrendy",
  "hp-flash-sale",
  "hp-just-for-you",
  "plush-toys",
  "spring",
  "ponds",
  "bluetooth-speakers",
  "dayshoping",
  "pubshopee"
];

// 全局配置
export const globalConfig = {
  productLimit: 50  // 每个站点最多爬取的产品数量
};

export const scrapingConfig = {
  "boboshop":{
    "url": "https://www.amazon.in/b/?_encoding=UTF8&ie=UTF8&node=10894230031&ref_=sv_lpdin_2",
    "type": "standard",
    "waitSelector": "body",
    "autoScroll": true,
    "waitTime": 8000,
    "selectors": {
      "product": ".a-section",
      "name": "h2, .a-size-base-plus, .a-size-medium",
      "price": ".a-price, .a-color-price",
      "oldPrice": ".a-price.a-text-price, .a-text-strike",
      "rating": ".a-icon-star, .a-star-medium",
      "reviews": ".a-size-base",
      "image": "img",
      "link": "a"
    }
   },
  "pubshopee":{
   "url": "https://www.amazon.in/gp/bestsellers/boost/ref=zg_bs_pg_2_boost?ie=UTF8&pg=2",
   "type": "standard",
   "waitSelector": ".p13n-desktop-grid",
   "autoScroll": true,
   "waitTime": 3000,
   "selectors": {
     "product": ".a-column",
     "name": "._cDEzb_p13n-sc-css-line-clamp-3_g3dy1",
     "price": ".a-size-base.a-color-price span",
     "image": ".a-section img"
   }
  },
  "dayshoping":{
    'url': "https://www.amazon.in/gp/bestsellers/boost/ref=zg_bs_boost_sm",
    "type": "standard",
    "waitSelector": ".p13n-desktop-grid",
    "autoScroll": true,
    "waitTime": 3000,
    "selectors": {
      "product": ".a-column",
      "name": "._cDEzb_p13n-sc-css-line-clamp-3_g3dy1",
      "price": ".a-size-base.a-color-price span",
      "image": ".a-section img"
    }
  },
  "bluetooth-speakers":{
    'url': "https://priceoye.pk/bluetooth-speakers",
    "type": "standard",
    "waitSelector": ".product-list",
    "autoScroll": true,
    "waitTime": 3000,
    "selectors": {
      "product": ".productBox",
      "name": ".text-box .p-title",
      "price": ".price-box",
      "difference": ".price-diff .price-diff-saving",
      "image": ".image-box img"
    }
  },
  "ponds":{
    'url': "https://bagallery.com/collections/ponds",
    "type": "standard",
    "waitSelector": ".t4s-main-collection-page",
    "autoScroll": true,
    "waitTime": 3000,
    "selectors": {
      "product": ".t4s-product.t4s-pr-grid.t4s-pr-style3",
      "name": ".t4s-product-title a",
      "price": ".t4s-product-price .money",
      "image": ".t4s-product-img img"
    }
  },
  "shoptrendy":{
    "url": "https://shoptrendy.pk/",
    "type": "standard",
    "waitSelector": ".product-list",
    "autoScroll": true,
    "waitTime": 3000,
    "selectors": {
      "product": ".grid-item.product-item",
      "name": ".woocommerce-loop-product__title",
      "price": ".price",
      "oldPrice": ".price del",
      "image": ".product-thumbnail img",
      "link": ".product-thumbnail a"
    }
  },
  "hp-just-for-you":{
    "url": "https://pages.daraz.pk/wow/gcp/route/daraz/pk/upr/router?hybrid=1&data_prefetch=true&prefetch_replace=1&at_iframe=1&wh_pid=%2Flazada%2Fchannel%2Fpk%2Fflashsale%2F7cdarZ6wBa&hide_h5_title=true&lzd_navbar_hidden=true&disable_pull_refresh=true&skuIds=621987133%2C415248125%2C3127508%2C593964615%2C206800981%2C471790793%2C221707166&spm=a2a0e.tm80335142.FlashSale.d_shopMore",
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
  "fineArts":{
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
