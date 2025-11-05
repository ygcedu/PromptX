import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import logger, { type Logger } from '@promptx/logger';
import type {
  MCPServer,
  MCPServerOptions,
  ServerState,
  ToolHandler,
  ToolWithHandler,
  HealthCheckResult,
  ServerMetrics,
  SessionContext
} from '~/interfaces/MCPServer.js';
import { 
  MCPError, 
  ToolExecutionError, 
  ResourceAccessError,
  ErrorHelper,
  ErrorSeverity 
} from '~/errors/MCPError.js';
import { globalErrorCollector } from '~/errors/ErrorCollector.js';

/**
 * 基础MCP服务器实现
 * 
 * 设计模式：Template Method Pattern
 * 子类需要实现特定的传输层逻辑
 * 
 * 不变式：
 * 1. 状态转换必须原子性
 * 2. 资源注册必须幂等
 * 3. 错误不能破坏内部状态
 */
export abstract class BaseMCPServer implements MCPServer {
  protected server: Server;
  protected logger: Logger;
  protected state: ServerState = 'IDLE';
  protected options: MCPServerOptions;
  
  // 资源存储
  protected tools = new Map<string, ToolWithHandler>();
  protected sessions = new Map<string, SessionContext>();
  
  // 并发控制
  protected activeRequests = 0;
  protected readonly requestLocks = new Map<string, Promise<any>>();
  
  // 指标收集
  protected metrics: ServerMetrics = {
    requestCount: 0,
    errorCount: 0,
    avgResponseTime: 0,
    activeConnections: 0,
    memoryUsage: process.memoryUsage(),
    startTime: 0,
    uptime: 0
  };
  
  // 最后错误（用于诊断）
  protected lastError?: Error;
  
  constructor(options: MCPServerOptions) {
    this.options = options;
    this.logger = options.logger || logger;
    
    // 设置错误阈值
    this.setupErrorThresholds();
    
    // 初始化MCP SDK服务器
    this.server = new Server(
      {
        name: options.name,
        version: options.version
      },
      {
        capabilities: this.buildCapabilities()
      }
    );
    
    this.setupHandlers();
  }
  
  /**
   * 设置错误阈值
   */
  protected setupErrorThresholds(): void {
    // 严重错误超过5个时触发告警
    globalErrorCollector.setThreshold('severity:critical', 5, () => {
      this.logger.error('[ALERT] Critical error threshold reached!');
      // 可以在这里发送告警通知
    });
    
    // 致命错误立即触发
    globalErrorCollector.setThreshold('severity:fatal', 1, () => {
      this.logger.error('[ALERT] Fatal error occurred! Server may need restart.');
      this.setState('FATAL_ERROR');
    });
    
    // 工具执行错误过多时告警
    globalErrorCollector.setThreshold('category:tool_execution', 10, () => {
      this.logger.warn('[ALERT] Too many tool execution errors');
    });
  }
  
  /**
   * 构建服务器能力声明
   */
  protected buildCapabilities() {
    return {
      tools: {}  // 仅支持工具
    };
  }
  
  /**
   * 设置请求处理器
   */
  protected setupHandlers(): void {
    // 工具列表请求
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Handling list tools request');
      return {
        tools: Array.from(this.tools.values()).map(({ handler, ...tool }) => tool)
      };
    });
    
    // 工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.logger.debug(`Handling tool call: ${request.params.name}`);
      return this.executeTool(request.params.name, request.params.arguments);
    });
  }
  

  
  /**
   * 子类需要实现的传输层连接方法
   */
  protected abstract connectTransport(): Promise<void>;
  
  /**
   * 子类需要实现的传输层断开方法
   */
  protected abstract disconnectTransport(): Promise<void>;
  
  // ============ 生命周期管理 ============
  
  async start(options?: MCPServerOptions): Promise<void> {
    if (this.state === 'RUNNING' || this.state === 'STARTING') {
      throw new Error('Server is already running or starting');
    }
    
    this.setState('STARTING');
    this.logger.info('Starting MCP server...');
    
    try {
      // 合并选项
      if (options) {
        this.options = { ...this.options, ...options };
      }
      
      // 连接传输层
      await this.connectTransport();
      
      // 记录启动时间
      this.metrics.startTime = Date.now();
      
      this.setState('RUNNING');
      this.logger.info('MCP server started successfully');
    } catch (error) {
      this.setState('ERROR');
      this.lastError = error as Error;
      this.logger.error('Failed to start server', error);
      throw error;
    }
  }
  
  async stop(): Promise<void> {
    if (this.state !== 'RUNNING') {
      throw new Error(`Invalid state transition: cannot stop from ${this.state}`);
    }
    
    this.setState('STOPPING');
    this.logger.info('Stopping MCP server...');
    
    try {
      // 等待所有活跃请求完成
      await this.waitForActiveRequests();
      
      // 断开传输层
      await this.disconnectTransport();
      
      // 清理会话
      this.sessions.clear();
      
      this.setState('STOPPED');
      this.logger.info('MCP server stopped');
    } catch (error) {
      this.setState('ERROR');
      this.lastError = error as Error;
      this.logger.error('Error stopping server', error);
      throw error;
    }
  }
  
  async gracefulShutdown(timeoutMs: number): Promise<void> {
    this.logger.info(`Graceful shutdown initiated with ${timeoutMs}ms timeout`);
    
    const shutdownPromise = this.stop();
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs);
    });
    
    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
    } catch (error) {
      if ((error as Error).message === 'Shutdown timeout') {
        this.logger.warn('Graceful shutdown timeout, forcing stop');
        this.setState('STOPPED');
      } else {
        throw error;
      }
    }
  }
  
  // 删除recover方法 - 错误就是错误，不要自动恢复
  
  isRunning(): boolean {
    return this.state === 'RUNNING';
  }
  
  getState(): ServerState {
    return this.state;
  }
  
  protected setState(newState: ServerState): void {
    const oldState = this.state;
    this.state = newState;
    this.logger.info(`[STATE_CHANGE] ${oldState} -> ${newState}`);
    
    // 发出状态变化事件（如果有监听器）
    if (oldState !== newState) {
      this.logger.debug(`[STATE_DETAILS] Previous: ${oldState}, Current: ${newState}, Running: ${this.isRunning()}`);
    }
  }
  
  // ============ 工具管理 ============
  
  registerTool(tool: ToolWithHandler): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} already registered`);
    }
    
    this.tools.set(tool.name, tool);
    this.logger.info(`Tool registered: ${tool.name}`);
  }
  
  unregisterTool(name: string): void {
    if (!this.tools.has(name)) {
      this.logger.warn(`Tool ${name} not found for unregistration`);
      return;
    }
    
    this.tools.delete(name);
    this.logger.info(`Tool unregistered: ${name}`);
  }
  
  getTool(name: string): Tool | undefined {
    const tool = this.tools.get(name);
    if (tool) {
      const { handler, ...toolDef } = tool;
      return toolDef;
    }
    return undefined;
  }
  
  listTools(): Tool[] {
    return Array.from(this.tools.values()).map(({ handler, ...tool }) => tool);
  }
  
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
    
    this.logger.info(`[TOOL_EXEC_START] Tool: ${name}`);
    this.logger.debug(`[TOOL_ARGS] ${name}:`, args);
    
    try {
      const result = await tool.handler(args);
      
      const responseTime = Date.now() - startTime;
      this.logger.info(`[TOOL_EXEC_SUCCESS] Tool: ${name}, Time: ${responseTime}ms`);
      this.logger.debug(`[TOOL_RESULT] ${name}:`, result);
      
      return result;
    } catch (error: any) {
      // 直接失败，不重试，不计数，简单明了
      this.logger.error(`[TOOL_EXEC_ERROR] Tool: ${name}`, error);
      throw error;
    }
  }
  

  

  
  // ============ 会话管理 ============
  
  async createSession(metadata?: Record<string, any>): Promise<SessionContext> {
    const sessionId = this.generateSessionId();
    const session: SessionContext = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata
    };
    
    this.sessions.set(sessionId, session);
    this.logger.info(`Session created: ${sessionId}`);
    
    // 会话清理
    if (this.options.sessionTimeout) {
      setTimeout(() => {
        this.destroySession(sessionId);
      }, this.options.sessionTimeout);
    }
    
    return session;
  }
  
  getSession(sessionId: string): SessionContext | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }
  
  async destroySession(sessionId: string): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      this.logger.warn(`Session ${sessionId} not found for destruction`);
      return;
    }
    
    this.sessions.delete(sessionId);
    this.logger.info(`Session destroyed: ${sessionId}`);
  }
  
  listSessions(): SessionContext[] {
    return Array.from(this.sessions.values());
  }
  
  // ============ 监控与可观测性 ============
  
  /**
   * 获取错误统计报告
   */
  getErrorReport(): string {
    return globalErrorCollector.exportReport();
  }
  
  /**
   * 获取错误统计
   */
  getErrorStats(): any {
    return globalErrorCollector.getStats();
  }
  
  async healthCheck(): Promise<HealthCheckResult> {
    const memUsage = process.memoryUsage();
    const memoryPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    const health: HealthCheckResult = {
      status: 'healthy',
      timestamp: Date.now(),
      checks: {
        server: {
          status: this.isRunning() ? 'up' : 'down',
          message: `Server is ${this.state}`
        },
        tools: {
          registered: this.tools.size,
          available: this.tools.size
        },
        memory: {
          used: memUsage.heapUsed,
          limit: memUsage.heapTotal,
          percentage: memoryPercentage
        }
      }
    };
    
    // 判断健康状态
    if (this.state === 'ERROR' || this.state === 'FATAL_ERROR') {
      health.status = 'unhealthy';
      health.errors = [this.lastError?.message || 'Unknown error'];
    } else if (memoryPercentage > 80 || this.activeRequests > (this.options.maxConcurrentRequests || 100)) {
      health.status = 'degraded';
    }
    
    return health;
  }
  
  getMetrics(): ServerMetrics {
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.uptime = this.metrics.startTime ? Date.now() - this.metrics.startTime : 0;
    this.metrics.activeConnections = this.sessions.size;
    return { ...this.metrics };
  }
  
  setLogger(logger: Logger): void {
    this.logger = logger;
  }
  
  // ============ 辅助方法 ============
  
  protected generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  protected async waitForActiveRequests(): Promise<void> {
    while (this.activeRequests > 0) {
      this.logger.debug(`Waiting for ${this.activeRequests} active requests to complete`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  protected updateAvgResponseTime(newTime: number): void {
    const count = this.metrics.requestCount;
    const currentAvg = this.metrics.avgResponseTime;
    this.metrics.avgResponseTime = (currentAvg * (count - 1) + newTime) / count;
  }
}