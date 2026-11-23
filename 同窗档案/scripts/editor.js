const editor = byId('editor');
const panels = [];
const photos = people.map(person => person.photo);
const status = byId('status');
let pendingPhotos = 0;
const fields = [
  ['name', '姓名或昵称', '填写姓名或常用昵称'],
  ['major', '专业', '例如：数字媒体'],
  ['grade', '年级', '例如：大二'],
  ['interest', '兴趣', '例如：摄影、游泳'],
  ['bio', '一句话简介', '用一句话介绍自己。']
];


// 将照片缩小后嵌入资料文件，分享时无需另外复制照片。
async function readPhoto(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fafbf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', .78);
  } finally {
    bitmap.close();
  }
}

people.forEach((person, index) => {
  const panel = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = '组员 ' + (index + 1);
  const grid = document.createElement('div');
  grid.className = 'fields';
  for (const [key, labelText, hint] of fields) {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement(key === 'bio' ? 'textarea' : 'input');
    input.name = key + '-' + index;
    input.placeholder = hint;
    input.maxLength = input.tagName === 'INPUT' ? 90 : 1200;
    input.value = person[key] || '';
    input.required = key === 'name';
    label.append(input);
    grid.append(label);
  }
  const label = document.createElement('label');
  label.textContent = '个人照片（JPG、PNG 或 WebP）';
  const upload = document.createElement('input');
  upload.type = 'file';
  upload.accept = 'image/jpeg,image/png,image/webp';
  const preview = document.createElement('img');
  preview.alt = '当前头像';
  preview.className = 'thumb';
  preview.src = photoFor(person, index);
  upload.addEventListener('change', async () => {
    const file = upload.files[0];
    if (!file) return;
    upload.disabled = true;
    pendingPhotos++;
    try {
      photos[index] = await readPhoto(file);
      preview.src = photos[index];
      status.textContent = '照片已就绪。';
    } catch {
      status.textContent = '照片读取失败，请选择 JPG、PNG 或 WebP 文件。';
    } finally {
      upload.disabled = false;
      pendingPhotos--;
    }
  });
  label.append(upload, preview);
  grid.append(label);
  panel.append(legend, grid);
  byId('forms').append(panel);
  panels.push(panel);
});

editor.hidden = false;
if (fileMode) {
  byId('save').hidden = true;
  status.textContent = '当前为直接打开文件模式。填写后请导出资料文件，替换 scripts/team-data.js，再刷新首页。';
}

function collectTeam() {
  if (pendingPhotos) {
    status.textContent = '正在处理照片，请稍后保存。';
    return null;
  }
  if (!editor.reportValidity()) return null;
  const value = name => editor.elements.namedItem(name).value.trim();
  return {
    members: panels.map((panel, index) => {
      const member = { photo: photos[index] };
      for (const [key] of fields) member[key] = value(key + '-' + index);
      member.name ||= '组员 ' + (index + 1);
      return member;
    })
  };
}

editor.addEventListener('submit', event => {
  event.preventDefault();
  if (fileMode) return;
  const updated = collectTeam();
  if (!updated) return;
  try {
    localStorage.setItem(draftKey, JSON.stringify({ version: source.version || 'template', team: updated }));
    location.assign('index.html#members');
  } catch {
    status.textContent = '浏览器无法保存草稿，请使用「导出资料文件」。';
  }
});

byId('export').addEventListener('click', () => {
  const updated = collectTeam();
  if (!updated) return;
  updated.version = new Date().toISOString();
  const content = 'window.teamData = ' + JSON.stringify(updated, null, 2) + ';\n';
  const url = URL.createObjectURL(new Blob([content], { type: 'application/javascript;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'team-data.js';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  status.textContent = '请用下载的资料文件替换 scripts/team-data.js，再刷新首页检查。';
});
