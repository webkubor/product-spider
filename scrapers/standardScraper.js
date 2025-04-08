import { log } from '../utils/logger.js';
import chalk from 'chalk';
import { generateProductData } from '../utils/mockData.js';
import { autoScroll } from '../utils/scraperHelpers.js';

/**
 * 标准爬虫函数 - 使用配置的选择器爬取产品
 * @param {string} siteName - 网站配置名称
 * @param {object} config - 爬虫配置
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Array>} - 爬取的产品数据
 */
export async function standardScraper(siteName, config, page) {
  log.info(`使用${chalk.bold('标准爬虫')}爬取 ${chalk.bold.cyan(siteName)}...`);
  
  // 等待指定选择器加载
  if (config.waitSelector) {
    await page.waitForSelector(config.waitSelector, { timeout: 60000 });
  }
  
  // 如果需要等待额外时间
  if (config.waitTime) {
    await page.waitForTimeout(config.waitTime);
  }
  
  // 如果需要自动滚动（用于懒加载页面）
  if (config.autoScroll) {
    await autoScroll(page);
  }
  
  // 使用页面评估来提取数据
  const products = await page.evaluate((selectors) => {
    const productElements = document.querySelectorAll(selectors.product);
    
    return Array.from(productElements).map((element, index) => {
      // 提取产品信息
      const nameElement = element.querySelector(selectors.name);
      const priceElement = element.querySelector(selectors.price);
      const imageElement = element.querySelector(selectors.image);
      const linkElement = element.querySelector(selectors.link) || imageElement?.closest('a');
      
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
      }
      
      if (!imageUrl) {
        return null;
      }
      
      // 生成模拟数据的占位符，使用更自然的占位符
      // 使用一些产品类型和价格范围作为占位符
      const productTypes = [
        'Product', 'Item', 'Gadget', 'Device', 'Accessory', 'Tool', 'Gear', 'Equipment'
      ];
      
      const productIndex = Math.floor(Math.random() * productTypes.length);
      const itemNumber = Math.floor(Math.random() * 1000) + 1;
      
      return {
        id: index + 1,
        name: nameElement && nameElement.textContent.trim() ? nameElement.textContent.trim() : `${productTypes[productIndex]} #${itemNumber}`,
        price: priceElement && priceElement.textContent.trim() ? priceElement.textContent.trim() : `#price_placeholder_${itemNumber}`,
        image: imageUrl,
        url: linkElement ? linkElement.href : null
      };
    }).filter(item => item !== null); // 过滤掉没有图片的产品
  }, config.selectors);
  
  // 处理模拟数据占位符
  return products.map(product => {
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
    
    return product;
  });
}
