import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Copy } from 'lucide-react'
import { toast } from 'sonner'

const ELEMENT_MAP = {
  '云': ['云朵', '服务器', '上传箭头'],
  '安全': ['盾牌', '锁', '钥匙'],
  '数据': ['图表', '仪表盘', '数据流'],
  'AI': ['大脑', '芯片', '神经网络'],
  '设置': ['齿轮', '滑块', '扳手'],
  '通信': ['信封', '气泡', '电话'],
  '支付': ['钱包', '信用卡', '金币'],
  '用户': ['头像', '人形', '团队'],
  '文件': ['文档', '文件夹', '笔'],
  '搜索': ['放大镜', '雷达', '望远镜'],
}

function analyzeText(title, desc) {
  const text = `${title} ${desc}`.toLowerCase()
  const elements = []
  const reasons = []
  for (const [key, vals] of Object.entries(ELEMENT_MAP)) {
    if (text.includes(key)) {
      elements.push(...vals.slice(0, 2))
      reasons.push(`"${key}"相关 → ${vals.join(' / ')}`)
    }
  }
  if (elements.length === 0) {
    elements.push('抽象几何体', '光效粒子', '渐变球体')
    reasons.push('未匹配到具体关键词，推荐使用抽象元素表达概念')
  }
  const prompt = `3D科技感图标，主体为${elements.join(' + ')}，磨砂质感搭配蓝白光效，等轴侧视角。Blender渲染，8K分辨率，纯白背景，无底座，减少细节。`
  return { elements, reasons, prompt }
}

export default function Analyzer() {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  // batch
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState([])

  const analyze = () => {
    if (!title.trim()) { toast.error('请输入标题'); return }
    setLoading(true)
    setTimeout(() => {
      setResult(analyzeText(title, desc))
      setLoading(false)
    }, 800)
  }

  const batchAnalyze = () => {
    const lines = batchInput.trim().split('\n').filter(Boolean)
    if (!lines.length) { toast.error('请输入内容'); return }
    const results = lines.map(line => {
      const [t, d = ''] = line.split('|')
      return { title: t.trim(), ...analyzeText(t, d) }
    })
    setBatchResults(results)
    toast.success(`已分析 ${results.length} 条`)
  }

  const copyText = (t) => { navigator.clipboard.writeText(t); toast.success('已复制') }

  return (
    <div className="max-w-2xl space-y-4">
      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">单条分析</TabsTrigger>
          <TabsTrigger value="batch">批量分析</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">功能标题</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="如：云存储管理" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">功能描述</label>
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述该功能的用途..." rows={3} />
              </div>
              <Button onClick={analyze} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                分析
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-base">分析结果</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">推荐元素组合</div>
                  <div className="flex flex-wrap gap-1">
                    {result.elements.map((e, i) => <Badge key={i}>{e}</Badge>)}
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">设计理由</div>
                  <ul className="text-sm space-y-1">
                    {result.reasons.map((r, i) => <li key={i} className="text-muted-foreground">• {r}</li>)}
                  </ul>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">建议提示词</div>
                  <div className="bg-muted p-3 rounded-md text-sm">{result.prompt}</div>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => copyText(result.prompt)}>
                    <Copy className="h-3 w-3 mr-1" />复制
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">批量输入（每行一条，格式：标题|描述）</label>
                <Textarea value={batchInput} onChange={e => setBatchInput(e.target.value)} placeholder={'云存储管理|管理云端文件和备份\nAI智能客服|基于AI的自动客服系统\n安全中心|账户安全和隐私设置'} rows={6} />
              </div>
              <Button onClick={batchAnalyze}><Sparkles className="h-4 w-4 mr-1" />批量分析</Button>
            </CardContent>
          </Card>

          {batchResults.map((r, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="font-medium text-sm">{r.title}</div>
                <div className="flex flex-wrap gap-1">{r.elements.map((e, j) => <Badge key={j} variant="secondary">{e}</Badge>)}</div>
                <div className="bg-muted p-3 rounded-md text-sm">{r.prompt}</div>
                <Button variant="ghost" size="sm" onClick={() => copyText(r.prompt)}><Copy className="h-3 w-3 mr-1" />复制</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
