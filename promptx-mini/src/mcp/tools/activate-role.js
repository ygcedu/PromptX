/**
 * 激活角色工具
 */

export const activateRoleTool = {
  name: 'activate_role',
  description: '激活指定的AI角色',
  inputSchema: {
    type: 'object',
    properties: {
      role_name: { type: 'string', description: '角色名称，如：产品经理、架构师、内容专家' }
    },
    required: ['role_name']
  },
  
  async execute(args, agent) {
    return agent.handleRoleActivation(`激活${args.role_name}`)
  }
}