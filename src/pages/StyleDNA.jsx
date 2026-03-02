import { copyToClipboard } from '@/lib/clipboard'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Dna, Sparkles, Check, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'

const DNA_DIMENSIONS = [
  {
    key: 'style',
    label: '风格基因',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    keywords: [
      { zh: '梦幻', en: 'dreamy' }, { zh: '科技', en: 'tech' }, { zh: '可爱', en: 'cute' },
      { zh: '现代简约', en: 'modern minimalist' }, { zh: '赛博朋克', en: 'cyberpunk' },
      { zh: '极简', en: 'minimalist' }, { zh: '扁平', en: 'flat' }, { zh: '新拟态', en: 'neumorphism' },
      { zh: '像素', en: 'pixel' }, { zh: '复古', en: 'retro' }, { zh: '奢华', en: 'luxury' },
      { zh: '粘土', en: 'clay' }, { zh: '水彩', en: 'watercolor' }, { zh: '手绘', en: 'hand-drawn' },
      { zh: '卡通', en: 'cartoon' }, { zh: 'abstract', en: 'abstract' }, { zh: 'realistic', en: 'realistic' },
    ],
  },
  {
    key: 'material',
    label: '材质基因',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    keywords: [
      { zh: '磨砂', en: 'frosted' }, { zh: '玻璃', en: 'glass' }, { zh: '金属', en: 'metallic' },
      { zh: '透明', en: 'transparent' }, { zh: '塑料', en: 'plastic' }, { zh: '陶瓷', en: 'ceramic' },
      { zh: '水晶', en: 'crystal' }, { zh: '亚克力', en: 'acrylic' }, { zh: '全息', en: 'holographic' },
      { zh: '霓虹', en: 'neon' }, { zh: '粘土', en: 'clay' }, { zh: '布料', en: 'fabric' },
      { zh: '木质', en: 'wooden' }, { zh: '纸张', en: 'paper' },
    ],
  },
  {
    key: 'palette',
    label: '配色基因',
    color: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    keywords: [
      { zh: '蓝白', en: 'blue-white' }, { zh: '低饱和', en: 'low saturation' },
      { zh: '渐变', en: 'gradient' }, { zh: '单色', en: 'monochrome' },
      { zh: '马卡龙', en: 'macaron' }, { zh: '莫兰迪', en: 'morandi' },
      { zh: '暖色', en: 'warm' }, { zh: '冷色', en: 'cool' },
      { zh: '粉紫', en: 'pink-purple' }, { zh: '霓虹', en: 'neon' },
      { zh: '大地色', en: 'earth tones' }, { zh: '高饱和', en: 'vibrant' },
      { zh: '彩虹', en: 'rainbow' }, { zh: 'pastel', en: 'pastel' },
    ],
  },
  {
    key: 'perspective',
    label: '视角基因',
    color: 'bg-green-500/15 text-green-400 border-green-500/30',
    keywords: [
      { zh: '2.5D', en: '2.5D' }, { zh: '等轴侧', en: 'isometric' },
      { zh: '斜角透视', en: 'oblique' }, { zh: '正面', en: 'front' },
      { zh: '俯视', en: 'top-down' }, { zh: '仰视', en: 'low angle' },
      { zh: '平视', en: 'eye-level' }, { zh: '微距', en: 'macro' },
      { zh: '45度', en: '45-degree' },
    ],
  },
  {
    key: 'tech',
    label: '技术基因',
    color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    keywords: [
      { zh: 'C4D', en: 'C4D' }, { zh: 'OC', en: 'Octane' }, { zh: 'Blender', en: 'Blender' },
      { zh: 'Redshift', en: 'Redshift' }, { zh: '8K', en: '8K' }, { zh: '16K', en: '16K' },
      { zh: '4K', en: '4K' }, { zh: '光线追踪', en: 'ray tracing' },
      { zh: 'HDRI', en: 'HDRI' }, { zh: 'SSS', en: 'SSS' },
      { zh: 'ray tracing', en: 'ray tracing' }, { zh: 'Octane', en: 'Octane' },
    ],
  },
  {
    key: 'constraint',
    label: '约束基因',
    color: 'bg-red-500/15 text-red-400 border-red-500/30',
    keywords: [
      { zh: '无底座', en: 'no base' }, { zh: '干净背景', en: 'clean bg' },
      { zh: '纯白背景', en: 'white bg' }, { zh: '纯黑背景', en: 'black bg' },
      { zh: '无阴影', en: 'no shadow' }, { zh: '减少细节', en: 'less detail' },
      { zh: '简洁', en: 'clean' }, { zh: '居中', en: 'centered' },
      { zh: '无冗余', en: 'no clutter' }, { zh: '统一', en: 'unified' },
    ],
  },
]

const STORAGE_KEY = 'pico_dna_profiles'

function getProfiles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveProfiles(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) }

function extractDNA(text) {
  const t = text.toLowerCase()
  const result = {}
  for (const dim of DNA_DIMENSIONS) {
    const matched = dim.keywords.filter(kw =>
      t.includes(kw.zh.toLowerCase()) || t.includes(kw.en.toLowerCase())
    )
    // Deduplicate by zh
    const seen = new Set()
    result[dim.key] = matched.filter(m => {
      if (seen.has(m.zh)) return false
      seen.add(m.zh)
      return true
    })
  }
  return result
}

function dnaToPromptFragment(dna) {
  const parts = []
  if (dna.style?.length) parts.push(dna.style.map(k => k.zh).join('+') + '风格')
  if (dna.material?.length) parts.push(dna.material.map(k => k.zh).join('+') + '材质')
  if (dna.palette?.length) parts.push(dna.palette.map(k => k.zh).join('+') + '配色')
  if (dna.perspective?.length) parts.push(dna.perspective.map(k => k.zh).join('') + '视角')
  if (dna.tech?.length) parts.push(dna.tech.map(k => k.zh).join('+'))
  if (dna.constraint?.length) parts.push(dna.constraint.map(k => k.zh).join('，'))
  return parts.join('，')
}

function dnaScore(dna) {
  let filled = 0
  for (const dim of DNA_DIMENSIONS) {
    if (dna[dim.key]?.length > 0) filled++
  }
  return filled
}

const EXAMPLES = [
  '2.5D风格磨砂质感图标设计，多彩低饱和度配色，一组6个图标。磨砂玻璃材质，柔和光影，圆角造型。Blender渲染，8K分辨率，白色背景，干净简洁。',
  'Cyberpunk neon icon, glowing edges with pink and cyan neon lights, dark background. Holographic material, Octane render, 8K resolution, no base.',
  '手绘水彩风格植物图标，自然晕染效果，温暖的大地色系。纸张纹理背景，文艺清新风格。',
]

export default function StyleDNA() {
  const [input, setInput] = useState('')
  const [extracted, setExtracted] = useState(false)
  const [profiles, setProfiles] = useState(getProfiles)
  const [copied, setCopied] = useState(null)

  const dna = useMemo(() => extractDNA(input), [input])
  const totalMatched = useMemo(() => Object.values(dna).reduce((s, arr) => s + arr.length, 0), [dna])
  const score = useMemo(() => dnaScore(dna), [dna])

  const handleExtract = () => {
    if (!input.trim()) { toast.error('请输入提示词'); return }
    setExtracted(true)
  }

  const fragment = useMemo(() => dnaToPromptFragment(dna), [dna])

  const copyText = (text, key) => {
    copyToClipboard(text)
    setCopied(key)
    toast.success('已复制')
    setTimeout(() => setCopied(null), 1500)
  }

  const saveProfile = () => {
    const name = (dna.style?.[0]?.zh || '未知') + '+' + (dna.material?.[0]?.zh || '未知')
    const profile = { id: Date.now().toString(), name, dna, fragment, date: new Date().toISOString().slice(0, 10) }
    const updated = [profile, ...profiles].slice(0, 20)
    setProfiles(updated)
    saveProfiles(updated)
    toast.success('DNA 已保存')
  }

  const deleteProfile = (id) => {
    const updated = profiles.filter(p => p.id !== id)
    setProfiles(updated)
    saveProfiles(updated)
    toast.success('已删除')
  }

  const applyProfile = (profile) => {
    copyText(profile.fragment, 'profile-' + profile.id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">风格DNA提取</h1>
        <p className="text-muted-foreground mt-1">从提示词中提取风格基因,生成可复用的风格片段</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">输入提示词</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="粘贴一段你喜欢的提示词,提取它的风格DNA..."
            value={input}
            onChange={e => { setInput(e.target.value); setExtracted(false) }}
            rows={4}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExtract}>
              <Dna className="w-4 h-4 mr-2" />
              提取DNA
            </Button>
            <Button variant="outline" onClick={() => { setInput(''); setExtracted(false) }}>清空</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">示例:</span>
            {EXAMPLES.map((ex, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-accent text-xs" onClick={() => { setInput(ex); setExtracted(false) }}>
                <Sparkles className="h-3 w-3 mr-1" />示例 {i + 1}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {extracted && (
        <>
          {/* Score overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex flex-col items-center justify-center text-white shadow-lg">
                  <Dna className="h-6 w-6" />
                  <span className="text-lg font-bold">{score}/6</span>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold">检测到 {totalMatched} 个基因片段</div>
                  <p className="text-muted-foreground text-sm mt-1">
                    覆盖 {score} 个维度{score < 4 ? ',建议补充更多维度以丰富风格' : score < 6 ? ',风格较为完整' : ',风格非常丰富'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DNA strands */}
          <Card>
            <CardHeader><CardTitle className="text-base">DNA 图谱</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {DNA_DIMENSIONS.map(dim => (
                <div key={dim.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{dim.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {dna[dim.key]?.length || 0} 个匹配
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dna[dim.key]?.length > 0 ? (
                      dna[dim.key].map(kw => (
                        <Badge key={kw.zh} className={`text-xs ${dim.color}`}>
                          {kw.zh}
                          <span className="opacity-50 ml-1">{kw.en}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">未检测到</span>
                    )}
                  </div>
                  {dim.key !== 'constraint' && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Generated fragment */}
          {fragment && (
            <Card>
              <CardHeader><CardTitle className="text-base">可复用风格片段</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed select-text">{fragment}</div>
                <p className="text-xs text-muted-foreground">将此片段拼接到任意主体描述后,即可复制该风格</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => copyText(fragment, 'fragment')}>
                    {copied === 'fragment' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied === 'fragment' ? '已复制' : '复制片段'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={saveProfile}>
                    <Save className="h-3 w-3 mr-1" />保存为模板
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Saved profiles */}
      {profiles.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">已保存的风格DNA ({profiles.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {profiles.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                  <Dna className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.fragment}</div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{p.date}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => applyProfile(p)}>
                  {copied === 'profile-' + p.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteProfile(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
