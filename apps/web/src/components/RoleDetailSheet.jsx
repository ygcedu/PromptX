import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet'
import { usePromptX } from '../contexts/PromptXContext'

function RoleDetailSheet({ role, isOpen, onClose }) {
  const { fetchRoleDetails } = usePromptX()
  const [roleDetails, setRoleDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 获取角色详情
  useEffect(() => {
    if (role && isOpen) {
      const loadRoleDetails = async () => {
        try {
          setLoading(true)
          setError(null)
          const details = await fetchRoleDetails(role.id, role.source)
          setRoleDetails({
            ...role,
            ...details
          })
        } catch (err) {
          console.error('Failed to load role details:', err)
          setError(err.message)
          // 如果获取失败，使用基本信息
          setRoleDetails({
            ...role,
            prompt: '无法获取角色提示词，请稍后重试。'
          })
        } finally {
          setLoading(false)
        }
      }
      
      loadRoleDetails()
    }
  }, [role, isOpen, fetchRoleDetails])

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setRoleDetails(null)
      setError(null)
      setLoading(false)
    }
  }, [isOpen])

  if (!role) return null
  
  const displayRole = roleDetails || role

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${
              displayRole.source === 'system' 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
            }`}>
              🎭
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-gray-900">{displayRole.name}</SheetTitle>
              <SheetDescription className="text-gray-600">
                {displayRole.description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* 基本信息 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">基本信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">角色 ID</span>
                <span className="font-mono text-sm text-gray-900">{displayRole.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">来源</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  displayRole.source === 'system' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {displayRole.source === 'system' ? '系统角色' : '用户角色'}
                </span>
              </div>
              {displayRole.version && (
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">版本</span>
                  <span className="font-mono text-sm text-gray-900">{displayRole.version}</span>
                </div>
              )}
            </div>
          </div>

          {/* 角色提示词 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">角色提示词</h3>
            <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">正在获取角色提示词...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">获取失败</div>
                  <div className="text-gray-600 text-sm">{error}</div>
                </div>
              ) : (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {displayRole.prompt || '暂无提示词内容'}
                </pre>
              )}
            </div>
          </div>

          {/* 能力标签 */}
          {displayRole.capabilities && displayRole.capabilities.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">能力标签</h3>
              <div className="flex flex-wrap gap-2">
                {displayRole.capabilities.map((capability, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 使用示例 */}
          {displayRole.examples && displayRole.examples.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">使用示例</h3>
              <div className="space-y-3">
                {displayRole.examples.map((example, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{example}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 激活命令 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">激活命令</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <code className="text-green-400 text-sm font-mono">
                {displayRole.activateCommand || `action("${displayRole.id}")`}
              </code>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default RoleDetailSheet