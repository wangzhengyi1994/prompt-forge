import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Copy, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { getLibrary } from '@/lib/store'

const OPTIONS = {
  材质: ['磨砂质感', '毛玻璃', '几何玻璃', '透明材质', '塑料质感'],
  视角: ['2.5D', '等轴侧', '斜角透视', '平视', '正面透视'],
  色调: ['蓝白', '多彩低饱和', '单色渐变', '蓝白带绿', '自定义'],
  背景: ['纯白', '浅蓝', '自定义'],
  风格: ['梦幻', '科技', '可爱清新', '现代简约'],
  细节度: ['多细节', '有一定细节', '减少细节', '极简'],
  分辨率: ['8K', '16K'],
  渲染器: ['C4D+OC', 'Blender', '不指定'],
}

const TEMPLATES = [
  { name: '2.5D 磨砂图标', values: { 材质: '磨砂质感', 视角: '2.5D', 色调: '多彩低饱和', 背景: '纯白', 风格: '现代简约', 细节度: '有一定细节', 分辨率: '8K', 渲染器: 'Blender' } },
  { name: '3D 科技透明', values: { 材质: '透明材质', 视角: '等轴侧', 色调: '蓝白', 背景: '纯白', 风格: '科技', 细节度: '减少细节', 分辨率: '16K', 渲染器: 'Blender' } },
  { name: '3D 梦幻场景', values: { 材质: '几何玻璃', 视角: '等轴侧', 色调: '蓝白带绿', 背景: '浅蓝', 风格: '梦幻', 细节度: '多细节', 分辨率: '8K', 渲染器: 'C4D+OC' } },
]

export default function PromptBuilder() {
  const [sel, setSel] = useState({})
  const [subject, setSubject] = useState('')

  const update = (key, val) => setSel(prev => ({ ...prev, [key]: val }))

  const applyTemplate = (t) => { setSel(t.values) }

  const prompt = useMemo(() => {
    const parts = []
    if (sel.风格) parts.push(`${sel.风格}风格`)
    if (sel.材质) parts.push(`${sel.材质}`)
    parts.push('3D图标')
    if (subject.trim()) parts.push(`，主体为${subject.trim()}`)
    if (sel.视角) parts.push(`，${sel.视角}视角`)
    if (sel.色调 && sel.色调 !== '自定义') parts.push(`，${sel.色调}配色`)
    if (sel.背景 && sel.背景 !== '自定义') parts.push(`，${sel.背景}背景`)
    if (sel.细节度) parts.push(`，${sel.细节度}`)
    if (sel.渲染器 && sel.渲染器 !== '不指定') parts.push(`。${sel.渲染器}渲染`)
    if (sel.分辨率) parts.push(`，${sel.分辨率}分辨率`)
    parts.push('。干净背景，无底座，无冗余装饰。')
    return parts.join('')
  }, [sel, subject])

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    toast.success('已复制')
  }

  // Also load library templates
  const libTemplates = getLibrary().map(i => ({ name: i.title, prompt: i.template }))

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
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
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <CardContent className="p-4">
          <label className="text-xs text-muted-foreground mb-1 block">主体内容</label>
          <Textarea value={subject} onChange={e => setSubject(e.target.value)} placeholder="描述图标主体，如：云服务器、数据仪表盘、安全盾牌..." rows={2} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">生成预览</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap min-h-[60px]">{prompt}</div>
          <Button className="mt-3" onClick={copyPrompt}><Copy className="h-4 w-4 mr-1" />复制提示词</Button>
        </CardContent>
      </Card>
    </div>
  )
}
