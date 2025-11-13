import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  InitializeRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer } from '~/servers/BaseMCPServer.js';
import type { MCPServerOptions } from '~/interfaces/MCPServer.js';
import { WorkerpoolAdapter } from '~/workers/index.js';
import type { ToolWorkerPool } from '~/interfaces/ToolWorkerPool.js';

import { randomUUID } from 'crypto';
import packageJson from '../../package.json';

const SESSION_ID_HEADER_NAME = "mcp-session-id";

/**
 * HTTP流式MCP服务器实现
 *
 * 使用 MCP SDK 的 StreamableHTTPServerTransport 处理所有协议细节
 * 支持HTTP JSON-RPC和SSE（Server-Sent Events）
 */
export class StreamableHttpMCPServer extends BaseMCPServer {
  private app?: Express;
  private httpServer?: HttpServer;
  private port: number;
  private host: string;
  private corsEnabled: boolean;
  private workerPool: ToolWorkerPool;

  // 支持多个并发连接 - 每个session独立的Server和Transport实例
  private servers: Map<string, Server> = new Map();
  private transports: Map<string, StreamableHTTPServerTransport> = new Map();

  constructor(options: MCPServerOptions & {
    port?: number;
    host?: string;
    corsEnabled?: boolean;
  }) {
    super(options);
    this.port = options.port || 8080;
    this.host = options.host || '127.0.0.1';  // 使用 IPv4 避免 IPv6 问题
    this.corsEnabled = options.corsEnabled || false;

    // 初始化 worker pool
    this.workerPool = new WorkerpoolAdapter({
      minWorkers: 2,
      maxWorkers: 4,
      workerTimeout: 30000
    });
  }

  /**
   * 连接HTTP传输层
   */
  protected async connectTransport(): Promise<void> {
    this.logger.info('Starting HTTP server...');

    // 初始化 worker pool
    await this.workerPool.initialize();
    this.logger.info('Worker pool initialized');

    // 创建Express应用
    this.app = express();

    // 设置Express应用 - 完全仿照官方
    this.setupExpress();

    // 启动HTTP服务器
    await new Promise<void>((resolve, reject) => {
      this.httpServer = this.app!.listen(this.port, this.host, () => {
        this.logger.info(`HTTP server listening on http://${this.host}:${this.port}/mcp`);
        resolve();
      });

      this.httpServer.on('error', reject);
    });
  }

  /**
   * 获取或创建session对应的Server实例
   *
   * 形式化规约：
   * 前置条件：sessionId ≠ null ∧ sessionId ≠ ""
   * 后置条件：返回的Server是sessionId唯一对应的
   * 不变式：servers.get(sessionId) 存在 ⟺ transports.get(sessionId) 存在
   */
  private getOrCreateServer(sessionId: string): Server {
    // 断言：sessionId必须有效
    if (!sessionId) {
      throw new Error('SessionId cannot be null or empty');
    }

    // 如果已存在，直接返回
    if (this.servers.has(sessionId)) {
      return this.servers.get(sessionId)!;
    }

    // 创建新的Server实例（注意：不监听端口）
    const server = new Server(
      {
        name: this.options.name,
        version: this.options.version
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // 为这个Server注册处理器（独立副本）
    this.setupServerHandlers(server);

    // 保存Server实例
    this.servers.set(sessionId, server);
    this.logger.info(`Created new Server instance for session: ${sessionId}`);

    return server;
  }

  /**
   * 为Server实例设置请求处理器
   * 注意：这些处理器是每个Server独立的
   */
  private setupServerHandlers(server: Server): void {
    // 工具列表请求
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Handling list tools request');
      return {
        tools: Array.from(this.tools.values()).map(({ handler, ...tool }) => tool)
      };
    });

    // 工具调用请求
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.logger.debug(`Handling tool call: ${request.params.name}`);
      return this.executeTool(request.params.name, request.params.arguments);
    });
  }

  /**
   * 设置中间件和路由 - 完全仿照官方实现
   */
  private setupExpress(): void {
    if (!this.app) return;

    // CORS 中间件 - 如果启用了 CORS
    if (this.corsEnabled) {
      this.app.use((req, res, next) => {
        // 允许所有来源
        res.header('Access-Control-Allow-Origin', '*');
        
        // 允许的请求头
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, mcp-session-id');
        
        // 允许的请求方法
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        
        // 预检请求处理
        if (req.method === 'OPTIONS') {
          res.status(200).end();
          return;
        }
        
        next();
      });
      
      this.logger.info('CORS enabled for all origins');
    }

    // 仿照官方：只有基础的 JSON 解析
    this.app.use(express.json());

    // 仿照官方：使用 Router
    const router = express.Router();

    // 健康检查端点 - 在其他路由之前定义
    router.get('/health', (req, res) => {
      this.handleHealthCheck(req, res);
    });

    // PromptX 资源状态查询端点
    router.get('/status', async (req, res) => {
      await this.handleStatusQuery(req, res);
    });

    // 角色详情查询端点
    router.get('/roles/:roleId', async (req, res) => {
      await this.handleRoleDetailsQuery(req, res);
    });

    // 仿照官方：路由定义
    router.post('/mcp', async (req, res) => {
      await this.handlePostRequest(req, res);
    });

    router.get('/mcp', async (req, res) => {
      await this.handleGetRequest(req, res);
    });

    // 仿照官方：挂载路由
    this.app.use('/', router);
  }

  /**
   * 处理健康检查请求
   *
   * 形式化保证：
   * - 无副作用（幂等性）
   * - O(1)时间复杂度
   * - 始终返回有效JSON
   */
  private handleHealthCheck(req: Request, res: Response): void {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mcp-server',
      uptime: process.uptime(),
      version: this.getVersion(),
      transport: 'http',
      sessions: this.servers.size,  // 显示当前活跃的session数量
      servers: this.servers.size,   // 独立Server实例数量
      transports: this.transports.size  // Transport实例数量
    };

    res.status(200).json(healthStatus);
  }

  /**
   * 获取服务版本信息
   */
  private getVersion(): string {
    return packageJson.version || 'unknown';
  }

  private async handleStatusQuery(req: Request, res: Response): Promise<void> {
    try {
      // 获取 Worker Pool 统计信息
      const workerStats = this.workerPool.getStats();

      // 构建工具详细信息
      const toolsInfo = Array.from(this.tools.entries()).map(([name, tool]) => ({
        name,
        description: tool.description || 'No description',
        inputSchema: tool.inputSchema || {},
        usesWorkerPool: WorkerpoolAdapter.shouldUsePool(name)
      }));

      // 获取 PromptX 资源信息
      const promptxResources = await this.getPromptXResources();

      const statusResponse = {
        // 基本服务信息
        service: {
          name: 'PromptX MCP Server',
          version: this.getVersion(),
          status: this.isRunning() ? 'running' : 'stopped',
          transport: 'http',
          host: this.host,
          port: this.port,
          corsEnabled: this.corsEnabled
        },

        // 系统环境
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          cwd: process.cwd()
        },

        // 系统指标
        metrics: {
          requests: {
            total: this.metrics.requestCount,
            errors: this.metrics.errorCount,
            successRate: this.metrics.requestCount > 0
              ? ((this.metrics.requestCount - this.metrics.errorCount) / this.metrics.requestCount * 100).toFixed(2) + '%'
              : '100%'
          }
        },

        // Worker Pool 状态
        workerPool: {
          status: 'initialized',
          workers: {
            active: workerStats.active,
            pending: workerStats.pending,
            available: workerStats.available,
            total: workerStats.total
          },
          configuration: {
            minWorkers: 2,
            maxWorkers: 4,
            timeout: '30000ms'
          }
        },

        // MCP 工具统计
        mcpTools: {
          total: this.tools.size,
          workerPoolTools: toolsInfo.filter(t => t.usesWorkerPool).length,
          directTools: toolsInfo.filter(t => !t.usesWorkerPool).length,
          list: toolsInfo
        },

        // PromptX 资源统计
        promptxResources
      };

      res.status(200).json(statusResponse);

    } catch (error: any) {
      this.logger.error(`Error handling status query: ${error.message}`);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 处理角色详情查询请求
   */
  private async handleRoleDetailsQuery(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const source = req.query.source as string || 'system';
      
      this.logger.info(`Getting role details for: ${roleId} (${source})`);
      
      // 直接从资源管理器获取角色原始数据
      const roleDetails = await this.getRoleFromResourceManager(roleId, source);
      
      res.status(200).json({
        success: true,
        data: roleDetails,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      this.logger.error(`Error handling role details query: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get role details',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 从资源管理器获取角色原始数据
   */
  private async getRoleFromResourceManager(roleId: string, source: string): Promise<any> {
    try {
      // 直接使用 core 模块的 ResourceManager API
      const core = await import('@promptx/core');
      const coreExports = core.default || core;

      // 获取 ResourceManager
      const getGlobalResourceManager = coreExports.resource?.getGlobalResourceManager;
      if (!getGlobalResourceManager) {
        throw new Error('getGlobalResourceManager not found in @promptx/core.resource');
      }

      const resourceManager = getGlobalResourceManager();

      // 刷新资源以获取最新数据
      await resourceManager.initializeWithNewArchitecture();

      // 获取所有角色资源
      const roles = resourceManager.registryData.getResourcesByProtocol('role');
      
      // 查找指定角色
      const role = roles.find((r: any) => r.id === roleId);
      if (!role) {
        throw new Error(`Role '${roleId}' not found`);
      }

      this.logger.info(`Found role: ${JSON.stringify(role, null, 2)}`);

      // 直接使用 ResourceManager 的 loadResource 方法获取完整内容
      let prompt = '暂无提示词内容';
      let capabilities: string[] = [];
      let examples: string[] = [];
      let version = '1.0.0';
      
      try {
        // 使用 ResourceManager 的 loadResource 方法
        const loadedRole = await resourceManager.loadResource(role.id, 'role');
        this.logger.info(`Loaded role content: ${JSON.stringify(loadedRole, null, 2)}`);
        
        if (loadedRole && loadedRole.content) {
          prompt = loadedRole.content;
        } else if (loadedRole && loadedRole.data) {
          prompt = loadedRole.data;
        }
      } catch (loadError) {
        this.logger.warn(`Failed to load role content: ${loadError}`);
        
        // 如果 loadResource 失败，尝试直接从文件读取
        if (role.resourcePath || role.path) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            
            const rolePath = role.resourcePath || role.path;
            this.logger.info(`Trying to read role file: ${rolePath}`);
            
            if (fs.existsSync(rolePath)) {
              const fileContent = fs.readFileSync(rolePath, 'utf-8');
              this.logger.info(`File content length: ${fileContent.length}`);
              
              // 如果是 DPML 格式，提取 prompt 部分
              if (fileContent.includes('```prompt')) {
                const promptMatch = fileContent.match(/```prompt\s*([\s\S]*?)\s*```/);
                if (promptMatch) {
                  prompt = promptMatch[1].trim();
                  this.logger.info(`Extracted prompt from DPML: ${prompt.substring(0, 200)}...`);
                }
              } else {
                // 直接使用文件内容
                prompt = fileContent;
                this.logger.info(`Using file content directly: ${prompt.substring(0, 200)}...`);
              }
            } else {
              this.logger.warn(`Role file does not exist: ${rolePath}`);
            }
          } catch (fileError) {
            this.logger.error(`Failed to read role file: ${fileError}`);
          }
        }
      }
      
      // 从提示词中提取结构化信息
      if (prompt && prompt !== '暂无提示词内容') {
        // 提取能力标签
        const capabilityMatch = prompt.match(/能力[:：]([^\n]+)/);
        if (capabilityMatch) {
          capabilities = capabilityMatch[1].split(/[,，、]/).map((c: string) => c.trim()).filter((c: string) => c);
        }
        
        // 提取使用示例
        const exampleMatches = prompt.match(/示例[:：]([^\n]+)/g);
        if (exampleMatches) {
          examples = exampleMatches.map((match: string) => 
            match.replace(/示例[:：]/, '').trim()
          );
        }
        
        // 提取版本信息
        const versionMatch = prompt.match(/版本[:：]([^\n]+)/);
        if (versionMatch) {
          version = versionMatch[1].trim();
        }
      }
      
      return {
        id: roleId,
        name: role.name || role.title || roleId,
        description: role.description || 'No description',
        source: this.normalizeResourceSource(role.source || source),
        prompt: prompt,
        capabilities: capabilities,
        examples: examples,
        version: version,
        activateCommand: `action("${roleId}")`
      };
      
    } catch (error: any) {
      this.logger.error(`Failed to get role from resource manager: ${error.message}`);
      throw new Error(`Failed to get role details: ${error.message}`);
    }
  }

  /**
   * 获取 PromptX 资源信息（角色和工具）
   */
  private async getPromptXResources(): Promise<any> {
    try {
      // 直接使用 core 模块的 ResourceManager API
      const core = await import('@promptx/core');
      const coreExports = core.default || core;

      // 获取 ResourceManager
      const getGlobalResourceManager = coreExports.resource?.getGlobalResourceManager;
      if (!getGlobalResourceManager) {
        throw new Error('getGlobalResourceManager not found in @promptx/core.resource');
      }

      const resourceManager = getGlobalResourceManager();

      // 刷新资源以获取最新数据
      await resourceManager.initializeWithNewArchitecture();

      // 直接从 ResourceManager 获取结构化数据
      const roles = resourceManager.registryData.getResourcesByProtocol('role');
      const tools = resourceManager.registryData.getResourcesByProtocol('tool');

      // 按来源分类
      const categorizeBySource = (resources: any[]) => {
        const categories = {
          system: [] as any[],
          project: [] as any[],
          user: [] as any[]
        };

        resources.forEach(resource => {
          const source = this.normalizeResourceSource(resource.source);
          categories[source].push({
            id: resource.id,
            name: resource.name || resource.title || resource.id,
            description: resource.description || 'No description',
            activateCommand: resource.protocol === 'role' ? `action("${resource.id}")` : undefined,
            manualCommand: resource.protocol === 'tool' ? `toolx("@tool://${resource.id}", mode: 'manual')` : undefined,
            executeCommand: resource.protocol === 'tool' ? `toolx("@tool://${resource.id}", parameters)` : undefined
          });
        });

        return categories;
      };

      const roleCategories = categorizeBySource(roles);
      const toolCategories = categorizeBySource(tools);

      // 构建结果
      return {
        roles: {
          system: roleCategories.system,
          project: roleCategories.project,
          user: roleCategories.user
        },
        tools: {
          system: toolCategories.system,
          project: toolCategories.project,
          user: toolCategories.user
        },
        summary: {
          totalRoles: roles.length,
          totalTools: tools.length,
          system: roleCategories.system.length,
          user: roleCategories.user.length,
          systemTools: toolCategories.system.length,
          userTools: toolCategories.user.length,
          projectRoles: roleCategories.project.length,
          projectTools: toolCategories.project.length
        }
      };

    } catch (error: any) {
      this.logger.warn(`Failed to load PromptX resources: ${error.message}`);
      return {
        error: 'Failed to load PromptX resources',
        message: error.message,
        roles: { system: [], project: [], user: [] },
        tools: { system: [], project: [], user: [] },
        summary: {
          totalRoles: 0,
          totalTools: 0,
          system: 0,
          user: 0,
          systemTools: 0,
          userTools: 0,
          projectRoles: 0,
          projectTools: 0
        }
      };
    }
  }

  /**
   * 标准化资源来源
   */
  private normalizeResourceSource(source: string): 'system' | 'project' | 'user' {
    if (!source) return 'system';

    const lowerSource = String(source).toLowerCase();

    if (lowerSource === 'user') return 'user';
    if (lowerSource === 'project') return 'project';
    if (['package', 'merged', 'fallback', 'system'].includes(lowerSource)) {
      return 'system';
    }

    return 'system';
  }

  /**
   * 处理 GET 请求（SSE）
   * 使用独立的Server实例处理SSE连接
   */
  private async handleGetRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;

    if (!sessionId) {
      res.status(400).json(
        this.createErrorResponse('Bad Request: session ID required for SSE.')
      );
      return;
    }

    // 确保session存在（获取或创建Server和Transport）
    if (!this.transports.has(sessionId)) {
      this.logger.info(`Session ${sessionId} not found for SSE, creating...`);

      // 获取或创建Server
      const server = this.getOrCreateServer(sessionId);

      // 创建Transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId
      });

      // 连接
      await server.connect(transport);
      this.transports.set(sessionId, transport);
    }

    this.logger.info(`Establishing SSE stream for session ${sessionId}`);

    // 设置 SSE 必需的响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

    // 启动心跳机制 - 每 20 秒发送一次
    const heartbeatInterval = setInterval(() => {
      try {
        // SSE 心跳格式：注释行
        res.write(':heartbeat\n\n');
        this.logger.info(`Sent SSE heartbeat for session ${sessionId}`);
      } catch (error) {
        this.logger.error(`Failed to send heartbeat for session ${sessionId}: ${error}`);
        clearInterval(heartbeatInterval);
      }
    }, 20000); // 20 秒间隔

    // 监听连接关闭事件
    req.on('close', () => {
      this.logger.info(`SSE connection closed for session ${sessionId}`);
      clearInterval(heartbeatInterval);
      // 注意：暂时不清理session，因为客户端可能重连
    });

    const transport = this.transports.get(sessionId)!;
    await transport.handleRequest(req, res);
    await this.streamMessages(transport);

    return;
  }

  /**
   * 发送 SSE 流消息 - 完全复制官方实现
   */
  private async streamMessages(transport: StreamableHTTPServerTransport): Promise<void> {
    try {
      // 基于 LoggingMessageNotificationSchema 触发客户端的 setNotificationHandler
      const message = {
        method: 'notifications/message',
        params: { level: 'info', data: 'SSE Connection established' }
      };

      this.sendNotification(transport, message);

      let messageCount = 0;

      const interval = setInterval(async () => {
        messageCount++;

        const data = `Message ${messageCount} at ${new Date().toISOString()}`;

        const message = {
          method: 'notifications/message',
          params: { level: 'info', data: data }
        };

        try {
          this.sendNotification(transport, message);

          if (messageCount === 2) {
            clearInterval(interval);

            const message = {
              method: 'notifications/message',
              params: { level: 'info', data: 'Streaming complete!' }
            };

            this.sendNotification(transport, message);
          }
        } catch (error) {
          this.logger.error(`Error sending message: ${error}`);
          clearInterval(interval);
        }
      }, 1000);
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
    }
  }

  /**
   * 发送通知 - 完全复制官方实现
   */
  private async sendNotification(
    transport: StreamableHTTPServerTransport,
    notification: any
  ): Promise<void> {
    const rpcNotification = {
      ...notification,
      jsonrpc: '2.0'
    };
    await transport.send(rpcNotification);
  }

  /**
   * 处理 POST 请求（JSON-RPC）
   * 使用独立的Server实例处理每个session
   */
  private async handlePostRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;

    this.logger.info('=== POST Request ===');
    this.logger.info(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    this.logger.info(`Body: ${JSON.stringify(req.body, null, 2)}`);
    this.logger.info(`Session ID: ${sessionId}`);

    try {
      // 处理已有session的请求
      if (sessionId && this.transports.has(sessionId)) {
        this.logger.info(`Reusing existing Server and Transport for session: ${sessionId}`);
        const transport = this.transports.get(sessionId)!;
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // 处理initialize请求（创建新session）
      if (!sessionId && this.isInitializeRequest(req.body)) {
        this.logger.info('Creating new session for initialize request');

        // 生成新的session ID
        const newSessionId = randomUUID();

        // 获取或创建该session的Server
        const server = this.getOrCreateServer(newSessionId);

        // 创建新的Transport
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId
        });

        // 连接Server和Transport
        await server.connect(transport);

        // 保存Transport（Server已在getOrCreateServer中保存）
        this.transports.set(newSessionId, transport);

        // 处理请求
        await transport.handleRequest(req, res, req.body);

        this.logger.info(`New session created: ${newSessionId}`);
        return;
      }

      // 处理带session ID但Transport不存在的情况（可能是服务器重启）
      if (sessionId && !this.transports.has(sessionId)) {
        this.logger.info(`Session ${sessionId} not found, recreating...`);

        // 获取或创建Server
        const server = this.getOrCreateServer(sessionId);

        // 创建新的Transport
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId
        });

        // 连接
        await server.connect(transport);
        this.transports.set(sessionId, transport);

        // 处理请求
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // 无效请求
      this.logger.info('Invalid request - no session ID and not initialize request');
      this.logger.info(`isInitializeRequest result: ${this.isInitializeRequest(req.body)}`);
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: invalid session ID or method.'
        },
        id: randomUUID()
      });

    } catch (error) {
      this.logger.error(`Error handling MCP request: ${error}`);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error.'
        },
        id: randomUUID()
      });
    }
  }

  /**
   * 检查是否是 initialize 请求 - 完全复制官方实现
   */
  private isInitializeRequest(body: any): boolean {
    const isInitial = (data: any) => {
      const result = InitializeRequestSchema.safeParse(data);
      return result.success;
    };
    if (Array.isArray(body)) {
      return body.some((request) => isInitial(request));
    }
    return isInitial(body);
  }

  /**
   * 创建错误响应 - 完全复制官方实现
   */
  private createErrorResponse(message: string): any {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: message
      },
      id: randomUUID()
    };
  }

  /**
   * 断开HTTP传输层
   */
  protected async disconnectTransport(): Promise<void> {
    this.logger.info('Stopping HTTP server...');

    // 关闭所有 transports 和 servers
    for (const [sessionId, transport] of this.transports.entries()) {
      this.logger.info(`Closing transport for session: ${sessionId}`);
      await transport.close();
    }

    // 清理所有servers（不需要显式关闭，因为它们不监听端口）
    this.servers.clear();
    this.transports.clear();

    // 关闭HTTP服务器
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          this.logger.info('HTTP server stopped');
          resolve();
        });
      });

      this.httpServer = undefined;
    }

    // 终止 worker pool
    await this.workerPool.terminate();
    this.logger.info('Worker pool terminated');

    this.app = undefined;
  }

  /**
   * 清理特定session的资源
   * 可以在session超时或客户端断开时调用
   */
  private async cleanupSession(sessionId: string): Promise<void> {
    this.logger.info(`Cleaning up session: ${sessionId}`);

    // 关闭Transport
    const transport = this.transports.get(sessionId);
    if (transport) {
      await transport.close();
      this.transports.delete(sessionId);
    }

    // 移除Server（垃圾回收会处理）
    this.servers.delete(sessionId);

    this.logger.info(`Session cleaned up: ${sessionId}`);
  }

  /**
   * 重写 executeTool 方法，使用 WorkerPool 执行所有工具
   */
  async executeTool(name: string, args: any): Promise<any> {
    if (!this.isRunning()) {
      this.logger.warn(`Attempted to execute tool '${name}' while server is not running`);
      throw new Error('Server is not running');
    }

    const tool = this.tools.get(name);
    if (!tool) {
      this.logger.error(`Tool not found: ${name}. Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
      throw new Error(`Tool not found: ${name}`);
    }

    const startTime = Date.now();

    this.logger.info(`[TOOL_EXEC_START] Tool: ${name} (via WorkerPool)`);
    this.logger.debug(`[TOOL_ARGS] ${name}: ${JSON.stringify(args)}`);

    try {
      // 所有工具都通过 WorkerPool 执行
      const result = await this.workerPool.execute(tool, args);

      const responseTime = Date.now() - startTime;
      this.logger.info(`[TOOL_EXEC_SUCCESS] Tool: ${name}, Time: ${responseTime}ms`);

      // 更新指标
      this.metrics.requestCount++;
      this.metrics.avgResponseTime =
        (this.metrics.avgResponseTime * (this.metrics.requestCount - 1) + responseTime) /
        this.metrics.requestCount;

      return result;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`[TOOL_EXEC_ERROR] Tool: ${name}, Time: ${responseTime}ms, Error: ${error.message}`);

      // 更新错误计数
      this.metrics.errorCount++;
      this.lastError = error;

      // 重新抛出错误
      throw error;
    }
  }
}
