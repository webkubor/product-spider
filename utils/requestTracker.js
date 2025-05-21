import fs from 'fs-extra';
import path from 'path';
import { log } from './logger.js';

/**
 * 请求跟踪器 - 用于监听和记录网页加载过程中的 AJAX 请求和响应
 */
export class RequestTracker {
  constructor() {
    this.requests = [];
    this.responses = [];
    this.requestMap = new Map(); // 用于关联请求和响应
    this.startTime = Date.now();
    // AJAX 请求类型
    this.ajaxTypes = ['xhr', 'fetch'];
  }

  /**
   * 初始化请求跟踪
   * @param {BrowserContext} context - Playwright 浏览器上下文
   */
  initialize(context) {
    log.info('初始化请求跟踪器...');
    
    // 监听请求事件
    context.on('request', request => {
      const resourceType = request.resourceType();
      
      // 只跟踪 AJAX 请求（xhr 和 fetch）
      if (!this.ajaxTypes.includes(resourceType)) {
        return;
      }
      
      // 提取请求参数
      let queryParams = null;
      let postData = request.postData() || null;
      
      // 对于所有请求，如果 URL 中包含查询参数，尝试提取
      if (request.url().includes('?')) {
        try {
          const urlObj = new URL(request.url());
          queryParams = {};
          urlObj.searchParams.forEach((value, key) => {
            queryParams[key] = value;
          });
        } catch (e) {
          // 如果 URL 解析失败，忽略错误
        }
      }
      
      // 如果是 POST 请求且有数据，尝试解析 JSON
      let parsedPostData = null;
      if (postData) {
        try {
          parsedPostData = JSON.parse(postData);
        } catch (e) {
          // 如果不是 JSON，保留原始数据
        }
      }
      
      const requestData = {
        id: this.requests.length + 1,
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        resourceType: resourceType,
        timestamp: Date.now(),
        timeSinceStart: Date.now() - this.startTime,
        postData: postData,
        parsedPostData: parsedPostData,
        queryParams: queryParams
      };
      
      this.requests.push(requestData);
      this.requestMap.set(request.url(), requestData);
      
      log.info(`[请求] ${requestData.method} ${requestData.url} (${requestData.resourceType})`);
    });
    
    // 监听响应事件
    context.on('response', async response => {
      try {
        // 检查请求是否在我们的跟踪列表中
        const requestData = this.requestMap.get(response.url());
        if (!requestData) {
          return; // 如果不是我们跟踪的请求，则跳过
        }
        
        let responseBody = null;
        let parsedResponseBody = null;
        
        // 尝试获取响应体
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json') || 
            contentType.includes('text') || 
            contentType.includes('javascript') || 
            contentType.includes('xml')) {
          try {
            responseBody = await response.text();
            
            // 如果是 JSON，尝试解析
            if (contentType.includes('json')) {
              try {
                parsedResponseBody = JSON.parse(responseBody);
              } catch (jsonError) {
                // JSON 解析失败，保留原始文本
              }
            }
          } catch (e) {
            responseBody = '无法获取响应体: ' + e.message;
          }
        } else {
          responseBody = `[二进制数据 - ${contentType}]`;
        }
        
        const responseData = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          timestamp: Date.now(),
          timeSinceStart: Date.now() - this.startTime,
          body: responseBody,
          parsedBody: parsedResponseBody,
          contentType: contentType
        };
        
        this.responses.push(responseData);
        
        // 关联请求和响应
        requestData.response = responseData;
        
        log.info(`[响应] ${response.status()} ${response.url()}`);
      } catch (error) {
        log.error(`处理响应时出错: ${error.message}`);
      }
    });
    
    log.success('AJAX 请求跟踪器初始化完成');
  }
  
  /**
   * 获取所有请求和响应数据
   * @returns {Object} 包含请求和响应的对象
   */
  getAllData() {
    return {
      totalRequests: this.requests.length,
      totalResponses: this.responses.length,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      requests: this.requests
    };
  }
  
  /**
   * 保存请求和响应数据到文件
   * @param {string} url - 被监听的网址
   * @param {string} outputDir - 输出目录
   * @returns {Promise<string>} 保存的文件路径
   */
  async saveToFile(url, outputDir = './results/requests') {
    try {
      // 确保输出目录存在
      await fs.ensureDir(outputDir);
      
      // 生成文件名（使用URL的域名部分）
      const domain = new URL(url).hostname;
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const fileName = `${domain}_${timestamp}.json`;
      const filePath = path.join(outputDir, fileName);
      
      // 准备数据
      const data = this.getAllData();
      data.targetUrl = url;
      
      // 写入文件
      await fs.writeJson(filePath, data, { spaces: 2 });
      log.success(`请求跟踪数据已保存到 ${filePath}`);
      
      return filePath;
    } catch (error) {
      log.error(`保存请求跟踪数据时出错: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 清空所有请求和响应数据
   */
  clear() {
    this.requests = [];
    this.responses = [];
    this.requestMap.clear();
    this.startTime = Date.now();
    log.info('请求跟踪器已重置');
  }
}

/**
 * 创建一个新的请求跟踪器实例
 * @returns {RequestTracker} 请求跟踪器实例
 */
export function createRequestTracker() {
  return new RequestTracker();
}
