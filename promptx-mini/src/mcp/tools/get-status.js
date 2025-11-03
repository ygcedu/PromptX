/**
 * 获取状态工具
 */

export const getStatusTool = {
  name: 'get_status',
  description: '获取系统状态信息',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  
  async execute(args, agent) {
    return agent.handleStatusQuery()
  }
}