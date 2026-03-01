import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, Copy, Dna, Zap } from 'lucide-react'
import { toast } from 'sonner'

const ELEMENT_MAP = {
  '云': ['云朵', '服务器', '上传箭头', '数据流'],
  '安全': ['盾牌', '锁', '钥匙', '指纹'],
  '数据': ['图表', '仪表盘', '数据流', '柱状图'],
  'AI': ['大脑', '芯片', '神经网络', '机器人'],
  '设置': ['齿轮', '滑块', '扳手', '控制面板'],
  '通信': ['信封', '气泡', '电话', '铃铛'],
  '支付': ['钱包', '信用卡', '金币', '二维码'],
  '用户': ['头像', '人形', '团队', '徽章'],
  '文件': ['文档', '文件夹', '笔', '书签'],
  '搜索': ['放大镜', '雷达', '望远镜', '指南针'],
  '音乐': ['音符', '耳机', '扬声器', '均衡器'],
  '视频': ['播放按钮', '胶片', '摄像机', '屏幕'],
  '购物': ['购物车', '标签', '礼盒', '商店'],
  '位置': ['定位标记', '地图', '罗盘', '路线'],
  '时间': ['时钟', '沙漏', '日历', '秒表'],
  '医疗': ['十字标志', '药丸', '心跳线', '听诊器'],
  '教育': ['书本', '毕业帽', '黑板', '灯泡'],
  '天气': ['太阳', '云彩', '雨滴', '闪电'],
  '游戏': ['手柄', '奖杯', '骰子', '宝箱'],
  '社交': ['点赞', '分享', '评论', '关注'],
  '电商': ['标签', '折扣', '快递箱', '商品'],
  '金融': ['银行', '走势图', '保险箱', '计算器'],
  '运动': ['跑鞋', '奖牌', '篮球', '哑铃'],
  '美食': ['餐盘', '厨师帽', '叉勺', '食材'],
  '旅行': ['行李箱', '飞机', '护照', '地球仪'],
}

const STYLE_PRESETS = {
  '科技简约': { style: '科技', material: '磨砂质感', color: '蓝白配色', view: '等轴侧视角', bg: '纯白背景', renderer: 'Blender渲染', res: '8K分辨率', constraint: '无底座，减少细节' },
  '梦幻玻璃': { style: '梦幻', material: '几何玻璃', color: '蓝白带绿渐变', view: '等轴侧视角', bg: '浅蓝背景', renderer: 'C4D+OC渲染', res: '8K分辨率', constraint: '干净构图，无冗余装饰' },
  '赛博霓虹': { style: '赛博朋克', material: '金属质感', color: '粉青霓虹配色', view: '斜角透视', bg: '纯黑背景', renderer: 'Octane渲染', res: '8K分辨率', constraint: '发光边缘，无底座' },
  '粘土可爱': { style: '可爱清新', material: '手工粘土质感', color: '马卡龙配色', view: '2.5D视角', bg: '浅粉背景', renderer: 'Blender渲染', res: '8K分辨率', constraint: '圆润造型，无底座' },
  '水晶奢华': { style: '奢华', material: '水晶宝石质感', color: '彩虹色散配色', view: '等轴侧视角', bg: '纯黑背景', renderer: 'C4D+Redshift渲染', res: '16K分辨率', constraint: '焦散光效，无底座' },
  '扁平矢量': { style: '扁平', material: '矢量图形', color: '渐变配色', view: '正面视角', bg: '纯白背景', renderer: 'SVG矢量', res: '高清', constraint: '无阴影，统一描边，圆角矩形' },
  '新拟态柔和': { style: '新拟态', material: '凸起浮雕', color: '单色渐变', view: '正面视角', bg: '浅灰背景', renderer: '矢量渲染', res: '高清', constraint: '柔和内外阴影，无冗余' },
}

// --- 风格DNA提取 ---
const DNA_DIMENSIONS = {
  风格: {
    keywords: { '科技': ['科技','tech','futuristic','现代'], '梦幻': ['梦幻','dreamy','fantasy','魔法'], '赛博朋克': ['赛博','cyberpunk','neon','霓虹'], '可爱': ['可爱','cute','cartoon','卡通','粘土','clay'], '极简': ['极简','minimalist','简约','minimal'], '扁平': ['扁平','flat','矢量'], '新拟态': ['新拟态','neumorphism','拟态'], '写实': ['写实','realistic','photorealistic','照片级'], '复古': ['复古','retro','vintage','像素','pixel'], '奢华': ['奢华','luxury','宝石','crystal','水晶'] },
  },
  材质: {
    keywords: { '磨砂': ['磨砂','frosted','matte'], '玻璃': ['玻璃','glass','透明','transparent'], '金属': ['金属','metal','metallic','钢'], '塑料': ['塑料','plastic'], '水晶': ['水晶','crystal','宝石','gem'], '陶瓷': ['陶瓷','ceramic','瓷'], '粘土': ['粘土','clay','手工'], '木质': ['木质','wood','wooden'], '全息': ['全息','holographic','hologram'] },
  },
  视角: {
    keywords: { '等轴侧': ['等轴','isometric','2.5d'], '俯视': ['俯视','top-down','top view','鸟瞰'], '正面': ['正面','front','平视','eye-level'], '斜角': ['斜角','oblique','45度','perspective','透视'], '侧面': ['侧面','side view','侧视'] },
  },
  色调: {
    keywords: { '蓝白': ['蓝白','blue-white','蓝色'], '粉紫': ['粉紫','pink','purple','粉色','紫色'], '暖色': ['暖色','warm','橙','黄','暖'], '冷色': ['冷色','cool','冷'], '马卡龙': ['马卡龙','pastel','柔和'], '霓虹': ['霓虹','neon','荧光'], '单色': ['单色','monochrome','mono'], '渐变': ['渐变','gradient'] },
  },
  渲染: {
    keywords: { 'Blender': ['blender'], 'C4D': ['c4d','cinema 4d','cinema4d'], 'Octane': ['octane','oc渲染','oc '], 'Redshift': ['redshift'], 'V-Ray': ['vray','v-ray'] },
  },
  分辨率: {
    keywords: { '16K': ['16k'], '8K': ['8k'], '4K': ['4k'], '高清': ['hd','高清','high resolution'] },
  },
}

function extractDNA(prompt) {
  const text = prompt.toLowerCase()
  const dna = {}
  const unmatched = []

  for (const [dim, { keywords }] of Object.entries(DNA_DIMENSIONS)) {
    let found = null
    let maxMatches = 0
    for (const [label, words] of Object.entries(keywords)) {
      const matches = words.filter(w => text.includes(w)).length
      if (matches > maxMatches) { maxMatches = matches; found = label }
    }
    if (found) {
      dna[dim] = found
    } else {
      unmatched.push(dim)
    }
  }

  // Extract constraints
  const constraints = []
  const constraintPatterns = [
    [/无底座/i, '无底座'], [/no base/i, '无底座'],
    [/干净背景|clean background/i, '干净背景'],
    [/无阴影|no shadow/i, '无阴影'],
    [/无冗余|no redundant/i, '无冗余装饰'],
    [/减少细节|reduce detail/i, '减少细节'],
    [/居中构图|centered/i, '居中构图'],
  ]
  for (const [pat, label] of constraintPatterns) {
    if (pat.test(prompt)) constraints.push(label)
  }
  if (constraints.length > 0) dna['约束'] = constraints.join('，')

  // Completeness score
  const total = Object.keys(DNA_DIMENSIONS).length + 1 // +1 for constraints
  const filled = Object.keys(dna).length
  const completeness = Math.round((filled / total) * 100)

  return { dna, unmatched, completeness }
}

function analyzeText(title, desc, styleKey) {
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
    reasons.push('未匹配到具体关键词,推荐使用抽象元素表达概念')
  }

  const preset = STYLE_PRESETS[styleKey] || STYLE_PRESETS['科技简约']
  const prompt = `${preset.style}风格3D图标，主体为${elements.join(' + ')}，${preset.material}搭配${preset.color}，${preset.view}。${preset.renderer}，${preset.res}，${preset.bg}，${preset.constraint}。`

  return { elements, reasons, prompt, styleName: styleKey || '科技简约' }
}

export default function Analyzer() {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [styleKey, setStyleKey] = useState('科技简约')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  // batch
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState([])
  // DNA
  const [dnaInput, setDnaInput] = useState('')
  const [dnaResult, setDnaResult] = useState(null)

  const analyze = () => {
    if (!title.trim()) { toast.error('请输入标题'); return }
    setLoading(true)
    setTimeout(() => {
      setResult(analyzeText(title, desc, styleKey))
      setLoading(false)
    }, 600)
  }

  const batchAnalyze = () => {
    const lines = batchInput.trim().split('\n').filter(Boolean)
    if (!lines.length) { toast.error('请输入内容'); return }
    const results = lines.map(line => {
      const [t, d = ''] = line.split('|')
      return { title: t.trim(), ...analyzeText(t, d, styleKey) }
    })
    setBatchResults(results)
    toast.success(`已分析 ${results.length} 条`)
  }

  const handleDNA = () => {
    if (!dnaInput.trim()) { toast.error('请输入提示词'); return }
    setDnaResult(extractDNA(dnaInput))
  }

  const copyText = (t) => { navigator.clipboard.writeText(t); toast.success('已复制') }

  const DNA_EXAMPLES = [
    '科技感透明图标，等轴侧视角，透明材质搭配蓝白光效。16K分辨率，Blender渲染，现代简约风格。干净背景，无底座。',
    'Cyberpunk neon icon, glowing edges with pink and cyan neon lights, dark background. Holographic material, Octane render, 8K resolution, no base.',
    '水晶宝石质感3D图标，内部光线折射，彩虹色散光。C4D+Redshift渲染，16K分辨率，纯黑背景。',
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">单条分析</TabsTrigger>
          <TabsTrigger value="batch">批量分析</TabsTrigger>
          <TabsTrigger value="dna">风格DNA</TabsTrigger>
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
              <div>
                <label className="text-xs text-muted-foreground">选择风格预设</label>
                <Select value={styleKey} onValueChange={setStyleKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(STYLE_PRESETS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={analyze} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                分析
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">分析结果</CardTitle>
                  <Badge variant="secondary">{result.styleName}</Badge>
                </div>
              </CardHeader>
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
                <label className="text-xs text-muted-foreground">批量输入(每行一条,格式: 标题|描述)</label>
                <Textarea value={batchInput} onChange={e => setBatchInput(e.target.value)} placeholder={'云存储管理|管理云端文件和备份\nAI智能客服|基于AI的自动客服系统\n安全中心|账户安全和隐私设置'} rows={6} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">风格预设</label>
                <Select value={styleKey} onValueChange={setStyleKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(STYLE_PRESETS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={batchAnalyze}><Sparkles className="h-4 w-4 mr-1" />批量分析</Button>
            </CardContent>
          </Card>

          {batchResults.map((r, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{r.title}</span>
                  <Badge variant="outline" className="text-xs">{r.styleName}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">{r.elements.map((e, j) => <Badge key={j} variant="secondary">{e}</Badge>)}</div>
                <div className="bg-muted p-3 rounded-md text-sm">{r.prompt}</div>
                <Button variant="ghost" size="sm" onClick={() => copyText(r.prompt)}><Copy className="h-3 w-3 mr-1" />复制</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="dna" className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Dna className="h-4 w-4" />
                风格DNA提取
              </CardTitle>
              <p className="text-xs text-muted-foreground">粘贴任意提示词,自动提取其风格基因组成</p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <Textarea
                value={dnaInput}
                onChange={e => setDnaInput(e.target.value)}
                placeholder="粘贴一段提示词,分析其风格DNA..."
                rows={4}
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleDNA}>
                  <Zap className="h-4 w-4 mr-1" />提取DNA
                </Button>
                <Button variant="outline" onClick={() => { setDnaInput(''); setDnaResult(null) }}>清空</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center">示例:</span>
                {DNA_EXAMPLES.map((ex, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-accent text-xs" onClick={() => setDnaInput(ex)}>
                    示例 {i + 1}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {dnaResult && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${dnaResult.completeness >= 80 ? 'bg-emerald-500' : dnaResult.completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                      {dnaResult.completeness}%
                    </div>
                    <div>
                      <div className="text-sm font-medium">风格完整度</div>
                      <div className="text-xs text-muted-foreground">
                        {dnaResult.completeness >= 80 ? '风格定义完整,各维度清晰' :
                         dnaResult.completeness >= 50 ? '基本维度覆盖,部分缺失' :
                         '风格定义不完整,建议补充更多维度'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">DNA 图谱</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {Object.entries(dnaResult.dna).map(([dim, val]) => (
                    <div key={dim} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-14 shrink-0 text-right">{dim}</span>
                      <div className="h-8 flex-1 bg-muted rounded-md flex items-center px-3">
                        <Badge variant="default" className="bg-blue-500/15 text-blue-500 border-blue-500/30 hover:bg-blue-500/20">{val}</Badge>
                      </div>
                    </div>
                  ))}
                  {dnaResult.unmatched.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground w-14 shrink-0 text-right">缺失</span>
                      <div className="flex flex-wrap gap-1">
                        {dnaResult.unmatched.map(d => (
                          <Badge key={d} variant="outline" className="text-xs text-red-400 border-red-400/30">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">DNA 代码</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="bg-muted p-3 rounded-md font-mono text-xs whitespace-pre-wrap">
                    {Object.entries(dnaResult.dna).map(([k, v]) => `${k}: ${v}`).join('\n')}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => copyText(Object.entries(dnaResult.dna).map(([k, v]) => `${k}: ${v}`).join('\n'))}>
                    <Copy className="h-3 w-3 mr-1" />复制DNA
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
