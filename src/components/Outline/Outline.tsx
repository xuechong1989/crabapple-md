/**
 * 目录大纲导航组件
 * xuechong 2026-06-20 0.3.00
 */

import { HeadingItem } from '../../utils/outline-parser';
import './Outline.css';

interface Props {
  headings: HeadingItem[];
  activeLine: number | null;
  onJump: (line: number) => void;
  visible: boolean;
  onToggle: () => void;
  width?: number;
}

export default function Outline({ headings, activeLine, onJump, visible, onToggle, width = 280 }: Props) {
  if (!visible) {
    return (
      <button className="ol-toggle-collapsed" onClick={onToggle} title="展开大纲">
        ☰
      </button>
    );
  }

  return (
    <div className="ol-panel" style={{ width }}>
      <div className="ol-header">
        <span>目录</span>
        <button className="ol-toggle" onClick={onToggle}>×</button>
      </div>
      <div className="ol-list">
        {headings.length === 0 ? (
          <div className="ol-empty">无标题</div>
        ) : (
          headings.map((h, i) => {
            const nextLine = i < headings.length - 1 ? headings[i + 1].line : Infinity;
            const isActive = activeLine !== null && activeLine >= h.line && activeLine < nextLine;

            return (
              <div
                key={i}
                className={`ol-item ol-level-${h.level} ${isActive ? 'ol-active' : ''}`}
                onClick={() => onJump(h.line)}
                title={h.text}
              >
                {h.text}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
