#!/usr/bin/env node

/**
 * PromptX Mini 增强版功能测试
 * 测试 DPML 和 Pouch 的核心功能
 */

import { PromptXAgent } from './src/agent.js'

async function testEnhancedFeatures() {
  console.log('🧪 开始测试 PromptX Mini 增强版功能...\n')
  
  const agent = new PromptXAgent()
  
  const testCases = [
    {
      name: 'Pouch发现功能',
      input: '发现',
      description: '测试系统能力发现和PATEOAS导航'
    },
    {
      name: 'DPML资源创建',
      input: '创建资源: thought://test-thinking 这是一个测试思维模式',
      description: '测试DPML资源的动态创建'
    },
    {
      name: 'DPML引用解析',
      input: '解析: @thought://test-thinking',
      description: '测试DPML引用的解析和渲染'
    },
    {
      name: '复杂DPML内容',
      input: '解析: 我的思维方式是 @thought://creative-thinking 结合 @execution://problem-solving',
      description: '测试复杂DPML内容的解析'
    },
    {
      name: 'Pouch状态导航',
      input: '激活产品经理',
      description: '测试角色激活后的状态变化'
    },
    {
      name: '专业咨询与记忆',
      input: '如何设计一个好的用户界面？',
      description: '测试专业咨询和记忆系统集成'
    },
    {
      name: '系统状态查询',
      input: '显示状态',
      description: '测试增强版状态显示'
    }
  ]

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🧪 测试 ${i + 1}/${testCases.length}: ${testCase.name}`)
    console.log(`📝 描述: ${testCase.description}`)
    console.log(`💬 输入: ${testCase.input}`)
    console.log('='.repeat(60))
    
    try {
      await agent.processInput(testCase.input)
      console.log('✅ 测试通过')
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`)
    }
    
    // 等待一秒，让输出更清晰
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 所有测试完成！')
  console.log('='.repeat(60))
  
  // 显示最终状态
  console.log('\n📊 最终系统状态:')
  await agent.processInput('显示状态')
}

// 运行测试
testEnhancedFeatures().catch(console.error)