import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRightLeft, Copy, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const DICT_ZH_EN = {
  // 材质
  '磨砂质感': 'frosted texture',
  '毛玻璃': 'frosted glass',
  '几何玻璃': 'geometric glass',
  '透明材质': 'transparent material',
  '塑料质感': 'plastic texture',
  '金属质感': 'metallic texture',
  '陶瓷质感': 'ceramic texture',
  '水晶材质': 'crystal material',
  '亚克力': 'acrylic',
  '磨砂光泽': 'frosted gloss',
  '高光边缘': 'highlight edge',
  '渐变色': 'gradient color',
  // 视角
  '等轴侧视角': 'isometric view',
  '等轴侧': 'isometric',
  '斜角透视': 'oblique perspective',
  '正面透视': 'front perspective',
  '平视角度': 'eye-level view',
  '俯视角度': 'top-down view',
  '45度角': '45-degree angle',
  '微距视角': 'macro view',
  '2.5D': '2.5D',
  // 风格
  '梦幻风格': 'dreamy style',
  '科技感': 'tech feel',
  '可爱清新': 'cute and fresh',
  '现代简约': 'modern minimalist',
  '赛博朋克': 'cyberpunk',
  '极简主义': 'minimalism',
  '扁平风格': 'flat design',
  '新拟态': 'neumorphism',
  'UI设计风格': 'UI design style',
  '微缩场景': 'miniature scene',
  '小场景': 'small scene',
  // 技术
  'C4D': 'Cinema 4D',
  'OC渲染器': 'OctaneRender',
  'Blender': 'Blender',
  '光线追踪': 'ray tracing',
  '8K分辨率': '8K resolution',
  '16K分辨率': '16K resolution',
  'HDRI照明': 'HDRI lighting',
  '全局光照': 'global illumination',
  'SSS次表面散射': 'SSS subsurface scattering',
  // 色调
  '低饱和度': 'low saturation',
  '柔和渐变': 'soft gradient',
  '蓝白配色': 'blue-white color scheme',
  '多彩低饱和': 'colorful low saturation',
  '单色渐变': 'monochrome gradient',
  '莫兰迪色系': 'Morandi color palette',
  '冷色调': 'cool tones',
  '暖色调': 'warm tones',
  '蓝紫渐变': 'blue-purple gradient',
  // 约束
  '减少细节': 'reduce details',
  '无底座': 'no base/pedestal',
  '干净背景': 'clean background',
  '无冗余装饰': 'no redundant decoration',
  '居中构图': 'centered composition',
  '无阴影': 'no shadow',
  '白色背景': 'white background',
  '简洁线条': 'clean lines',
  '纯白背景': 'pure white background',
  // 通用
  '3D图标': '3D icon',
  '图标设计': 'icon design',
  '圆角造型': 'rounded shape',
  '柔和光影': 'soft lighting',
  '柔和阴影': 'soft shadow',
  '梦幻光效': 'dreamy light effect',
  '超高清': 'ultra HD',
  '高清': 'HD',
}

// Build reverse dict
const DICT_EN_ZH = {}
Object.entries(DICT_ZH_EN).forEach(([zh, en]) => {
  DICT_EN_ZH[en.toLowerCase()] = zh
})

function detectLanguage(text) {
  const zhCount = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const enCount = (text.match(/[a-zA-Z]+/g) || []).length
  return zhCount >= enCount ? 'zh' : 'en'
}

function translateText(text, direction) {
  let result = text
  if (direction === 'zh2en') {
    // Sort by length descending to match longer phrases first
    const sorted = Object.entries(DICT_ZH_EN).sort((a, b) => b[0].length - a[0].length)
    for (const [zh, en] of sorted) {
      result = result.replaceAll(zh, en)
    }
  } else {
    const sorted = Object.entries(DICT_EN_ZH).sort((a, b) => b[0].length - a[0].length)
    for (const [en, zh] of sorted) {
      // Case-insensitive replace
      const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      result = result.replace(regex, zh)
    }
  }
  return result
}

function findMatches(text) {
  const matches = []
  const sorted = Object.entries(DICT_ZH_EN).sort((a, b) => b[0].length - a[0].length)
  for (const [zh, en] of sorted) {
    if (text.includes(zh) || text.toLowerCase().includes(en.toLowerCase())) {
      matches.push({ zh, en })
    }
  }
  return matches
}

export default function Translator() {
  const [input, setInput] = useState('')
  const [direction, setDirection] = useState('auto') // auto, zh2en, en2zh

  const effectiveDirection = useMemo(() => {
    if (direction !== 'auto') return direction
    return detectLanguage(input) === 'zh' ? 'zh2en' : 'en2zh'
  }, [input, direction])

  const output = useMemo(() => {
    if (!input.trim()) return ''
    return translateText(input, effectiveDirection)
  }, [input, effectiveDirection])

  const matches = useMemo(() => findMatches(input), [input])

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制')
  }

  const swap = () => {
    setInput(output)
    setDirection(effectiveDirection === 'zh2en' ? 'en2zh' : 'zh2en')
  }

  // Common prompt phrases for quick input
  const QUICK = [
    '磨砂质感 3D图标 等轴侧视角 白色背景',
    'frosted texture 3D icon isometric view white background',
    '科技感 透明材质 蓝白配色 16K分辨率',
    '梦幻风格 几何玻璃 柔和渐变 C4D',
  ]

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">提示词翻译</h2>
        <Badge variant="outline" className="text-xs">
          {effectiveDirection === 'zh2en' ? '中 → 英' : '英 → 中'}
        </Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        {QUICK.map((q, i) => (
          <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-accent transition-colors text-xs" onClick={() => setInput(q)}>
            <Sparkles className="h-3 w-3 mr-1" />{q.slice(0, 20)}...
          </Badge>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">{effectiveDirection === 'zh2en' ? '中文' : 'English'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={effectiveDirection === 'zh2en' ? '输入中文提示词...' : 'Enter English prompt...'}
              rows={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{effectiveDirection === 'zh2en' ? 'English' : '中文'}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={swap} title="交换">
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(output)} title="复制">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap min-h-[118px]">
              {output || <span className="text-muted-foreground">翻译结果</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {matches.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">识别到的关键词 ({matches.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {matches.map(({ zh, en }) => (
                <div key={zh} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1.5 cursor-pointer hover:bg-muted transition-colors" onClick={() => copy(`${zh} / ${en}`)}>
                  <span className="text-foreground">{zh}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-blue-400">{en}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        内置 {Object.keys(DICT_ZH_EN).length} 个图标提示词对照 · 自动检测语言方向 · 点击关键词复制
      </p>
    </div>
  )
}
