import { copyToClipboard } from '@/lib/clipboard'
import { useState, useEffect } from 'react'
import { getLibrary, deleteFromLibrary, saveLibrary, exportLibrary, importLibrary } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Grid3X3, List, Search, Trash2, Copy, Check, Pencil, X, Tag, Layers, FileText, LayoutTemplate, Plus, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'

const TABS = [
  { key: 'prompt', label: '提示词', icon: FileText },
  { key: 'structure', label: '结构拆解', icon: Layers },
  { key: 'template', label: '模板', icon: LayoutTemplate },
]

function DetailDialog({ item, onClose, onDelete, onUpdate }) {
  const [tab, setTab] = useState('prompt')
  const [copied, setCopied] = useState(null)
  const [editingTags, setEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(item?.tags || [])
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [promptDraft, setPromptDraft] = useState('')

  useEffect(() => {
    if (item) {
      setTags(item.tags || [])
      setEditingTags(false)
      setEditingPrompt(false)
      setTab('prompt')
    }
  }, [item?.id])

  if (!item) return null

  const copyText = (text, key) => {
    copyToClipboard(text)
    setCopied(key)
    toast.success('已复制到剪贴板')
    setTimeout(() => setCopied(null), 1500)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || tags.includes(t)) return
    const newTags = [...tags, t]
    setTags(newTags)
    setTagInput('')
    onUpdate({ ...item, tags: newTags })
  }

  const removeTag = (t) => {
    const newTags = tags.filter(x => x !== t)
    setTags(newTags)
    onUpdate({ ...item, tags: newTags })
  }

  const savePrompt = () => {
    onUpdate({ ...item, prompt: promptDraft })
    setEditingPrompt(false)
    toast.success('提示词已更新')
  }

  const tabContent = {
    prompt: (
      <div className="space-y-3">
        {editingPrompt ? (
          <>
            <Textarea value={promptDraft} onChange={e => setPromptDraft(e.target.value)} rows={5} className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={savePrompt}>保存</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingPrompt(false)}>取消</Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap leading-relaxed select-text">{item.prompt}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyText(item.prompt, 'prompt')}>
                {copied === 'prompt' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied === 'prompt' ? '已复制' : '复制'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setPromptDraft(item.prompt); setEditingPrompt(true) }}>
                <Pencil className="h-3 w-3 mr-1" />编辑
              </Button>
            </div>
          </>
        )}
      </div>
    ),
    structure: (
      <div className="space-y-3">
        <div className="grid gap-2">
          {item.structure?.split(' | ').map((s, i) => {
            const [k, v] = s.split(': ')
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-16 shrink-0 text-right">{k}</span>
                <span className="bg-muted px-3 py-1.5 rounded-md flex-1">{v}</span>
              </div>
            )
          })}
        </div>
        <Button variant="outline" size="sm" onClick={() => copyText(item.structure, 'structure')}>
          {copied === 'structure' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied === 'structure' ? '已复制' : '复制结构'}
        </Button>
      </div>
    ),
    template: (
      <div className="space-y-3">
        <div className="text-sm bg-muted p-4 rounded-lg font-mono leading-relaxed select-text">
          {item.template?.split(/(\{[^}]+\})/).map((part, i) =>
            part.startsWith('{') ? (
              <span key={i} className="text-blue-400 bg-blue-500/10 px-1 rounded">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => copyText(item.template, 'template')}>
          {copied === 'template' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied === 'template' ? '已复制' : '复制模板'}
        </Button>
      </div>
    ),
  }

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto p-0">
        {/* Header with gradient */}
        <div className="h-36 rounded-t-lg relative" style={
          item.thumbnail?.startsWith('http') || item.thumbnail?.startsWith('/api/')
            ? { backgroundImage: `url(${item.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: item.thumbnail || 'linear-gradient(135deg, #667eea, #764ba2)' }
        }>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <DialogHeader>
              <DialogTitle className="text-xl text-white drop-shadow-md">{item.title}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
              <span>{item.source}</span>
              <span>·</span>
              <span>{item.date}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {tags.map(t => (
              <Badge key={t} variant="secondary" className="text-xs gap-1">
                {t}
                {editingTags && (
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(t)} />
                )}
              </Badge>
            ))}
            {editingTags ? (
              <div className="flex items-center gap-1">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="新标签"
                  className="h-6 w-24 text-xs"
                />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addTag}><Plus className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTags(false)}><Check className="h-3 w-3" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTags(true)}>
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Images gallery */}
          {item.images?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">图片素材 ({item.images.length})</div>
              <div className="flex flex-wrap gap-2">
                {item.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                    <img src={img} alt="" className="h-20 w-20 object-cover rounded-md border hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Tabs */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tabContent[tab]}

          <Separator />

          {/* Footer */}
          <div className="flex justify-end">
            <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-3 w-3 mr-1" />删除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function Library() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
  const [selected, setSelected] = useState(null)
  const fileInputRef = useState(null)

  useEffect(() => { setItems(getLibrary()) }, [])

  const handleExport = () => {
    const count = exportLibrary()
    toast.success(`已导出 ${count} 条素材`)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importLibrary(file)
      setItems(getLibrary())
      toast.success(`导入完成: 新增 ${result.added} 条, 跳过 ${result.skipped} 条重复`)
    } catch (err) {
      toast.error(`导入失败: ${err.message}`)
    }
    e.target.value = ''
  }

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    return !q || i.title.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q)) || i.source?.toLowerCase().includes(q)
  })

  const handleDelete = (id) => {
    setItems(deleteFromLibrary(id))
    setSelected(null)
    toast.success('已删除')
  }

  const handleUpdate = (updated) => {
    const newItems = items.map(i => i.id === updated.id ? updated : i)
    setItems(newItems)
    setSelected(updated)
    saveLibrary(newItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索标题、标签、来源..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 ml-auto">
          <input type="file" accept=".json" className="hidden" id="import-file" onChange={handleImport} />
          <Button variant="ghost" size="sm" onClick={() => document.getElementById('import-file').click()} title="导入素材">
            <Upload className="h-4 w-4 mr-1" /><span className="hidden sm:inline">导入</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport} title="导出素材">
            <Download className="h-4 w-4 mr-1" /><span className="hidden sm:inline">导出</span>
          </Button>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
              if (confirm('确定清空所有素材？此操作不可恢复')) { saveLibrary([]); setItems([]); toast.success('已清空') }
            }} title="清空素材库">
              <Trash2 className="h-4 w-4 mr-1" /><span className="hidden sm:inline">清空</span>
            </Button>
          )}
          <div className="w-px bg-border mx-1" />
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}><Grid3X3 className="h-4 w-4" /></Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => setSelected(item)}>
              <div className="h-32 rounded-t-lg relative overflow-hidden" style={
                item.thumbnail?.startsWith('http') || item.thumbnail?.startsWith('/api/')
                  ? { backgroundImage: `url(${item.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: item.thumbnail || 'linear-gradient(135deg, #667eea, #764ba2)' }
              }>
                {item.images?.length > 1 && (
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">{item.images.length}张</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm truncate">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {item.tags?.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  {item.tags?.length > 3 && <Badge variant="outline" className="text-xs">+{item.tags.length - 3}</Badge>}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span>{item.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelected(item)}>
              <div className="flex items-center p-4 gap-4">
                <div className="h-12 w-12 rounded-md shrink-0" style={
                  item.thumbnail?.startsWith('http') || item.thumbnail?.startsWith('/api/')
                    ? { backgroundImage: `url(${item.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: item.thumbnail || 'linear-gradient(135deg, #667eea, #764ba2)' }
                } />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="flex gap-1 mt-1">
                    {item.tags?.slice(0, 4).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">{item.date}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && <div className="text-center text-muted-foreground py-12">暂无数据</div>}

      <DetailDialog
        item={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
