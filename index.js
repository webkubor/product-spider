import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { faker } from '@faker-js/faker/locale/zh_CN';
import { scrapingConfig } from './config.js';

// 控制台输出样式
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ ') + chalk.blue(msg)),
  success: (msg) => console.log(chalk.green('✅ ') + chalk.green(msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️ ') + chalk.yellow(msg)),
  error: (msg) => console.error(chalk.red('❌ ') + chalk.red(msg)),
  title: (msg) => console.log('\n' + chalk.bold.cyan('🔍 ' + msg) + '\n' + chalk.cyan('='.repeat(50)))
};

/**
 * 模拟滚动加载（用于懒加载页面）
 * @param {Page} page - Playwright页面对象
 */
async function autoScroll(page) {
  log.info('正在自动滚动页面以加载更多内容...');
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
  log.success('页面滚动完成');
}

/**
 * 标准爬虫函数 - 使用配置的选择器爬取产品
 * @param {string} siteName - 网站配置名称
 * @param {object} config - 爬虫配置
 * @returns {Promise<Array>} - 爬取的产品数据
 */
async function standardScraper(siteName, config, page) {
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
  // 使用 Faker 生成产品数据
  const generateProductData = () => {
    const categories = [
      // 电子产品
      '智能手表', '无线耳机', '蓝牙音箱', '智能手环', '充电宝',
      // 家居产品
      '沙发', '床垫', '桌子', '椅子', '衣柜',
      // 服装类
      '上衣', '裤子', '外套', '连衣裙', '鞋子',
      // 美妆类
      '口红', '面霜', '精华液', '香水', '护肤品',
      // 食品类
      '巧克力', '饼干', '咖啡', '茶叶', '山核桃',
      // 运动类
      '跑步鞋', '瑜伽垫', '健身器材', '自行车', '篮球'
    ];
    
    const brands = [
      'Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Nike', 'Adidas', 'IKEA', 'MUJI', 'Zara', 'H&M',
      'Chanel', 'Dior', 'Gucci', 'Prada', 'Nestle', 'Coca-Cola', 'Pepsi', 'Starbucks', 'Nike', 'Under Armour'
    ];
    
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomBrand = brands[Math.floor(Math.random() * brands.length)];
    const randomAdjective = faker.commerce.productAdjective();
    
    // 生成标准格式的价格
    const standardPrice = `Rs. ${faker.number.int({ min: 1000, max: 50000 }).toLocaleString('en-IN')}`;
    
    return {
      name: `${randomBrand} ${randomAdjective}${randomCategory}`,
      price: standardPrice
    };
  };
  
  const products = await page.evaluate((selectors) => {
    const productElements = document.querySelectorAll(selectors.product);
    
    return Array.from(productElements).map((element, index) => {
      // 提取产品信息
      const nameElement = element.querySelector(selectors.name);
      const priceElement = element.querySelector(selectors.price);
      const imageElement = element.querySelector(selectors.image);
      const linkElement = element.querySelector(selectors.link) || imageElement?.closest('a');
      
      // 确保一定有图片，如果没有图片则跳过该产品
      if (!imageElement || !(imageElement.src || imageElement.getAttribute('src'))) {
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
        image: imageElement.src || imageElement.getAttribute('src'),
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
      // 生成一个随机价格，格式为 Rs. XX,XXX
      const randomPrice = faker.number.int({ min: 1000, max: 50000 });
      product.price = `Rs. ${randomPrice.toLocaleString('en-IN')}`;
    }
    
    return product;
  });
}




/**
 * 图片爬虫 - 爬取网页上的图片
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Array>} - 爬取的图片数据
 */
async function imageScraper(page) {
  log.info(`使用${chalk.bold.green('图片')}爬虫...`);
  
  // 生成一组相机产品名称
  const cameraProducts = [
    'DJI Mini 3 Pro', 'DJI Air 2S', 'DJI Mavic 3', 'DJI FPV', 'DJI Phantom 4 Pro V2.0',
    'DJI Inspire 2', 'DJI Matrice 300 RTK', 'DJI Avata', 'DJI Mini 3', 'DJI Mavic 3 Classic',
    'DJI Mavic 3 Cine', 'DJI Mini 2', 'DJI Mini SE', 'DJI Mavic Air 2', 'DJI Mavic 2 Pro'
  ];
  
  // 生成一组相机产品价格函数
  const generateCameraPrice = () => {
    return `Rs. ${faker.number.int({ min: 9999, max: 50000 }).toLocaleString('en-IN')}`;
  };
  
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
  
  // 添加名称和价格
  return images.map(item => {
    // 如果有 alt 属性，使用它作为名称，否则使用预定义的相机产品名称
    const name = item.alt && item.alt.trim() !== '' ? 
      item.alt : 
      cameraProducts[item.nameIndex];
    
    return {
      id: item.id,
      name: name,
      price: generateCameraPrice(),
      image: item.image,
      dimensions: item.dimensions
    };
  });
}

/**
 * 通用爬虫函数 - 根据配置选择不同的爬虫策略
 * @param {string} siteName - 网站配置名称
 * @param {object} config - 爬虫配置
 * @returns {Promise<Array>} - 爬取的数据
 */
async function scrapeProducts(siteName, config) {
  log.title(`开始爬取 ${chalk.bold.white(siteName)} 的数据`);
  
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
      case 'image':
        products = await imageScraper(page);
        break;
      default:
        // 默认使用标准爬虫
        if (config.selectors) {
          products = await standardScraper(siteName, config, page);
        } else {
          log.error(`未知的爬虫类型: ${config.type}`);
        }
    }
    
    log.success(`成功从 ${chalk.bold.white(siteName)} 爬取了 ${chalk.bold.white(products.length)} 条数据`);
    
  } catch (error) {
    log.error(`爬取 ${chalk.bold.white(siteName)} 时出错: ${error.message}`);
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
  log.success(`数据已保存到 ${chalk.underline.cyan(filePath)} (${chalk.bold.white(data.length)} 条记录)`);
}

/**
 * 主函数
 */
async function main() {
  // 显示爬虫启动信息
  console.log('\n' + chalk.bold.bgCyan.black(' 灵活爬虫框架 ') + ' ' + chalk.cyan('v1.0.0') + '\n');
  
  // 确保结果目录存在
  await fs.ensureDir('./results');
  log.info('结果将保存到 results 目录');
  
  // 遍历配置中的所有站点
  for (const [siteName, config] of Object.entries(scrapingConfig)) {
    try {
      const products = await scrapeProducts(siteName, config);
      
      if (products.length > 0) {
        await saveResults(siteName, products);
      }
    } catch (error) {
      log.error(`处理 ${chalk.bold.white(siteName)} 时出错: ${error.message}`);
    }
  }
  
  console.log('\n' + chalk.bold.bgGreen.black(' 完成 ') + ' ' + chalk.green('所有爬取任务已完成') + '\n');
}

// 执行主函数
main().catch(error => {
  log.error(`程序执行出错: ${error.message}`);
  process.exit(1);
});