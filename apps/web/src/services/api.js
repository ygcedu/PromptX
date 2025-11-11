// API service for PromptX MCP Server integration

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8848'

// Debug environment variables
console.log('🔧 API Configuration:')
console.log('- API_BASE_URL:', API_BASE_URL)
console.log('- Mode: Real MCP Server Data')



class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log(`🚀 Making API request to: ${url}`)
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`✅ API request successful: ${endpoint}`)
      return data
    } catch (error) {
      console.error(`❌ API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Get system status from MCP server
  async getStatus() {
    return this.request('/status')
  }

  // Get health check
  async getHealth() {
    return this.request('/health')
  }

  // Get current configuration
  getConfig() {
    return {
      baseURL: this.baseURL,
      mode: 'real-server'
    }
  }
}

// Create singleton instance
const apiService = new ApiService()

export default apiService

// Named exports for specific functions
export const getStatus = () => apiService.getStatus()
export const getHealth = () => apiService.getHealth()
export const getApiConfig = () => apiService.getConfig()