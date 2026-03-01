import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { addToLibrary } from '@/lib/store'
import { Loader2, Download, Save, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

export default function Collect() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState(null)
  // manual
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [notes, setNotes] = useState('')

  const handleCollect = () => {
    if (!url.trim()) return
    setLoading(true)
    setTimeout(() => {
      setExtracted({
        title: '3D 磨砂质感科技图标',
        prompt: '3D科技感图标，磨砂质感搭配蓝白渐变光效，等轴侧视角，透明玻璃材质。Blender渲染，16K分辨率，纯白背景，无底座设计。减少细节，突出科技质感。',
        tags: ['3D', '磨砂', '科技', 'Blender'],
        source: '小红书',
      })
      setLoading(false)
      toast.success('采集成功')
    }, 1500)
  }

  const saveExtracted = () => {
    if (!extracted) return
    addToLibrary({
      ...extracted,
      structure: '自动采集',
      template: extracted.prompt,
      thumbnail: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    })
    toast.success('已保存到素材库')
    setExtracted(null)
    setUrl('')
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

  return (
    <div className="max-w-2xl space-y-4">
      <Tabs defaultValue="url">
        <TabsList>
          <TabsTrigger value="url">URL 采集</TabsTrigger>
          <TabsTrigger value="manual">手动录入</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">粘贴链接采集</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="粘贴小红书链接..." value={url} onChange={e => setUrl(e.target.value)} />
                <Button onClick={handleCollect} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                  {loading ? '采集中...' : '采集'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {extracted && (
            <Card>
              <CardHeader><CardTitle className="text-base">采集结果预览</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><span className="text-xs text-muted-foreground">标题</span><div className="text-sm font-medium">{extracted.title}</div></div>
                <div><span className="text-xs text-muted-foreground">提示词</span><div className="text-sm bg-muted p-3 rounded-md">{extracted.prompt}</div></div>
                <div className="flex flex-wrap gap-1">
                  {extracted.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
                <Button onClick={saveExtracted}><Save className="h-4 w-4 mr-1" />保存到素材库</Button>
              </CardContent>
            </Card>
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
