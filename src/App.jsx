import { useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Library as LibraryIcon, Download, Wrench, FileText, BookOpen, Menu, Sun, Moon, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Library from '@/pages/Library'
import Collect from '@/pages/Collect'
import PromptBuilder from '@/pages/PromptBuilder'
import Analyzer from '@/pages/Analyzer'
import Dictionary from '@/pages/Dictionary'

const NAV = [
  { path: '/library', label: '素材库', icon: LibraryIcon },
  { path: '/collect', label: '快速采集', icon: Download },
  { path: '/builder', label: '提示词组装器', icon: Wrench },
  { path: '/analyzer', label: '文案分析', icon: FileText },
  { path: '/dictionary', label: '提示词词典', icon: BookOpen },
]

export default function App() {
  const [dark, setDark] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen bg-background text-foreground">
        {/* Sidebar */}
        <aside className={`${collapsed ? 'w-16' : 'w-56'} border-r border-border flex flex-col transition-all duration-200 shrink-0`}>
          <div className="h-14 flex items-center px-4 border-b border-border gap-2">
            {!collapsed && <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">PromptForge</span>}
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <Menu className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
          <nav className="flex-1 py-2 space-y-1 px-2">
            {NAV.map(n => (
              <NavLink key={n.path} to={n.path} className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`
              }>
                <n.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{n.label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-border flex items-center px-6 justify-between shrink-0">
            <h1 className="text-sm text-muted-foreground">AI 图标提示词工具</h1>
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/library" replace />} />
              <Route path="/library" element={<Library />} />
              <Route path="/collect" element={<Collect />} />
              <Route path="/builder" element={<PromptBuilder />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/dictionary" element={<Dictionary />} />
            </Routes>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
