import { log } from '../utils/logger.js';
import { standardScraper } from './standardScraper.js';
import { imageScraper } from './imageScraper.js';

/**
 * 通用爬虫函数 - 根据配置选择不同的爬虫策略
 * @param {string} siteName - 网站配置名称
 * @param {object} config - 爬虫配置
 * @param {Page} page - Playwright页面对象
 * @returns {Promise<Array>} - 爬取的数据
 */
export async function scrapeProducts(siteName, config, page) {
  // 根据配置类型选择爬虫策略
  switch (config.type) {
    case 'standard':
      return await standardScraper(siteName, config, page);
    case 'image':
      return await imageScraper(page);
    default:
      log.warning(`未知的爬虫类型: ${config.type}，使用标准爬虫`);
      return await standardScraper(siteName, config, page);
  }
}
