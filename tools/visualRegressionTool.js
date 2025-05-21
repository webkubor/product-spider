import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import ora from 'ora';
import { log } from '../utils/logger.js';

/**
 * 视觉回归测试工具 - 对比两个网页截图，检测视觉差异
 * @param {string} baselineUrl - 基准URL
 * @param {string} compareUrl - 比较URL
 * @param {Object} options - 配置选项
 * @returns {Promise<void>}
 */
async function visualRegressionTest(baselineUrl, compareUrl, options = {}) {
  const {
    headless = true,
    outputDir = './results/visual-regression',
    threshold = 0.1,
    selector = null,
    waitTime = 2000,
    deviceType = null,
    viewportSize = null
  } = options;
  
  console.log(chalk.cyan(`🔍 开始视觉回归测试`));
  console.log(chalk.cyan(`基准URL: ${baselineUrl}`));
  console.log(chalk.cyan(`比较URL: ${compareUrl}`));
  
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
    
    // 生成文件名前缀
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filePrefix = `visual_regression_${timestamp}`;
    
    // 设置上下文选项
    let contextOptions = {};
    if (deviceType) {
      contextOptions = {
        ...chromium.devices[deviceType]
      };
      spinner.text = chalk.yellow(`使用设备模拟: ${deviceType}`);
    } else if (viewportSize) {
      contextOptions = {
        viewport: viewportSize
      };
      spinner.text = chalk.yellow(`使用自定义视口大小: ${viewportSize.width}x${viewportSize.height}`);
    }
    
    // 截取基准图片
    spinner.text = chalk.yellow(`正在截取基准图片: ${baselineUrl}`);
    const baselinePath = path.join(outputDir, `${filePrefix}_baseline.png`);
    await captureScreenshot(browser, baselineUrl, baselinePath, {
      contextOptions,
      selector,
      waitTime
    });
    spinner.succeed(chalk.green(`基准图片已保存: ${baselinePath}`));
    
    // 截取比较图片
    spinner.text = chalk.yellow(`正在截取比较图片: ${compareUrl}`);
    const comparePath = path.join(outputDir, `${filePrefix}_compare.png`);
    await captureScreenshot(browser, compareUrl, comparePath, {
      contextOptions,
      selector,
      waitTime
    });
    spinner.succeed(chalk.green(`比较图片已保存: ${comparePath}`));
    
    // 对比图片
    spinner.text = chalk.yellow('正在对比图片...');
    const diffPath = path.join(outputDir, `${filePrefix}_diff.png`);
    const diffResult = await compareImages(baselinePath, comparePath, diffPath, threshold);
    
    if (diffResult.identical) {
      spinner.succeed(chalk.green('图片完全匹配，没有视觉差异'));
    } else {
      spinner.warn(chalk.yellow(`检测到视觉差异: ${diffResult.diffPixels} 像素不同 (${diffResult.diffPercentage.toFixed(2)}%)`));
      console.log(chalk.yellow(`差异图片已保存: ${diffPath}`));
    }
    
    // 生成报告
    const reportPath = path.join(outputDir, `${filePrefix}_report.json`);
    const report = {
      timestamp: new Date().toISOString(),
      baselineUrl,
      compareUrl,
      threshold,
      deviceType,
      viewportSize,
      selector,
      result: {
        identical: diffResult.identical,
        diffPixels: diffResult.diffPixels,
        diffPercentage: diffResult.diffPercentage,
        totalPixels: diffResult.totalPixels
      },
      files: {
        baseline: baselinePath,
        compare: comparePath,
        diff: diffPath
      }
    };
    
    await fs.writeJson(reportPath, report, { spaces: 2 });
    console.log(chalk.green(`测试报告已保存: ${reportPath}`));
    
  } catch (error) {
    spinner.fail(chalk.red(`视觉回归测试过程中出错: ${error.message}`));
    console.error(error);
  } finally {
    // 关闭浏览器
    await browser.close();
    console.log(chalk.cyan('视觉回归测试任务完成'));
  }
}

/**
 * 截取网页截图
 * @param {Browser} browser - Playwright浏览器实例
 * @param {string} url - 要截图的URL
 * @param {string} outputPath - 输出路径
 * @param {Object} options - 截图选项
 * @returns {Promise<void>}
 */
async function captureScreenshot(browser, url, outputPath, options = {}) {
  const {
    contextOptions = {},
    selector = null,
    waitTime = 2000
  } = options;
  
  // 创建新的上下文和页面
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  
  try {
    // 访问网站
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // 等待额外时间，确保页面完全加载
    if (waitTime > 0) {
      await page.waitForTimeout(waitTime);
    }
    
    // 截图
    if (selector) {
      // 等待选择器出现
      await page.waitForSelector(selector, { timeout: 5000 });
      
      // 元素截图
      const element = await page.$(selector);
      if (element) {
        await element.screenshot({ path: outputPath });
      } else {
        throw new Error(`未找到元素: ${selector}`);
      }
    } else {
      // 全页面截图
      await page.screenshot({ 
        path: outputPath,
        fullPage: true
      });
    }
  } finally {
    // 关闭上下文
    await context.close();
  }
}

/**
 * 对比两张图片
 * @param {string} img1Path - 第一张图片路径
 * @param {string} img2Path - 第二张图片路径
 * @param {string} diffOutputPath - 差异图片输出路径
 * @param {number} threshold - 阈值 (0-1)
 * @returns {Promise<Object>} - 对比结果
 */
async function compareImages(img1Path, img2Path, diffOutputPath, threshold = 0.1) {
  // 读取图片
  const img1Data = await fs.readFile(img1Path);
  const img2Data = await fs.readFile(img2Path);
  
  const img1 = PNG.sync.read(img1Data);
  const img2 = PNG.sync.read(img2Data);
  
  // 确保两张图片尺寸相同
  const width = img1.width;
  const height = img1.height;
  
  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error('图片尺寸不匹配，无法进行对比');
  }
  
  // 创建差异图片
  const diff = new PNG({ width, height });
  
  // 对比像素
  const diffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold }
  );
  
  // 保存差异图片
  await fs.writeFile(diffOutputPath, PNG.sync.write(diff));
  
  // 计算差异百分比
  const totalPixels = width * height;
  const diffPercentage = (diffPixels / totalPixels) * 100;
  
  return {
    identical: diffPixels === 0,
    diffPixels,
    diffPercentage,
    totalPixels
  };
}

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(chalk.red('请提供基准URL和比较URL'));
    console.log(chalk.yellow('用法: node visualRegressionTool.js <基准URL> <比较URL> [选项]'));
    console.log(chalk.yellow('选项:'));
    console.log(chalk.yellow('  --threshold=0.1 - 像素匹配阈值 (0-1)'));
    console.log(chalk.yellow('  --selector=".class-name" - 指定要截图的元素选择器'));
    console.log(chalk.yellow('  --waitTime=5000 - 等待时间(毫秒)'));
    console.log(chalk.yellow('  --device="iPhone 12" - 使用预设设备'));
    console.log(chalk.yellow('  --width=1280 --height=720 - 自定义视口大小'));
    process.exit(1);
  }
  
  const baselineUrl = args[0];
  const compareUrl = args[1];
  
  // 验证URL格式
  try {
    new URL(baselineUrl);
    new URL(compareUrl);
  } catch (error) {
    console.log(chalk.red(`无效的URL`));
    process.exit(1);
  }
  
  // 解析选项
  const options = {};
  
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--threshold=')) {
      options.threshold = parseFloat(arg.replace('--threshold=', ''));
    } else if (arg.startsWith('--selector=')) {
      options.selector = arg.replace('--selector=', '');
    } else if (arg.startsWith('--waitTime=')) {
      options.waitTime = parseInt(arg.replace('--waitTime=', ''));
    } else if (arg.startsWith('--device=')) {
      options.deviceType = arg.replace('--device=', '');
    } else if (arg.startsWith('--width=')) {
      if (!options.viewportSize) options.viewportSize = {};
      options.viewportSize.width = parseInt(arg.replace('--width=', ''));
    } else if (arg.startsWith('--height=')) {
      if (!options.viewportSize) options.viewportSize = {};
      options.viewportSize.height = parseInt(arg.replace('--height=', ''));
    }
  }
  
  // 开始视觉回归测试
  await visualRegressionTest(baselineUrl, compareUrl, options);
}

// 执行主函数
main().catch(error => {
  console.log(chalk.red(`程序执行出错: ${error.message}`));
  process.exit(1);
});
