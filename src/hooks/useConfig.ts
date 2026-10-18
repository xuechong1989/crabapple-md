/**
 * 统一配置管理 Hook — crabapple-md.json 读写
 * xuechong 2026-06-20 0.3.00 功能：替代 localStorage，持久化到 exe 同目录
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ConfigData {
  settings: Record<string, unknown>;
  session: Record<string, unknown>;
  splitter_ratio: number;
  view_mode: string;
  backup_dir: string;
  backup_interval: number;
}

const DEFAULTS: ConfigData = {
  settings: {},
  session: {},
  splitter_ratio: 0.3,
  view_mode: 'all',
  backup_dir: '',
  backup_interval: 300,
};

export function useConfig() {
  const [config, setConfig] = useState<ConfigData>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const configPathRef = useRef('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // xuechong 2026-08-07 0.3.00 初始化：获取 exe 目录，读取配置
  useEffect(() => {
    (async () => {
      try {
        const exeDir: string = await invoke('get_exe_dir');
        configPathRef.current = exeDir.replace(/\\/g, '/') + '/crabapple-md.json';
        const data: ConfigData = await invoke('read_config', {
          configPath: configPathRef.current,
        });
        setConfig({ ...DEFAULTS, ...data });
      } catch {
        // xuechong 2026-08-07 0.3.00 读取失败用默认值
      }
      setReady(true);
    })();
  }, []);

  // xuechong 2026-08-07 0.3.00 写入配置（debounce 500ms 避免频繁 I/O）
  const saveConfig = useCallback((patch: Partial<ConfigData>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (configPathRef.current) {
          invoke('write_config', { configPath: configPathRef.current, data: next }).catch(() => {});
        }
      }, 500);
      return next;
    });
  }, []);

  return { config, ready, saveConfig, configPath: configPathRef.current };
}
