import { log } from '../utils/logger.js';
import chalk from 'chalk';
import { cameraProducts, generateCameraPrice } from '../utils/mockData.js';

/**
 * 图片爬虫 - 爬取网页上的图片
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Array>} - 爬取的图片数据
 */
export async function imageScraper(page) {
  log.info(`使用${chalk.bold.green('图片')}爬虫...`);
  
  const images = await page.evaluate(() => {
    const imgElements = document.querySelectorAll('img');
    const images = Array.from(imgElements).map(img => ({
      src: img.src,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      alt: img.alt || ''
    }));
    
    // 只过滤有源地址的图片
    return images.filter(img => img.src && img.src.trim() !== '').map((img, index) => ({
      id: index + 1,
      image: img.src,
      alt: img.alt,
      dimensions: `${img.width}x${img.height}`,
      nameIndex: index % 15, // 用于生成名称
      priceIndex: index % 15 // 用于生成价格
    }));
  });
  
  // 添加产品名称和价格
  return images.map(img => {
    const productName = cameraProducts[img.nameIndex];
    const productPrice = generateCameraPrice();
    
    return {
      ...img,
      name: productName,
      price: productPrice,
      // 删除不需要的索引属性
      nameIndex: undefined,
      priceIndex: undefined
    };
  });
}
