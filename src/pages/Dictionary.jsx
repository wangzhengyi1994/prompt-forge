import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Globe, Copy } from 'lucide-react'
import { toast } from 'sonner'

const DICT = {
  材质词: [
    { zh: '磨砂质感', en: 'frosted texture' },
    { zh: '毛玻璃', en: 'frosted glass' },
    { zh: '几何玻璃', en: 'geometric glass' },
    { zh: '透明材质', en: 'transparent material' },
    { zh: '塑料质感', en: 'plastic texture' },
    { zh: '磨砂光泽', en: 'frosted gloss' },
    { zh: '金属质感', en: 'metallic texture' },
    { zh: '陶瓷质感', en: 'ceramic texture' },
    { zh: '水晶材质', en: 'crystal material' },
    { zh: '亚克力', en: 'acrylic' },
    { zh: '高光边缘', en: 'highlight edge' },
    { zh: '渐变色', en: 'gradient color' },
    { zh: '半透明', en: 'translucent' },
    { zh: '浮雕质感', en: 'embossed texture' },
    { zh: '丝绒质感', en: 'velvet texture' },
    { zh: '珐琅质感', en: 'enamel texture' },
  ],
  视角词: [
    { zh: '等轴侧视角', en: 'isometric view' },
    { zh: '斜角透视', en: 'oblique perspective' },
    { zh: '正面透视', en: 'front perspective' },
    { zh: '平视角度', en: 'eye-level view' },
    { zh: '2.5D', en: '2.5D' },
    { zh: '俯视角度', en: 'top-down view' },
    { zh: '45度角', en: '45-degree angle' },
    { zh: '微距视角', en: 'macro view' },
    { zh: '仰视角度', en: 'low-angle view' },
    { zh: '三分之四视角', en: 'three-quarter view' },
    { zh: '鸟瞰视角', en: "bird's eye view" },
  ],
  风格词: [
    { zh: '梦幻风格', en: 'dreamy style' },
    { zh: '科技感', en: 'tech feel' },
    { zh: '可爱清新', en: 'cute and fresh' },
    { zh: '现代简约', en: 'modern minimalist' },
    { zh: 'UI设计风格', en: 'UI design style' },
    { zh: '赛博朋克', en: 'cyberpunk' },
    { zh: '极简主义', en: 'minimalism' },
    { zh: '扁平风格', en: 'flat design' },
    { zh: '新拟态', en: 'neumorphism' },
    { zh: '微缩场景', en: 'miniature scene' },
    { zh: '像素风格', en: 'pixel art style' },
    { zh: '孟菲斯风格', en: 'Memphis style' },
    { zh: '波普艺术', en: 'pop art' },
    { zh: '蒸汽波', en: 'vaporwave' },
    { zh: '洛可可风', en: 'Rococo style' },
    { zh: '包豪斯风格', en: 'Bauhaus style' },
  ],
  技术词: [
    { zh: 'C4D', en: 'Cinema 4D' },
    { zh: 'OC渲染器', en: 'OctaneRender' },
    { zh: 'Blender', en: 'Blender' },
    { zh: '光线追踪', en: 'ray tracing' },
    { zh: '8K分辨率', en: '8K resolution' },
    { zh: '16K分辨率', en: '16K resolution' },
    { zh: 'HDRI照明', en: 'HDRI lighting' },
    { zh: '全局光照', en: 'global illumination' },
    { zh: 'SSS次表面散射', en: 'SSS subsurface scattering' },
    { zh: '体积光', en: 'volumetric light' },
    { zh: '景深效果', en: 'depth of field' },
    { zh: '抗锯齿', en: 'anti-aliasing' },
    { zh: '法线贴图', en: 'normal map' },
    { zh: 'PBR材质', en: 'PBR material' },
  ],
  色调词: [
    { zh: '低饱和度', en: 'low saturation' },
    { zh: '柔和渐变', en: 'soft gradient' },
    { zh: '蓝白配色', en: 'blue-white color scheme' },
    { zh: '多彩低饱和', en: 'colorful low saturation' },
    { zh: '单色渐变', en: 'monochrome gradient' },
    { zh: '莫兰迪色系', en: 'Morandi color palette' },
    { zh: '冷色调', en: 'cool tones' },
    { zh: '暖色调', en: 'warm tones' },
    { zh: '蓝紫渐变', en: 'blue-purple gradient' },
    { zh: '霓虹色', en: 'neon colors' },
    { zh: '马卡龙配色', en: 'macaron color palette' },
    { zh: '黑金配色', en: 'black-gold color scheme' },
    { zh: '糖果色', en: 'candy colors' },
  ],
  约束词: [
    { zh: '减少细节', en: 'reduce details' },
    { zh: '无底座', en: 'no base/pedestal' },
    { zh: '干净背景', en: 'clean background' },
    { zh: '无冗余装饰', en: 'no redundant decoration' },
    { zh: '居中构图', en: 'centered composition' },
    { zh: '无阴影', en: 'no shadow' },
    { zh: '白色背景', en: 'white background' },
    { zh: '简洁线条', en: 'clean lines' },
    { zh: '去除多余元素', en: 'remove excess elements' },
    { zh: '纯白背景', en: 'pure white background' },
    { zh: '单一主体', en: 'single subject' },
    { zh: '负空间', en: 'negative space' },
  ],
  光影词: [
    { zh: '柔和光影', en: 'soft lighting' },
    { zh: '柔和阴影', en: 'soft shadow' },
    { zh: '梦幻光效', en: 'dreamy light effect' },
    { zh: '背光效果', en: 'backlight effect' },
    { zh: '环境光遮蔽', en: 'ambient occlusion' },
    { zh: '丁达尔效应', en: 'Tyndall effect' },
    { zh: '顶光照明', en: 'top lighting' },
    { zh: '侧光照明', en: 'side lighting' },
    { zh: '漫射光', en: 'diffused light' },
    { zh: '辉光效果', en: 'glow effect' },
    { zh: '焦散效果', en: 'caustics effect' },
  ],
}

export default function Dictionary() {
  const [search, setSearch] = useState('')
  const [showEn, setShowEn] = useState(false)
  const [selected, setSelected] = useState([])

  const totalCount = useMemo(() => Object.values(DICT).reduce((s, arr) => s + arr.length, 0), [])

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success(`已复制: ${text}`)
  }

  const toggleSelect = (word) => {
    setSelected(prev =>
      prev.find(w => w.zh === word.zh)
        ? prev.filter(w => w.zh !== word.zh)
        : [...prev, word]
    )
  }

  const copySelected = () => {
    if (selected.length === 0) return
    const text = selected.map(w => showEn ? w.en : w.zh).join(', ')
    navigator.clipboard.writeText(text)
    toast.success(`已复制 ${selected.length} 个关键词`)
  }

  const clearSelected = () => setSelected([])

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索关键词(中/英)..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant={showEn ? 'default' : 'outline'} size="sm" onClick={() => setShowEn(!showEn)} className="gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          {showEn ? '显示英文' : '仅中文'}
        </Button>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-xs text-muted-foreground">已选 {selected.length} 个</span>
          <div className="flex-1 flex flex-wrap gap-1">
            {selected.map(w => (
              <Badge key={w.zh} variant="secondary" className="text-xs cursor-pointer" onClick={() => toggleSelect(w)}>
                {w.zh} ×
              </Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={copySelected}>
            <Copy className="h-3 w-3" />复制
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={clearSelected}>清空</Button>
        </div>
      )}

      <div className="grid gap-4">
        {Object.entries(DICT).map(([cat, words]) => {
          const filtered = words.filter(w =>
            !search || w.zh.includes(search) || w.en.toLowerCase().includes(search.toLowerCase())
          )
          if (filtered.length === 0) return null
          return (
            <Card key={cat}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {cat}
                  <span className="text-xs text-muted-foreground font-normal">{filtered.length} 词</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex flex-wrap gap-2">
                {filtered.map(w => {
                  const isSelected = selected.find(s => s.zh === w.zh)
                  return (
                    <Badge
                      key={w.zh}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-accent transition-colors px-3 py-1.5 gap-1.5"
                      onClick={() => toggleSelect(w)}
                      onDoubleClick={(e) => { e.preventDefault(); copy(showEn ? w.en : w.zh) }}
                    >
                      <span>{w.zh}</span>
                      {showEn && <span className="text-blue-400 text-[10px]">{w.en}</span>}
                    </Badge>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        共 {totalCount} 个关键词 · 单击选中 · 双击直接复制 · 支持中英文搜索
      </p>
    </div>
  )
}
