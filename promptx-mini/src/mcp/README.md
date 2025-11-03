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

### 3. 验证服务器

```bash
# 健康检查
curl http://127.0.0.1:8080/health

# 服务器信息
curl http://127.0.0.1:8080/

# MCP 端点信息
curl http://127.0.0.1:8080/mcp
```

## 🔧 可用工具

MCP 服务器暴露了以下工具，大模型可以直接调用：

### 角色管理

- **`create_role`** - 创建新的AI角色
  - `name`: 角色名称（如：数据分析师）
  - `description`: 角色描述（如：专门分析数据和制作报表）

- **`activate_role`** - 激活指定角色
  - `role_name`: 角色名称（如：产品经理、架构师、内容专家）

### 工具管理

- **`create_tool`** - 创建自定义工具
  - `name`: 工具名称
  - `description`: 工具描述

- **`use_tool`** - 使用指定工具
  - `tool_name`: 工具名称
  - `parameters`: 工具参数（逗号分隔）

### 内置功能

- **`calculate`** - 数学计算
  - `expression`: 数学表达式（如：2+3*4, (100*0.05)+50）

- **`analyze_text`** - 文本分析
  - `text`: 要分析的文本内容

### 专业咨询

- **`expert_consultation`** - 基于当前角色的专业建议
  - `question`: 要咨询的专业问题

### 系统功能

- **`get_status`** - 获取系统状态
  - 无参数，返回当前角色、记忆统计、可用工具等信息

- **`get_help`** - 获取帮助信息
  - 无参数，返回详细的使用指南

- **`memory_search`** - 记忆系统搜索
  - `query`: 搜索关键词
  - `max_results`: 最大结果数（可选，默认3）

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

// 获取系统状态
await mcpClient.callTool('get_status', {})
```

### 与大模型集成

配置大模型客户端（如 Claude Desktop、Cursor 等）连接到：
- **URL**: `http://127.0.0.1:8080/mcp`
- **Transport**: `StreamableHTTPServerTransport`

## 🏗️ 架构设计

```
大模型客户端
    ↓ MCP Protocol (HTTP)
PromptX Mini MCP Server (src/mcp/index.js)
    ↓ 工具调用
MCP Tools (src/mcp/tools/)
    ↓ 内部调用
PromptX Agent (src/agent.js)
    ├── 🧠 Memory System (src/memory.js)
    ├── 🎭 Role System (src/role.js)
    └── 🔧 Tool System (src/tool.js)
```

## 📁 目录结构

```
promptx-mini/src/mcp/
├── index.js              # MCP 服务器主文件
├── README.md             # 本文档
└── tools/                # MCP 工具定义
    ├── index.js          # 工具注册器
    ├── create-role.js    # 创建角色工具
    ├── activate-role.js  # 激活角色工具
    ├── calculate.js      # 计算工具
    ├── analyze-text.js   # 文本分析工具
    ├── use-tool.js       # 使用工具工具
    ├── get-status.js     # 获取状态工具
    ├── get-help.js       # 获取帮助工具
    ├── expert-consultation.js # 专家咨询工具
    ├── memory-search.js  # 记忆搜索工具
    └── create-tool.js    # 创建工具工具
```

## 🔧 配置选项

```javascript
// 环境变量配置
PORT=8080                 // 服务器端口
HOST=127.0.0.1           // 服务器地址

// 或在代码中配置
const port = process.env.PORT || 8080
const host = '127.0.0.1'
```

## 🚦 API 端点

- **GET /** - 服务器信息和工具列表
- **GET /health** - 健康检查
- **GET /mcp** - MCP 端点信息
- **POST /mcp** - MCP 协议请求处理

## 📝 日志

服务器会输出详细的日志信息：
- 🚀 服务器启动/停止
- 📨 MCP 请求处理
- 📋 工具列表查询
- 🔧 工具执行
- ❌ 错误信息

## 🛠️ 开发说明

### 添加新工具

1. 在 `tools/` 目录创建新工具文件：

```javascript
// tools/my-new-tool.js
export const myNewTool = {
  name: 'my_new_tool',
  description: '我的新工具',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: '参数1' }
    },
    required: ['param1']
  },
  
  async execute(args, agent) {
    // 工具逻辑
    return `处理结果: ${args.param1}`
  }
}
```

2. 在 `tools/index.js` 中注册：

```javascript
import { myNewTool } from './my-new-tool.js'

export const allTools = [
  // ... 其他工具
  myNewTool
]
```

3. 重启服务器即可使用

### 调试

```bash
# 启动时查看详细日志
npm run mcp:dev

# 测试工具调用
curl -X POST http://127.0.0.1:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list"}'
```

## 🎯 设计原则

1. **模块化架构** - 每个工具都是独立模块
2. **标准协议** - 完全兼容 MCP 规范
3. **易于扩展** - 简单的工具注册机制
4. **开箱即用** - 无需复杂配置即可启动

## 🔗 相关链接

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [PromptX 项目](https://github.com/deepractice/PromptX)

## 🚨 注意事项

1. **端口占用** - 确保 8080 端口未被占用
2. **依赖安装** - 需要先运行 `npm install`
3. **Node.js 版本** - 需要 Node.js 18+ 支持 ES 模块
4. **网络访问** - 确保防火墙允许 8080 端口访问