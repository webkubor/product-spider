import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { log } from '../utils/logger.js';

/**
 * 网页性能测试工具 - 收集和分析网页性能指标
 * @param {string} url - 要测试的网址
 * @param {Object} options - 配置选项
 * @returns {Promise<void>}
 */
async function testPerformance(url, options = {}) {
  const {
    headless = true,
    outputDir = './results/performance',
    runs = 3,
    device = null,
    throttling = null
  } = options;
  
  console.log(chalk.cyan(`🚀 开始对 ${url} 进行性能测试`));
  
  // 启动浏览器的加载动画
  const spinner = ora({
    text: chalk.yellow('正在启动浏览器...'),
    color: 'yellow'
  }).start();
  
  // 启动浏览器
  const browser = await chromium.launch({
    headless
  });
  
  try {
    // 确保输出目录存在
    await fs.ensureDir(outputDir);
    
    // 生成文件名
    const domain = new URL(url).hostname;
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const fileName = `${domain}_${timestamp}.json`;
    const filePath = path.join(outputDir, fileName);
    
    // 存储所有运行的性能数据
    const allRuns = [];
    
    // 多次运行以获取更准确的数据
    for (let i = 0; i < runs; i++) {
      spinner.text = chalk.yellow(`运行测试 ${i + 1}/${runs}...`);
      
      // 创建新的上下文和页面
      let contextOptions = {};
      
      if (device) {
        contextOptions = {
          ...chromium.devices[device]
        };
        spinner.text = chalk.yellow(`使用设备模拟: ${device}`);
      }
      
      // 添加网络节流
      if (throttling) {
        contextOptions.networkThrottling = throttling;
        spinner.text = chalk.yellow(`应用网络节流: ${throttling}`);
      }
      
      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();
      
      // 启用性能指标收集
      await page.evaluate(() => {
        window.performanceData = {
          timings: {},
          resources: []
        };
        
        // 收集资源加载信息
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              window.performanceData.resources.push({
                name: entry.name,
                entryType: entry.entryType,
                startTime: entry.startTime,
                duration: entry.duration,
                transferSize: entry.transferSize,
                decodedBodySize: entry.decodedBodySize
              });
            }
          });
        });
        
        observer.observe({ entryTypes: ['resource'] });
      });
      
      // 访问网站
      spinner.text = chalk.yellow(`正在加载网页: ${url}`);
      const startTime = Date.now();
      const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      const loadTime = Date.now() - startTime;
      
      // 等待网络空闲
      await page.waitForLoadState('networkidle');
      
      // 收集性能指标
      const performanceMetrics = await page.evaluate(() => {
        const timing = performance.timing || {};
        const navigation = performance.getEntriesByType('navigation')[0] || {};
        const paint = performance.getEntriesByType('paint');
        
        // 收集关键时间点
        const timings = {
          // 导航计时
          navigationStart: timing.navigationStart || 0,
          redirectTime: (timing.redirectEnd || 0) - (timing.redirectStart || 0),
          dnsTime: (timing.domainLookupEnd || 0) - (timing.domainLookupStart || 0),
          connectTime: (timing.connectEnd || 0) - (timing.connectStart || 0),
          responseTime: (timing.responseEnd || 0) - (timing.requestStart || 0),
          domInteractive: (timing.domInteractive || 0) - (timing.navigationStart || 0),
          domContentLoaded: (timing.domContentLoadedEventEnd || 0) - (timing.navigationStart || 0),
          domComplete: (timing.domComplete || 0) - (timing.navigationStart || 0),
          loadEvent: (timing.loadEventEnd || 0) - (timing.navigationStart || 0),
          
          // 关键渲染指标
          firstPaint: 0,
          firstContentfulPaint: 0,
          
          // 导航类型
          navigationType: navigation.type || '',
          
          // 资源统计
          resourceCount: window.performanceData.resources.length,
          totalResourceSize: window.performanceData.resources.reduce((total, res) => total + (res.transferSize || 0), 0),
          
          // 其他指标
          timeToFirstByte: (timing.responseStart || 0) - (timing.requestStart || 0)
        };
        
        // 提取首次绘制和首次内容绘制时间
        paint.forEach(entry => {
          if (entry.name === 'first-paint') {
            timings.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            timings.firstContentfulPaint = entry.startTime;
          }
        });
        
        return {
          timings,
          resources: window.performanceData.resources,
          userAgent: navigator.userAgent,
          url: window.location.href
        };
      });
      
      // 添加HTTP状态码
      performanceMetrics.statusCode = response.status();
      performanceMetrics.statusText = response.statusText();
      performanceMetrics.headers = response.headers();
      performanceMetrics.loadTime = loadTime;
      performanceMetrics.runNumber = i + 1;
      
      // 添加到结果集
      allRuns.push(performanceMetrics);
      
      // 关闭上下文
      await context.close();
      
      spinner.succeed(chalk.green(`完成测试运行 ${i + 1}/${runs}`));
    }
    
    // 计算平均值
    const averages = calculateAverages(allRuns);
    
    // 保存结果
    const results = {
      url,
      timestamp: new Date().toISOString(),
      device,
      throttling,
      runs: allRuns,
      averages
    };
    
    await fs.writeJson(filePath, results, { spaces: 2 });
    spinner.succeed(chalk.green(`性能测试数据已保存到: ${filePath}`));
    
    // 在控制台显示结果
    displayResults(averages);
    
  } catch (error) {
    spinner.fail(chalk.red(`性能测试过程中出错: ${error.message}`));
    console.error(error);
  } finally {
    // 关闭浏览器
    await browser.close();
    console.log(chalk.cyan('性能测试任务完成'));
  }
}

/**
 * 计算多次运行的平均值
 * @param {Array} runs - 所有运行的性能数据
 * @returns {Object} - 平均值
 */
function calculateAverages(runs) {
  const timingKeys = Object.keys(runs[0].timings);
  const avgTimings = {};
  
  // 计算时间指标的平均值
  timingKeys.forEach(key => {
    const sum = runs.reduce((total, run) => total + run.timings[key], 0);
    avgTimings[key] = sum / runs.length;
  });
  
  // 计算其他指标的平均值
  const avgLoadTime = runs.reduce((total, run) => total + run.loadTime, 0) / runs.length;
  const avgResourceCount = runs.reduce((total, run) => total + run.timings.resourceCount, 0) / runs.length;
  const avgResourceSize = runs.reduce((total, run) => total + run.timings.totalResourceSize, 0) / runs.length;
  
  return {
    timings: avgTimings,
    loadTime: avgLoadTime,
    resourceCount: avgResourceCount,
    resourceSize: avgResourceSize
  };
}

/**
 * 在控制台显示性能测试结果
 * @param {Object} averages - 平均性能指标
 */
function displayResults(averages) {
  console.log(chalk.cyan.bold('\n📊 性能测试结果摘要:'));
  
  // 创建表格
  const table = new Table({
    head: [chalk.cyan('指标'), chalk.cyan('值')],
    colWidths: [30, 20]
  });
  
  // 添加关键指标
  table.push(
    ['页面加载时间 (ms)', Math.round(averages.loadTime)],
    ['首次绘制 (ms)', Math.round(averages.timings.firstPaint)],
    ['首次内容绘制 (ms)', Math.round(averages.timings.firstContentfulPaint)],
    ['DOM交互时间 (ms)', Math.round(averages.timings.domInteractive)],
    ['DOM内容加载 (ms)', Math.round(averages.timings.domContentLoaded)],
    ['DOM完成时间 (ms)', Math.round(averages.timings.domComplete)],
    ['首字节时间 (ms)', Math.round(averages.timings.timeToFirstByte)],
    ['资源数量', Math.round(averages.resourceCount)],
    ['资源总大小 (KB)', Math.round(averages.resourceSize / 1024)]
  );
  
  console.log(table.toString());
  
  // 性能评级
  let performanceRating = '';
  const loadTime = averages.loadTime;
  
  if (loadTime < 1000) {
    performanceRating = chalk.green('极佳 (< 1秒)');
  } else if (loadTime < 2000) {
    performanceRating = chalk.green('良好 (< 2秒)');
  } else if (loadTime < 3000) {
    performanceRating = chalk.yellow('一般 (< 3秒)');
  } else if (loadTime < 5000) {
    performanceRating = chalk.yellow('较慢 (< 5秒)');
  } else {
    performanceRating = chalk.red('很慢 (> 5秒)');
  }
  
  console.log(chalk.cyan.bold('\n🏆 性能评级:'), performanceRating);
  
  // 优化建议
  console.log(chalk.cyan.bold('\n💡 优化建议:'));
  
  if (averages.timings.timeToFirstByte > 200) {
    console.log(chalk.yellow('- 首字节时间较长，考虑优化服务器响应时间'));
  }
  
  if (averages.resourceCount > 30) {
    console.log(chalk.yellow('- 资源数量较多，考虑合并文件或使用HTTP/2'));
  }
  
  if (averages.resourceSize > 1024 * 1024) {
    console.log(chalk.yellow('- 资源总大小超过1MB，考虑压缩资源或延迟加载'));
  }
  
  if (averages.timings.firstContentfulPaint > 1500) {
    console.log(chalk.yellow('- 首次内容绘制时间较长，考虑优化关键渲染路径'));
  }
}

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.red('请提供要测试的网址'));
    console.log(chalk.yellow('用法: node performanceTool.js <网址> [选项]'));
    console.log(chalk.yellow('选项:'));
    console.log(chalk.yellow('  --runs=3 - 测试运行次数'));
    console.log(chalk.yellow('  --device="iPhone 12" - 使用预设设备'));
    console.log(chalk.yellow('  --throttling="slow3G" - 网络节流 (slow3G, fast3G)'));
    process.exit(1);
  }
  
  const url = args[0];
  
  // 验证URL格式
  try {
    new URL(url);
  } catch (error) {
    console.log(chalk.red(`无效的URL: ${url}`));
    process.exit(1);
  }
  
  // 解析选项
  const options = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--runs=')) {
      options.runs = parseInt(arg.replace('--runs=', ''));
    } else if (arg.startsWith('--device=')) {
      options.device = arg.replace('--device=', '');
    } else if (arg.startsWith('--throttling=')) {
      const throttlingType = arg.replace('--throttling=', '');
      
      if (throttlingType === 'slow3G') {
        options.throttling = {
          downloadThroughput: 500 * 1024 / 8,
          uploadThroughput: 500 * 1024 / 8,
          latency: 400
        };
      } else if (throttlingType === 'fast3G') {
        options.throttling = {
          downloadThroughput: 1.5 * 1024 * 1024 / 8,
          uploadThroughput: 750 * 1024 / 8,
          latency: 150
        };
      }
    }
  }
  
  // 开始性能测试
  await testPerformance(url, options);
}

// 执行主函数
main().catch(error => {
  console.log(chalk.red(`程序执行出错: ${error.message}`));
  process.exit(1);
});
