let noteData = null;

function showToast(msg, ms = 1500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}

async function init() {
  const statusEl = document.getElementById('status');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes('xiaohongshu.com')) {
      statusEl.textContent = '请在小红书笔记页面使用此插件';
      statusEl.classList.add('error');
      return;
    }

    // Inject content script if not already present
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });
    } catch {}

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });

    if (!response || response.error) {
      statusEl.textContent = response?.error || '无法提取内容';
      statusEl.classList.add('error');
      return;
    }

    noteData = response;
    statusEl.style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('title').textContent = noteData.title || '(无标题)';
    document.getElementById('content').textContent = noteData.content || '(无内容)';

    const tagsEl = document.getElementById('tags');
    if (noteData.tags?.length) {
      tagsEl.innerHTML = noteData.tags.map(t => `<span class="tag">#${t}</span>`).join('');
    } else {
      document.getElementById('tags-field').style.display = 'none';
    }

    const imagesEl = document.getElementById('images');
    if (noteData.images?.length) {
      imagesEl.innerHTML = noteData.images.slice(0, 6).map(url =>
        `<img src="${url}" alt="" />`
      ).join('');
    } else {
      document.getElementById('images-field').style.display = 'none';
    }
  } catch (err) {
    statusEl.textContent = '提取失败: ' + err.message;
    statusEl.classList.add('error');
  }
}

document.getElementById('btn-copy').addEventListener('click', async () => {
  if (!noteData) return;
  const json = JSON.stringify(noteData, null, 2);
  await navigator.clipboard.writeText(json);
  showToast('已复制到剪贴板 ✓');
});

document.getElementById('btn-send').addEventListener('click', async () => {
  if (!noteData) return;

  // Find PromptForge tab and send data via message
  const tabs = await chrome.tabs.query({});
  const pfTab = tabs.find(t => t.url && (t.url.includes('localhost') || t.url.includes('promptforge')));

  if (pfTab) {
    await chrome.scripting.executeScript({
      target: { tabId: pfTab.id },
      func: (data) => {
        window.postMessage({ type: 'PROMPTFORGE_COLLECT', data }, '*');
      },
      args: [noteData],
    });
    showToast('已发送到 PromptForge ✓');
  } else {
    showToast('未找到 PromptForge 页面，请先打开', 2500);
  }
});

init();
