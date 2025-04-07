import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';
import { scrapingConfig } from './config.js';

/**
 * 模拟滚动加载（用于懒加载页面）
 * @param {Page} page - Playwright页面对象
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

/**
 * 标准爬虫函数 - 使用配置的选择器爬取产品
 * @param {string} siteName - 网站配置名称
 * @param {object} config - 爬虫配置
 * @returns {Promise<Array>} - 爬取的产品数据
 */
async function standardScraper(siteName, config, page) {
  console.log(`使用标准爬虫爬取 ${siteName}...`);
  
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
  return await page.evaluate((selectors) => {
    const productElements = document.querySelectorAll(selectors.product);
    
    return Array.from(productElements).map((element, index) => {
      // 提取产品信息
      const nameElement = element.querySelector(selectors.name);
      const priceElement = element.querySelector(selectors.price);
      const imageElement = element.querySelector(selectors.image);
      const linkElement = element.querySelector(selectors.link) || imageElement?.closest('a');
      
      return {
        id: index + 1,
        name: nameElement ? nameElement.textContent.trim() : '未知名称',
        price: priceElement ? priceElement.textContent.trim() : '未知价格',
        image: imageElement ? (imageElement.src || imageElement.getAttribute('src')) : null,
        url: linkElement ? linkElement.href : null
      };
    });
  }, config.selectors);
}

/**
 * 小米商店爬虫 - 特定逻辑
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Array>} - 爬取的产品数据
 */
async function xiaomiScraper(page) {
  console.log('使用小米商店爬虫...');
  
  return await page.evaluate(() => {
    const items = document.querySelectorAll('.no_crop_image.grid-item');
    return Array.from(items).map((item, index) => {
      const titleLink = item.querySelector('a.product-grid-image');
      const name = titleLink?.getAttribute('href')?.split('/').pop() || '';
      const discount = item.querySelector('.sale-percentage-label')?.textContent?.trim() || '';
      const saveAmount = item.querySelector('.product-label .label')?.textContent?.trim() || '';
      const onSale = item.querySelector('.sale-label')?.textContent?.trim() === 'SALE';
      const imageUrl = item.querySelector('img')?.getAttribute('src') || '';

      return {
        id: index + 1,
        name: name.replace(/-/g, ' '),
        discount,
        saveAmount,
        onSale,
        imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl
      };
    });
  });
}

/**
 * CopyPencil爬虫 - 特定逻辑
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Array>} - 爬取的产品数据
 */
async function copypencilScraper(page) {
  console.log('使用CopyPencil爬虫...');
  
  return await page.evaluate(() => {
    const items = document.querySelectorAll('.product-collection .product-item');
    return Array.from(items).map((item, index) => {
      const name = item.querySelector('.product-title')?.textContent?.trim() || '';
      
      const priceElement = item.querySelector('.price-regular > span');
      const priceText = priceElement ? priceElement.textContent.trim() : '';
      const price = priceText;
      
      // 获取图片链接
      const imageElement = item.querySelector('.product-item img');
      let image = '';
      if (imageElement) {
        // 解析 srcset 属性
        const srcset = imageElement.getAttribute('data-srcset');
        if (srcset) {
          // 获取 srcset 中第一个图片的 URL
          const imageUrls = srcset.split(',');
          image = imageUrls[0].split(' ')[0].trim();  // 取第一个 URL
        } else {
          image = imageElement.src || imageElement.getAttribute('src') || '';
        }
      }
      
      const colorElements = item.querySelectorAll('.swatch .swatch-element .tooltip');
      const colors = Array.from(colorElements).map(el => el.textContent.trim());
      
      const isNew = !!item.querySelector('.product-label--new');

      return {
        id: index + 1,
        name,
        price,
        image: image.startsWith('//') ? `https:${image}` : image,
        colors,
        isNew,
      };
    });
  });
}

/**
 * 图片爬虫 - 爬取网页上的图片
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Array>} - 爬取的图片数据
 */
async function imageScraper(page) {
  console.log('使用图片爬虫...');
  
  return await page.evaluate(() => {
    const imgElements = document.querySelectorAll('img');
    const images = Array.from(imgElements).map(img => ({
      src: img.src,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      alt: img.alt
    }));
    
    // 只过滤有 alt 属性的图片
    return images.filter(img => img.alt && img.alt.trim() !== '').map((img, index) => ({
      id: index + 1,
      url: img.src,
      dimensions: `${img.width}x${img.height}`,
      alt: img.alt
    }));
  });
}

/**
 * 通用爬虫函数 - 根据配置选择不同的爬虫策略
 * @param {string} siteName - 网站配置名称
 * @param {object} config - 爬虫配置
 * @returns {Promise<Array>} - 爬取的数据
 */
async function scrapeProducts(siteName, config) {
  console.log(`开始爬取 ${siteName} 的数据...`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let products = [];
  
  try {
    // 访问目标网站
    await page.goto(config.url, { waitUntil: config.waitForNetworkIdle ? 'networkidle' : 'load' });
    
    // 根据配置类型选择不同的爬虫策略
    switch (config.type) {
      case 'standard':
        products = await standardScraper(siteName, config, page);
        break;
      case 'custom':
        if (config.customLogic === 'xiaomi') {
          products = await xiaomiScraper(page);
        } else if (config.customLogic === 'copypencil') {
          products = await copypencilScraper(page);
        }
        break;
      case 'image':
        products = await imageScraper(page);
        break;
      default:
        // 默认使用标准爬虫
        if (config.selectors) {
          products = await standardScraper(siteName, config, page);
        } else {
          console.error(`未知的爬虫类型: ${config.type}`);
        }
    }
    
    console.log(`成功从 ${siteName} 爬取了 ${products.length} 条数据`);
    
  } catch (error) {
    console.error(`爬取 ${siteName} 时出错:`, error);
  } finally {
    await browser.close();
  }
  
  return products;
}

/**
 * 保存爬取结果到JSON文件
 * @param {string} siteName - 网站名称
 * @param {Array} data - 爬取的数据
 */
async function saveResults(siteName, data) {
  const resultDir = './results';
  await fs.ensureDir(resultDir);
  
  const filename = `${siteName}-product.json`;
  const filePath = path.join(resultDir, filename);
  
  await fs.writeJSON(filePath, data, { spaces: 2 });
  console.log(`数据已保存到 ${filePath}`);
}

/**
 * 主函数
 */
async function main() {
  // 确保结果目录存在
  await fs.ensureDir('./results');
  
  // 遍历配置中的所有站点
  for (const [siteName, config] of Object.entries(scrapingConfig)) {
    try {
      const products = await scrapeProducts(siteName, config);
      
      if (products.length > 0) {
        await saveResults(siteName, products);
      }
    } catch (error) {
      console.error(`处理 ${siteName} 时出错:`, error);
    }
  }
  
  console.log('所有爬取任务已完成');
}

// 执行主函数
main().catch(error => {
  console.error('程序执行出错:', error);
});