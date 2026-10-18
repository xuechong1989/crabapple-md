/**
 * 标签栏组件（右键菜单版）
 * 作者 xuechong 2026-06-19 0.3.00 功能：右键菜单（关闭当前/右侧/左侧/所有）
 */

import { useState, useCallback, useEffect } from 'react';
import { TabData } from '../../hooks/useEditor';
import './TabBar.css';

interface TabBarProps {
  tabs: TabData[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseRight: (tabId: string) => void;
  onCloseLeft: (tabId: string) => void;
  onCloseAll: () => void;
}

interface ContextMenu {
  x: number;
  y: number;
  tabId: string;
}

export default function TabBar({
  tabs, activeTabId, onSelectTab, onCloseTab,
  onCloseRight, onCloseLeft, onCloseAll,
}: TabBarProps) {
  const [menu, setMenu] = useState<ContextMenu | null>(null);
  const isLastTab = tabs.length <= 1;

  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, tabId });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

    // xuechong 2026-08-07 0.3.00 点击其他地方关闭菜单
  useEffect(() => {
    if (!menu) return;
    const h = () => closeMenu();
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [menu, closeMenu]);

  const menuTab = menu ? tabs.find(t => t.id === menu.tabId) : null;
  const menuIndex = menuTab ? tabs.findIndex(t => t.id === menuTab.id) : -1;
  const hasRight = menuIndex >= 0 && menuIndex < tabs.length - 1;
  const hasLeft = menuIndex > 0;

  return (
    <div className="tab-bar">
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        const isModified = tab.content !== tab.savedContent;

        return (
          <div
            key={tab.id}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            title={tab.filePath || '未命名'}
          >
            <span className="tab-title">{tab.title}</span>
            {isModified && <span className="tab-dot" title="已修改">●</span>}
            {!isLastTab && (
              <button className="tab-close" onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }} title="关闭标签">×</button>
            )}
          </div>
        );
      })}

      {/* xuechong 2026-08-07 0.3.00 右键菜单 */}
      {menu && (
        <div className="tab-context-menu" style={{ left: menu.x, top: menu.y }}>
          <div className="ctx-item" onClick={() => { onCloseTab(menu.tabId); closeMenu(); }}>
            关闭当前
          </div>
          <div className={`ctx-item${hasRight ? '' : ' ctx-disabled'}`}
            onClick={() => { if (hasRight) { onCloseRight(menu.tabId); closeMenu(); } }}>
            关闭右侧
          </div>
          <div className={`ctx-item${hasLeft ? '' : ' ctx-disabled'}`}
            onClick={() => { if (hasLeft) { onCloseLeft(menu.tabId); closeMenu(); } }}>
            关闭左侧
          </div>
          <div className="ctx-sep" />
          <div className="ctx-item"
            onClick={() => { onCloseAll(); closeMenu(); }}>
            关闭所有
          </div>
        </div>
      )}
    </div>
  );
}
