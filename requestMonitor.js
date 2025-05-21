import { chromium } from 'playwright';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import figlet from 'figlet';
import boxen from 'boxen';
import { log } from './utils/logger.js';
import { createRequestTracker } from './utils/requestTracker.js';

/**
 * 打印漂亮的标题
 * @param {string} text - 标题文本
 */
function printTitle(text) {
  console.log(
    figlet.textSync(text, {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true
    })
  );
}

/**
 * 打印信息框
 * @param {string} text - 要显示的文本
 * @param {string} title - 框标题
 */
function printBox(text, title = '') {
  console.log(
    boxen(text, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title,
      titleAlignment: 'center'
    })
  );
}

/**
 * 打印表格
 * @param {Array} headers - 表头
 * @param {Array} data - 表格数据
 */
function printTable(headers, data) {
  const table = new Table({
    head: headers.map(h => chalk.cyan(h)),
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  data.forEach(row => table.push(row));
  console.log(table.toString());
}

/**
 * 网址请求监听器 - 监听指定网址加载后的所有请求和响应
 * @param {string} url - 要监听的网址
 * @param {Object} options - 配置选项
 * @returns {Promise<void>}
 */
async function monitorRequests(url, options = {}) {
  const {
    headless = true, // 默认使用无头模式
    waitTime = 10000,
    outputDir = './results/requests'
  } = options;
  
  // 打印漂亮的标题
  printTitle('AJAX监控');
  
  // 显示目标信息
  printBox(
    `目标网址: ${chalk.green(url)}\n` +
    `等待时间: ${chalk.yellow(waitTime/1000)} 秒\n` +
    `输出目录: ${chalk.blue(outputDir)}\n` +
    `跟踪类型: ${chalk.magenta('AJAX请求 (XHR和Fetch)')}`,
    '监控配置'
  );
  
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
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 创建请求跟踪器
    spinner.text = chalk.yellow('初始化AJAX请求跟踪器...');
    const requestTracker = createRequestTracker();
    requestTracker.initialize(context);
    
    // 访问网站
    spinner.text = chalk.yellow(`正在加载网页: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    spinner.succeed(chalk.green(`网页已成功加载: ${url}`));
    
    // 等待一段时间，确保所有AJAX请求都被捕获
    spinner.text = chalk.yellow(`等待 ${waitTime/1000} 秒以捕获AJAX请求...`);
    spinner.color = 'blue';
    await page.waitForTimeout(waitTime);
    spinner.succeed(chalk.green('AJAX请求捕获完成'));
    
    // 保存AJAX请求数据
    spinner.text = chalk.yellow('正在保存AJAX请求数据...');
    spinner.color = 'magenta';
    const filePath = await requestTracker.saveToFile(url, outputDir);
    spinner.succeed(chalk.green(`数据已保存到: ${filePath}`));
    
    // 获取数据并显示统计信息
    const data = requestTracker.getAllData();
    
    // 打印摘要信息
    const summaryText = 
      `总请求数: ${chalk.green(data.totalRequests)} 个\n` +
      `总响应数: ${chalk.green(data.totalResponses)} 个\n` +
      `监听时长: ${chalk.green(data.duration / 1000)} 秒\n` +
      `开始时间: ${chalk.blue(data.startTime)}\n` +
      `结束时间: ${chalk.blue(new Date().toISOString())}`;
    
    printBox(summaryText, 'AJAX监控摘要');
    
    // 显示请求类型统计
    const resourceTypes = {};
    data.requests.forEach(req => {
      resourceTypes[req.resourceType] = (resourceTypes[req.resourceType] || 0) + 1;
    });
    
    // AJAX请求类型已经限定为 xhr 和 fetch，所以这里只显示这两种类型
    console.log(chalk.cyan.bold('\nAJAX请求类型统计:'));
    const typeRows = Object.entries(resourceTypes).map(([type, count]) => [
      type,
      count,
      `${((count / data.totalRequests) * 100).toFixed(2)}%`
    ]);
    printTable(['AJAX类型', '请求数', '百分比'], typeRows);
    
    // 显示状态码统计
    const statusCodes = {};
    data.requests.forEach(req => {
      if (req.response) {
        const status = req.response.status;
        statusCodes[status] = (statusCodes[status] || 0) + 1;
      }
    });
    
    console.log(chalk.cyan.bold('\n响应状态码统计:'));
    const statusRows = Object.entries(statusCodes).map(([status, count]) => {
      // 根据状态码设置颜色
      let statusWithColor = status;
      if (status >= 200 && status < 300) {
        statusWithColor = chalk.green(status);
      } else if (status >= 300 && status < 400) {
        statusWithColor = chalk.blue(status);
      } else if (status >= 400 && status < 500) {
        statusWithColor = chalk.yellow(status);
      } else if (status >= 500) {
        statusWithColor = chalk.red(status);
      }
      
      return [
        statusWithColor,
        count,
        `${((count / data.totalResponses) * 100).toFixed(2)}%`
      ];
    });
    printTable(['状态码', '响应数', '百分比'], statusRows);
    
    // 只显示请求URL和响应信息
    console.log(chalk.cyan.bold('\nAJAX请求和响应信息:'));
    console.log(chalk.yellow('─'.repeat(100)));
    
    // 逐个显示每个请求的URL和响应
    data.requests.forEach((req, index) => {
      const reqNumber = index + 1;
      
      // 请求URL和方法
      console.log(chalk.green.bold(`${reqNumber}. ${req.method} ${req.url}`));
      
      // 请求参数（如果有）
      let hasParams = false;
      
      // 显示 URL 中的查询参数（无论是 GET 还是 POST 请求）
      if (req.queryParams && Object.keys(req.queryParams).length > 0) {
        console.log(chalk.cyan('  URL查询参数:'));
        console.log('  ' + JSON.stringify(req.queryParams, null, 2).replace(/\n/g, '\n  '));
        hasParams = true;
      }
      
      // 显示 POST 请求的数据
      if (req.parsedPostData) {
        console.log(chalk.cyan('  POST数据 (JSON):'));
        console.log('  ' + JSON.stringify(req.parsedPostData, null, 2).replace(/\n/g, '\n  '));
        hasParams = true;
      } else if (req.postData) {
        console.log(chalk.cyan('  POST数据:'));
        console.log(`  ${req.postData.substring(0, 100)}${req.postData.length > 100 ? '...' : ''}`);
        hasParams = true;
      }
      
      if (!hasParams) {
        console.log(chalk.italic('  无请求参数'));
      }
      
      // 响应信息
      if (req.response) {
        console.log(chalk.cyan(`  响应状态: ${req.response.status} ${req.response.statusText}`));
        
        // 响应体
        if (req.response.parsedBody) {
          console.log(chalk.cyan('  响应数据 (JSON):'));
          console.log('  ' + JSON.stringify(req.response.parsedBody, null, 2).replace(/\n/g, '\n  '));
        } else if (req.response.body && !req.response.body.startsWith('[二进制数据')) {
          console.log(chalk.cyan('  响应数据:'));
          const bodyPreview = req.response.body.substring(0, 200);
          console.log(`  ${bodyPreview}${req.response.body.length > 200 ? '...' : ''}`);
        } else if (req.response.body) {
          console.log(chalk.cyan('  响应数据:'));
          console.log(`  ${req.response.body}`);
        }
      } else {
        console.log(chalk.red('  无响应信息'));
      }
      
      console.log(chalk.yellow('─'.repeat(100)));
    });
    
    // 提示查看完整数据
    console.log(chalk.yellow('\n提示: 完整的AJAX请求和响应数据已保存到文件中，可以使用以下命令查看:'));
    console.log(chalk.green(`cat ${filePath}`));
    
  } catch (error) {
    log.error(`监听过程中出错: ${error.message}`);
    console.error(error);
  } finally {
    // 关闭浏览器
    await browser.close();
    log.title('AJAX请求监听结束');
  }
}

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log.error('请提供要监听的网址');
    log.info('用法: node requestMonitor.js <网址> [等待时间(毫秒)]');
    log.info('例如: node requestMonitor.js https://example.com 5000');
    process.exit(1);
  }
  
  const url = args[0];
  const waitTime = parseInt(args[1]) || 10000;
  
  // 验证URL格式
  try {
    new URL(url);
  } catch (error) {
    log.error(`无效的URL: ${url}`);
    process.exit(1);
  }
  
  // 开始监听
  await monitorRequests(url, { waitTime });
}

// 执行主函数
main().catch(error => {
  log.error(`程序执行出错: ${error.message}`);
  process.exit(1);
});
