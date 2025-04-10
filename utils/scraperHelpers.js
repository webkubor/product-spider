import { log } from './logger.js';
import { globalConfig } from '../config.js';

/**
 * 模拟滚动加载（用于懒加载页面）
 * @param {Page} page - Playwright页面对象
 */
export async function autoScroll(page) {
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
 * 保存爬取结果到JSON文件
 * 如果数据超过限制，会分割成多个文件
 * @param {string} siteName - 网站名称
 * @param {Array} data - 爬取的数据
 * @param {Object} fs - 文件系统模块
 * @param {Object} path - 路径模块
 * @param {number} limit - 每个文件的数据上限，默认从globalConfig获取
 */
export async function saveResults(siteName, data, fs, path, limit) {
  const resultsDir = './results';
  await fs.ensureDir(resultsDir);
  
  // 如果启用了重新编号，重新生成连续的产品ID
  if (globalConfig.reindexProducts) {
    data = data.map((product, index) => ({
      ...product,
      id: index + 1
    }));
  }
  
  // 如果数据量小于等于限制，直接保存到一个文件
  if (data.length <= limit) {
    const fileName = `${siteName}.json`;
    const filePath = path.join(resultsDir, fileName);
    
    await fs.writeJson(filePath, data, { spaces: 2 });
    log.success(`已保存 ${data.length} 条数据到 ${fileName}`);
    
    return filePath;
  }
  
  // 如果数据量超过限制，分割成多个文件
  const fileCount = Math.ceil(data.length / limit);
  const savedFiles = [];
  
  for (let i = 0; i < fileCount; i++) {
    const start = i * limit;
    const end = Math.min((i + 1) * limit, data.length);
    const chunkData = data.slice(start, end);
    
    const fileName = `${siteName}_part${i + 1}.json`;
    const filePath = path.join(resultsDir, fileName);
    
    await fs.writeJson(filePath, chunkData, { spaces: 2 });
    log.success(`已保存 ${chunkData.length} 条数据到 ${fileName}`);
    
    savedFiles.push(filePath);
  }
  
  log.info(`总共分割成 ${fileCount} 个文件，每个文件最多包含 ${limit} 条数据`);
  return savedFiles;
}
