import React from 'react';

/*
 * 資料表：欄寬由 colgroup 宣告，不由內容決定（table-layout: fixed）。
 *
 * iias 篇章表的作者欄設了 white-space: nowrap，795 列裡有一列是三位西文作者共 50 字，
 * auto 版面就把整欄撐到那一列的寬度；其餘 794 列的作者是三個字，
 * 多出來的寬度從篇名與出處那兩欄扣，出處因此每列折三行。auto 版面拿最長的那一列
 * 當整欄的寬度，而長度的分布通常偏斜，所以資料表一律固定版面。
 *
 * columns: [{ key, head, width, align, nowrap, numeric, headClassName, className,
 *             render(row, index) }]
 *   width 用百分比寫，欄寬才隨容器縮放；省略 width 的欄平分剩下的寬度，一張表至少
 *   留一欄不寫。nowrap 只給數值欄與按鈕欄；內容欄要能折行，那是它不去擠別欄的方式。
 * rows: 資料列。帶 section 的列渲染成跨欄的分段列（{ section: '第一編' }）。
 *
 * sticky 與 minWidth 互斥，只能擇一：minWidth 會把表包進一個橫向捲動容器，而那個
 * 容器同時是捲動祖先，表頭的 position: sticky 就改成貼容器的頂端（等於失效）。
 * 長清單要留表頭就用 sticky、窄欄位多的表就用 minWidth。
 */
export default function DataTable({
  columns,
  rows,
  getKey,
  sticky = false,
  minWidth,
  className = '',
  tableClassName = '',
}) {
  const cellBase = 'px-2.5 py-2 align-top border-b border-line-soft';
  const headBase = `px-2.5 py-1.5 text-left font-normal text-token-xs text-ink-faint bg-surface whitespace-nowrap border-b border-line${
    sticky && !minWidth ? ' sticky top-0 z-[1]' : ''
  }`;

  const modifiers = (col) => [
    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '',
    col.numeric ? 'tabular-nums' : '',
    col.nowrap ? 'whitespace-nowrap' : 'break-words',
  ].filter(Boolean).join(' ');

  const table = (
    <table
      className={`w-full table-fixed border-collapse text-token-sm ${tableClassName}`}
      style={minWidth ? { minWidth } : undefined}
    >
      <colgroup>
        {columns.map((col) => (
          <col key={col.key} style={col.width ? { width: col.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              className={`${headBase} ${col.align === 'right' ? 'text-right' : ''} ${col.headClassName || ''}`}
            >
              {col.head}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          row.section ? (
            <tr key={getKey ? getKey(row, i) : `s${i}`}>
              <td
                colSpan={columns.length}
                className="px-2.5 pt-2.5 pb-1 text-token-xs tracking-[0.03em] text-ink-faint"
              >
                {row.section}
              </td>
            </tr>
          ) : (
            <tr key={getKey ? getKey(row, i) : i}>
              {columns.map((col) => (
                <td key={col.key} className={`${cellBase} ${modifiers(col)} ${col.className || ''}`}>
                  {col.render ? col.render(row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          )
        ))}
      </tbody>
    </table>
  );

  if (minWidth) {
    return <div className={`overflow-x-auto overscroll-x-contain ${className}`}>{table}</div>;
  }
  return className ? <div className={className}>{table}</div> : table;
}
