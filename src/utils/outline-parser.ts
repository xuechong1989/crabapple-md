/**
 * Markdown 标题解析器 — 提取 # ## ### #### 作为目录大纲
 * xuechong 2026-06-20 0.3.00
 * xuechong 2026-08-07 0.3.00 修复：代码块内 # 误解析为标题
 * 修复：增加代码围栏状态跟踪，跳过代码块内的 # 行
 * xuechong 2026-08-07 0.3.00 修复：代码块内 # 误解析为标题
 * 彻底修复：改用 markdown-it token 流提取标题，与预览渲染完全一致，覆盖代码围栏、HTML 注释块等所有非标题场景
 */

import md from './markdown-parser';

export interface HeadingItem {
  level: number;  // 1-4 (对应 # ~ ####)
  text: string;   // 标题文字
  line: number;   // 原文件行号（从 1 开始）
}

/**
 * xuechong 2026-08-07 0.3.00 修复：代码块内 # 误解析为标题
 * 从 markdown-it 行内 token 中提取纯文本（去掉加粗、链接等标记语法）
 */
function inlineText(children: unknown[] | null): string {
  if (!children) return '';
  let text = '';
  for (const child of children as Array<{ type: string; content: string }>) {
    if (child.type === 'text' || child.type === 'code_inline') {
      text += child.content;
    } else if (child.type === 'image') {
      text += child.content;
    } else if (child.type === 'softbreak' || child.type === 'hardbreak') {
      text += ' ';
    }
  }
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * xuechong 2026-08-07 0.3.00 修复：代码块内 # 误解析为标题
 * 从 Markdown 文本中提取所有标题（1-4 级），仅采用 markdown-it 识别为标题的行
 */
export function parseOutline(markdown: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const tokens = md.parse(markdown, {});
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'heading_open' || !token.map) continue;
    const level = Number(token.tag.slice(1));
    // xuechong 2026-08-07 0.3.00 保持原有设计：大纲只展示 1-4 级标题（与 App.tsx 的 h1-h4 联动一致）
    if (level < 1 || level > 4) continue;
    const inline = tokens[i + 1];
    if (!inline || inline.type !== 'inline') continue;
    const text = inlineText(inline.children);
    if (!text) continue;
    headings.push({
      level,
      text,
      line: token.map[0] + 1,
    });
  }
  return headings;
}
