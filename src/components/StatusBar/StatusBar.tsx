/**
 * 状态栏组件
 * 显示文档统计信息和编辑器状态
 * 作者 xuechong 2026-06-17 0.3.00
 */

interface StatusBarProps {
  content: string;
  filePath?: string;
  isModified?: boolean;
}

/** 计算文档统计 xuechong 2026-06-17 0.3.00 */
function getDocumentStats(content: string) {
  if (!content) {
    return { characters: 0, words: 0, lines: 0 };
  }

  const characters = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lines = content.split('\n').length;

  return { characters, words, lines };
}

/**
 * xuechong 2026-08-07 0.3.00 状态栏组件
 */
export default function StatusBar({ content, filePath, isModified = false }: StatusBarProps) {
  const stats = getDocumentStats(content);
  const fileName = filePath ? filePath.split(/[/\\]/).pop() : '未命名';

  return (
    <div className="status-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 12px',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e9ecef',
      fontSize: '12px',
      color: '#6c757d',
    }}>
      {/* xuechong 2026-08-07 0.3.00 左侧：文件信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>
          {isModified ? '● ' : ''}
          {fileName}
        </span>
        {filePath && (
          <span style={{ color: '#adb5bd' }}>
            {filePath}
          </span>
        )}
      </div>

      {/* xuechong 2026-08-07 0.3.00 右侧：统计信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>字符数: {stats.characters}</span>
        <span>单词数: {stats.words}</span>
        <span>行数: {stats.lines}</span>
        <span>Markdown</span>
      </div>
    </div>
  );
}
