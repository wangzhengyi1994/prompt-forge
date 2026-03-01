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
]

export function getLibrary() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA))
  return SEED_DATA
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
