import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Copy, Sparkles, AlertTriangle, CheckCircle, Info, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

const DIMENSIONS = [
  {
    name: '主体描述',
    weight: 25,
    check: (t) => {
      const subjectWords = ['图标', 'icon', 'logo', '场景', '角色', '物体', '主体', 'subject', '一个', '一只', '一朵']
      const has = subjectWords.some(w => t.toLowerCase().includes(w))
      if (!has) return { score: 0, tip: '缺少明确的主体描述,建议加上"主体为XX"或具体对象名称' }
      if (t.length < 15) return { score: 12, tip: '主体描述过于简短,建议补充更多细节' }
      return { score: 25, tip: '主体描述清晰' }
    }
  },
  {
    name: '风格定义',
    weight: 20,
    check: (t) => {
      const styleWords = ['风格', 'style', '极简', '科技', '梦幻', '可爱', '复古', '赛博', '扁平', '写实', 'minimalist', 'realistic', 'fantasy', 'cyberpunk', 'cartoon', 'abstract']
      const count = styleWords.filter(w => t.toLowerCase().includes(w)).length
      if (count === 0) return { score: 0, tip: '未指定风格,建议添加如"极简风格""科技感"等描述' }
      if (count >= 2) return { score: 20, tip: '风格定义丰富' }
      return { score: 14, tip: '风格基本明确,可再补充一个辅助风格词' }
    }
  },
  {
    name: '材质/质感',
    weight: 15,
    check: (t) => {
      const matWords = ['材质', '质感', '磨砂', '玻璃', '金属', '透明', '塑料', '陶瓷', '木质', '布料', 'glass', 'metal', 'matte', 'glossy', 'frosted', 'crystal']
      const has = matWords.some(w => t.toLowerCase().includes(w))
      if (!has) return { score: 0, tip: '缺少材质/质感描述,建议加上"磨砂""玻璃""金属"等' }
      return { score: 15, tip: '材质描述到位' }
    }
  },
  {
    name: '视角/构图',
    weight: 10,
    check: (t) => {
      const viewWords = ['视角', '透视', '等轴', '俯视', '仰视', '平视', '正面', '侧面', '2.5d', 'isometric', 'perspective', 'top view', 'front view']
      const has = viewWords.some(w => t.toLowerCase().includes(w))
      if (!has) return { score: 0, tip: '未指定视角,建议添加"2.5D视角""等轴侧"等' }
      return { score: 10, tip: '视角明确' }
    }
  },
  {
    name: '色彩方案',
    weight: 10,
    check: (t) => {
      const colorWords = ['配色', '色调', '颜色', '蓝', '红', '绿', '紫', '渐变', '单色', '多彩', '饱和', 'color', 'gradient', 'monochrome', 'pastel', 'vibrant']
      const has = colorWords.some(w => t.toLowerCase().includes(w))
      if (!has) return { score: 0, tip: '缺少色彩方案,建议指定配色或色调' }
      return { score: 10, tip: '色彩描述充分' }
    }
  },
  {
    name: '技术参数',
    weight: 10,
    check: (t) => {
      const techWords = ['8k', '16k', '4k', '分辨率', 'resolution', 'c4d', 'blender', 'oc', 'octane', 'vray', '渲染', 'render', 'unreal']
      const count = techWords.filter(w => t.toLowerCase().includes(w)).length
      if (count === 0) return { score: 0, tip: '缺少技术参数,建议添加分辨率或渲染器' }
      if (count >= 2) return { score: 10, tip: '技术参数完整' }
      return { score: 6, tip: '可补充更多技术参数(分辨率/渲染器)' }
    }
  },
  {
    name: '约束/负向',
    weight: 10,
    check: (t) => {
      const negWords = ['无', '不要', '禁止', '去除', '干净', '简洁', 'no ', 'without', 'clean', 'simple', '不含', '避免']
      const has = negWords.some(w => t.toLowerCase().includes(w))
      if (!has) return { score: 3, tip: '建议添加约束条件,如"无底座""干净背景"' }
      return { score: 10, tip: '约束条件明确' }
    }
  },
]

const EXAMPLES = [
  '现代简约风格，磨砂质感3D图标，主体为一朵云，2.5D视角，蓝白配色，纯白背景，有一定细节。Blender渲染，8K分辨率。干净背景，无底座，无冗余装饰。',
  'A cute cartoon cat icon, isometric view, pastel colors, glass material, clean white background, 8K resolution',
  '科技风格透明玻璃图标',
]

function getGrade(score) {
  if (score >= 90) return { label: 'S', color: 'bg-emerald-500', text: '优秀!提示词非常完整' }
  if (score >= 75) return { label: 'A', color: 'bg-blue-500', text: '良好,细节充分' }
  if (score >= 60) return { label: 'B', color: 'bg-yellow-500', text: '尚可,建议补充更多维度' }
  if (score >= 40) return { label: 'C', color: 'bg-orange-500', text: '一般,缺少多个关键维度' }
  return { label: 'D', color: 'bg-red-500', text: '较弱,需要大幅补充' }
}

export default function Scorer() {
  const [input, setInput] = useState('')
  const [scored, setScored] = useState(false)

  const results = useMemo(() => {
    if (!input.trim()) return null
    return DIMENSIONS.map(d => ({ ...d, ...d.check(input) }))
  }, [input])

  const totalScore = results ? results.reduce((s, r) => s + r.score, 0) : 0
  const grade = getGrade(totalScore)

  const suggestions = results ? results.filter(r => r.score < r.weight).map(r => r.tip) : []

  const optimizePrompt = () => {
    if (!input.trim()) { toast.error('请先输入提示词'); return }
    const t = input.toLowerCase()
    const additions = []

    // Check missing dimensions and add reasonable defaults
    const hasSubject = ['图标','icon','logo','场景','角色','物体','主体','subject','一个','一只','一朵'].some(w => t.includes(w))
    if (!hasSubject) additions.push('3D图标')

    const hasStyle = ['风格','style','极简','科技','梦幻','可爱','复古','赛博','扁平','写实','minimalist','realistic','fantasy','cyberpunk','cartoon','abstract','现代','简约'].some(w => t.includes(w))
    if (!hasStyle) additions.push('现代简约风格')

    const hasMaterial = ['材质','质感','磨砂','玻璃','金属','透明','塑料','陶瓷','木质','布料','glass','metal','matte','glossy','frosted','crystal','水晶'].some(w => t.includes(w))
    if (!hasMaterial) additions.push('磨砂质感')

    const hasView = ['视角','透视','等轴','俯视','仰视','平视','正面','侧面','2.5d','isometric','perspective','top view','front view'].some(w => t.includes(w))
    if (!hasView) additions.push('2.5D视角')

    const hasColor = ['配色','色调','颜色','蓝','红','绿','紫','渐变','单色','多彩','饱和','color','gradient','monochrome','pastel','vibrant','粉','暖','冷'].some(w => t.includes(w))
    if (!hasColor) additions.push('蓝白渐变配色')

    const hasTech = ['8k','16k','4k','分辨率','resolution','c4d','blender','oc','octane','vray','渲染','render','unreal','redshift'].some(w => t.includes(w))
    if (!hasTech) additions.push('Blender渲染，8K分辨率')

    const hasConstraint = ['无','不要','禁止','去除','干净','简洁','no ','without','clean','simple','不含','避免'].some(w => t.includes(w))
    if (!hasConstraint) additions.push('干净背景，无底座，无冗余装饰')

    if (additions.length === 0) {
      toast.info('提示词已经很完整了')
      return
    }

    const optimized = input.trim().replace(/[。.]+$/, '') + '。' + additions.join('，') + '。'
    setInput(optimized)
    setScored(false)
    toast.success(`已补充 ${additions.length} 个维度`)
  }

  const handleScore = () => {
    if (!input.trim()) { toast.error('请输入提示词'); return }
    setScored(true)
  }

  const handleExample = (ex) => {
    setInput(ex)
    setScored(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">提示词评分</h1>
        <p className="text-muted-foreground mt-1">从 7 个维度评估你的提示词质量,获取改进建议</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">输入提示词</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="粘贴或输入你的图标设计提示词..."
            value={input}
            onChange={e => { setInput(e.target.value); setScored(false) }}
            rows={4}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleScore}>
              <Sparkles className="w-4 h-4 mr-2" />
              开始评分
            </Button>
            <Button variant="outline" onClick={optimizePrompt}>
              <Wand2 className="w-4 h-4 mr-2" />
              一键优化
            </Button>
            <Button variant="outline" onClick={() => { setInput(''); setScored(false) }}>清空</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">快速示例:</span>
            {EXAMPLES.map((ex, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-accent" onClick={() => handleExample(ex)}>
                示例 {i + 1}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {scored && results && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-2xl ${grade.color} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                  {grade.label}
                </div>
                <div className="flex-1">
                  <div className="text-4xl font-bold">{totalScore}<span className="text-lg text-muted-foreground">/100</span></div>
                  <p className="text-muted-foreground mt-1">{grade.text}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(input); toast.success('已复制') }}>
                    <Copy className="w-3 h-3 mr-1" />复制
                  </Button>
                  {totalScore < 90 && (
                    <Button size="sm" onClick={optimizePrompt}>
                      <Wand2 className="w-3 h-3 mr-1" />一键优化
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">维度详情</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {r.score >= r.weight ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                       r.score === 0 ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                       <Info className="w-4 h-4 text-yellow-500" />}
                      {r.name}
                    </span>
                    <span className="font-mono">{r.score}/{r.weight}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${r.score >= r.weight ? 'bg-emerald-500' : r.score === 0 ? 'bg-red-500' : 'bg-yellow-500'}`}
                      style={{ width: `${(r.score / r.weight) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.tip}</p>
                  {i < results.length - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {suggestions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">改进建议</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-500 mt-0.5">●</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
