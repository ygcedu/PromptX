/**
 * 创建角色工具
 */

export const createRoleTool = {
  name: 'create_role',
  description: '创建新的AI角色',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '角色名称，如：数据分析师' },
      description: { type: 'string', description: '角色描述，如：专门分析数据和制作报表' }
    },
    required: ['name', 'description']
  },
  
  async execute(args, agent) {
    return agent.handleRoleCreation(`创建角色：${args.name}，${args.description}`)
  }
}