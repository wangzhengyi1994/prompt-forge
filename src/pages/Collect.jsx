import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { addToLibrary } from '@/lib/store'
import { Loader2, Download, Save, Plus, X, Plug, ClipboardPaste, FileText, Layers, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Collect() {
  // paste collect
  const [pasteText, setPasteText] = useState('')
  const [pasteLoading, setPasteLoading] = useState(false)
  const [pasteResult, setPasteResult] = useState(null)
  // manual
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [notes, setNotes] = useState('')
  // batch
  const [batchText, setBatchText] = useState('')
  const [batchItems, setBatchItems] = useState([])
  const [batchSaved, setBatchSaved] = useState(new Set())
  // extension
  const [extData, setExtData] = useState(null)

  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'PROMPTFORGE_COLLECT' && event.data?.data) {
        setExtData(event.data.data)
        toast.success('收到插件采集数据')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handlePasteCollect = async () => {
    if (!pasteText.trim()) return
    setPasteLoading(true)
    try {
      // Try local API first, fallback to client-side parsing
      const apiBase = import.meta.env.VITE_COLLECT_API || ''
      let data
      try {
        const resp = await fetch(`${apiBase}/api/collect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pasteText.trim() }),
        })
        data = await resp.json()
        if (!resp.ok) throw new Error(data.error)
      } catch {
        // Fallback: client-side parse
        const lines = pasteText.trim().split('\n').filter(Boolean)
        const tagMatches = pasteText.match(/#([^#\s]+)/g)
        data = {
          title: lines[0] || '',
          content: lines.slice(1).join('\n').trim() || lines[0] || '',
          tags: tagMatches ? tagMatches.map(t => t.replace('#', '')) : [],
          images: [],
          source: '小红书',
        }
      }
      setPasteResult(data)
      toast.success('解析完成')
    } finally {
      setPasteLoading(false)
    }
  }

  const saveData = (data, resetFn) => {
    if (!data) return
    addToLibrary({
      title: data.title || '未命名',
      prompt: data.content || data.prompt || '',
      tags: data.tags || [],
      source: data.source || '采集',
      structure: '自动采集',
      template: data.content || data.prompt || '',
      thumbnail: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    })
    toast.success('已保存到素材库')
    resetFn?.()
  }

  const parseBatch = () => {
    if (!batchText.trim()) return
    const blocks = batchText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    const items = blocks.map((block, i) => {
      const lines = block.split('\n').filter(Boolean)
      const tagMatches = block.match(/#([^#\s]+)/g)
      const contentLines = lines.filter(l => !l.match(/^#[^#]/))
      return {
        id: Date.now() + i,
        title: lines[0]?.replace(/#\S+/g, '').trim().slice(0, 40) || `提示词 ${i + 1}`,
        content: contentLines.join('\n').replace(/#\S+/g, '').trim(),
        tags: tagMatches ? tagMatches.map(t => t.replace('#', '')) : [],
      }
    })
    setBatchItems(items)
    setBatchSaved(new Set())
    toast.success(`解析出 ${items.length} 条提示词`)
  }

  const saveBatchItem = (item) => {
    addToLibrary({
      title: item.title,
      prompt: item.content,
      tags: item.tags,
      source: '批量采集',
      structure: '批量采集',
      template: item.content,
      thumbnail: `linear-gradient(${Math.random() * 360}deg, hsl(${Math.random()*360},70%,60%), hsl(${Math.random()*360},70%,60%))`,
    })
    setBatchSaved(prev => new Set([...prev, item.id]))
  }

  const saveBatchAll = () => {
    let count = 0
    for (const item of batchItems) {
      if (!batchSaved.has(item.id)) {
        saveBatchItem(item)
        count++
      }
    }
    toast.success(`已保存 ${count} 条到素材库`)
  }

  const removeBatchItem = (id) => {
    setBatchItems(prev => prev.filter(it => it.id !== id))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const saveManual = () => {
    if (!title.trim() || !prompt.trim()) { toast.error('请填写标题和提示词'); return }
    addToLibrary({
      title, prompt, tags, source: '手动录入',
      structure: notes || '手动录入',
      template: prompt,
      thumbnail: `linear-gradient(${Math.random() * 360}deg, hsl(${Math.random()*360},70%,60%), hsl(${Math.random()*360},70%,60%))`,
    })
    toast.success('已保存到素材库')
    setTitle(''); setPrompt(''); setTags([]); setNotes('')
  }

  const PreviewCard = ({ data, onSave, onClear }) => (
    <Card>
      <CardHeader><CardTitle className="text-base">采集结果预览</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div><span className="text-xs text-muted-foreground">标题</span><div className="text-sm font-medium">{data.title || '(无标题)'}</div></div>
        <div><span className="text-xs text-muted-foreground">内容</span><div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap max-h-48 overflow-y-auto">{data.content || data.prompt || '(无内容)'}</div></div>
        {data.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        )}
        {data.images?.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">图片 ({data.images.length})</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {data.images.slice(0, 6).map((img, i) => (
                <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded border" />
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={onSave}><Save className="h-4 w-4 mr-1" />保存到素材库</Button>
          {onClear && <Button variant="outline" onClick={onClear}>清除</Button>}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-2xl space-y-4">
      <Tabs defaultValue="paste">
        <TabsList>
          <TabsTrigger value="paste">粘贴采集</TabsTrigger>
          <TabsTrigger value="extension">插件采集</TabsTrigger>
          <TabsTrigger value="batch">批量采集</TabsTrigger>
          <TabsTrigger value="manual">手动录入</TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardPaste className="h-4 w-4" />粘贴笔记内容</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                在小红书 App 中复制笔记文字,粘贴到下方即可解析提取提示词和标签
              </div>
              <Textarea
                placeholder={"粘贴小红书笔记内容...\n\n例如:\n3D磨砂质感科技图标\n3D科技感图标，磨砂质感搭配蓝白渐变光效...\n#3D #磨砂 #图标设计"}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={6}
              />
              <Button onClick={handlePasteCollect} disabled={pasteLoading || !pasteText.trim()}>
                {pasteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
                {pasteLoading ? '解析中...' : '解析提取'}
              </Button>
            </CardContent>
          </Card>

          {pasteResult && (
            <PreviewCard data={pasteResult}
              onSave={() => saveData(pasteResult, () => { setPasteResult(null); setPasteText('') })}
              onClear={() => { setPasteResult(null); setPasteText('') }}
            />
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" />批量粘贴</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                粘贴多条提示词,用空行分隔每条,支持 #标签 自动提取
              </div>
              <Textarea
                placeholder={"第一条提示词内容\n#标签1 #标签2\n\n第二条提示词内容\n#标签3\n\n第三条..."}
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                rows={8}
              />
              <div className="flex gap-2">
                <Button onClick={parseBatch} disabled={!batchText.trim()}>
                  <Layers className="h-4 w-4 mr-1" />解析分割
                </Button>
                {batchItems.length > 0 && (
                  <Button variant="outline" onClick={() => { setBatchText(''); setBatchItems([]); setBatchSaved(new Set()) }}>清空</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {batchItems.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">解析结果 ({batchItems.length} 条)</CardTitle>
                  <Button size="sm" onClick={saveBatchAll} disabled={batchSaved.size === batchItems.length}>
                    <Save className="h-3 w-3 mr-1" />全部保存 ({batchItems.length - batchSaved.size})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {batchItems.map(item => (
                  <div key={item.id} className={`p-3 rounded-lg border transition-colors ${batchSaved.has(item.id) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/50 border-border'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</div>
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {batchSaved.has(item.id) ? (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" disabled>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveBatchItem(item)}>
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeBatchItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="extension" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4" />浏览器插件采集</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">安装步骤:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>打开 Chrome → <code className="bg-muted px-1 rounded">chrome://extensions/</code></li>
                  <li>开启「开发者模式」→「加载已解压的扩展程序」</li>
                  <li>选择项目中的 <code className="bg-muted px-1 rounded">extension/</code> 文件夹</li>
                </ol>
                <p className="font-medium text-foreground mt-3">使用方式:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>在小红书笔记页面点击插件图标</li>
                  <li>预览采集内容,点击「发送到 PromptForge」</li>
                  <li>数据会自动出现在下方</li>
                </ol>
              </div>
              {!extData && (
                <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  等待插件发送数据...
                </div>
              )}
            </CardContent>
          </Card>

          {extData && (
            <PreviewCard data={extData}
              onSave={() => saveData(extData, () => setExtData(null))}
              onClear={() => setExtData(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">手动录入</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">标题</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="素材标题" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">提示词</label>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="粘贴或输入提示词..." rows={4} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">标签</label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="输入标签" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                  <Button variant="outline" size="icon" onClick={addTag}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => setTags(tags.filter(x => x !== t))}>
                      {t} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">备注</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="备注信息..." rows={2} />
              </div>
              <Button onClick={saveManual}><Save className="h-4 w-4 mr-1" />保存到素材库</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
