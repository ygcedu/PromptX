import { createContext, useContext, useReducer, useEffect } from 'react'
import apiService from '../services/api'

// 初始状态
const initialState = {
  // 加载状态
  loading: true,
  error: null,
  lastUpdated: null,
  
  // 服务状态
  service: null,
  environment: null,
  metrics: null,
  workerPool: null,
  mcpTools: null,
  
  // PromptX 资源
  roles: {
    system: [],
    project: [],
    user: []
  },
  tools: {
    system: [],
    project: [],
    user: []
  },
  summary: {
    totalRoles: 0,
    totalTools: 0,
    system: 0,
    user: 0,
    systemTools: 0,
    userTools: 0,
    projectRoles: 0,
    projectTools: 0
  }
}

// Action 类型
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DATA: 'SET_DATA',
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// Reducer
function promptxReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error
      }
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    
    case ACTIONS.SET_DATA:
      return {
        ...state,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
        ...action.payload
      }
    
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

// Context
const PromptXContext = createContext()

// Provider 组件
export function PromptXProvider({ children }) {
  const [state, dispatch] = useReducer(promptxReducer, initialState)

  // 获取状态数据
  const fetchStatus = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      console.log('🚀 Fetching PromptX status...')
      const data = await apiService.getStatus()
      console.log('✅ PromptX status fetched successfully:', data)
      
      // 解构数据
      const {
        service,
        environment,
        metrics,
        workerPool,
        mcpTools,
        promptxResources
      } = data
      
      dispatch({
        type: ACTIONS.SET_DATA,
        payload: {
          service,
          environment,
          metrics,
          workerPool,
          mcpTools,
          roles: promptxResources?.roles || initialState.roles,
          tools: promptxResources?.tools || initialState.tools,
          summary: promptxResources?.summary || initialState.summary
        }
      })
    } catch (error) {
      console.error('❌ Failed to fetch PromptX status:', error)
      
      let errorMessage = 'Failed to fetch data'
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to PromptX MCP Server. Please check if the server is running.'
      } else if (error.message.includes('HTTP error')) {
        errorMessage = `Server error: ${error.message}`
      } else {
        errorMessage = error.message || 'Unknown error occurred'
      }
      
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: errorMessage
      })
    }
  }

  // 清除错误
  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR })
  }

  // 获取角色详情
  const fetchRoleDetails = async (roleId, source = 'system') => {
    try {
      console.log(`🎭 Fetching role details for: ${roleId}`)
      const roleDetails = await apiService.getRoleDetails(roleId, source)
      console.log('✅ Role details fetched successfully:', roleDetails)
      return roleDetails
    } catch (error) {
      console.error('❌ Failed to fetch role details:', error)
      throw error
    }
  }

  // 刷新数据
  const refresh = () => {
    fetchStatus()
  }

  // 初始化数据获取
  useEffect(() => {
    fetchStatus()
  }, [])

  // Context 值
  const value = {
    // 状态
    ...state,
    
    // 方法
    refresh,
    clearError,
    fetchRoleDetails,
    
    // 便捷访问器
    isLoading: state.loading,
    hasError: !!state.error,
    isReady: !state.loading && !state.error && state.lastUpdated,
    
    // 统计数据
    stats: {
      totalRoles: state.summary.totalRoles,
      totalTools: state.summary.totalTools,
      systemRoles: state.summary.system,
      userRoles: state.summary.user,
      systemTools: state.summary.systemTools,
      userTools: state.summary.userTools,
      projectRoles: state.summary.projectRoles,
      projectTools: state.summary.projectTools
    }
  }

  return (
    <PromptXContext.Provider value={value}>
      {children}
    </PromptXContext.Provider>
  )
}

// Hook
export function usePromptX() {
  const context = useContext(PromptXContext)
  if (!context) {
    throw new Error('usePromptX must be used within a PromptXProvider')
  }
  return context
}

export default PromptXContext