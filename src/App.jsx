import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Library as LibraryIcon, Download, Wrench, FileText, BookOpen, Languages, Sparkles, Dna, Menu, Sun, Moon, PanelLeftClose, X, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Library from '@/pages/Library'
import Collect from '@/pages/Collect'
import PromptBuilder from '@/pages/PromptBuilder'
import Analyzer from '@/pages/Analyzer'
import Dictionary from '@/pages/Dictionary'
import Translator from '@/pages/Translator'
import Scorer from '@/pages/Scorer'
import StyleDNA from '@/pages/StyleDNA'

const NAV = [
  { path: '/library', label: '素材库', icon: LibraryIcon },
  { path: '/collect', label: '快速采集', icon: Download },
  { path: '/builder', label: '组装器', icon: Wrench },
  { path: '/analyzer', label: '文案分析', icon: FileText },
  { path: '/dictionary', label: '词典', icon: BookOpen },
  { path: '/translator', label: '互译', icon: Languages },
  { path: '/scorer', label: '评分', icon: Sparkles },
  { path: '/style-dna', label: 'DNA', icon: Dna },
]

// Bottom tab bar: show first 4 + "more" toggle for rest
const BOTTOM_NAV = NAV.slice(0, 4)
const MORE_NAV = NAV.slice(4)

export default function App() {
  const [dark, setDark] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setMoreOpen(false) }, [location.pathname])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => { if (e.matches) { setMobileOpen(false); setMoreOpen(false) } }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Check if current path is in MORE_NAV
  const isMoreActive = MORE_NAV.some(n => location.pathname === n.path)

  const sidebarContent = (mobile = false) => (
    <>
      <div className="h-14 flex items-center px-4 border-b border-border gap-2">
        <img src="/logo.svg" alt="Pico" className="h-6 w-6 shrink-0" />
        {(mobile || !collapsed) && <span className="font-bold text-lg text-foreground">Pico</span>}
        {mobile ? (
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 hidden md:flex" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <Menu className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <nav className="flex-1 py-2 space-y-1 px-2">
        {NAV.map(n => (
          <NavLink key={n.path} to={n.path} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`
          }>
            <n.icon className="h-4 w-4 shrink-0" />
            {(mobile || !collapsed) && <span>{n.label}</span>}
          </NavLink>
        ))}
      </nav>
    </>
  )

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen bg-background text-foreground">
        {/* Desktop Sidebar */}
        <aside className={`${collapsed ? 'w-16' : 'w-56'} border-r border-border flex-col transition-all duration-200 shrink-0 hidden md:flex`}>
          {sidebarContent(false)}
        </aside>

        {/* Mobile Overlay (hamburger menu - kept as fallback) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex flex-col z-10 animate-in slide-in-from-left duration-200">
              {sidebarContent(true)}
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-border flex items-center px-4 md:px-6 justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white md:hidden">Pico</span>
              <h1 className="text-sm text-muted-foreground hidden md:block">AI 图标提示词工具</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-3 md:p-6 pb-20 md:pb-6">
            <Routes>
              <Route path="/" element={<Navigate to="/library" replace />} />
              <Route path="/library" element={<Library />} />
              <Route path="/collect" element={<Collect />} />
              <Route path="/builder" element={<PromptBuilder />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/dictionary" element={<Dictionary />} />
              <Route path="/translator" element={<Translator />} />
              <Route path="/scorer" element={<Scorer />} />
              <Route path="/style-dna" element={<StyleDNA />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* More panel */}
        {moreOpen && (
          <div className="bg-background border-t border-border px-2 pt-2 pb-1 grid grid-cols-4 gap-1">
            {MORE_NAV.map(n => (
              <NavLink key={n.path} to={n.path} className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs transition-colors ${isActive ? 'text-blue-400 bg-accent' : 'text-muted-foreground'}`
              }>
                <n.icon className="h-4 w-4" />
                <span>{n.label}</span>
              </NavLink>
            ))}
          </div>
        )}
        <nav className="bg-background/95 backdrop-blur-md border-t border-border flex items-stretch safe-bottom">
          {BOTTOM_NAV.map(n => (
            <NavLink key={n.path} to={n.path} className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 text-xs transition-colors ${isActive ? 'text-blue-400' : 'text-muted-foreground'}`
            }>
              <n.icon className="h-5 w-5" />
              <span>{n.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 text-xs transition-colors ${isMoreActive || moreOpen ? 'text-blue-400' : 'text-muted-foreground'}`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>更多</span>
          </button>
        </nav>
      </div>

      <Toaster />
    </div>
  )
}
