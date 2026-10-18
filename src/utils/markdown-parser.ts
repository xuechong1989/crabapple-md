/**
 * Markdown解析工具
 * 使用markdown-it进行Markdown到HTML的转换
 * 作者 xuechong 2026-06-17 0.3.00
 */

import MarkdownIt from 'markdown-it';

/** HTML转义 xuechong 2026-06-17 0.3.00 功能：防止XSS注入 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 创建markdown-it实例 xuechong 2026-06-17 0.3.00 */
function createMarkdownIt(): MarkdownIt {
  return new MarkdownIt({
    html: true,
    linkify: true,
    // xuechong 2026-08-17 修复：预览界面引号被替换成中文引号问题
    // 关闭typographer排版美化：开启时会把直引号'显示为中文弯引号‘’、双引号显示为“”、SQL注释符--显示为长横线–，属于对原始内容的篡改，预览必须保持原样
    typographer: false,
    breaks: true,
    highlight: function (str: string, lang: string): string {
    // xuechong 2026-08-07 0.3.00 代码高亮占位符，后续集成Prism.js
      const escapedStr = escapeHtml(str);
      const langClass = lang ? ` class="language-${lang}"` : '';
      return `<pre class="code-block"><code${langClass}>${escapedStr}</code></pre>`;
    }
  });
}

// xuechong 2026-08-07 0.3.00 创建markdown-it实例
const md: MarkdownIt = createMarkdownIt();

/** 解析完整Markdown为HTML xuechong 2026-06-17 0.3.00 */
export function parseMarkdown(content: string): string {
  if (!content) return '';
  return md.render(content);
}

/** 解析行内Markdown xuechong 2026-06-17 0.3.00 */
export function parseInlineMarkdown(content: string): string {
  if (!content) return '';
  return md.renderInline(content);
}

/** 验证Markdown合法性 xuechong 2026-06-17 0.3.00 */
export function validateMarkdown(content: string): boolean {
  try {
    md.render(content);
    return true;
  } catch {
    return false;
  }
}

export default md;
