/**
 * Quillium 主应用组件
 * 作者 xuechong 2026-06-18 0.3.00
 * 更新 xuechong 2026-06-19 0.3.00 功能：多标签页 + 分隔条 + 同步滚动 + 会话保持 + 路径复制
 */

import { useEffect, useCallback, useRef, useState, useMemo, lazy, Suspense } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import Editor, { EditorHandle } from './components/Editor/Editor';
import EditorToolbar from './components/Editor/EditorToolbar';
import Preview, { PreviewHandle } from './components/Preview/Preview';
import StatusBar from './components/StatusBar/StatusBar';
import TabBar from './components/TabBar/TabBar';
import SearchBar from './components/SearchBar/SearchBar';
import Outline from './components/Outline/Outline';
import { useEditor } from './hooks/useEditor';
import { useSettings } from './hooks/useSettings';
import { useConfig } from './hooks/useConfig';

  // 懒加载模态框 xuechong 2026-06-20 0.3.00
const ChangelogModal = lazy(() => import('./components/Changelog/ChangelogModal'));
const SettingsModal = lazy(() => import('./components/Settings/SettingsModal'));
import { parseOutline } from './utils/outline-parser';
import './App.css';
import './styles/markdown.css';

/** Markdown格式化 xuechong 2026-06-17 0.3.00 */
function insertFormat(format: string, content: string): string {
  const formats: Record<string, { prefix: string; suffix: string; placeholder: string }> = {
    bold: { prefix: '**', suffix: '**', placeholder: 'bold text' },
    italic: { prefix: '*', suffix: '*', placeholder: 'italic text' },
    strikethrough: { prefix: '~~', suffix: '~~', placeholder: 'strikethrough text' },
    code: { prefix: '`', suffix: '`', placeholder: 'code' },
    link: { prefix: '[', suffix: '](url)', placeholder: 'link text' },
    image: { prefix: '![', suffix: '](url)', placeholder: 'image alt' },
    unorderedList: { prefix: '- ', suffix: '', placeholder: 'list item' },
    orderedList: { prefix: '1. ', suffix: '', placeholder: 'list item' },
    taskList: { prefix: '- [ ] ', suffix: '', placeholder: 'task item' },
    blockquote: { prefix: '> ', suffix: '', placeholder: 'quote' },
    horizontalRule: { prefix: '\n---\n', suffix: '', placeholder: '' },
    heading: { prefix: '## ', suffix: '', placeholder: 'Heading' },
    codeBlock: { prefix: '```\n', suffix: '\n```', placeholder: 'code block' },
    table: { prefix: '| Col 1 | Col 2 | Col 3 |\n| --- | --- | --- |\n| ', suffix: ' | Data | Data |', placeholder: 'Data' },
  };
  const f = formats[format];
  return f ? content + f.prefix + f.placeholder + f.suffix : content;
}

function App() {
  const {
    state, setContent, setActiveTab, closeTab,
    handleOpenFile, handleSaveFile, handleOpenFileByPath,
    clearError, setSplitterRatio,
    closeTabsRightOf, closeTabsLeftOf, closeAllTabs,
  } = useEditor();

  // xuechong 2026-08-07 0.3.00 系统设置 + 配置持久化
  const { settings, updateEditor, updateGeneral } = useSettings();
  const { config, ready: configReady, configPath } = useConfig();

  // xuechong 2026-08-07 0.3.00 视图模式: all(编辑) | preview_with_outline(预览)
  // 启动时始终以系统设置为准（配置优先级最高）xuechong 2026-06-20 0.3.00
  const [viewMode, setViewMode] = useState(settings.general.defaultViewMode);

  const handleViewMode = useCallback((mode: string) => {
    setViewMode(mode);
  }, []);

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) ?? null;
  const activeContent = activeTab?.content ?? '';
  const isModified = activeTab ? activeTab.content !== activeTab.savedContent : false;

  // xuechong 2026-08-07 0.3.00 Refs
  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<PreviewHandle>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isSyncingRef = useRef(false);
  const isJumpingRef = useRef(false);
  const listenersReady = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // xuechong 2026-08-07 0.3.00 目录大纲（useMemo 避免每次渲染重解析）
  const headings = useMemo(() => parseOutline(activeContent), [activeContent]);

  // xuechong 2026-08-07 0.3.00 路径显示
  const displayPath = activeTab?.filePath?.replace(/\\/g, '/') ?? '';
  const [showChangelog, setShowChangelog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [activeOutlineLine, setActiveOutlineLine] = useState<number | null>(null);
  const [outlineWidth, setOutlineWidth] = useState(280);
  const outlineDraggingRef = useRef(false);
  // xuechong 2026-08-07 0.3.00 格式化
  const handleFormat = useCallback((format: string) => {
    setContent(insertFormat(format, activeContent));
  }, [activeContent, setContent]);

  // xuechong 2026-08-07 0.3.00 快捷键
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSaveFile(); }
      if (e.ctrlKey && e.key === 'o') { e.preventDefault(); handleOpenFile(); }
      if (e.ctrlKey && e.key === 'w') { e.preventDefault(); if (activeTab && state.tabs.length > 1) handleCloseTab(activeTab.id); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleSaveFile, handleOpenFile, activeTab, state.tabs.length]);

  // xuechong 2026-06-19 0.3.00 功能：同步未保存状态到 Rust
  useEffect(() => {
    const shouldWarn = settings.general.confirmOnClose;
    const hasUnsaved = shouldWarn && state.tabs.some(t => t.content !== t.savedContent);
    invoke('set_unsaved', { unsaved: hasUnsaved });
  }, [state.tabs, settings.general.confirmOnClose]);

  // xuechong 2026-06-20 0.3.00 功能：文件追踪 + 备份监视
  useEffect(() => {
    if (!activeTab?.filePath || !configReady) return;
    invoke('track_file', { filePath: activeTab.filePath }).catch(() => {});
    const bd = config.backup_dir || (configPath.replace(/\/[^/]+$/, '') + '/backup');
    invoke('start_backup_watcher', { filePath: activeTab.filePath, backupDir: bd, intervalSecs: config.backup_interval || 300 }).catch(() => {});
    return () => { invoke('stop_backup_watcher', { filePath: activeTab.filePath }).catch(() => {}); };
  }, [activeTab?.filePath, configReady]);

  // xuechong 2026-06-20 0.3.00 功能：窗口聚焦时检查文件外部修改
  useEffect(() => {
    const f = async () => {
      if (!activeTab?.filePath) return;
      try {
        const ch: boolean = await invoke('check_file_changed', { filePath: activeTab.filePath });
        if (ch && window.confirm(`"${activeTab.title}" 已被外部修改。是否重新加载？`)) {
          const ct: string | null = await invoke('read_file', { filePath: activeTab.filePath });
          if (ct !== null) setContent(ct);
        }
      } catch { /* */ }
    };
    window.addEventListener('focus', f);
    return () => window.removeEventListener('focus', f);
  }, [activeTab?.filePath]);

  // xuechong 2026-06-20 0.3.00 功能：自动保存
  useEffect(() => {
    if (!settings.general.autoSave) return;
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (!tab || !tab.filePath || tab.content === tab.savedContent) return;

    const timer = setTimeout(() => {
      handleSaveFile();
    }, settings.general.autoSaveInterval * 1000);

    return () => clearTimeout(timer);
  }, [state.activeTabId, state.tabs, settings.general.autoSave, settings.general.autoSaveInterval]);

  // xuechong 2026-08-07 0.3.00 拖拽打开
  useEffect(() => {
    const unlisten = listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
      if (event.payload.paths?.length > 0) handleOpenFileByPath(event.payload.paths[0]);
    });
    return () => { unlisten.then(fn => fn()); };
  }, [handleOpenFileByPath]);

  // xuechong 2026-07-03 0.3.00 功能：启动时通过命令行参数打开文件（Windows .md 文件关联双击）
  useEffect(() => {
    invoke('get_launch_file').then((filePath) => {
      if (filePath && typeof filePath === 'string') {
        handleOpenFileByPath(filePath);
      }
    }).catch(() => {});
  }, []); // 仅在首次挂载时执行

  // xuechong 2026-07-03 0.3.00 功能：监听后续双击 .md 文件（单实例模式，新文件在已有窗口中打开）
  useEffect(() => {
    const unlisten = listen<string>('open-file-from-os', (event) => {
      if (event.payload) {
        handleOpenFileByPath(event.payload);
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, [handleOpenFileByPath]);

  // xuechong 2026-08-07 0.3.00 分隔条拖拽
  const handleSplitterMouseDown = useCallback(() => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // 目录分隔条拖拽 xuechong 2026-06-20 0.3.00
  const handleOutlineSplitterDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    outlineDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (isDraggingRef.current && splitContainerRef.current) {
        const rect = splitContainerRef.current.getBoundingClientRect();
        setSplitterRatio((e.clientX - rect.left) / rect.width);
      }
      if (outlineDraggingRef.current) {
        setOutlineWidth(Math.max(100, Math.min(400, e.clientX - 100)));
      }
    };
    const up = () => {
      if (isDraggingRef.current) { isDraggingRef.current = false; }
      if (outlineDraggingRef.current) { outlineDraggingRef.current = false; }
      if (!isDraggingRef.current && !outlineDraggingRef.current) {
        document.body.style.cursor = ''; document.body.style.userSelect = '';
      }
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  }, [setSplitterRatio]);

  // xuechong 2026-08-07 0.3.00 同步滚动 + 大纲追踪
  // xuechong 2026-06-20 0.3.00 功能：ref防重复注册，scroll时实时读取数据
  const headingsRef = useRef(headings);
  headingsRef.current = headings;

  useEffect(() => {
    const es = editorRef.current?.getScrollContainer();
    const ps = previewRef.current?.getScrollContainer();
    if (!es || !ps || listenersReady.current) return;
    listenersReady.current = true;

    const syncTo = (from: HTMLElement, to: HTMLElement) => {
      if (isSyncingRef.current || isJumpingRef.current) return;
      const maxFrom = from.scrollHeight - from.clientHeight;
      const maxTo = to.scrollHeight - to.clientHeight;
      if (maxFrom <= 0 || maxTo <= 0) return;
      isSyncingRef.current = true;
      to.scrollTop = (from.scrollTop / maxFrom) * maxTo;
      isSyncingRef.current = false;
    };

    const trackHeading = () => {
      if (lockedOutlineLine.current !== null) return; // 点击锁定期间不覆盖
      const heads = ps.querySelectorAll('h1, h2, h3, h4');
      const hh = headingsRef.current;
      const st = ps.scrollTop;
      for (let i = heads.length - 1; i >= 0; i--) {
        if ((heads[i] as HTMLElement).offsetTop <= st + 10) {
          if (hh[i]) setActiveOutlineLine(hh[i].line);
          return;
        }
      }
      if (hh.length > 0) setActiveOutlineLine(hh[0].line);
    };

    const onEditor = () => { syncTo(es, ps); trackHeading(); };
    const onPreview = () => { syncTo(ps, es); trackHeading(); };

    es.addEventListener('scroll', onEditor, { passive: true });
    ps.addEventListener('scroll', onPreview, { passive: true });

    return () => {
      es.removeEventListener('scroll', onEditor);
      ps.removeEventListener('scroll', onPreview);
      listenersReady.current = false;
    };
  });  // 每帧尝试，listenersReady 防重复；切换标签时 reset 重建

  // 大纲跳转 xuechong 2026-06-20 0.3.00
  // 点击锁定行号，防止 scroll 事件覆盖 xuechong 2026-06-20 0.3.00
  const lockedOutlineLine = useRef<number | null>(null);
  const handleOutlineJump = useCallback((line: number) => {
    isJumpingRef.current = true;
    lockedOutlineLine.current = line;
    setActiveOutlineLine(line);
  // 编辑器光标跳到对应行 + 滚动到该行 xuechong 2026-06-20 0.3.00
    editorRef.current?.setCursorLine(line);
    const es = editorRef.current?.getScrollContainer();
    if (es) {
      const top = editorRef.current?.getLineTop(line) ?? 0;
      es.scrollTo({ top: Math.max(0, top - 50), behavior: 'instant' });
    }
    const ps = previewRef.current?.getScrollContainer();
    if (!ps) { isJumpingRef.current = false; lockedOutlineLine.current = null; return; }
    const heads = ps.querySelectorAll('h1, h2, h3, h4');
    const hh = headingsRef.current;
    const idx = hh.findIndex(h => h.line === line);
    if (idx >= 0 && idx < heads.length) {
      ps.scrollTo({ top: (heads[idx] as HTMLElement).offsetTop - 28, behavior: 'instant' });
    }
    setTimeout(() => { isJumpingRef.current = false; lockedOutlineLine.current = null; }, 300);
  }, []);


  // xuechong 2026-08-07 0.3.00 关闭标签
  const handleCloseTab = useCallback((tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab && tab.content !== tab.savedContent) {
      if (!window.confirm(`"${tab.title}" 尚未保存，确定关闭吗？`)) return;
    }
    closeTab(tabId);
  }, [state.tabs, closeTab]);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#ffffff' }}>
      <TabBar tabs={state.tabs} activeTabId={state.activeTabId} onSelectTab={setActiveTab} onCloseTab={handleCloseTab}
        onCloseRight={closeTabsRightOf} onCloseLeft={closeTabsLeftOf} onCloseAll={closeAllTabs} />

      {/* 工具栏 xuechong 2026-06-20 0.3.00 浅色主题 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', padding: '5px 10px', backgroundColor: '#f0f2f5', borderBottom: '1px solid #d1d5da', flexShrink: 0, minHeight: '36px' }}>
        {/* xuechong 2026-08-07 0.3.00 系统设置 */}
        <button onClick={() => setShowSettings(true)} title="系统设置"
          style={{ background: '#fff', border: '1px solid #d1d5da', color: '#24292e', cursor: 'pointer', fontSize: '18px', padding: '4px 10px', borderRadius: '4px' }}
        >⚙</button>

        {/* xuechong 2026-08-07 0.3.00 版本 */}
        <button onClick={() => setShowChangelog(true)} title="版本记录"
          style={{ background: '#fff', border: '1px solid #d1d5da', color: '#586069', cursor: 'pointer', fontSize: '12px', padding: '5px 9px', borderRadius: '4px', fontWeight: 600 }}
        >v0.4.00</button>

        <span style={{ color: '#d1d5da', fontSize: '18px', margin: '0 2px' }}>|</span>

        {/* xuechong 2026-08-07 0.3.00 文件操作 */}
        <button onClick={handleOpenFile} disabled={state.isLoading} title="打开文件 (Ctrl+O)"
          style={{ padding: '5px 12px', border: '1px solid #d1d5da', borderRadius: '4px', background: '#fff', color: '#24292e', cursor: 'pointer', fontSize: '13px' }}
        >📂 打开</button>
        <button onClick={handleSaveFile} disabled={state.isLoading} title="保存文件 (Ctrl+S)"
          style={{ padding: '5px 12px', border: '1px solid #d1d5da', borderRadius: '4px', background: '#fff', color: '#24292e', cursor: 'pointer', fontSize: '13px' }}
        >💾 保存</button>

        <span style={{ color: '#d1d5da', fontSize: '18px', margin: '0 2px' }}>|</span>

        {/* xuechong 2026-08-07 0.3.00 格式化按钮 */}
        <EditorToolbar onFormat={handleFormat} disabled={state.isLoading}
          viewMode={viewMode} onViewMode={handleViewMode} />

        {/* 搜索（始终可见） xuechong 2026-06-20 0.3.00 */}
        <SearchBar editorRef={editorRef} />
      </div>

      {state.error && (
        <div className="error-banner" style={{ padding: '6px 16px', backgroundColor: '#f8d7da', color: '#721c24', borderBottom: '1px solid #f5c6cb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', flexShrink: 0 }}>
          <span>{state.error}</span>
          <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 4px', color: '#721c24' }}>×</button>
        </div>
      )}

      {/* xuechong 2026-08-07 0.3.00 分屏主体 */}
      <div ref={splitContainerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* xuechong 2026-08-07 0.3.00 文本区（视图模式：仅预览时隐藏） */}
        {viewMode === 'all' && (
        <div style={{ flex: `0 0 ${state.splitterRatio * 100}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ padding: '4px 12px', backgroundColor: '#f6f8fa', borderBottom: '1px solid #e1e4e8', fontSize: '12px', color: '#656d76', flexShrink: 0 }}>编辑区</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor key={activeTab?.id} ref={editorRef} initialContent={activeContent} onChange={setContent} onSave={handleSaveFile}
              fontSize={settings.editor.fontSize} tabSize={settings.editor.tabSize}
              wordWrap={settings.editor.wordWrap} lineNumbers={settings.editor.lineNumbers} />
          </div>
        </div>
        )}

        {viewMode === 'all' && (
        <div className="splitter" onMouseDown={handleSplitterMouseDown} />)}

        {/* xuechong 2026-08-07 0.3.00 预览区 */}
        <div style={{
          flex: viewMode === 'all' ? `0 0 ${(1 - state.splitterRatio) * 100}%` : '1 1 auto',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0,
        }}>
          <div style={{ padding: '4px 12px', backgroundColor: '#f6f8fa', borderBottom: '1px solid #e1e4e8', fontSize: '12px', color: '#656d76', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ flexShrink: 0 }}>预览区</span>
            {activeTab?.filePath && (
              <span style={{ fontSize: '12px', color: '#0366d6', fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, userSelect: 'text' }} title={displayPath}>{displayPath}</span>
            )}
            {isModified && <span style={{ fontSize: '11px', color: '#f66', flexShrink: 0 }}>已修改</span>}
            <button onClick={() => setShowOutline(!showOutline)} title="切换大纲"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: showOutline ? '#0366d6' : '#999', flexShrink: 0 }}
            >☰</button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            <Outline
              headings={headings}
              activeLine={activeOutlineLine}
              onJump={handleOutlineJump}
              visible={showOutline}
              onToggle={() => setShowOutline(!showOutline)}
              width={outlineWidth}
            />
            {showOutline && (
              <div style={{ width: '4px', cursor: 'col-resize', backgroundColor: '#e1e4e8', flexShrink: 0 }}
                onMouseDown={handleOutlineSplitterDown} />
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Preview ref={previewRef} content={activeContent} />
            </div>
          </div>
        </div>
      </div>

      <StatusBar content={activeContent} filePath={activeTab?.filePath || undefined} isModified={isModified} />

      {showChangelog && <Suspense><ChangelogModal onClose={() => setShowChangelog(false)} /></Suspense>}
      {showSettings && (
        <Suspense><SettingsModal
          settings={settings}
          onUpdateEditor={updateEditor}
          onUpdateGeneral={updateGeneral}
          onClose={() => setShowSettings(false)}
        /></Suspense>
      )}
    </div>
  );
}

export default App;
