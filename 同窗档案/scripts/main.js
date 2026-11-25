// 每个项目目录使用独立的草稿。替换资料文件后，旧草稿自动失效。
const source = window.teamData;
const draftKey = 'class-album-v2:' + new URL('.', location.href).pathname;
const fileMode = location.protocol === 'file:';
let team = source;
if (!fileMode) {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey));
    if (draft && draft.version === (source.version || 'template')) team = draft.team;
  } catch {
    // 禁用本地存储时，仍可展示随源码提供的资料。
  }
}
// 固定五个位置，沿用旧草稿中已填写的资料，忽略旧版人数选项。
const people = Array.from({ length: 5 }, (_, index) => {
  const member = team.members?.[index] || {};
  return { ...member, name: member.name || '组员' + '一二三四五'[index] };
});
const byId = id => document.getElementById(id);
function photoFor(member, index) {
  return member.photo || 'images/member-placeholder.svg';
}
function setText(id, value) {
  const node = byId(id);
  if (node) node.textContent = value;
}
function personLink(index) {
  const link = document.createElement('a');
  link.href = 'member-' + (index + 1) + '.html';
  return link;
}
setText('credits', people.map(person => person.name).join('、'));

// 每张卡片连接到对应的独立个人页。
const directory = byId('directory');
if (directory) directory.replaceChildren();
people.forEach((person, index) => {
  if (directory) {
    const item = document.createElement('li');
    const link = personLink(index);
    link.className = 'entry';
    const photo = document.createElement('img');
    photo.src = photoFor(person, index);
    photo.alt = '';
    const name = document.createElement('span');
    name.textContent = person.name;
    const detail = document.createElement('small');
    detail.textContent = person.major ? [person.major, person.grade].filter(Boolean).join(' / ') : '资料待补充';
    link.append(photo, name, detail);
    item.append(link);
    directory.append(item);
  }
});

if (document.body.dataset.member) {
  const index = Number(document.body.dataset.member) - 1;
  const person = people[index];
  if (!person) {
    location.replace('index.html#members');
  } else {
    document.title = person.name + ' · 小组成员介绍';
    setText('title', person.name);
    setText('bio', person.bio || '一句话简介待填写。');
    for (const field of ['major', 'grade', 'interest']) setText(field, person[field] || '待填写');
    byId('photo').src = photoFor(person, index);
    byId('photo').alt = person.photo ? person.name + '的照片' : '';
    // 作品链接使用文本节点展示，与个人资料一起保存。
    const links = byId('personal-links');
    if (links) {
      links.replaceChildren();
      for (const item of person.links || []) {
        if (!/^https?:\/\//i.test(item.url)) continue;
        const row = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.label;
        row.append(link);
        if (item.description) row.append('：' + item.description);
        links.append(row);
      }
    }
  }
}
