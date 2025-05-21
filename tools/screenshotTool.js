import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { log } from '../utils/logger.js';

/**
 * 网页截图工具 - 对指定网址进行截图，支持全页面和元素截图
 * @param {string} url - 要截图的网址
 * @param {Object} options - 配置选项
 * @returns {Promise<void>}
 */
async function captureScreenshot(url, options = {}) {
  const {
    headless = true,
    outputDir = './results/screenshots',
    fullPage = true,
    selector = null,
    waitTime = 2000,
    deviceType = null,
    viewportSize = null
  } = options;
  
  console.log(chalk.cyan(`🔍 开始对 ${url} 进行截图`));
  
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
    // 创建新的上下文和页面
    spinner.text = chalk.yellow('正在创建浏览器上下文...');
    
    let context;
    if (deviceType) {
      // 使用预设设备
      context = await browser.newContext({
        ...chromium.devices[deviceType]
      });
      console.log(chalk.blue(`使用设备模拟: ${deviceType}`));
    } else if (viewportSize) {
      // 使用自定义视口大小
      context = await browser.newContext({
        viewport: viewportSize
      });
      console.log(chalk.blue(`使用自定义视口大小: ${viewportSize.width}x${viewportSize.height}`));
    } else {
      // 使用默认设置
      context = await browser.newContext();
    }
    
    const page = await context.newPage();
    
    // 访问网站
    spinner.text = chalk.yellow(`正在加载网页: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    spinner.succeed(chalk.green(`网页已成功加载: ${url}`));
    
    // 等待额外时间，确保页面完全加载
    if (waitTime > 0) {
      spinner.text = chalk.yellow(`等待 ${waitTime/1000} 秒以确保页面完全加载...`);
      await page.waitForTimeout(waitTime);
    }
    
    // 确保输出目录存在
    await fs.ensureDir(outputDir);
    
    // 生成文件名
    const domain = new URL(url).hostname;
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    let fileName = `${domain}_${timestamp}`;
    
    if (selector) {
      fileName += `_${selector.replace(/[^\w]/g, '-')}`;
    }
    
    fileName += '.png';
    const filePath = path.join(outputDir, fileName);
    
    // 截图
    spinner.text = chalk.yellow('正在截图...');
    
    if (selector) {
      try {
        // 等待选择器出现
        await page.waitForSelector(selector, { timeout: 5000 });
        
        // 元素截图
        const element = await page.$(selector);
        if (element) {
          await element.screenshot({ path: filePath });
          spinner.succeed(chalk.green(`已截取元素 "${selector}" 的截图`));
        } else {
          spinner.fail(chalk.red(`未找到元素: ${selector}`));
          return;
        }
      } catch (error) {
        spinner.fail(chalk.red(`截取元素失败: ${error.message}`));
        return;
      }
    } else {
      // 全页面截图
      await page.screenshot({ 
        path: filePath,
        fullPage
      });
      spinner.succeed(chalk.green(`已截取${fullPage ? '全页面' : '可视区域'}截图`));
    }
    
    console.log(chalk.green(`截图已保存到: ${filePath}`));
    
  } catch (error) {
    spinner.fail(chalk.red(`截图过程中出错: ${error.message}`));
    console.error(error);
  } finally {
    // 关闭浏览器
    await browser.close();
    console.log(chalk.cyan('截图任务完成'));
  }
}

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.red('请提供要截图的网址'));
    console.log(chalk.yellow('用法: node screenshotTool.js <网址> [选项]'));
    console.log(chalk.yellow('选项:'));
    console.log(chalk.yellow('  --selector=".class-name" - 指定要截图的元素选择器'));
    console.log(chalk.yellow('  --fullPage=false - 设置为false只截取可视区域'));
    console.log(chalk.yellow('  --waitTime=5000 - 等待时间(毫秒)'));
    console.log(chalk.yellow('  --device="iPhone 12" - 使用预设设备'));
    console.log(chalk.yellow('  --width=1280 --height=720 - 自定义视口大小'));
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
    
    if (arg.startsWith('--selector=')) {
      options.selector = arg.replace('--selector=', '');
    } else if (arg.startsWith('--fullPage=')) {
      options.fullPage = arg.replace('--fullPage=', '') === 'true';
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
  
  // 开始截图
  await captureScreenshot(url, options);
}

// 执行主函数
main().catch(error => {
  console.log(chalk.red(`程序执行出错: ${error.message}`));
  process.exit(1);
});
