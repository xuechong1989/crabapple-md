/**
 * Markdown 实时预览组件
 * 作者 xuechong 2026-06-18 0.3.00
 * 更新 xuechong 2026-06-19 0.3.00 功能：forwardRef + 隐藏滚动条（视觉统一）
 */

import { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { parseMarkdown } from '../../utils/markdown-parser';

interface PreviewProps {
  content: string;
  className?: string;
}

export interface PreviewHandle {
  getScrollContainer: () => HTMLElement | null;
}

const Preview = forwardRef<PreviewHandle, PreviewProps>(({
  content, className = '',
}, ref) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getScrollContainer: () => previewRef.current,
  }), []);

  const html = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={`preview-container ${className}`} style={{ height: '100%' }}>
      <div
        ref={previewRef}
        className="markdown-body preview-scroll"
        style={{ height: '100%', overflow: 'auto', userSelect: 'text', WebkitUserSelect: 'text' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
});

Preview.displayName = 'Preview';
export default Preview;
