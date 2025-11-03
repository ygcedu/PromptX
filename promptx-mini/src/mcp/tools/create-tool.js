/**
 * 创建工具工具
 */

export const createToolTool = {
  name: 'create_tool',
  description: '创建新的自定义工具',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '工具名称，如：随机选择器' },
      description: { type: 'string', description: '工具描述，如：从多个选项中随机选择一个' }
    },
    required: ['name', 'description']
  },
  
  async execute(args, agent) {
    return agent.handleToolCreation(`创建工具：${args.name}，${args.description}`)
  }
}