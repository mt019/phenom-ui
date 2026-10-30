import { readonly, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';
/** Content groups start expanded. A new group gets the same visible default;
 * existing user choices survive a refreshed or filtered group list.
 */
export function useExpandedSet<T extends string | number>(ids: MaybeRefOrGetter<readonly T[]>) {
  const current = () => Array.from(toValue(ids));
  const openIds = shallowRef(new Set(current()));
  let known = new Set(current());
  watch(current, (next) => {
    const updated = new Set(openIds.value);
    for (const id of next) if (!known.has(id)) updated.add(id);
    known = new Set(next);
    openIds.value = updated;
  });
  function toggle(id: T) {
    const next = new Set(openIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openIds.value = next;
  }
  function open(id: T) {
    if (!openIds.value.has(id)) openIds.value = new Set(openIds.value).add(id);
  }
  const expandAll = () => (openIds.value = new Set(current()));
  const collapseAll = () => (openIds.value = new Set<T>());
  const isOpen = (id: T) => openIds.value.has(id);
  return { openIds: readonly(openIds), toggle, open, expandAll, collapseAll, isOpen };
}
