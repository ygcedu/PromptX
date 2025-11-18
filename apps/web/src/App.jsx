import { Routes, Route, Navigate } from 'react-router-dom'
import { PromptXProvider } from './contexts/PromptXContext'
import Layout from './components/Layout'
import Roles from './pages/Roles'
import Tools from './pages/Tools'
import Status from './pages/Status'
import FileManagerPage from './pages/FileManagerPage'
import './App.css'

function App() {
  return (
    <PromptXProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/roles" replace />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/status" element={<Status />} />
          <Route path="/files" element={<FileManagerPage />} />
        </Routes>
      </Layout>
    </PromptXProvider>
  )
}

export default App