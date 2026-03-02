import { copyToClipboard } from '@/lib/clipboard'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
// Select removed
import { Loader2, Sparkles, Copy, Dna, Zap, ArrowRight, ImageIcon, ChevronDown, ChevronUp, Download, Package, X, Check } from 'lucide-react'
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

function analyzeText(title, desc, primaryColor = '白色', accentColors = ['蓝色'], texture = '磨砂质感', noShadow = true) {
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
  const shadowStr = noShadow ? '，无投影，无阴影，物体悬浮在纯白背景上，底部没有任何阴影或反射' : '，带柔和投影'
  const prompt = `3D图标，主体为${subjectPart}，${texture}，${colorDesc}，等轴侧视角。Blender渲染，8K分辨率，纯白背景(#FFFFFF)，无底座${shadowStr}，减少细节。`

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
  const [history, setHistory] = useState([])

  // 加载历史
  useEffect(() => {
    const API = import.meta.env.VITE_COLLECT_API || 'https://api.shengtu.uk'
    fetch(`${API}/api/history`).then(r => r.json()).then(setHistory).catch(() => {
      try { setHistory(JSON.parse(localStorage.getItem('pico_analyze_history') || '[]')) } catch {}
    })
    // 加载生图历史
    fetch(`${API}/api/gen-history`).then(r => r.json()).then(setGenHistory).catch(() => {
      try { setGenHistory(JSON.parse(localStorage.getItem('pico_gen_history') || '[]')) } catch {}
    })
  }, [])

  const downloadImage = async (url, filename) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename || 'pico-image.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
      toast.success('下载成功')
    } catch { toast.error('下载失败') }
  }

  const downloadAll = async (images, prefix) => {
    for (let i = 0; i < images.length; i++) {
      await downloadImage(images[i], `${prefix}-${i + 1}.png`)
      if (i < images.length - 1) await new Promise(r => setTimeout(r, 500))
    }
  }
  // batch
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState([])
  // DNA
  const [dnaInput, setDnaInput] = useState('')
  const [dnaResult, setDnaResult] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState([])
  const [imageSize, setImageSize] = useState('2k-1:1')
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [autoGen, setAutoGen] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [editPromptText, setEditPromptText] = useState('')
  const [enPrompt, setEnPrompt] = useState('')
  const [translating, setTranslating] = useState(false)
  const [noShadow, setNoShadow] = useState(true)
  const [genHistory, setGenHistory] = useState([])
  const [showBatchDl, setShowBatchDl] = useState(false)
  const [selectedDl, setSelectedDl] = useState(new Set())
  const [rightTab, setRightTab] = useState('gen')

  const [resolution, setResolution] = useState('2k')
  const [ratio, setRatio] = useState('1:1')

  const RATIO_OPTIONS = [
    { value: '1:1', label: '1:1' },
    { value: '4:3', label: '4:3' },
    { value: '3:2', label: '3:2' },
    { value: '16:9', label: '16:9' },
  ]
  const RES_OPTIONS = [
    { value: '1k', label: '1K' },
    { value: '2k', label: '2K' },
    { value: '4k', label: '4K' },
  ]
  const SIZE_MAP = {
    '1k-1:1': { w: 1024, h: 1024 }, '1k-4:3': { w: 1152, h: 864 }, '1k-3:2': { w: 1248, h: 832 }, '1k-16:9': { w: 1280, h: 720 },
    '2k-1:1': { w: 2048, h: 2048 }, '2k-4:3': { w: 2304, h: 1728 }, '2k-3:2': { w: 2496, h: 1664 }, '2k-16:9': { w: 2560, h: 1440 },
    '4k-1:1': { w: 4096, h: 4096 }, '4k-4:3': { w: 4694, h: 3520 }, '4k-3:2': { w: 4992, h: 3328 }, '4k-16:9': { w: 5404, h: 3040 },
  }

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
      const layoutDesc = ai.layout ? `，${ai.layout}` : ''
      const shadowStr = noShadow ? '，无投影，无阴影，物体悬浮在纯白背景上，底部没有任何阴影或反射' : '，带柔和投影'
      const prompt = `单个3D图标，主体为${ai.subject || elementsStr}，包含${elementsStr}元素${layoutDesc}，所有元素组合在同一个图标中且保持独立完整造型，${texture}，${colorDesc}，等轴侧视角。Blender渲染，8K分辨率，纯白背景(#FFFFFF)，无底座${shadowStr}，减少细节，只生成一张图。`

      const newResult = {
        elements: ai.elements,
        reasons: [`AI分析: ${ai.reasoning}`],
        prompt,
      }
      setResult(newResult)
      setEditingPrompt(false)
      translatePrompt(prompt)
      // 保存历史到后端
      const entry = { title: title.trim(), prompt, elements: ai.elements, time: new Date().toLocaleString('zh-CN') }
      fetch(`${API_BASE}/api/history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }).catch(() => {})
      setHistory(prev => [{ ...entry, id: Date.now() }, ...prev].slice(0, 200))
    } catch (e) {
      // AI 失败时 fallback 到本地分析
      console.warn('AI analyze failed, fallback:', e)
      const fallback = analyzeText(title, desc, primaryColor, accentColors, texture, noShadow)
      setResult(fallback)
      const entry = { title: title.trim(), prompt: fallback.prompt, elements: fallback.elements, time: new Date().toLocaleString('zh-CN') }
      fetch(`${API_BASE}/api/history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }).catch(() => {})
      setHistory(prev => [{ ...entry, id: Date.now() }, ...prev].slice(0, 200))
    } finally {
      setLoading(false)
      if (autoGen) setPendingAutoGen(true)
    }
  }

  const translatePrompt = async (text) => {
    setTranslating(true)
    try {
      const res = await fetch(`${API_BASE}/api/translate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      if (data.translated) setEnPrompt(data.translated)
    } catch (e) { console.warn('translate failed:', e) }
    finally { setTranslating(false) }
  }

  // 自动生图: 分析完成后自动触发
  const [pendingAutoGen, setPendingAutoGen] = useState(false)
  useEffect(() => {
    if (pendingAutoGen && result?.prompt && !generating) {
      setPendingAutoGen(false)
      generateImage()
    }
  }, [pendingAutoGen, result])

  const generateImage = async () => {
    if (!result?.prompt) { toast.error('请先分析生成提示词'); return }
    setGenerating(true)
    setGeneratedImages([])
    try {
      // 提交任务
      const sizeKey = `${resolution}-${ratio}`
      const sizeOpt = SIZE_MAP[sizeKey] || SIZE_MAP['2k-1:1']
      const submitRes = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: result.prompt, width: sizeOpt.w, height: sizeOpt.h }),
      })
      const submitData = await submitRes.json()
      if (!submitData.task_id) throw new Error(submitData.error || '提交失败')

      toast.info('图片生成中, 请稍候...')

      // 轮询结果
      let attempts = 0
      const maxAttempts = 60
      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000))
        const queryRes = await fetch(`${API_BASE}/api/generate/result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: submitData.task_id }),
        })
        const queryData = await queryRes.json()
        if (queryData.status === 'done' && queryData.images?.length) {
          setGeneratedImages(queryData.images)
          const genEntry = {
            id: Date.now(),
            title: title.trim() || '未命名',
            prompt: result.prompt,
            images: queryData.images,
            size: `${resolution}-${ratio}`,
            time: new Date().toLocaleString('zh-CN'),
          }
          setGenHistory(prev => {
            const updated = [genEntry, ...prev].slice(0, 100)
            fetch(`${API_BASE}/api/gen-history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(genEntry) }).catch(() => {})
            localStorage.setItem('pico_gen_history', JSON.stringify(updated))
            return updated
          })
          toast.success('图片生成完成')
          return
        }
        if (queryData.status === 'done' && !queryData.images?.length) {
          throw new Error('生成完成但无图片返回')
        }
        if (queryData.error) throw new Error(queryData.error)
        attempts++
      }
      throw new Error('生成超时, 请重试')
    } catch (e) {
      console.error('Generate error:', e)
      toast.error(e.message || '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const batchAnalyze = () => {
    const lines = batchInput.trim().split('\n').filter(Boolean)
    if (!lines.length) { toast.error('请输入内容'); return }
    const results = lines.map(line => {
      const [t, d = ''] = line.split('|')
      return { title: t.trim(), ...analyzeText(t, d, primaryColor, accentColors, texture, noShadow) }
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
    const API = import.meta.env.VITE_COLLECT_API || 'https://api.shengtu.uk'
    fetch(`${API}/api/history`, { method: 'DELETE' }).catch(() => {})
    setHistory([])
    toast.success('历史已清空')
  }

  const settingsSummary = `${primaryColor}${accentColors.length ? ' + ' + accentColors.join('+') : ''} · ${texture} · ${elementCount}个元素 · ${noShadow ? '无投影' : '有投影'} · ${autoGen ? '自动生图' : '手动生图'}`

  return (
    <div className="space-y-4">
      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">单条分析</TabsTrigger>
          <TabsTrigger value="batch">批量分析</TabsTrigger>
          <TabsTrigger value="dna">风格DNA</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
    {/* 左栏: 输入 */}
    <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">功能标题</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !loading) analyze() }} placeholder="如：云存储管理" className="h-11" />
                </div>
                <Button onClick={analyze} disabled={loading} className="h-11 px-6 text-base shrink-0">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-1.5" /> : <Sparkles className="h-5 w-5 mr-1.5" />}
                  分析
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">功能描述</label>
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述该功能的用途 (可选)" rows={1} className="min-h-[40px] resize-y" />
              </div>

              {/* 可折叠的样式配置 */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button onClick={() => setSettingsOpen(!settingsOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">样式配置</span>
                    {!settingsOpen && <span className="text-xs text-muted-foreground">{settingsSummary}</span>}
                  </div>
                  {settingsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {settingsOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
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
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">投影</label>
                      <div className="flex gap-2">
                        {[{ value: true, label: '无投影' }, { value: false, label: '有投影' }].map(opt => (
                          <button key={String(opt.value)} onClick={() => setNoShadow(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${noShadow === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">自动生图</label>
                      <button onClick={() => setAutoGen(!autoGen)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoGen ? 'bg-primary' : 'bg-muted'}`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${autoGen ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
    </div>

    {/* 中栏: 分析结果 + 生图 */}
    <div className="space-y-4 min-h-[60vh]">
      {result ? (
        <>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">提示词</div>
                <div className="flex gap-1">
                  {editingPrompt ? (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
                      setResult({ ...result, prompt: editPromptText })
                      setEditingPrompt(false)
                      translatePrompt(editPromptText)
                    }}>保存</Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
                      setEditPromptText(result.prompt)
                      setEditingPrompt(true)
                    }}>编辑</Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyText(result.prompt)}>
                    <Copy className="h-3 w-3 mr-1" />复制
                  </Button>
                </div>
              </div>
              {editingPrompt ? (
                <Textarea value={editPromptText} onChange={e => setEditPromptText(e.target.value)}
                  className="text-sm min-h-[80px]" rows={4} />
              ) : (
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div className="text-xs text-muted-foreground mb-1">中文</div>
                    {result.prompt}
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <div className="text-xs text-muted-foreground mb-1">English</div>
                    {translating ? <span className="text-muted-foreground">翻译中...</span> : (enPrompt || <span className="text-muted-foreground">等待翻译</span>)}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">推荐元素</div>
                <div className="flex flex-wrap gap-1">
                  {result.elements.map((e, i) => <Badge key={i} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">{e}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">比例</label>
                  <div className="flex gap-1">
                    {RATIO_OPTIONS.map(r => (
                      <button key={r.value} onClick={() => setRatio(r.value)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-all ${ratio === r.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">清晰度</label>
                  <div className="flex gap-1">
                    {RES_OPTIONS.map(r => (
                      <button key={r.value} onClick={() => setResolution(r.value)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-all ${resolution === r.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={generateImage} disabled={generating} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ImageIcon className="h-4 w-4 mr-1" />}
                {generating ? '生成中...' : '生成图片'}
              </Button>
              {generatedImages.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {generatedImages.map((url, i) => (
                      <div key={i} className="relative group">
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`生成图片 ${i + 1}`} className="rounded-lg w-full hover:opacity-90 transition-opacity" />
                        </a>
                        <button onClick={() => downloadImage(url, `${title || 'pico'}-${i + 1}.png`)}
                          className="absolute top-2 right-2 p-2.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {generatedImages.length > 1 && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => downloadAll(generatedImages, title || 'pico')}>
                      <Download className="h-3 w-3 mr-1" />全部下载 ({generatedImages.length}张)
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  {generating ? (
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                      <span className="text-sm text-muted-foreground">生成中...</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                      <span className="text-xs text-muted-foreground">图片预览</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="h-full">
          <CardContent className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center h-full">
            输入功能标题, 点击分析生成提示词
          </CardContent>
        </Card>
      )}
    </div>

    {/* 右栏: 历史记录 */}
    <div className="hidden lg:block">
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button onClick={() => setRightTab('gen')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${rightTab === 'gen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                生图记录
              </button>
              <button onClick={() => setRightTab('analyze')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${rightTab === 'analyze' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                分析记录
              </button>
            </div>
            {rightTab === 'analyze' && history.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={clearHistory}>清空</Button>
            )}
            {rightTab === 'gen' && genHistory.length > 0 && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => {
                  setSelectedDl(new Set())
                  setShowBatchDl(true)
                }}><Package className="h-3 w-3 mr-1" />批量下载</Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => {
                  fetch(`${API_BASE}/api/gen-history`, { method: 'DELETE' }).catch(() => {})
                  setGenHistory([])
                  localStorage.removeItem('pico_gen_history')
                  toast.success('生图记录已清空')
                }}>清空</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 max-h-[70vh] overflow-auto">
          {rightTab === 'gen' && (
            genHistory.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">暂无生图记录</div>
            ) : (
              <div className="space-y-4">
                {genHistory.map(g => (
                  <div key={g.id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{g.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{g.time}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {g.images?.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="" className="rounded w-full aspect-square object-cover" />
                          <button onClick={() => downloadImage(url, `${g.title}-${i + 1}.png`)}
                            className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {g.images?.length > 1 && (
                      <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => downloadAll(g.images, g.title)}>
                        <Download className="h-3 w-3 mr-1" />全部下载 ({g.images.length}张)
                      </Button>
                    )}
                    <div className="text-xs text-muted-foreground line-clamp-2 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => copyText(g.prompt)} title="点击复制提示词">
                      {g.prompt}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {rightTab === 'analyze' && (
            history.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">暂无记录</div>
            ) : (
              <div className="relative pl-4 border-l border-border space-y-4">
                {history.map(h => (
                  <div key={h.id} className="relative group">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                    <div className="text-xs text-muted-foreground mb-1">{h.time}</div>
                    <div className="text-sm font-medium mb-1">{h.title}</div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {h.elements?.map((e, i) => <Badge key={i} className="text-xs bg-primary/10 text-primary border-primary/20">{e}</Badge>)}
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded cursor-pointer hover:bg-accent transition-colors line-clamp-3"
                      onClick={() => copyText(h.prompt)} title="点击复制">
                      {h.prompt}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
    </div>
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
                <div className="flex flex-wrap gap-1">{r.elements.map((e, j) => <Badge key={j} className="bg-primary/10 text-primary border-primary/20">{e}</Badge>)}</div>
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
              <Textarea value={dnaInput} onChange={e => setDnaInput(e.target.value)} placeholder="粘贴一段提示词,分析其风格DNA..." rows={4} />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleDNA}><Zap className="h-4 w-4 mr-1" />提取DNA</Button>
                <Button variant="outline" onClick={() => { setDnaInput(''); setDnaResult(null) }}>清空</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center">示例:</span>
                {DNA_EXAMPLES.map((ex, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-accent text-xs" onClick={() => setDnaInput(ex)}>示例 {i + 1}</Badge>
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
                         dnaResult.completeness >= 50 ? '基本维度覆盖,部分缺失' : '风格定义不完整,建议补充更多维度'}
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
                        {dnaResult.unmatched.map(d => <Badge key={d} variant="outline" className="text-xs text-red-400 border-red-400/30">{d}</Badge>)}
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

      {/* 批量下载弹窗 */}
      {showBatchDl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBatchDl(false)}>
          <div className="bg-background rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">批量下载 ({selectedDl.size} 张已选)</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => {
                  const all = new Set()
                  genHistory.forEach(g => g.images?.forEach(url => all.add(url)))
                  setSelectedDl(prev => prev.size === all.size ? new Set() : all)
                }}>
                  {(() => { let total = 0; genHistory.forEach(g => total += (g.images?.length || 0)); return selectedDl.size === total ? '取消全选' : '全选' })()}
                </Button>
                <Button size="sm" disabled={selectedDl.size === 0} className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
                  selectedDl.forEach(url => {
                    const a = document.createElement('a'); a.href = url; a.download = ''; a.target = '_blank'; document.body.appendChild(a); a.click(); a.remove()
                  })
                  toast.success(`开始下载 ${selectedDl.size} 张图片`)
                  setShowBatchDl(false)
                }}>
                  <Download className="h-3.5 w-3.5 mr-1" />下载选中
                </Button>
                <button onClick={() => setShowBatchDl(false)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex-1 space-y-4">
              {[...genHistory].sort((a, b) => new Date(b.time) - new Date(a.time)).map(g => (
                <div key={g.id}>
                  <div className="text-xs text-muted-foreground mb-2">{g.time} — {g.title}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {g.images?.map((url, i) => (
                      <div key={i} className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedDl.has(url) ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'}`}
                        onClick={() => setSelectedDl(prev => { const n = new Set(prev); n.has(url) ? n.delete(url) : n.add(url); return n })}>
                        <img src={url} alt="" className="w-full aspect-square object-cover" />
                        {selectedDl.has(url) && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
