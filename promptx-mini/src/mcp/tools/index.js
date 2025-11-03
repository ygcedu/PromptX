/**
 * MCP 工具注册器
 * 
 * 自动导入所有工具并提供统一的注册接口
 */

import { createRoleTool } from './create-role.js'
import { createToolTool } from './create-tool.js'
import { activateRoleTool } from './activate-role.js'
import { calculateTool } from './calculate.js'
import { analyzeTextTool } from './analyze-text.js'
import { useToolTool } from './use-tool.js'
import { getStatusTool } from './get-status.js'
import { getHelpTool } from './get-help.js'
import { expertConsultationTool } from './expert-consultation.js'
import { memorySearchTool } from './memory-search.js'

// 所有可用工具
export const allTools = [
  createRoleTool,
  createToolTool,
  activateRoleTool,
  calculateTool,
  analyzeTextTool,
  useToolTool,
  getStatusTool,
  getHelpTool,
  expertConsultationTool,
  memorySearchTool
]

// 工具映射表（按名称快速查找）
export const toolMap = new Map(
  allTools.map(tool => [tool.name, tool])
)

/**
 * 获取工具列表（用于 ListToolsRequestSchema）
 */
export function getToolList() {
  return allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }))
}

/**
 * 执行工具（用于 CallToolRequestSchema）
 */
export async function executeTool(name, args, agent) {
  const tool = toolMap.get(name)
  
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`)
  }
  
  try {
    const result = await tool.execute(args, agent)
    return {
      content: [{ type: 'text', text: result }]
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `❌ 错误: ${error.message}` }],
      isError: true
    }
  }
}