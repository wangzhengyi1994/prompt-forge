const STORAGE_KEY = 'promptforge_library'

const SEED_DATA = [
  {
    id: '1',
    title: '2.5D 磨砂质感图标',
    source: '小红书',
    tags: ['2.5D', '磨砂', '低饱和', '批量'],
    date: '2024-12-15',
    prompt: '2.5D风格磨砂质感图标设计，多彩低饱和度配色，一组6个图标，包含常见UI元素。磨砂玻璃材质，柔和的光影效果，圆角造型，微立体感。Blender渲染，8K分辨率，白色背景，干净简洁。',
    structure: '风格: 2.5D | 材质: 磨砂质感 | 色调: 多彩低饱和 | 数量: 6个一组 | 渲染: Blender | 分辨率: 8K',
    template: '2.5D风格{材质}图标，{色调}配色，一组{数量}个，{主体内容}。{材质}材质，柔和光影，圆角造型。{渲染器}渲染，{分辨率}，{背景}背景。',
    thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: '2',
    title: '3D 工业设备图标',
    source: '小红书',
    tags: ['3D', '磨砂', '高光边缘', '工业'],
    date: '2024-12-20',
    prompt: '3D工业设备图标，磨砂质感搭配高光边缘描边，白色背景，无底座设计。图标主体为工业设备元素（齿轮、扳手、仪表盘等），C4D+OC渲染器，细腻光线追踪，8K超高清。减少多余细节，突出主体。',
    structure: '风格: 3D | 材质: 磨砂+高光边缘 | 背景: 纯白 | 约束: 无底座 | 渲染: C4D+OC | 分辨率: 8K',
    template: '3D{主体}图标，磨砂质感搭配高光边缘描边，{背景}背景，无底座。{渲染器}渲染，{分辨率}。减少多余细节，突出主体。',
    thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: '3',
    title: '3D 小场景图标',
    source: '小红书',
    tags: ['3D', '玻璃', '几何', 'C4D', '场景'],
    date: '2025-01-05',
    prompt: '3D小场景图标，玻璃材质搭配几何玻璃元素，C4D+OC渲染器，8K分辨率。微缩场景风格，包含多个小元素组合，梦幻光效，柔和阴影。等轴侧视角，浅蓝色背景，干净无冗余装饰。',
    structure: '风格: 3D场景 | 材质: 玻璃+几何玻璃 | 渲染: C4D+OC | 分辨率: 8K | 视角: 等轴侧 | 背景: 浅蓝',
    template: '3D小场景图标，{材质}材质，{渲染器}渲染，{分辨率}。微缩场景风格，{主体内容}，梦幻光效。{视角}视角，{背景}背景。',
    thumbnail: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: '4',
    title: '科技感透明图标模板',
    source: '小红书',
    tags: ['透明', '科技', '等轴侧', '16K', '模板'],
    date: '2025-01-10',
    prompt: '科技感透明图标，XX（替换为具体主体），等轴侧透视视角，透明材质搭配蓝白光效。16K超高清分辨率，Blender渲染，现代简约风格。干净背景，无底座，减少细节突出科技质感。',
    structure: '风格: 科技 | 材质: 透明 | 视角: 等轴侧 | 分辨率: 16K | 渲染: Blender | 方法: XX占位替换',
    template: '科技感透明图标，XX（{主体内容}），等轴侧透视视角，透明材质搭配蓝白光效。16K，{渲染器}渲染，现代简约风格。干净背景，无底座。',
    thumbnail: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    id: '5',
    title: '粘土风格可爱图标',
    source: '小红书',
    tags: ['粘土', '可爱', '卡通', 'Blender'],
    date: '2025-01-18',
    prompt: '粘土风格可爱3D图标，主体为小动物（猫、狗、兔子），圆润造型，柔和马卡龙配色。手工捏制质感，微微不规则边缘，温暖光照。Blender渲染，8K分辨率，浅粉色背景，无底座。',
    structure: '风格: 粘土卡通 | 材质: 手工粘土 | 色调: 马卡龙 | 主体: 小动物 | 渲染: Blender | 分辨率: 8K',
    template: '粘土风格可爱3D图标，主体为{主体内容}，圆润造型，{色调}配色。手工捏制质感，{渲染器}渲染，{分辨率}，{背景}背景。',
    thumbnail: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  {
    id: '6',
    title: '赛博朋克霓虹图标',
    source: 'Midjourney社区',
    tags: ['赛博朋克', '霓虹', '暗色', '未来'],
    date: '2025-01-25',
    prompt: 'Cyberpunk neon icon, glowing edges with pink and cyan neon lights, dark background, futuristic tech style. Holographic material with translucent layers, sharp geometric shapes. Octane render, 8K resolution, no base, clean composition.',
    structure: '风格: Cyberpunk | 材质: 霓虹+全息 | 色调: 粉青霓虹 | 背景: 暗色 | 渲染: Octane | 分辨率: 8K',
    template: 'Cyberpunk neon icon, {主体内容}, glowing edges with {色调} neon lights, dark background. Holographic material, {渲染器} render, {分辨率}.',
    thumbnail: 'linear-gradient(135deg, #0c0c1d 0%, #e91e9c 50%, #00d4ff 100%)',
  },
  {
    id: '7',
    title: '扁平渐变金融图标',
    source: '设计达人',
    tags: ['扁平', '渐变', '金融', 'Figma'],
    date: '2025-02-03',
    prompt: '扁平风格金融主题图标集，渐变配色（蓝紫色系），包含钱包、图表、银行卡、硬币等元素。简洁线条搭配圆角矩形，统一描边粗细，无阴影。SVG矢量风格，适配深色/浅色模式。',
    structure: '风格: 扁平 | 色调: 蓝紫渐变 | 主题: 金融 | 格式: SVG矢量 | 约束: 无阴影/统一描边',
    template: '扁平风格{主题}图标集，{色调}配色，包含{元素列表}。简洁线条搭配圆角矩形，统一描边粗细，{约束}。',
    thumbnail: 'linear-gradient(135deg, #5f72bd 0%, #9b23ea 100%)',
  },
  {
    id: '8',
    title: '水晶宝石质感图标',
    source: '小红书',
    tags: ['水晶', '宝石', '折射', '奢华'],
    date: '2025-02-08',
    prompt: '水晶宝石质感3D图标，主体为几何宝石形态，内部光线折射效果，彩虹色散光。透明材质搭配金属底座，微妙的焦散效果。C4D+Redshift渲染，16K分辨率，纯黑背景，突出发光质感。',
    structure: '风格: 奢华 | 材质: 水晶宝石 | 效果: 折射+色散 | 渲染: C4D+Redshift | 分辨率: 16K | 背景: 纯黑',
    template: '水晶宝石质感3D图标，主体为{主体内容}，内部光线折射，{色调}色散光。{材质}材质，{渲染器}渲染，{分辨率}，{背景}背景。',
    thumbnail: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  {
    id: '9',
    title: '像素风游戏图标',
    source: 'Dribbble',
    tags: ['像素', '复古', '游戏', '8bit'],
    date: '2025-02-14',
    prompt: 'Pixel art game icon, 32x32 grid, retro 8-bit style, limited color palette (max 16 colors). Sharp edges, no anti-aliasing, classic RPG item design (sword, potion, shield). Bright saturated colors on transparent background.',
    structure: '风格: 像素8bit | 尺寸: 32x32 | 色彩: 限定16色 | 主题: RPG道具 | 约束: 无抗锯齿',
    template: 'Pixel art game icon, {尺寸} grid, retro 8-bit style, limited {色数} color palette. {主体内容}, {色调} colors on {背景} background.',
    thumbnail: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
  },
  {
    id: '10',
    title: '新拟态UI图标',
    source: '设计达人',
    tags: ['新拟态', 'Neumorphism', 'UI', '柔和'],
    date: '2025-02-20',
    prompt: '新拟态风格UI图标，浅灰色背景上的凸起效果，柔和内外阴影。图标主体为常见APP功能（设置、消息、相机、音乐），单色线性图形。圆角正方形容器，统一48px尺寸，适配iOS设计规范。',
    structure: '风格: 新拟态 | 效果: 凸起+内外阴影 | 主题: APP功能 | 尺寸: 48px | 约束: 单色线性/iOS规范',
    template: '新拟态风格UI图标，{背景}背景上的凸起效果，柔和内外阴影。主体为{主体内容}，单色线性。圆角正方形容器，{尺寸}尺寸。',
    thumbnail: 'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)',
  },
  {
    id: '11',
    title: '手绘水彩植物图标',
    source: 'Pinterest',
    tags: ['水彩', '手绘', '植物', '自然'],
    date: '2025-02-25',
    prompt: '手绘水彩风格植物图标，包含花朵、叶子、多肉、盆栽等元素。自然晕染效果，颜料边缘渗透感，温暖的大地色系。纸张纹理背景，带有微微的铅笔底稿痕迹，文艺清新风格。',
    structure: '风格: 手绘水彩 | 主题: 植物 | 效果: 晕染+渗透 | 色调: 大地色 | 背景: 纸张纹理 | 细节: 铅笔底稿',
    template: '手绘水彩风格{主题}图标，包含{元素列表}。自然晕染效果，{色调}色系。{背景}背景，文艺清新风格。',
    thumbnail: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)',
  },
  {
    id: '12',
    title: '毛玻璃拟物天气图标',
    source: '小红书',
    tags: ['毛玻璃', '拟物', '天气', '动效'],
    date: '2025-03-01',
    prompt: '毛玻璃拟物风格天气图标，主体为太阳/云/雨滴/雪花，半透明磨砂玻璃容器，背景模糊效果。渐变彩色光晕，3D微立体感，圆润造型。适配iOS动态壁纸风格，4K分辨率，深蓝色渐变背景。',
    structure: '风格: 毛玻璃拟物 | 材质: 半透明磨砂 | 主题: 天气 | 效果: 背景模糊+光晕 | 分辨率: 4K | 适配: iOS',
    template: '毛玻璃拟物风格{主题}图标，主体为{主体内容}，半透明磨砂玻璃容器。渐变彩色光晕，3D微立体感。{分辨率}，{背景}背景。',
    thumbnail: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  },
  {
    id: '13',
    title: '电商产品白底精修',
    source: '小红书',
    tags: ['电商', '产品', '白底', '精修'],
    date: '2025-03-05',
    prompt: 'Product photography, minimalist white background, studio lighting setup with soft diffused key light and subtle fill light. Subject centered, slight shadow for depth. Ultra-clean composition, no distractions. Shot on Phase One, 100mm macro lens, f/8, 16K resolution, commercial retouching quality.',
    structure: '风格: 产品精修 | 背景: 纯白 | 灯光: 柔和影棚 | 镜头: 100mm微距 | 分辨率: 16K | 约束: 居中构图',
    template: 'Product photography of {主体内容}, minimalist white background, studio lighting. {镜头} lens, {分辨率}, commercial retouching quality.',
    thumbnail: 'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)',
  },
  {
    id: '14',
    title: '日系胶片人像写真',
    source: 'Midjourney社区',
    tags: ['日系', '胶片', '人像', '写真'],
    date: '2025-02-20',
    prompt: 'Japanese film photography portrait, young woman in linen dress standing by window, soft natural light, warm golden hour tones. Shot on Fujifilm Superia 400, slight grain texture, muted pastel color palette. Shallow depth of field, bokeh background, intimate candid moment. 35mm film, Contax T2 camera aesthetic.',
    structure: '风格: 日系胶片 | 色调: 暖金+柔和粉彩 | 胶片: Superia 400 | 镜头: 35mm | 光线: 自然光 | 景深: 浅景深',
    template: 'Japanese film photography, {主体内容}, soft natural light, {色调}. Shot on {胶片}, slight grain texture. Shallow depth of field, {镜头} film aesthetic.',
    thumbnail: 'linear-gradient(135deg, #f5e6d3 0%, #e8c4a0 100%)',
  },
  {
    id: '15',
    title: '等距像素城市场景',
    source: '设计达人',
    tags: ['等距', '像素', '城市', '场景'],
    date: '2025-02-15',
    prompt: 'Isometric pixel art city block, detailed miniature buildings including cafe, bookstore, and park. Vibrant color palette with warm sunlight, tiny people walking on sidewalks. 32x32 pixel grid, clean anti-aliased edges. Game asset style, top-down 30-degree angle, transparent background.',
    structure: '风格: 等距像素 | 主题: 城市街区 | 像素: 32x32 | 视角: 30度俯视 | 色调: 暖阳活泼 | 用途: 游戏素材',
    template: 'Isometric pixel art {主体内容}, {色调} color palette, {像素}px grid, clean edges. Game asset style, top-down 30-degree angle, {背景} background.',
    thumbnail: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #fd79a8 100%)',
  },
  {
    id: '16',
    title: '国潮水墨山水插画',
    source: '小红书',
    tags: ['国潮', '水墨', '山水', '中国风'],
    date: '2025-02-28',
    prompt: '新国潮水墨风格山水插画，远山层叠，松林云雾缭绕，溪流蜿蜒。传统水墨晕染与现代渐变色结合，主色调靛蓝+金色点缀。留白构图，题字空间预留右上角。宣纸纹理质感，4K分辨率，适配海报竖版比例。',
    structure: '风格: 新国潮水墨 | 色调: 靛蓝+金 | 构图: 留白 | 材质: 宣纸纹理 | 分辨率: 4K | 比例: 竖版海报',
    template: '新国潮水墨风格{主体内容}，传统水墨晕染与现代渐变色结合，{色调}。留白构图，宣纸纹理质感，{分辨率}，{比例}。',
    thumbnail: 'linear-gradient(135deg, #2c3e50 0%, #1a3a5c 50%, #c8a84e 100%)',
  },
  {
    id: '17',
    title: 'Logo 徽章立体效果',
    source: 'Midjourney社区',
    tags: ['Logo', '徽章', '立体', '品牌'],
    date: '2025-03-02',
    prompt: 'Embossed metallic badge logo, circular shape with intricate border details, brushed gold and matte black color scheme. Central icon with subtle 3D depth, beveled edges catching light. Luxury brand aesthetic, photorealistic material rendering, dark leather background texture. 8K resolution, studio lighting.',
    structure: '风格: 金属徽章 | 材质: 拉丝金+哑光黑 | 形状: 圆形 | 效果: 浮雕3D | 背景: 皮革纹理 | 分辨率: 8K',
    template: 'Embossed metallic badge logo, {形状} shape, {材质} color scheme. Central {主体内容} with 3D depth. {背景} background, {分辨率}, studio lighting.',
    thumbnail: 'linear-gradient(135deg, #232526 0%, #c8a84e 50%, #414345 100%)',
  },
  {
    id: '18',
    title: '微缩盲盒潮玩手办',
    source: '小红书',
    tags: ['盲盒', '潮玩', '手办', 'IP'],
    date: '2025-02-10',
    prompt: '盲盒潮玩手办设计，Q版大头比例（头身比2:1），圆润光滑表面，PVC塑料材质光泽。角色穿太空服，头盔反射星空。底座为小行星造型，整体高度8cm。C4D+Arnold渲染，柔和三点布光，浅灰纯色背景，产品展示视角。',
    structure: '风格: Q版潮玩 | 比例: 头身2:1 | 材质: PVC光泽 | 渲染: C4D+Arnold | 布光: 三点 | 背景: 浅灰',
    template: '盲盒潮玩手办，Q版大头比例，{主体内容}，PVC塑料材质光泽。{渲染器}渲染，柔和三点布光，{背景}背景，产品展示视角。',
    thumbnail: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fdfcfb 100%)',
  },
  {
    id: '19',
    title: '建筑可视化室内',
    source: '设计达人',
    tags: ['建筑', '室内', '可视化', '写实'],
    date: '2025-01-30',
    prompt: 'Architectural interior visualization, modern minimalist living room with floor-to-ceiling windows, natural oak flooring, white walls. Scandinavian furniture, monstera plant accent. Late afternoon golden light streaming through windows, volumetric light rays. V-Ray render, photorealistic materials, 8K resolution, wide-angle 24mm perspective.',
    structure: '风格: 建筑可视化 | 空间: 极简客厅 | 光线: 午后金光 | 渲染: V-Ray | 镜头: 24mm广角 | 分辨率: 8K',
    template: 'Architectural interior visualization, {空间描述}, {光线}. {渲染器} render, photorealistic materials, {分辨率}, {镜头} perspective.',
    thumbnail: 'linear-gradient(135deg, #e8d5b7 0%, #f5f0e8 50%, #c4b08b 100%)',
  },
  {
    id: '20',
    title: '美食摄影俯拍构图',
    source: '小红书',
    tags: ['美食', '俯拍', '摄影', '摆盘'],
    date: '2025-02-08',
    prompt: 'Flat lay food photography, artisan brunch spread on marble surface. Avocado toast, latte art, fresh berries, croissant, small bouquet of wildflowers. Soft diffused natural light from left side, subtle shadows. Warm earth tone color palette, negative space for text overlay. Shot on Sony A7R IV, 35mm lens, f/5.6, 8K resolution.',
    structure: '风格: 俯拍美食 | 构图: 平铺 | 光线: 左侧自然光 | 表面: 大理石 | 镜头: 35mm | 留白: 文字区域',
    template: 'Flat lay food photography, {主体内容} on {表面}. Soft diffused natural light, {色调} palette, negative space for text. {镜头} lens, {分辨率}.',
    thumbnail: 'linear-gradient(135deg, #f8e8d0 0%, #d4a76a 50%, #8b6f47 100%)',
  },
]

export function getLibrary() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  return []
}

export function saveLibrary(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addToLibrary(item) {
  const lib = getLibrary()
  const newItem = { ...item, id: Date.now().toString(), date: new Date().toISOString().slice(0, 10) }
  lib.unshift(newItem)
  saveLibrary(lib)
  return lib
}

export function deleteFromLibrary(id) {
  const lib = getLibrary().filter(i => i.id !== id)
  saveLibrary(lib)
  return lib
}

export function exportLibrary() {
  const lib = getLibrary()
  const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items: lib }, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `promptforge-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  return lib.length
}

export function importLibrary(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        const items = parsed.items || parsed
        if (!Array.isArray(items)) { reject(new Error('格式错误')); return }
        const existing = getLibrary()
        const existingIds = new Set(existing.map(i => i.id))
        let added = 0
        for (const item of items) {
          if (!item.title || !item.prompt) continue
          if (existingIds.has(item.id)) continue
          existing.push({ ...item, id: item.id || Date.now().toString() + Math.random().toString(36).slice(2) })
          added++
        }
        saveLibrary(existing)
        resolve({ total: items.length, added, skipped: items.length - added })
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsText(file)
  })
}

export function clearLibrary() {
  localStorage.removeItem(STORAGE_KEY)
  return getLibrary()
}
