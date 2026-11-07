export interface BookTreeItem {
  id: string | number;
  title: string;
  href?: string;
  group: string;
  subgroup?: string | null;
  lead?: string | number | null;
  badge?: string;
  hint?: string;
}
export interface BookTreeBlock<T extends BookTreeItem = BookTreeItem> {
  label: string | null;
  items: T[];
}
export interface BookTreeGroup<T extends BookTreeItem = BookTreeItem> {
  name: string;
  blocks: BookTreeBlock<T>[];
  count: number;
}
export function buildBookTree<T extends BookTreeItem>(items: T[]): BookTreeGroup<T>[];
export function searchBookTree<T extends BookTreeItem>(items: T[], query: string): T[] | null;
export function centerActiveLeaf(root: HTMLElement | null | undefined): void;
