import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';
import { scrapingConfig } from './config.js';
import { log } from './utils/logger.js';
import { scrapeProducts } from './scrapers/index.js';
import { saveResults } from './utils/scraperHelpers.js';

/**
 * 主函数
 */
async function main() {
  log.title('爬虫程序启动');
  
  // 启动浏览器
  const browser = await chromium.launch({
    headless: false
  });
  
  try {
    // 创建新的上下文和页面
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 遍历配置的网站
    for (const [siteName, config] of Object.entries(scrapingConfig)) {
      log.title(`开始爬取 ${siteName}`);
      
      // 访问网站
      await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      log.info(`已加载页面: ${config.url}`);
      
      // 爬取产品
      const products = await scrapeProducts(siteName, config, page);
      log.success(`爬取完成，获取到 ${products.length} 个产品`);
      
      // 保存结果
      await saveResults(siteName, products, fs, path);
    }
  } catch (error) {
    log.error(`爬虫执行出错: ${error.message}`);
    console.error(error);
  } finally {
    // 关闭浏览器
    await browser.close();
    log.title('爬虫程序结束');
  }
}

// 执行主函数
main().catch(error => {
  log.error(`程序执行出错: ${error.message}`);
  process.exit(1);
});