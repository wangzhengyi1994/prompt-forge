import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Copy, ChevronDown, RotateCcw, Sparkles, CheckCircle, AlertTriangle, BookmarkPlus, Check, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { addToLibrary } from '@/lib/store'

const OPTIONS = {
  材质: ['磨砂质感', '毛玻璃', '几何玻璃', '透明材质', '塑料质感', '金属质感', '水晶质感', '陶瓷质感'],
  视角: ['2.5D', '等轴侧', '斜角透视', '平视', '正面透视', '俯视', '仰视'],
  色调: ['蓝白', '多彩低饱和', '单色渐变', '蓝白带绿', '粉紫', '暖色系', '冷色系', '自定义'],
  背景: ['纯白', '浅蓝', '浅灰', '纯黑', '渐变', '自定义'],
  风格: ['梦幻', '科技', '可爱清新', '现代简约', '赛博朋克', '扁平', '新拟态', '像素'],
  细节度: ['多细节', '有一定细节', '减少细节', '极简'],
  分辨率: ['4K', '8K', '16K'],
  渲染器: ['C4D+OC', 'Blender', 'C4D+Redshift', '不指定'],
}

const TEMPLATES = [
  { name: '2.5D 磨砂图标', values: { 材质: '磨砂质感', 视角: '2.5D', 色调: '多彩低饱和', 背景: '纯白', 风格: '现代简约', 细节度: '有一定细节', 分辨率: '8K', 渲染器: 'Blender' } },
  { name: '3D 科技透明', values: { 材质: '透明材质', 视角: '等轴侧', 色调: '蓝白', 背景: '纯白', 风格: '科技', 细节度: '减少细节', 分辨率: '16K', 渲染器: 'Blender' } },
  { name: '3D 梦幻场景', values: { 材质: '几何玻璃', 视角: '等轴侧', 色调: '蓝白带绿', 背景: '浅蓝', 风格: '梦幻', 细节度: '多细节', 分辨率: '8K', 渲染器: 'C4D+OC' } },
  { name: '赛博霓虹', values: { 材质: '金属质感', 视角: '斜角透视', 色调: '粉紫', 背景: '纯黑', 风格: '赛博朋克', 细节度: '多细节', 分辨率: '8K', 渲染器: 'C4D+OC' } },
  { name: '水晶宝石', values: { 材质: '水晶质感', 视角: '等轴侧', 色调: '单色渐变', 背景: '纯黑', 风格: '梦幻', 细节度: '多细节', 分辨率: '16K', 渲染器: 'C4D+Redshift' } },
]

// Mini scorer for real-time quality check
const DIMENSIONS = [
  { name: '主体', check: (t) => ['图标','icon','主体','一个','一只','一朵','场景','角色'].some(w => t.toLowerCase().includes(w)) || t.length > 15 },
  { name: '风格', check: (t) => ['风格','style','极简','科技','梦幻','可爱','赛博','扁平','现代','复古','朋克','像素','拟态'].some(w => t.toLowerCase().includes(w)) },
  { name: '材质', check: (t) => ['材质','质感','磨砂','玻璃','金属','透明','水晶','陶瓷','塑料'].some(w => t.toLowerCase().includes(w)) },
  { name: '视角', check: (t) => ['视角','透视','等轴','俯视','仰视','2.5d','isometric','正面','侧面'].some(w => t.toLowerCase().includes(w)) },
  { name: '色彩', check: (t) => ['配色','色调','蓝','紫','渐变','饱和','粉','暖','冷','白'].some(w => t.toLowerCase().includes(w)) },
  { name: '技术', check: (t) => ['8k','16k','4k','c4d','blender','oc','octane','redshift','渲染','render'].some(w => t.toLowerCase().includes(w)) },
  { name: '约束', check: (t) => ['无','不要','干净','简洁','减少','无底座','无冗余'].some(w => t.toLowerCase().includes(w)) },
]

export default function PromptBuilder() {
  const [sel, setSel] = useState({})
  const [subject, setSubject] = useState('')
  const [extraConstraint, setExtraConstraint] = useState('')

  const update = (key, val) => setSel(prev => ({ ...prev, [key]: val }))
  const applyTemplate = (t) => { setSel(t.values) }
  const resetAll = () => { setSel({}); setSubject(''); setExtraConstraint('') }

  const filledCount = Object.values(sel).filter(v => v && v !== '自定义' && v !== '不指定').length

  // Color map for each dimension category
  const DIM_COLORS = {
    风格: 'text-purple-400 bg-purple-500/10',
    材质: 'text-blue-400 bg-blue-500/10',
    视角: 'text-green-400 bg-green-500/10',
    色调: 'text-pink-400 bg-pink-500/10',
    背景: 'text-cyan-400 bg-cyan-500/10',
    细节度: 'text-yellow-400 bg-yellow-500/10',
    渲染器: 'text-orange-400 bg-orange-500/10',
    分辨率: 'text-red-400 bg-red-500/10',
    主体: 'text-emerald-400 bg-emerald-500/10',
    约束: 'text-slate-400 bg-slate-500/10',
  }

  // Build prompt as segments with dimension labels for highlighting
  const promptSegments = useMemo(() => {
    const segs = []
    if (sel.风格) segs.push({ text: `${sel.风格}风格`, dim: '风格' })
    if (sel.材质) segs.push({ text: sel.材质, dim: '材质' })
    segs.push({ text: '3D图标', dim: null })
    if (subject.trim()) segs.push({ text: `，主体为${subject.trim()}`, dim: '主体' })
    if (sel.视角) segs.push({ text: `，${sel.视角}视角`, dim: '视角' })
    if (sel.色调 && sel.色调 !== '自定义') segs.push({ text: `，${sel.色调}配色`, dim: '色调' })
    if (sel.背景 && sel.背景 !== '自定义') segs.push({ text: `，${sel.背景}背景`, dim: '背景' })
    if (sel.细节度) segs.push({ text: `，${sel.细节度}`, dim: '细节度' })
    if (sel.渲染器 && sel.渲染器 !== '不指定') segs.push({ text: `。${sel.渲染器}渲染`, dim: '渲染器' })
    if (sel.分辨率) segs.push({ text: `，${sel.分辨率}分辨率`, dim: '分辨率' })
    segs.push({ text: '。干净背景，无底座，无冗余装饰。', dim: '约束' })
    if (extraConstraint.trim()) segs.push({ text: extraConstraint.trim(), dim: '约束' })
    return segs
  }, [sel, subject, extraConstraint])

  const prompt = useMemo(() => promptSegments.map(s => s.text).join(''), [promptSegments])

  const [highlightMode, setHighlightMode] = useState(true)

  const dimResults = useMemo(() => {
    return DIMENSIONS.map(d => ({ ...d, passed: d.check(prompt) }))
  }, [prompt])

  const passedCount = dimResults.filter(d => d.passed).length
  const scoreColor = passedCount >= 6 ? 'text-emerald-500' : passedCount >= 4 ? 'text-yellow-500' : 'text-red-500'

  const [copied, setCopied] = useState(false)

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    toast.success('已复制')
    setTimeout(() => setCopied(false), 1500)
  }

  const saveToLibrary = () => {
    const styleName = sel.风格 || ''
    const matName = sel.材质 || ''
    const title = subject.trim()
      ? `${styleName}${matName} - ${subject.trim()}`
      : `${styleName}${matName}图标`
    const tags = Object.values(sel).filter(v => v && v !== '自定义' && v !== '不指定')
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ]
    const thumbnail = gradients[Math.floor(Math.random() * gradients.length)]
    addToLibrary({
      title,
      source: '组装器生成',
      tags,
      prompt,
      structure: Object.entries(sel).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(' | '),
      template: prompt.replace(subject.trim() || '___', '{主体内容}'),
      thumbnail,
    })
    toast.success('已保存到素材库')
  }

  return (
    <div className="max-w-3xl space-y-4 w-full mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">提示词组装器</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">参考模板 <ChevronDown className="h-3 w-3 ml-1" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {TEMPLATES.map(t => (
              <DropdownMenuItem key={t.name} onClick={() => applyTemplate(t)}>{t.name}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" onClick={resetAll}><RotateCcw className="h-3 w-3 mr-1" />重置</Button>
        <span className="text-xs text-muted-foreground ml-auto">已填 {filledCount}/{Object.keys(OPTIONS).length} 项</span>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(OPTIONS).map(([key, opts]) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground mb-1 block">{key}</label>
              <Select value={sel[key] || ''} onValueChange={v => update(key, v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder={`选择${key}`} /></SelectTrigger>
                <SelectContent>
                  {opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">主体内容</label>
            <Textarea value={subject} onChange={e => setSubject(e.target.value)} placeholder="描述图标主体，如：云服务器、数据仪表盘、安全盾牌..." rows={2} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">额外约束 (可选)</label>
            <Textarea value={extraConstraint} onChange={e => setExtraConstraint(e.target.value)} placeholder="如：无阴影、暖色调光照、手工粘土质感..." rows={1} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">实时预览</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{prompt.length} 字</span>
              <span className={`text-xs font-medium ${scoreColor}`}>
                <Sparkles className="h-3 w-3 inline mr-0.5" />
                {passedCount}/7 维度
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap min-h-[60px] leading-relaxed">
            {highlightMode ? promptSegments.map((seg, i) => (
              seg.dim ? (
                <span key={i} className={`${DIM_COLORS[seg.dim] || ''} px-0.5 rounded`} title={seg.dim}>{seg.text}</span>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )) : prompt}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setHighlightMode(!highlightMode)}>
              {highlightMode ? '关闭高亮' : '开启高亮'}
            </Button>
            {highlightMode && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(DIM_COLORS).filter(([k]) => promptSegments.some(s => s.dim === k)).map(([k, cls]) => (
                  <span key={k} className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>{k}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {dimResults.map(d => (
              <Badge key={d.name} variant={d.passed ? 'default' : 'outline'} className={`text-xs gap-1 ${d.passed ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20' : 'text-muted-foreground'}`}>
                {d.passed ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {d.name}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={copyPrompt}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? '已复制' : '复制提示词'}
            </Button>
            <Button variant="outline" onClick={saveToLibrary}>
              <BookmarkPlus className="h-4 w-4 mr-1" />收藏到素材库
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
