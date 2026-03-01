import { useState, useEffect } from 'react'
import { getLibrary, deleteFromLibrary } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Grid3X3, List, Search, Trash2, Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function Library() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
  const [selected, setSelected] = useState(null)

  useEffect(() => { setItems(getLibrary()) }, [])

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    return !q || i.title.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q)) || i.source?.toLowerCase().includes(q)
  })

  const handleDelete = (id) => {
    setItems(deleteFromLibrary(id))
    setSelected(null)
    toast.success('已删除')
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索标题、标签、来源..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 ml-auto">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}><Grid3X3 className="h-4 w-4" /></Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelected(item)}>
              <div className="h-32 rounded-t-lg" style={{ background: item.thumbnail || 'linear-gradient(135deg, #667eea, #764ba2)' }} />
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {item.tags?.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
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
                <div className="h-12 w-12 rounded-md shrink-0" style={{ background: item.thumbnail || 'linear-gradient(135deg, #667eea, #764ba2)' }} />
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="h-40 rounded-lg my-2" style={{ background: selected.thumbnail }} />
              <div className="flex flex-wrap gap-1 mb-3">
                {selected.tags?.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
              <Separator />
              <div className="space-y-3 mt-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">提示词</div>
                  <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{selected.prompt}</div>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => copyText(selected.prompt)}>
                    <Copy className="h-3 w-3 mr-1" />复制
                  </Button>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">结构拆解</div>
                  <div className="text-sm bg-muted p-3 rounded-md">{selected.structure}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">模板</div>
                  <div className="text-sm bg-muted p-3 rounded-md font-mono text-xs">{selected.template}</div>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => copyText(selected.template)}>
                    <Copy className="h-3 w-3 mr-1" />复制模板
                  </Button>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">来源: {selected.source} · {selected.date}</span>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selected.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />删除
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
