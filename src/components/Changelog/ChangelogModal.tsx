/**
 * 版本记录弹窗组件
 * 遵循 Keep a Changelog 标准格式 + 语义化版本
 * 作者 xuechong 2026-06-19 0.3.0
 */

import './ChangelogModal.css';

type ChangeCategory = 'Added' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security';

interface VersionEntry {
  version: string;
  date: string;
  changes: Record<ChangeCategory, string[]>;
}

const VERSIONS: VersionEntry[] = [
  {
    version: '0.4.0',
    date: '2026-08-17',
    changes: {
      Added: [],
      Changed: [
        '版本号从 0.3.0 升级至 0.4.0',
      ],
      Deprecated: [],
      Removed: [],
      Fixed: [
        '关闭预览排版美化（typographer）：修复围栏外SQL的直引号 \' 被误显示为中文弯引号 ‘’、双引号 " 被显示为 “”、SQL注释符 -- 被显示为长横线 – 的问题，预览严格保持原始内容',
      ],
      Security: [],
    },
  },
  {
    version: '0.3.0',
    date: '2026-08-07',
    changes: {
      Added: [
        '版本号统一为语义化版本（主版本.次版本.补丁）',
        '代码注释全面检查并统一携带版本号',
      ],
      Changed: [
        '版本号从 0.2.0 升级至 0.3.0',
      ],
      Deprecated: [],
      Removed: [],
      Fixed: [
        '目录大纲误将代码块内 # 行解析为标题（改用 markdown-it 解析，与预览完全一致，覆盖代码围栏、HTML 注释块等场景）',
      ],
      Security: [],
    },
  },
  {
    version: '0.2.0',
    date: '2026-07-03',
    changes: {
      Added: [
        'Windows .md 文件关联支持：双击 .md 文件自动在 crabapple-md 中打开',
        '单实例模式：再次双击 .md 文件时，在现有窗口新建标签页而非启动新窗口',
        '启动文件检测：命令行参数传入的 .md 文件优先于会话恢复打开',
      ],
      Changed: [
        '已有标签页再次打开同一文件时，自动刷新为磁盘最新内容（解决会话恢复内容过时问题）',
      ],
      Deprecated: [],
      Removed: [],
      Fixed: [
        '双击 .md 文件时弹出之前打开过的旧文件而非当前文件的 bug',
        '每次双击 .md 文件都启动新应用实例的 bug',
      ],
      Security: [],
    },
  },
  {
    version: '0.1.0',
    date: '2026-06-17',
    changes: {
      Added: [
        '基于 Tauri 2 + React 19 + CodeMirror 6 项目框架',
        '分屏布局：左侧 Markdown 源码编辑，右侧实时预览',
        '标准 Markdown 语法支持（标题/粗体/斜体/代码/链接/图片/列表/引用/表格/任务列表/水平线）',
        '代码语法高亮（CodeMirror 语言数据）',
        '工具栏 14 个格式化按钮',
        '文件打开（Ctrl+O）/ 保存（Ctrl+S）/ 另存为',
        '拖拽 .md 文件到窗口自动打开（Tauri 原生事件）',
        '可拖拽分隔条调节左右面板宽度（20%~80%）',
        '左右面板同步滚动',
        '底部状态栏（文件名/字符数/单词数/行数）',
        '多标签页管理——每个文件独立标签，互不覆盖',
        '标签右键菜单：关闭当前/右侧/左侧/所有',
        '窗口标题栏 crabapple-md 品牌名 + 应用图标',
        'Windows 10/11 便携版单文件发布（exe + dll）',
        '窗口关闭时未保存文件提醒',
        '启动时自动恢复上次打开的标签页（会话保持）',
        '文件路径 Linux 风格显示 + 一键复制到剪贴板',
      ],
      Changed: [],
      Deprecated: [],
      Removed: [],
      Fixed: [
        '编辑器输入时焦点丢失（CodeMirror 重复创建）',
        '预览区 CSS 高度链断裂导致不跟随滚动',
      ],
      Security: [],
    },
  },
];

const CATEGORY_LABELS: Record<ChangeCategory, string> = {
  Added: '新增',
  Changed: '变更',
  Deprecated: '弃用',
  Removed: '移除',
  Fixed: '修复',
  Security: '安全',
};

const CATEGORY_COLORS: Record<ChangeCategory, string> = {
  Added: '#2ea043',
  Changed: '#d29922',
  Deprecated: '#8b949e',
  Removed: '#f85149',
  Fixed: '#58a6ff',
  Security: '#f85149',
};

interface Props {
  onClose: () => void;
}

export default function ChangelogModal({ onClose }: Props) {
  return (
    <div className="cl-overlay" onClick={onClose}>
      <div className="cl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cl-header">
          <h2>版本记录</h2>
          <button className="cl-close" onClick={onClose}>×</button>
        </div>
        <div className="cl-body">
          <p className="cl-intro">
            格式遵循 <a href="https://keepachangelog.com/en/1.1.0/" target="_blank">Keep a Changelog</a>，
            版本号遵循 <a href="https://semver.org/lang/zh-CN/" target="_blank">语义化版本</a>。
          </p>

          {VERSIONS.map((entry) => (
            <div key={entry.version} className="cl-version">
              <h3>
                <span className="cl-ver-tag">v{entry.version}</span>
                <span className="cl-ver-date"> — {entry.date}</span>
              </h3>

              {(Object.keys(entry.changes) as ChangeCategory[]).map((cat) => {
                const items = entry.changes[cat];
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="cl-category">
                    <span className="cl-cat-tag" style={{ backgroundColor: CATEGORY_COLORS[cat] }}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <ul>
                      {items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}

          <p className="cl-footer">crabapple-md — Windows 10/11</p>
        </div>
      </div>
    </div>
  );
}
