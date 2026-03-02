import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { addToLibrary } from '@/lib/store'
import { Loader2, Download, Save, Plus, X, Plug, ClipboardPaste, FileText, Link } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE = import.meta.env.VITE_COLLECT_API || 'https://organization-text-reprints-convertible.trycloudflare.com'
function getApiBase() { return API_BASE }
function proxyImg(src) {
  if (!src) return src
  if (src.startsWith('/api/img')) return `${API_BASE}${src}`
  if (src.startsWith('http')) return `${API_BASE}/api/img?url=${encodeURIComponent(src)}`
  return src
}

export default function Collect() {
  // URL collect
  const [url, setUrl] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlResult, setUrlResult] = useState(null)
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

  const handleUrlCollect = async () => {
    if (!url.trim()) return
    setUrlLoading(true)
    try {
      const apiBase = getApiBase()
      const resp = await fetch(`${apiBase}/api/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await resp.json()
      if (!resp.ok) { toast.error(data.error || '采集失败'); return }
      if (data._error) { toast.error(data._error); return }
      setUrlResult(data)
      // Auto save to library
      const firstImg = data.images?.[0]
      addToLibrary({
        title: data.title || '未命名',
        prompt: data.content || '',
        tags: data.tags || [],
        source: data.source || '小红书',
        structure: '自动采集',
        template: data.content || '',
        images: (data.images || []).map(proxyImg),
        thumbnail: firstImg ? proxyImg(firstImg) : 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      })
      toast.success('采集成功，已自动保存到素材库')
    } catch (err) {
      toast.error('请求失败: ' + err.message)
    } finally {
      setUrlLoading(false)
    }
  }

  const handlePasteCollect = async () => {
    if (!pasteText.trim()) return
    setPasteLoading(true)
    try {
      const lines = pasteText.trim().split('\n').filter(Boolean)
      const tagMatches = pasteText.match(/#([^#\s]+)/g)
      const data = {
        title: lines[0] || '',
        content: lines.slice(1).join('\n').trim() || lines[0] || '',
        tags: tagMatches ? tagMatches.map(t => t.replace('#', '')) : [],
        images: [],
        source: '小红书',
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
                <img key={i} src={proxyImg(img)} alt="" className="w-16 h-16 object-cover rounded border" />
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
      <Tabs defaultValue="url">
        <TabsList>
          <TabsTrigger value="url">链接采集</TabsTrigger>
          <TabsTrigger value="paste">粘贴采集</TabsTrigger>
          <TabsTrigger value="extension">插件采集</TabsTrigger>
          <TabsTrigger value="manual">手动录入</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link className="h-4 w-4" />小红书链接采集</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                粘贴小红书笔记链接,自动抓取标题、正文、标签和图片
              </div>
              <div className="flex gap-2">
                <Input placeholder="粘贴小红书链接..." value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlCollect()} />
                <Button onClick={handleUrlCollect} disabled={urlLoading || !url.trim()}>
                  {urlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                  {urlLoading ? '采集中...' : '采集'}
                </Button>
              </div>
            </CardContent>
          </Card>
          {urlResult && (
            <PreviewCard data={urlResult}
              onSave={() => saveData(urlResult, () => { setUrlResult(null); setUrl('') })}
              onClear={() => { setUrlResult(null); setUrl('') }}
            />
          )}
        </TabsContent>

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
