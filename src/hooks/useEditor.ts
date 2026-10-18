/**
 * 编辑器状态管理Hook（多标签版 + 会话保持）
 * 管理标签页、文件路径、修改状态、分屏比例等
 * 作者 xuechong 2026-06-17 0.3.00
 * 更新 xuechong 2026-06-19 0.3.00 功能：多标签页重构 + 分隔条比例 + localStorage会话保持
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { openFile, saveFile, readFile, isMarkdownFile, getFileName, FileInfo } from '../utils/file-system';

const SESSION_KEY = 'quillium-session';

interface SessionData {
  tabs: Array<{ filePath: string | null; content: string; savedContent: string }>;
  activeTabIndex: number;
  splitterRatio: number;
}

/**
 * 标签页数据模型
 */
export interface TabData {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  savedContent: string;
}

export interface EditorState {
  tabs: TabData[];
  activeTabId: string | null;
  isLoading: boolean;
  error: string | null;
  splitterRatio: number;
}

export interface UseEditorReturn {
  state: EditorState;
  setContent: (content: string) => void;
  setActiveTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  closeTabsRightOf: (tabId: string) => void;
  closeTabsLeftOf: (tabId: string) => void;
  closeAllTabs: () => void;
  handleOpenFile: () => Promise<void>;
  handleSaveFile: () => Promise<void>;
  handleSaveAsFile: () => Promise<void>;
  handleOpenFileByPath: (filePath: string) => Promise<void>;
  clearError: () => void;
  setSplitterRatio: (ratio: number) => void;
}

function createEmptyTab(): TabData {
  return {
    id: crypto.randomUUID(),
    title: '未命名',
    filePath: null,
    content: '',
    savedContent: '',
  };
}

/** 从localStorage加载会话 xuechong 2026-06-19 0.3.00 功能：会话恢复 */
function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    if (!data.tabs || data.tabs.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

/** 保存会话到localStorage xuechong 2026-06-19 0.3.00 功能：自动持久化 */
function saveSession(state: EditorState): void {
  try {
    // xuechong 2026-08-07 0.3.00 只保存有实际内容的标签（有路径或有文字）
    const saveTabs = state.tabs.filter(t => t.filePath !== null || t.content.trim() !== '');
    if (saveTabs.length === 0) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }

    const activeIndex = Math.max(0, saveTabs.findIndex(t => t.id === state.activeTabId));

    const data: SessionData = {
      tabs: saveTabs.map(t => ({
        filePath: t.filePath,
        content: t.content,
        savedContent: t.savedContent,
      })),
      activeTabIndex: activeIndex,
      splitterRatio: state.splitterRatio,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // xuechong 2026-08-07 0.3.00 localStorage 不可用时静默失败
  }
}

export function useEditor(): UseEditorReturn {
  const [state, setState] = useState<EditorState>(() => {
    // xuechong 2026-08-07 0.3.00 尝试恢复上次会话
    const session = loadSession();
    if (session) {
      const tabs: TabData[] = session.tabs.map(s => ({
        id: crypto.randomUUID(),
        title: s.filePath ? getFileName(s.filePath) : '未命名',
        filePath: s.filePath,
        content: s.content,
        savedContent: s.savedContent,
      }));
      const activeIndex = Math.min(session.activeTabIndex, tabs.length - 1);
      return {
        tabs,
        activeTabId: tabs[activeIndex].id,
        isLoading: false,
        error: null,
        splitterRatio: session.splitterRatio || 0.5,
      };
    }

    const emptyTab = createEmptyTab();
    return {
      tabs: [emptyTab],
      activeTabId: emptyTab.id,
      isLoading: false,
      error: null,
      splitterRatio: 0.3,  // xuechong 2026-06-20 0.3.00 左30%右70%
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // xuechong 2026-08-07 0.3.00 每次状态变化自动保存会话
  useEffect(() => {
    saveSession(state);
  }, [state.tabs, state.activeTabId, state.splitterRatio]);

  function getActiveTab(tabs: TabData[], activeTabId: string | null): TabData | undefined {
    return tabs.find(t => t.id === activeTabId);
  }

  const setContent = useCallback((content: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(t =>
        t.id === prev.activeTabId ? { ...t, content } : t
      ),
    }));
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setState(prev => ({ ...prev, activeTabId: tabId }));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setState(prev => {
      if (prev.tabs.length <= 1) return prev;
      const index = prev.tabs.findIndex(t => t.id === tabId);
      if (index === -1) return prev;
      const newTabs = prev.tabs.filter(t => t.id !== tabId);
      let newActiveId = prev.activeTabId;
      if (prev.activeTabId === tabId) {
        const newIndex = Math.min(index, newTabs.length - 1);
        newActiveId = newTabs[newIndex].id;
      }
      return { ...prev, tabs: newTabs, activeTabId: newActiveId };
    });
  }, []);

  // xuechong 2026-08-07 0.3.00 关闭右侧标签
  // xuechong 2026-06-19 0.3.00 功能：关闭右侧标签
  const closeTabsRightOf = useCallback((tabId: string) => {
    setState(prev => {
      const index = prev.tabs.findIndex(t => t.id === tabId);
      if (index === -1) return prev;
      const keepTabs = prev.tabs.slice(0, index + 1);
      let newActiveId = prev.activeTabId;
      if (!keepTabs.find(t => t.id === newActiveId)) {
        newActiveId = tabId;
      }
      return { ...prev, tabs: keepTabs, activeTabId: newActiveId };
    });
  }, []);

  // xuechong 2026-08-07 0.3.00 关闭左侧标签
  // xuechong 2026-06-19 0.3.00 功能：关闭左侧标签
  const closeTabsLeftOf = useCallback((tabId: string) => {
    setState(prev => {
      const index = prev.tabs.findIndex(t => t.id === tabId);
      if (index === -1) return prev;
      const keepTabs = prev.tabs.slice(index);
      let newActiveId = prev.activeTabId;
      if (!keepTabs.find(t => t.id === newActiveId)) {
        newActiveId = tabId;
      }
      return { ...prev, tabs: keepTabs, activeTabId: newActiveId };
    });
  }, []);

  // xuechong 2026-08-07 0.3.00 关闭所有标签（保留一个空标签）
  // xuechong 2026-06-19 0.3.00 功能：关闭所有标签
  const closeAllTabs = useCallback(() => {
    setState(prev => {
      const emptyTab = createEmptyTab();
      return { ...prev, tabs: [emptyTab], activeTabId: emptyTab.id };
    });
  }, []);

  // xuechong 2026-06-19 0.3.00 功能：按路径打开文件
  function doOpenFileByPath(tabs: TabData[], activeTabId: string | null, filePath: string, content: string) {
    const existingTab = tabs.find(t => t.filePath === filePath);
    if (existingTab) {
      if (existingTab.content !== existingTab.savedContent) {
        const reload = window.confirm(
          `"${existingTab.title}" 已在标签页中打开且有未保存的修改。\n\n是否重新加载文件？\n\n[确定] 重新加载（丢失修改）\n[取消] 切换到已有标签`
        );
        if (reload) {
          return {
            tabs: tabs.map(t =>
              t.id === existingTab.id ? { ...t, content, savedContent: content } : t
            ),
            activeTabId: existingTab.id,
            isLoading: false,
            error: null as string | null,
          };
        }
        return { tabs, activeTabId: existingTab.id, isLoading: false, error: null as string | null };
      }
      // xuechong 2026-07-03 0.3.00 修复：无未保存修改时也要刷新为磁盘最新内容（解决会话恢复内容过时问题）
      return {
        tabs: tabs.map(t =>
          t.id === existingTab.id ? { ...t, content, savedContent: content } : t
        ),
        activeTabId: existingTab.id,
        isLoading: false,
        error: null as string | null,
      };
    }

    const currentActive = getActiveTab(tabs, activeTabId);
    if (tabs.length === 1 && currentActive && currentActive.filePath === null && currentActive.content === '') {
      const newTab: TabData = {
        id: crypto.randomUUID(),
        title: getFileName(filePath),
        filePath,
        content,
        savedContent: content,
      };
      return { tabs: [newTab], activeTabId: newTab.id, isLoading: false, error: null as string | null };
    }

    const newTab: TabData = {
      id: crypto.randomUUID(),
      title: getFileName(filePath),
      filePath,
      content,
      savedContent: content,
    };
    return { tabs: [...tabs, newTab], activeTabId: newTab.id, isLoading: false, error: null as string | null };
  }

  const handleOpenFile = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const fileInfo: FileInfo | null = await openFile();
      if (!fileInfo) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      setState(prev => {
        const result = doOpenFileByPath(prev.tabs, prev.activeTabId, fileInfo.path, fileInfo.content);
        return { ...prev, ...result };
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: `打开文件失败: ${error}` }));
    }
  }, []);

  const handleOpenFileByPath = useCallback(async (filePath: string) => {
    if (!isMarkdownFile(filePath)) {
      setState(prev => ({ ...prev, error: '仅支持打开 .md / .markdown 文件' }));
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const content = await readFile(filePath);
      if (content === null) {
        setState(prev => ({ ...prev, isLoading: false, error: '文件不存在或无法读取' }));
        return;
      }
      setState(prev => {
        const result = doOpenFileByPath(prev.tabs, prev.activeTabId, filePath, content);
        return { ...prev, ...result };
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: `打开文件失败: ${error}` }));
    }
  }, []);

  const handleSaveFile = useCallback(async () => {
    const cur = stateRef.current;
    const tab = getActiveTab(cur.tabs, cur.activeTabId);
    if (!tab) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const success = await saveFile(tab.content, tab.filePath || undefined);
      if (success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          tabs: prev.tabs.map(t =>
            t.id === prev.activeTabId ? { ...t, savedContent: t.content } : t
          ),
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: `保存文件失败: ${error}` }));
    }
  }, []);

  const handleSaveAsFile = useCallback(async () => {
    const cur = stateRef.current;
    const tab = getActiveTab(cur.tabs, cur.activeTabId);
    if (!tab) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const success = await saveFile(tab.content);
      if (success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          tabs: prev.tabs.map(t =>
            t.id === prev.activeTabId ? { ...t, savedContent: t.content } : t
          ),
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: `另存为失败: ${error}` }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setSplitterRatio = useCallback((ratio: number) => {
    setState(prev => ({
      ...prev,
      splitterRatio: Math.max(0.2, Math.min(0.8, ratio)),
    }));
  }, []);

  return {
    state,
    setContent,
    setActiveTab,
    closeTab,
    closeTabsRightOf,
    closeTabsLeftOf,
    closeAllTabs,
    handleOpenFile,
    handleSaveFile,
    handleSaveAsFile,
    handleOpenFileByPath,
    clearError,
    setSplitterRatio,
  };
}
