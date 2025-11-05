import type { ToolWithHandler } from '~/interfaces/MCPServer.js';
import { MCPOutputAdapter } from '~/utils/MCPOutputAdapter.js';

const outputAdapter = new MCPOutputAdapter();

/**
 * Discover 工具 - 展示所有可用的AI专业角色和工具
 *
 * 为AI提供完整的专业服务选项清单，包括可激活的角色和可调用的工具。
 */
export const discoverTool: ToolWithHandler = {
  name: 'discover',
  description: `🎯 [探索AI潜能] 发现你的AI可以成为什么 - 探索可用角色与工具
为AI提供完整的专业服务选项清单，包括可激活的角色和可调用的工具。

【规范名称】promptx_discover
【调用说明】在提示词中使用 promptx_discover，实际调用时自动映射到 mcp__[server]__discover

何时使用此工具:
- 初次进入项目了解可用的角色和工具
- 需要专业能力但不知道有哪些角色可选
- 寻找合适的工具来完成特定任务
- 想要了解系统级、用户级资源
- 不确定该激活什么角色或使用什么工具
- 定期查看新增的角色和工具
- 当创建了新的角色和工具时，需要发现刚被创建的资源

核心展示内容:
- 所有可激活的专业角色（按来源分组）
- 所有可调用的功能工具（附带使用手册）
- 系统级资源（📦 来自PromptX核心）
- 用户级资源（👤 用户自定义）
- 资源统计和快速索引

重要提示:
⚠️ 项目级资源需要先使用 project 工具绑定项目目录才能发现
- 如果需要项目特有的角色和工具，请先调用 project 工具
- project 工具会自动扫描并注册项目的 .promptx/resource 目录

资源来源说明:
- 📦 系统角色/工具：PromptX内置的通用资源
- 🏗️ 项目角色/工具：需先用project工具激活（位于项目的.promptx/resource）
- 👤 用户角色/工具：用户自定义创建的资源

你应该:
1. 如果在项目中工作，先用project工具绑定项目，再用discover查看所有资源
2. 根据任务需求选择合适的角色激活
3. 发现工具后通过manual链接学习使用方法
4. 记住常用角色ID和工具名便于快速调用
5. 为用户推荐最适合当前任务的角色或工具
6. 关注新增资源（特别是项目级和用户级）
7. 理解不同来源资源的优先级和适用场景
8. 工具使用前必须先learn其manual文档

聚焦参数说明:
- 'all' (默认): 展示所有资源
- 'roles': 仅展示可激活的角色
- 'tools': 仅展示可用的工具`,
  inputSchema: {
    type: 'object',
    properties: {
      focus: {
        type: 'string',
        description: "聚焦范围：'all'(所有)、'roles'(角色)或'tools'(工具)",
        enum: ['all', 'roles', 'tools'],
        default: 'all'
      }
    }
  },
  handler: async (args: { focus: string }) => {
    // 动态导入 @promptx/core
    const core = await import('@promptx/core');
    const coreExports = core.default || core;

    // 获取 cli 对象
    const cli = (coreExports as any).cli || (coreExports as any).pouch?.cli;

    if (!cli || !cli.execute) {
      throw new Error('CLI not available in @promptx/core');
    }

    // 执行 discover 命令
    const result = await cli.execute('discover', [args.focus]);

    // 使用 OutputAdapter 格式化输出
    return outputAdapter.convertToMCPFormat(result);
  }
};
