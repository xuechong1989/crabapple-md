/**
 * 系统设置弹窗
 * xuechong 2026-06-20 0.3.00
 */

import { AppSettings, EditorSettings, GeneralSettings } from '../../hooks/useSettings';
import './SettingsModal.css';

interface Props {
  settings: AppSettings;
  onUpdateEditor: (p: Partial<EditorSettings>) => void;
  onUpdateGeneral: (p: Partial<GeneralSettings>) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onUpdateEditor, onUpdateGeneral, onClose }: Props) {
  const { editor, general } = settings;

  return (
    <div className="stg-overlay" onClick={onClose}>
      <div className="stg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stg-header">
          <h2>系统设置</h2>
          <button className="stg-close" onClick={onClose}>×</button>
        </div>

        <div className="stg-body">
          {/* xuechong 2026-08-07 0.3.00 编辑器设置 */}
          <h3>编辑器</h3>

          <label className="stg-row">
            <span>字号</span>
            <select value={editor.fontSize} onChange={e => onUpdateEditor({ fontSize: Number(e.target.value) })}>
              {[12, 14, 16, 18, 20, 22, 24].map(n => <option key={n} value={n}>{n}px</option>)}
            </select>
          </label>

          <label className="stg-row">
            <span>Tab 缩进</span>
            <select value={editor.tabSize} onChange={e => onUpdateEditor({ tabSize: Number(e.target.value) })}>
              {[2, 4, 8].map(n => <option key={n} value={n}>{n} 空格</option>)}
            </select>
          </label>

          <label className="stg-row">
            <span>自动换行</span>
            <input type="checkbox" checked={editor.wordWrap} onChange={e => onUpdateEditor({ wordWrap: e.target.checked })} />
          </label>

          <label className="stg-row">
            <span>行号</span>
            <input type="checkbox" checked={editor.lineNumbers} onChange={e => onUpdateEditor({ lineNumbers: e.target.checked })} />
          </label>

          {/* xuechong 2026-08-07 0.3.00 通用设置 */}
          <h3>通用</h3>

          <label className="stg-row">
            <span>打开文件默认</span>
            <select value={general.defaultViewMode || 'all'} onChange={e => onUpdateGeneral({ defaultViewMode: e.target.value })}>
              <option value="all">编辑模式</option>
              <option value="preview_with_outline">预览模式</option>
            </select>
          </label>

          <label className="stg-row">
            <span>自动保存</span>
            <input type="checkbox" checked={general.autoSave} onChange={e => onUpdateGeneral({ autoSave: e.target.checked })} />
          </label>

          {general.autoSave && (
            <label className="stg-row">
              <span>保存间隔</span>
              <select value={general.autoSaveInterval} onChange={e => onUpdateGeneral({ autoSaveInterval: Number(e.target.value) })}>
                {[30, 60, 120, 300].map(n => <option key={n} value={n}>{n >= 60 ? `${n / 60} 分钟` : `${n} 秒`}</option>)}
              </select>
            </label>
          )}

          <label className="stg-row">
            <span>关闭时确认</span>
            <input type="checkbox" checked={general.confirmOnClose}
              onChange={e => onUpdateGeneral({ confirmOnClose: e.target.checked })} />
          </label>
        </div>
      </div>
    </div>
  );
}
