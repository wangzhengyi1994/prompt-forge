import { copyToClipboard } from '@/lib/clipboard'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
// Select removed
import { Loader2, Sparkles, Copy, Dna, Zap, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

// 语义分类: triggers(触发词) → elements(推荐元素) + label(显示名)
const SEMANTIC_CATEGORIES = [
  { label: '云服务', triggers: ['云', 'cloud', '存储', '上传', '下载', '同步', '备份', '服务器', 'saas'], elements: ['云朵', '服务器', '上传箭头', '数据流'] },
  { label: '安全/信任', triggers: ['安全', '信赖', '信任', '可靠', '保障', '防护', '认证', '权限', '隐私', '合规', 'trust', 'security', '保护', '放心'], elements: ['盾牌', '锁', '勋章', '握手'] },
  { label: '数据', triggers: ['数据', '统计', '分析', '报表', '监控', '指标', 'data', 'analytics', '洞察', '趋势'], elements: ['图表', '仪表盘', '数据流', '柱状图'] },
  { label: 'AI/智能', triggers: ['ai', '智能', '算法', '模型', '机器学习', '深度学习', '自动', '推荐', '识别', '预测'], elements: ['大脑', '芯片', '神经网络', '机器人'] },
  { label: '设置', triggers: ['设置', '配置', '管理', '调整', '自定义', '偏好', '选项', '参数'], elements: ['齿轮', '滑块', '扳手', '控制面板'] },
  { label: '通信', triggers: ['通信', '消息', '聊天', '通知', '邮件', '短信', '沟通', '联系', '对话', '客服'], elements: ['信封', '气泡', '电话', '铃铛'] },
  { label: '支付/金融', triggers: ['支付', '付款', '钱', '费用', '账单', '收银', '金融', '银行', '投资', '理财', '贷款', '保险', '钱包', '交易'], elements: ['钱包', '信用卡', '金币', '走势图'] },
  { label: '用户/团队', triggers: ['用户', '客户', '会员', '团队', '协作', '人', '社区', '伙伴', '合作', '员工', '人力', '招聘'], elements: ['头像', '人形', '团队', '握手'] },
  { label: '文件/文档', triggers: ['文件', '文档', '合同', '报告', '笔记', '编辑', '内容', '写作', '记录'], elements: ['文档', '文件夹', '笔', '书签'] },
  { label: '搜索/发现', triggers: ['搜索', '查找', '发现', '探索', '导航', '浏览', '检索'], elements: ['放大镜', '雷达', '望远镜', '指南针'] },
  { label: '音乐/音频', triggers: ['音乐', '音频', '播客', '歌', '声音', '录音', '语音'], elements: ['音符', '耳机', '扬声器', '均衡器'] },
  { label: '视频/直播', triggers: ['视频', '直播', '录像', '播放', '频道', '流媒体'], elements: ['播放按钮', '胶片', '摄像机', '屏幕'] },
  { label: '购物/电商', triggers: ['购物', '商城', '电商', '订单', '商品', '优惠', '折扣', '促销', '物流', '快递', '配送'], elements: ['购物车', '礼盒', '快递箱', '商店'] },
  { label: '位置/地图', triggers: ['位置', '地图', '定位', '导航', '地址', '附近', '门店'], elements: ['定位标记', '地图', '罗盘', '路线'] },
  { label: '时间/效率', triggers: ['时间', '效率', '速度', '快速', '实时', '即时', '进度', '日程', '排期', '提醒'], elements: ['时钟', '沙漏', '闪电', '秒表'] },
  { label: '医疗/健康', triggers: ['医疗', '健康', '体检', '诊断', '药', '病', '养生', '运动', '健身'], elements: ['十字标志', '药丸', '心跳线', '听诊器'] },
  { label: '教育/学习', triggers: ['教育', '学习', '培训', '课程', '知识', '考试', '成长', '提升', '技能'], elements: ['书本', '毕业帽', '灯泡', '黑板'] },
  { label: '天气/环境', triggers: ['天气', '环境', '气候', '绿色', '环保', '自然', '生态'], elements: ['太阳', '云彩', '树叶', '地球'] },
  { label: '游戏/娱乐', triggers: ['游戏', '娱乐', '竞技', '挑战', '积分', '排行', '奖励', '成就'], elements: ['手柄', '奖杯', '骰子', '宝箱'] },
  { label: '社交/互动', triggers: ['社交', '分享', '点赞', '评论', '关注', '互动', '动态', '朋友圈'], elements: ['点赞', '分享', '评论', '关注'] },
  { label: '品牌/营销', triggers: ['品牌', '营销', '推广', '广告', '曝光', '传播', '口碑', '影响力', '形象'], elements: ['奖杯', '旗帜', '星星', '皇冠'] },
  { label: '创意/设计', triggers: ['创意', '设计', '美', '风格', '视觉', '色彩', '灵感', '艺术'], elements: ['调色板', '画笔', '钻石', '魔法棒'] },
  { label: '连接/集成', triggers: ['连接', '集成', '接口', 'api', '插件', '对接', '整合', '链接', '网络'], elements: ['链条', '插头', '拼图', '网格'] },
  { label: '发布/上线', triggers: ['发布', '上线', '部署', '推送', '更新', '版本', '迭代'], elements: ['火箭', '旗帜', '播放按钮', '上传箭头'] },
  { label: '成长/增长', triggers: ['成长', '增长', '提升', '上升', '进步', '扩展', '规模', '升级'], elements: ['上升箭头', '阶梯', '种子发芽', '图表'] },
]

// 兼容旧格式的映射(用于DNA等)
const ELEMENT_MAP = Object.fromEntries(
  SEMANTIC_CATEGORIES.map(c => [c.triggers[0], c.elements])
)

// 颜色预设
const COLOR_OPTIONS = {
  primary: [
    { label: '白色', value: '白色', color: '#ffffff', border: true },
    { label: '蓝色', value: '蓝色', color: '#3B82F6' },
    { label: '紫色', value: '紫色', color: '#8B5CF6' },
    { label: '绿色', value: '绿色', color: '#22C55E' },
    { label: '青色', value: '青色', color: '#06B6D4' },
    { label: '灰色', value: '灰色', color: '#6B7280' },
    { label: '黑色', value: '黑色', color: '#1F2937' },
  ],
  accent: [
    { label: '蓝色', value: '蓝色', color: '#3B82F6' },
    { label: '橙色', value: '橙色', color: '#F97316' },
    { label: '红色', value: '红色', color: '#EF4444' },
    { label: '黄色', value: '黄色', color: '#EAB308' },
    { label: '粉色', value: '粉色', color: '#EC4899' },
    { label: '紫色', value: '紫色', color: '#8B5CF6' },
    { label: '绿色', value: '绿色', color: '#22C55E' },
    { label: '青色', value: '青色', color: '#06B6D4' },
    { label: '金色', value: '金色', color: '#D4A017' },
  ],
}

const TEXTURE_OPTIONS = [
  { label: '磨砂质感', value: '磨砂质感', icon: '🪨' },
  { label: '磨砂玻璃', value: '磨砂玻璃质感', icon: '🧊' },
  { label: '透明玻璃', value: '透明玻璃质感', icon: '💎' },
  { label: '金属质感', value: '金属质感', icon: '🔩' },
  { label: '陶瓷质感', value: '陶瓷质感', icon: '🏺' },
  { label: '塑料质感', value: '塑料质感', icon: '🧴' },
  { label: '水晶质感', value: '水晶宝石质感', icon: '💠' },
  { label: '粘土质感', value: '手工粘土质感', icon: '🎨' },
]

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

function analyzeText(title, desc, primaryColor = '白色', accentColors = ['蓝色'], texture = '磨砂质感') {
  const text = `${title} ${desc}`.toLowerCase()

  // 第一步: 标题就是核心主体,直接作为图标主题
  const subject = title.trim()

  // 第二步: 从语义分类中找辅助元素(只做补充,不替代主体)
  const matched = []
  for (const cat of SEMANTIC_CATEGORIES) {
    // 只匹配2字以上的触发词,避免单字误匹配(如"人"匹配"无人机")
    const hitTriggers = cat.triggers.filter(t => t.length >= 2 && text.includes(t.toLowerCase()))
    if (hitTriggers.length > 0) {
      matched.push({ ...cat, hitTriggers, score: hitTriggers.length })
    }
  }
  matched.sort((a, b) => b.score - a.score)

  const reasons = []
  const supplementary = []

  // 分析思路: 解释为什么这样理解标题
  reasons.push(`核心主体: "${subject}" → 直接作为图标的视觉主题`)

  if (matched.length > 0) {
    const top = matched.slice(0, 2)
    for (const m of top) {
      const picks = m.elements.slice(0, 2)
      supplementary.push(...picks)
      reasons.push(`辅助元素: "${m.hitTriggers.join('/')}" → ${m.label}: ${picks.join(' / ')}`)
    }
  }

  // 构建元素列表: 主体 + 辅助(去重)
  const elements = [subject, ...supplementary.filter(s => !subject.includes(s))].slice(0, 4)

  const colorDesc = accentColors.length > 0
    ? `${primaryColor}为主色调搭配${accentColors.join('+')}点缀`
    : `${primaryColor}为主色调`

  // 生成提示词: 主体用标题原文,辅助元素点缀
  const subjectPart = supplementary.length > 0
    ? `${subject}，搭配${supplementary.slice(0, 2).join('和')}元素`
    : subject
  const prompt = `3D图标，主体为${subjectPart}，${texture}，${colorDesc}，等轴侧视角。Blender渲染，8K分辨率，纯白背景，无底座，减少细节。`

  return { elements, reasons, prompt }
}

export default function Analyzer() {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [primaryColor, setPrimaryColor] = useState('白色')
  const [accentColors, setAccentColors] = useState(['蓝色'])
  const [texture, setTexture] = useState('磨砂质感')
  const [elementCount, setElementCount] = useState(2)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pico_analyze_history') || '[]') } catch { return [] }
  })
  // batch
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState([])
  // DNA
  const [dnaInput, setDnaInput] = useState('')
  const [dnaResult, setDnaResult] = useState(null)

  const API_BASE = import.meta.env.VITE_COLLECT_API || 'https://api.shengtu.uk'

  const analyze = async () => {
    if (!title.trim()) { toast.error('请输入标题'); return }
    setLoading(true)
    try {
      // 调用 AI 分析接口
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), desc: desc.trim(), count: elementCount }),
      })
      const ai = await res.json()
      if (ai.error) throw new Error(ai.error)

      const colorDesc = accentColors.length > 0
        ? `${primaryColor}为主色调搭配${accentColors.join('+')}点缀`
        : `${primaryColor}为主色调`
      const elementsStr = ai.elements.join(' + ')
      const prompt = `3D图标，主体为${ai.subject || elementsStr}，包含${elementsStr}元素，${texture}，${colorDesc}，等轴侧视角。Blender渲染，8K分辨率，纯白背景，无底座，减少细节。`

      const newResult = {
        elements: ai.elements,
        reasons: [`AI分析: ${ai.reasoning}`],
        prompt,
      }
      setResult(newResult)
      // 保存历史
      const entry = { id: Date.now(), title: title.trim(), prompt, elements: ai.elements, time: new Date().toLocaleString('zh-CN') }
      const newHistory = [entry, ...history].slice(0, 50)
      setHistory(newHistory)
      localStorage.setItem('pico_analyze_history', JSON.stringify(newHistory))
    } catch (e) {
      // AI 失败时 fallback 到本地分析
      console.warn('AI analyze failed, fallback:', e)
      const fallback = analyzeText(title, desc, primaryColor, accentColors, texture)
      setResult(fallback)
      const entry = { id: Date.now(), title: title.trim(), prompt: fallback.prompt, elements: fallback.elements, time: new Date().toLocaleString('zh-CN') }
      const newHistory = [entry, ...history].slice(0, 50)
      setHistory(newHistory)
      localStorage.setItem('pico_analyze_history', JSON.stringify(newHistory))
    } finally {
      setLoading(false)
    }
  }

  const batchAnalyze = () => {
    const lines = batchInput.trim().split('\n').filter(Boolean)
    if (!lines.length) { toast.error('请输入内容'); return }
    const results = lines.map(line => {
      const [t, d = ''] = line.split('|')
      return { title: t.trim(), ...analyzeText(t, d, primaryColor, accentColors, texture) }
    })
    setBatchResults(results)
    toast.success(`已分析 ${results.length} 条`)
  }

  const handleDNA = () => {
    if (!dnaInput.trim()) { toast.error('请输入提示词'); return }
    setDnaResult(extractDNA(dnaInput))
  }

  const copyText = (t) => { copyToClipboard(t); toast.success('已复制') }

  const DNA_EXAMPLES = [
    '科技感透明图标，等轴侧视角，透明材质搭配蓝白光效。16K分辨率，Blender渲染，现代简约风格。干净背景，无底座。',
    'Cyberpunk neon icon, glowing edges with pink and cyan neon lights, dark background. Holographic material, Octane render, 8K resolution, no base.',
    '水晶宝石质感3D图标，内部光线折射，彩虹色散光。C4D+Redshift渲染，16K分辨率，纯黑背景。',
  ]

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('pico_analyze_history')
    toast.success('历史已清空')
  }

  return (
    <div className="flex gap-6 items-start">
    <div className="flex-1 min-w-0 space-y-4">
      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">单条分析</TabsTrigger>
          <TabsTrigger value="batch">批量分析</TabsTrigger>
          <TabsTrigger value="dna">风格DNA</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">主色</label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_OPTIONS.primary.map(c => (
                    <button key={c.value} onClick={() => setPrimaryColor(c.value)}
                      className={`w-9 h-9 rounded-full transition-all ${primaryColor === c.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'} ${c.border ? 'border border-border' : ''}`}
                      style={{ backgroundColor: c.color }} title={c.label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">点缀色 (可多选)</label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_OPTIONS.accent.map(c => {
                    const active = accentColors.includes(c.value)
                    return (
                      <button key={c.value} onClick={() => setAccentColors(prev => active ? prev.filter(x => x !== c.value) : [...prev, c.value])}
                        className={`w-9 h-9 rounded-full transition-all ${active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c.color }} title={c.label} />
                    )
                  })}
                </div>
                {(primaryColor || accentColors.length > 0) && (
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {primaryColor}{accentColors.length > 0 ? ` + ${accentColors.join(' + ')}` : ''}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">质感</label>
                <div className="flex flex-wrap gap-2">
                  {TEXTURE_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => setTexture(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${texture === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">元素数量</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setElementCount(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${elementCount === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">功能标题</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="如：云存储管理" className="h-11" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">功能描述</label>
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述该功能的用途..." rows={2} />
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
                <CardTitle className="text-base">分析结果</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="bg-muted p-4 rounded-lg text-sm cursor-pointer hover:bg-accent transition-colors group relative"
                  onClick={() => copyText(result.prompt)}>
                  {result.prompt}
                  <span className="absolute top-2 right-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">点击复制</span>
                </div>
                <Separator />
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
              <Button onClick={batchAnalyze}><Sparkles className="h-4 w-4 mr-1" />批量分析</Button>
            </CardContent>
          </Card>

          {batchResults.map((r, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{r.title}</span>
                  <Badge variant="outline" className="text-xs">3D图标</Badge>
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

    {/* 历史记录 */}
    <div className="flex-1 min-w-0 hidden lg:block">
      <Card className="sticky top-4">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">历史记录</CardTitle>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={clearHistory}>清空</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 max-h-[70vh] overflow-auto">
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">暂无记录</div>
          ) : (
            <div className="relative pl-4 border-l border-border space-y-4">
              {history.map(h => (
                <div key={h.id} className="relative group">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                  <div className="text-xs text-muted-foreground mb-1">{h.time}</div>
                  <div className="text-sm font-medium mb-1">{h.title}</div>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {h.elements?.map((e, i) => <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>)}
                  </div>
                  <div
                    className="text-xs text-muted-foreground bg-muted p-2 rounded cursor-pointer hover:bg-accent transition-colors line-clamp-3"
                    onClick={() => { copyText(h.prompt); }}
                    title="点击复制"
                  >
                    {h.prompt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
