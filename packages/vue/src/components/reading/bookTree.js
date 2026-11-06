/*
 * BookTree 的資料處理，不依賴框架。React 正本是 phenom-guzhun 的
 * src/components/lab/BookTree.jsx；分組與搜尋規則照那份。
 *
 * items 已照書的順序排好：group 相鄰同名者併為一段，subgroup 同此，不重排。
 */
export function buildBookTree(items) {
  const groups = [];
  for (const item of items) {
    let group = groups[groups.length - 1];
    if (!group || group.name !== item.group) {
      group = { name: item.group, blocks: [], count: 0 };
      groups.push(group);
    }
    group.count += 1;
    let block = group.blocks[group.blocks.length - 1];
    if (!block || block.label !== (item.subgroup ?? null)) {
      block = { label: item.subgroup ?? null, items: [] };
      group.blocks.push(block);
    }
    block.items.push(item);
  }
  return groups;
}

/** 查詢字串去頭尾空白後為空，回傳 null（顯示整棵樹）；否則回傳篇名含該字串的各篇。 */
export function searchBookTree(items, query) {
  const q = query.trim();
  return q ? items.filter((item) => item.title.includes(q)) : null;
}

/*
 * 讀到某一篇時，把目次所在的可捲容器捲到該篇附近。只設那個容器的 scrollTop，
 * 不用 scrollIntoView：後者連視窗一起捲，讀者會被帶離正文。
 */
export function centerActiveLeaf(root) {
  const target = root?.querySelector('[data-leaf-active]');
  if (!target) return;
  let box = root.parentElement;
  while (box && box.scrollHeight <= box.clientHeight) box = box.parentElement;
  if (!box || box === document.body || box === document.documentElement) return;
  const wanted = Math.max(0, target.offsetTop - box.clientHeight / 2);
  if (Math.abs(box.scrollTop - wanted) > 8) box.scrollTop = wanted;
}
