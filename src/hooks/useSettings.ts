/**
 * 系统设置 Hook — 编辑器 + 通用配置，localStorage 持久化
 * xuechong 2026-06-20 0.3.00
 */

import { useState, useCallback } from 'react';

const SETTINGS_KEY = 'quillium-settings';

export interface EditorSettings {
  fontSize: number;      // 12-24
  tabSize: number;       // 2/4/8
  wordWrap: boolean;
  lineNumbers: boolean;
}

export interface GeneralSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  confirmOnClose: boolean;
  defaultViewMode: string; // 'all' | 'preview_with_outline'
}

export interface AppSettings {
  editor: EditorSettings;
  general: GeneralSettings;
}

const DEFAULTS: AppSettings = {
  editor: {
    fontSize: 16,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
  },
  general: {
    autoSave: false,
    autoSaveInterval: 60,
    confirmOnClose: true,
    defaultViewMode: 'all',
  },
};

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...DEFAULTS, ...saved, editor: { ...DEFAULTS.editor, ...saved.editor }, general: { ...DEFAULTS.general, ...saved.general } };
    }
  } catch { /* ignore */ }
  return DEFAULTS;
}

function save(settings: AppSettings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(load);

  const updateEditor = useCallback((patch: Partial<EditorSettings>) => {
    setSettings(prev => {
      const next = { ...prev, editor: { ...prev.editor, ...patch } };
      save(next);
      return next;
    });
  }, []);

  const updateGeneral = useCallback((patch: Partial<GeneralSettings>) => {
    setSettings(prev => {
      const next = { ...prev, general: { ...prev.general, ...patch } };
      save(next);
      return next;
    });
  }, []);

  return { settings, updateEditor, updateGeneral };
}
