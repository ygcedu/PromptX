/**
 * 使用工具工具
 */

export const useToolTool = {
  name: 'use_tool',
  description: '使用指定的工具',
  inputSchema: {
    type: 'object',
    properties: {
      tool_name: { type: 'string', description: '工具名称' },
      parameters: { type: 'string', description: '工具参数，多个参数用逗号分隔' }
    },
    required: ['tool_name', 'parameters']
  },
  
  async execute(args, agent) {
    return agent.handleGenericToolUsage(`使用${args.tool_name}: ${args.parameters}`)
  }
}