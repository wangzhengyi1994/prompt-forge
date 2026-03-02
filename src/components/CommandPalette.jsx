import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Library as LibraryIcon, Download, Wrench, FileText, BookOpen, Languages, Sparkles, Dna, Search } from 'lucide-react'
import { getLibrary } from '@/lib/store'

const PAGES = [
  { path: '/library', label: '素材库', icon: LibraryIcon, keywords: '素材 library collection' },
  { path: '/collect', label: '快速采集', icon: Download, keywords: '采集 collect import' },
  { path: '/builder', label: '提示词组装器', icon: Wrench, keywords: '组装 builder assemble' },
  { path: '/analyzer', label: '文案分析', icon: FileText, keywords: '分析 analyze copy' },
  { path: '/dictionary', label: '关键词词典', icon: BookOpen, keywords: '词典 dictionary keyword' },
  { path: '/translator', label: '中英互译', icon: Languages, keywords: '翻译 translate' },
  { path: '/scorer', label: '提示词评分', icon: Sparkles, keywords: '评分 score rate' },
  { path: '/style-dna', label: '风格DNA', icon: Dna, keywords: 'DNA style 风格' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const libraryItems = useMemo(() => {
    if (!open) return []
    return getLibrary().slice(0, 20)
  }, [open])

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const go = (path) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="快速跳转" description="搜索页面或素材">
      <CommandInput placeholder="搜索页面、素材..." />
      <CommandList>
        <CommandEmpty>没有找到结果</CommandEmpty>
        <CommandGroup heading="页面">
          {PAGES.map(p => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} keywords={[p.keywords]}>
              <p.icon className="h-4 w-4 mr-2 shrink-0" />
              <span>{p.label}</span>
              {p.path === '/library' && <CommandShortcut>⌘1</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
        {libraryItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="素材库">
              {libraryItems.map(item => (
                <CommandItem key={item.id} onSelect={() => go('/library')} keywords={[item.tags?.join(' ') || '', item.title]}>
                  <Search className="h-3 w-3 mr-2 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item.title}</span>
                  <CommandShortcut>{item.source}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
