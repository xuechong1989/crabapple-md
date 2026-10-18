/**
 * 编辑器工具栏 — 格式化按钮 + 视图模式
 * xuechong 2026-06-17 0.3.00
 * 更新 xuechong 2026-06-20 0.3.00 功能：精简为内联样式 + 暗色主题
 */

interface EditorToolbarProps {
  onFormat?: (format: string) => void;
  disabled?: boolean;
  viewMode?: string;
  onViewMode?: (mode: string) => void;
}

const formatButtons = [
  { icon: 'B', title: '粗体', format: 'bold' },
  { icon: 'I', title: '斜体', format: 'italic' },
  { icon: 'S', title: '删除线', format: 'strikethrough' },
  { icon: '</>', title: '行内代码', format: 'code' },
  { icon: '🔗', title: '链接', format: 'link' },
  { icon: '🖼', title: '图片', format: 'image' },
  { icon: '•', title: '无序列表', format: 'unorderedList' },
  { icon: '1.', title: '有序列表', format: 'orderedList' },
  { icon: '☑', title: '任务列表', format: 'taskList' },
  { icon: '"', title: '引用', format: 'blockquote' },
  { icon: '—', title: '水平线', format: 'horizontalRule' },
  { icon: 'H', title: '标题', format: 'heading' },
  { icon: '<>', title: '代码块', format: 'codeBlock' },
  { icon: '⊞', title: '表格', format: 'table' },
];

const btnStyle: React.CSSProperties = {
  padding: '4px 7px', border: '1px solid #d1d5da', borderRadius: '4px',
  background: '#fff', color: '#24292e', cursor: 'pointer',
  fontSize: '13px', minWidth: '28px', textAlign: 'center', lineHeight: '1.4',
};

export default function EditorToolbar({ onFormat, disabled, viewMode, onViewMode }: EditorToolbarProps) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
      {formatButtons.map(btn => (
        <button key={btn.format} onClick={() => onFormat?.(btn.format)}
          disabled={disabled} title={btn.title}
          style={{ ...btnStyle, opacity: disabled ? 0.4 : 1 }}
        >{btn.icon}</button>
      ))}
      {onViewMode && (
        <>
          <span style={{ width: '1px', height: '18px', backgroundColor: '#d1d5da', margin: '0 4px', display: 'inline-block' }} />
          {[
            { mode: 'preview_with_outline', label: '预览', title: '仅预览+目录' },
            { mode: 'all', label: '编辑', title: '编辑器+目录+预览' },
          ].map(({ mode, label, title }) => (
            <button key={mode} onClick={() => onViewMode(mode)}
              disabled={disabled} title={title}
              style={{ ...btnStyle, fontWeight: viewMode === mode ? 600 : 400,
                background: viewMode === mode ? '#e8f0fe' : '#fff',
                borderColor: viewMode === mode ? '#0366d6' : '#d1d5da',
                color: viewMode === mode ? '#0366d6' : '#24292e',
              }}
            >{label}</button>
          ))}
        </>
      )}
    </span>
  );
}
