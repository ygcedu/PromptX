# PromptX Mini MCP Server

PromptX Mini 的 MCP (Model Context Protocol) 服务器实现，让大模型可以通过标准协议调用 PromptX Mini 的所有功能。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd promptx-mini
npm install
```

### 2. 启动 MCP 服务器

```bash
# 启动 MCP 服务器
npm run mcp

# 或者开发模式（自动重启）
npm run mcp:dev
```

服务器将在 `http://127.0.0.1:8080` 启动。

### 3. 健康检查

访问 `http://127.0.0.1:8080/health` 查看服务器状态。

## 🔧 可用工具

MCP 服务器暴露了以下工具，大模型可以直接调用：

### 角色管理

- **`create_role`** - 创建新的AI角色
  - `name`: 角色名称（如：数据分析师）
  - `description`: 角色描述（如：专门分析数据和制作报表）

- **`activate_role`** - 激活指定角色
  - `role_name`: 角色名称（如：产品经理、架构师、内容专家）

### 工具执行

- **`calculate`** - 数学计算
  - `expression`: 数学表达式（如：2+3*4, (100*0.05)+50）

- **`analyze_text`** - 文本分析
  - `text`: 要分析的文本内容

- **`create_tool`** - 创建自定义工具
  - `name`: 工具名称
  - `description`: 工具描述

### 专业咨询

- **`expert_consultation`** - 基于当前角色的专业建议
  - `question`: 要咨询的专业问题

### 系统状态

- **`get_status`** - 获取系统状态
  - 无参数，返回当前角色、记忆统计、可用工具等信息

## 📡 MCP 协议支持

- ✅ **StreamableHTTPServerTransport** - HTTP JSON-RPC + SSE
- ❌ **StdioServerTransport** - 不支持（按需求设计）

## 🌟 使用示例

### 通过 MCP 客户端调用

```javascript
// 创建角色
await mcpClient.callTool('create_role', {
  name: '数据分析师',
  description: '专门分析数据和制作报表的专家'
})

// 激活角色
await mcpClient.callTool('activate_role', {
  role_name: '数据分析师'
})

// 专业咨询
await mcpClient.callTool('expert_consultation', {
  question: '如何分析用户留存率数据？'
})

// 计算
await mcpClient.callTool('calculate', {
  expression: '(100 * 0.05) + 50'
})

// 文本分析
await mcpClient.callTool('analyze_text', {
  text: '人工智能正在改变我们的生活方式'
})
```

### 与大模型集成

配置大模型客户端（如 Claude Desktop、Cursor 等）连接到：
- **URL**: `http://127.0.0.1:8080/mcp`
- **Transport**: `StreamableHTTPServerTransport`

## 🏗️ 架构设计

```
大模型客户端
    ↓ MCP Protocol (HTTP)
PromptX Mini MCP Server
    ↓ 内部调用
PromptX Agent
    ├── 🧠 Memory System
    ├── 🎭 Role System  
    └── 🔧 Tool System
```

## 🔧 配置选项

```javascript
import { startMCPServer } from './src/mcp.js'

await startMCPServer({
  port: 8080,           // 服务器端口
  host: '127.0.0.1',    // 服务器地址
  name: 'promptx-mini', // 服务器名称
  version: '1.0.0'      // 服务器版本
})
```

## 🚦 状态码

- **200** - 成功
- **400** - 请求错误（缺少 session ID 等）
- **500** - 服务器内部错误

## 📝 日志

服务器会输出详细的日志信息：
- 🚀 服务器启动/停止
- 📨 MCP 请求处理
- 🔧 工具执行
- 🎭 角色操作
- ❌ 错误信息

## 🔄 会话管理

MCP 服务器支持多个并发会话：
- 每个会话有独立的 `session-id`
- 会话状态自动管理
- 支持会话重连

## 🛠️ 开发说明

### 文件结构
```
promptx-mini/
├── src/
│   ├── mcp.js      # MCP 服务器实现
│   ├── agent.js    # PromptX Agent
│   ├── memory.js   # 记忆系统
│   ├── role.js     # 角色系统
│   └── tool.js     # 工具系统
├── package.json
└── MCP_README.md
```

### 扩展工具

要添加新的 MCP 工具：

1. 在 `createMCPServer()` 的工具列表中添加工具定义
2. 在 `executeTool()` 中添加处理逻辑
3. 在 Agent 中实现具体功能（如需要）

### 调试

```bash
# 启动时查看详细日志
DEBUG=* npm run mcp

# 测试健康检查
curl http://127.0.0.1:8080/health
```

## 🎯 设计原则

1. **极简实现** - 最少的代码实现最核心的功能
2. **标准协议** - 完全兼容 MCP 规范
3. **易于扩展** - 简单的架构便于添加新功能
4. **开箱即用** - 无需复杂配置即可启动

## 🔗 相关链接

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [PromptX 项目](https://github.com/deepractice/PromptX)