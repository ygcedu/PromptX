import { Routes, Route } from 'react-router-dom'
import { PromptXProvider } from './contexts/PromptXContext'
import Layout from './components/Layout'
import ApiStatus from './components/Debug/ApiStatus'
import Home from './pages/Home'
import Roles from './pages/Roles'
import Tools from './pages/Tools'
import Status from './pages/Status'
import './App.css'

function App() {
  return (
    <PromptXProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/status" element={<Status />} />
        </Routes>
      </Layout>
      <ApiStatus />
    </PromptXProvider>
  )
}

export default App