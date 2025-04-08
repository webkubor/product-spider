import { log } from './logger.js';

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
 * @param {string} siteName - 网站名称
 * @param {Array} data - 爬取的数据
 */
export async function saveResults(siteName, data, fs, path) {
  const resultsDir = './results';
  await fs.ensureDir(resultsDir);
  
  // 移除时间戳，直接使用网站名称
  const fileName = `${siteName}.json`;
  const filePath = path.join(resultsDir, fileName);
  
  await fs.writeJson(filePath, data, { spaces: 2 });
  log.success(`已保存 ${data.length} 条数据到 ${fileName}`);
  
  return filePath;
}
