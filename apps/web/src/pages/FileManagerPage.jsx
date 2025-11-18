import React, { useState } from 'react'
import FileManager from '../components/FileManager.jsx'
import WebDAVTest from '../components/WebDAVTest.jsx'

const FileManagerPage = () => {
  const [activeTab, setActiveTab] = useState('manager')

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        {/* 标签页导航 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('manager')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manager'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                文件管理器
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'test'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                连接测试
              </button>
            </nav>
          </div>
        </div>

        {/* 标签页内容 */}
        {activeTab === 'manager' && <FileManager />}
        {activeTab === 'test' && <WebDAVTest />}
      </div>
    </div>
  )
}

export default FileManagerPage