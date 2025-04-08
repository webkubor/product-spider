import { log } from '../utils/logger.js';
import chalk from 'chalk';
import { generateProductData } from '../utils/mockData.js';
import { autoScroll } from '../utils/scraperHelpers.js';
import { globalConfig } from '../config.js';

/**
 * 标准爬虫函数 - 使用配置的选择器爬取产品
 * @param {string} siteName - 网站配置名称
 * @param {object} config - 爬虫配置
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Array>} - 爬取的产品数据
 */
export async function standardScraper(siteName, config, page) {
  log.info(`使用${chalk.bold('标准爬虫')}爬取 ${chalk.bold.cyan(siteName)}...`);
  
  // 验证网页是否包含必要的选择器
  try {
    // 等待指定选择器加载
    if (config.waitSelector) {
      await page.waitForSelector(config.waitSelector, { timeout: 30000 });
    }
    
    // 检查是否存在产品元素
    const productCount = await page.$$eval(config.selectors.product, elements => elements.length);
    if (productCount === 0) {
      log.warning(`在 ${siteName} 上没有找到产品元素，跳过爬取`);
      return [];
    }
    
    log.info(`在 ${siteName} 上找到 ${productCount} 个产品元素，开始爬取`);
    
    // 如果需要等待额外时间
    if (config.waitTime) {
      await page.waitForTimeout(config.waitTime);
    }
    
    // 如果需要自动滚动（用于懒加载页面）
    if (config.autoScroll) {
      await autoScroll(page);
    }
  } catch (error) {
    log.error(`验证选择器时出错: ${error.message}`);
    return [];
  }
  
  // 使用页面评估来提取数据
  const products = await page.evaluate((selectors) => {
    const productElements = document.querySelectorAll(selectors.product);
    console.log(`Found ${productElements.length} product elements`);
    
    return Array.from(productElements).map((element, index) => {
      // 提取产品信息
      const nameElement = element.querySelector(selectors.name);
      const priceElement = element.querySelector(selectors.price);
      const imageElement = element.querySelector(selectors.image);
      const linkElement = element.querySelector(selectors.link) || imageElement?.closest('a');
      
      // 调试信息
      console.log(`Product ${index + 1}:`);
      console.log(`- Name element: ${nameElement ? 'Found' : 'Not found'}`);
      console.log(`- Price element: ${priceElement ? 'Found' : 'Not found'}`);
      console.log(`- Image element: ${imageElement ? 'Found' : 'Not found'}`);
      console.log(`- Link element: ${linkElement ? 'Found' : 'Not found'}`);
      
      // 如果没有找到任何产品元素，尝试使用其他方法
      if (!nameElement && !priceElement && !imageElement) {
        console.log(`Trying alternative selectors for product ${index + 1}`);
        // 尝试更通用的选择器
        const altNameElement = element.querySelector('.product-title') || 
                               element.querySelector('h3') || 
                               element.querySelector('.product-name');
        
        const altPriceElement = element.querySelector('.price') || 
                                element.querySelector('.price-box') || 
                                element.querySelector('[data-price]');
        
        const altImageElement = element.querySelector('img');
        
        console.log(`- Alt Name element: ${altNameElement ? 'Found' : 'Not found'}`);
        console.log(`- Alt Price element: ${altPriceElement ? 'Found' : 'Not found'}`);
        console.log(`- Alt Image element: ${altImageElement ? 'Found' : 'Not found'}`);
      }
      
      // 确保一定有图片，如果没有图片则跳过该产品
      let imageUrl = null;
      if (imageElement) {
        // 尝试从src属性获取
        imageUrl = imageElement.src || imageElement.getAttribute('src');
        
        // 如果没有src，尝试从background-image样式获取
        if (!imageUrl) {
          const style = imageElement.getAttribute('style');
          if (style && style.includes('background-image')) {
            const match = style.match(/url\("?([^"\)]+)"?\)/);
            if (match && match[1]) {
              imageUrl = match[1];
            }
          }
        }
        
        // 尝试从data-bgset属性获取
        if (!imageUrl) {
          imageUrl = imageElement.getAttribute('data-bgset');
        }
        
        // 尝试从data-srcset属性获取
        if (!imageUrl) {
          const srcset = imageElement.getAttribute('data-srcset') || imageElement.getAttribute('srcset');
          if (srcset) {
            // 从 srcset 中提取第一个 URL
            const srcsetParts = srcset.split(',');
            if (srcsetParts.length > 0) {
              const firstSrc = srcsetParts[0].trim().split(' ')[0];
              if (firstSrc) {
                imageUrl = firstSrc;
              }
            }
          }
        }
      }
      
      // 如果还是没有找到图片，尝试在父元素中查找
      if (!imageUrl && imageElement && imageElement.parentElement) {
        const parentImgElements = imageElement.parentElement.querySelectorAll('img');
        for (let i = 0; i < parentImgElements.length; i++) {
          const img = parentImgElements[i];
          imageUrl = img.src || img.getAttribute('src') || img.getAttribute('data-src');
          if (imageUrl) break;
        }
      }
      
      if (!imageUrl) {
        console.log('No image URL found for product');
        return null;
      }
      
      // 生成模拟数据的占位符，使用更自然的占位符
      // 使用一些产品类型和价格范围作为占位符
      const productTypes = [
        'Product', 'Item', 'Gadget', 'Device', 'Accessory', 'Tool', 'Gear', 'Equipment'
      ];
      
      const productIndex = Math.floor(Math.random() * productTypes.length);
      const itemNumber = Math.floor(Math.random() * 1000) + 1;
      
      // 提取名称文本
      let productName = '';
      if (nameElement) {
        // 先尝试获取内部文本
        productName = nameElement.textContent ? nameElement.textContent.trim() : '';
        // 如果没有文本，尝试获取属性
        if (!productName) {
          productName = nameElement.getAttribute('title') || nameElement.getAttribute('alt') || '';
        }
      }
      
      // 如果还是没有名称，尝试从元素属性中获取
      if (!productName && element.hasAttribute('name')) {
        productName = element.getAttribute('name');
      }
      
      // 特别处理Daraz产品
      if (!productName && element.hasAttribute('id')) {
        const productId = element.getAttribute('id');
        if (productId) {
          // 如果有ID但没有名称，尝试使用ID作为名称的一部分
          productName = `Product ID: ${productId}`;
          
          // 如果有name属性，使用它
          if (element.hasAttribute('name')) {
            productName = element.getAttribute('name');
          }
        }
      }
      
      // 提取价格文本
      let productPrice = '';
      if (priceElement) {
        productPrice = priceElement.textContent ? priceElement.textContent.trim() : '';
        // 如果没有文本，尝试获取属性
        if (!productPrice) {
          productPrice = priceElement.getAttribute('data-price') || priceElement.getAttribute('content') || '';
        }
      }
      
      // 如果没有获取到名称或价格，使用占位符
      if (!productName) {
        productName = `${productTypes[productIndex]} #${itemNumber}`;
      }
      
      if (!productPrice) {
        productPrice = `#price_placeholder_${itemNumber}`;
      }
      
      // 规范化图片URL，确保添加https:前缀
      let normalizedImageUrl = imageUrl;
      if (normalizedImageUrl && normalizedImageUrl.startsWith('//')) {
        normalizedImageUrl = 'https:' + normalizedImageUrl;
      }
      
      // 规范化链接URL
      let normalizedUrl = null;
      
      // 先尝试获取href属性
      if (linkElement) {
        normalizedUrl = linkElement.href;
      }
      
      // 如果没有href，尝试获取元素本身的href属性
      if (!normalizedUrl && element.tagName === 'A') {
        normalizedUrl = element.href;
      }
      
      // 如果还是没有，尝试获取data-href属性
      if (!normalizedUrl) {
        normalizedUrl = linkElement ? linkElement.getAttribute('data-href') : null;
      }
      
      // 如果还是没有，尝试获取元素的data-href属性
      if (!normalizedUrl) {
        normalizedUrl = element.getAttribute('data-href');
      }
      
      // 添加https:前缀
      if (normalizedUrl && normalizedUrl.startsWith('//')) {
        normalizedUrl = 'https:' + normalizedUrl;
      }
      
      return {
        id: index + 1,
        name: productName,
        price: productPrice,
        image: normalizedImageUrl,
        url: normalizedUrl
      };
    }).filter(item => item !== null); // 过滤掉没有图片的产品
  }, config.selectors);
  
  // 处理模拟数据占位符
  const processedProducts = products.map(product => {
    // 生成一个新的产品数据
    const productData = generateProductData();
    
    // 如果名称是模拟的或者为空，则使用生成的名称
    if (!product.name || product.name.includes('#') || product.name === '未知名称' || 
        product.name.startsWith('Product') || product.name.startsWith('Item') || 
        product.name.startsWith('Gadget') || product.name.startsWith('Device')) {
      product.name = productData.name;
    }
    
    // 如果价格是模拟的或者为空，则使用生成的价格
    if (!product.price || product.price.includes('#price_placeholder_') || product.price === '未知价格') {
      product.price = productData.price;
    }
    
    // 再次检查图片URL格式，确保添加https:前缀
    if (product.image && product.image.startsWith('//')) {
      product.image = 'https:' + product.image;
    }
    
    // 再次检查链接URL格式
    if (product.url && product.url.startsWith('//')) {
      product.url = 'https:' + product.url;
    }
    
    return product;
  });
  
  // 应用产品数量限制
  const limit = globalConfig.productLimit || 50; // 默认值为50
  if (processedProducts.length > limit) {
    log.info(`产品数量超过限制 (${limit})，将只保留前 ${limit} 个产品`);
    return processedProducts.slice(0, limit);
  }
  
  return processedProducts;
}
