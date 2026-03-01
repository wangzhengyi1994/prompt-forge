import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

const DICT = {
  材质词: ['磨砂质感', '毛玻璃', '几何玻璃', '透明材质', '塑料质感', '磨砂光泽', '金属质感', '陶瓷质感', '水晶材质', '亚克力'],
  视角词: ['等轴侧视角', '斜角透视', '正面透视', '平视角度', '2.5D', '俯视角度', '45度角', '微距视角'],
  风格词: ['梦幻风格', '科技感', '可爱清新', '现代简约', 'UI设计风格', '赛博朋克', '极简主义', '扁平风格', '新拟态'],
  技术词: ['C4D', 'OC渲染器', 'Blender', '光线追踪', '8K分辨率', '16K分辨率', 'HDRI照明', '全局光照', 'SSS次表面散射'],
  色调词: ['低饱和度', '柔和渐变', '蓝白配色', '多彩低饱和', '单色渐变', '莫兰迪色系', '冷色调', '暖色调', '蓝紫渐变'],
  约束词: ['减少细节', '无底座', '干净背景', '无冗余装饰', '居中构图', '无阴影', '白色背景', '简洁线条', '去除多余元素'],
}

export default function Dictionary() {
  const [search, setSearch] = useState('')

  const copy = (word) => {
    navigator.clipboard.writeText(word)
    toast.success(`已复制: ${word}`)
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜索关键词..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-4">
        {Object.entries(DICT).map(([cat, words]) => {
          const filtered = words.filter(w => !search || w.includes(search))
          if (filtered.length === 0) return null
          return (
            <Card key={cat}>
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">{cat}</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 flex flex-wrap gap-2">
                {filtered.map(w => (
                  <Badge key={w} variant="outline" className="cursor-pointer hover:bg-accent transition-colors px-3 py-1" onClick={() => copy(w)}>
                    {w}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">点击任意关键词即可复制</p>
    </div>
  )
}
