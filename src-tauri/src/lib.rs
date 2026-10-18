/**
 * Tauri后端核心模块
 * 实现文件操作 + 窗口关闭拦截
 * 作者 xuechong 2026-06-17 0.3.00
 * 更新 xuechong 2026-06-19 0.3.00 功能：关闭前未保存检查（Rust原生层）
 */

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Manager;
use tauri::Emitter;

/// xuechong 2026-08-07 0.3.00 全局标记：前端同步未保存状态
static HAS_UNSAVED: AtomicBool = AtomicBool::new(false);

/// xuechong 2026-08-07 0.3.00 前端调用此命令同步未保存状态
#[tauri::command]
fn set_unsaved(unsaved: bool) {
    HAS_UNSAVED.store(unsaved, Ordering::SeqCst);
}

/**
 * xuechong 2026-08-07 0.3.00 文件信息结构体
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub content: String,
}

/**
 * xuechong 2026-08-07 0.3.00 打开文件对话框并读取文件内容
 */
#[tauri::command]
async fn open_file_dialog(app: tauri::AppHandle) -> Result<Option<FileInfo>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "mdown", "mkd"])
        .add_filter("所有文件", &["*"])
        .blocking_pick_file();

    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            let path_buf = PathBuf::from(&path_str);

            // xuechong 2026-08-07 0.3.00 读取文件内容
            match fs::read_to_string(&path_buf) {
                Ok(content) => {
                    let name = path_buf
                        .file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string();

                    Ok(Some(FileInfo {
                        path: path_str,
                        name,
                        content,
                    }))
                }
                Err(e) => Err(format!("读取文件失败: {}", e)),
            }
        }
        None => Ok(None),
    }
}

/**
 * xuechong 2026-08-07 0.3.00 保存文件到指定路径
 */
#[tauri::command]
async fn save_file(
    app: tauri::AppHandle,
    content: String,
    file_path: Option<String>,
) -> Result<bool, String> {
    let target_path = match file_path {
        Some(path) => PathBuf::from(path),
        None => {
            // xuechong 2026-08-07 0.3.00 显示另存为对话框
            use tauri_plugin_dialog::DialogExt;

            let save_path = app
                .dialog()
                .file()
                .add_filter("Markdown", &["md"])
                .set_file_name("untitled.md")
                .blocking_save_file();

            match save_path {
                Some(path) => PathBuf::from(path.to_string()),
                None => return Ok(false),
            }
        }
    };

    // xuechong 2026-08-07 0.3.00 写入文件
    match fs::write(&target_path, &content) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("保存文件失败: {}", e)),
    }
}

/**
 * xuechong 2026-08-07 0.3.00 读取指定路径的文件内容
 */
#[tauri::command]
async fn read_file(file_path: String) -> Result<Option<String>, String> {
    let path = PathBuf::from(&file_path);

    if !path.exists() {
        return Ok(None);
    }

    match fs::read_to_string(&path) {
        Ok(content) => Ok(Some(content)),
        Err(e) => Err(format!("读取文件失败: {}", e)),
    }
}

/**
 * 获取启动时 Windows 传入的文件路径（通过命令行参数）
 * xuechong 2026-07-03 0.3.00 功能：读取命令行参数中的 .md 文件路径，供前端启动时使用
 */
#[tauri::command]
fn get_launch_file() -> Result<Option<String>, String> {
    let args: Vec<String> = std::env::args().collect();
    // xuechong 2026-08-07 0.3.00 跳过第一个参数（exe路径），查找 .md 文件
    for arg in args.iter().skip(1) {
        let lower = arg.to_lowercase();
        if lower.ends_with(".md") || lower.ends_with(".markdown") ||
           lower.ends_with(".mdown") || lower.ends_with(".mkd") {
            // xuechong 2026-08-07 0.3.00 验证文件存在
            let path = std::path::PathBuf::from(arg);
            if path.exists() {
                return Ok(Some(arg.clone()));
            }
        }
    }
    Ok(None)
}

/**
 * xuechong 2026-08-07 0.3.00 应用入口
 */
// xuechong 2026-08-07 0.3.00 ===== 配置持久化（quillium.json）=====
// xuechong 2026-06-20 0.3.00

use std::sync::Mutex;
use std::collections::HashMap;
use std::sync::LazyLock;

/// xuechong 2026-08-07 0.3.00 完整配置结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConfigData {
    #[serde(default)]
    pub settings: serde_json::Value,
    #[serde(default)]
    pub session: serde_json::Value,
    #[serde(default = "default_splitter_ratio")]
    pub splitter_ratio: f64,
    #[serde(default = "default_view_mode")]
    pub view_mode: String,
    #[serde(default)]
    pub backup_dir: String,
    #[serde(default = "default_backup_interval")]
    pub backup_interval: u64,
}

fn default_splitter_ratio() -> f64 { 0.3 }
fn default_view_mode() -> String { "all".into() }
fn default_backup_interval() -> u64 { 300 }

impl Default for ConfigData {
    fn default() -> Self {
        Self {
            settings: serde_json::Value::default(),
            session: serde_json::Value::default(),
            splitter_ratio: 0.3,
            view_mode: "all".into(),
            backup_dir: String::new(),
            backup_interval: 300,
        }
    }
}

/// xuechong 2026-08-07 0.3.00 获取 exe 所在目录
#[tauri::command]
fn get_exe_dir() -> Result<String, String> {
    let exe = std::env::current_exe().map_err(|e| format!("获取exe路径失败: {}", e))?;
    let dir = exe.parent().ok_or("无法获取exe目录")?;
    Ok(dir.to_string_lossy().to_string())
}

/// xuechong 2026-08-07 0.3.00 读取配置文件
#[tauri::command]
fn read_config(config_path: String) -> Result<ConfigData, String> {
    let path = PathBuf::from(&config_path);
    if !path.exists() {
        return Ok(ConfigData::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("读取配置失败: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("解析配置失败: {}", e))
}

/// xuechong 2026-08-07 0.3.00 写入配置文件
#[tauri::command]
fn write_config(config_path: String, data: ConfigData) -> Result<(), String> {
    let path = PathBuf::from(&config_path);
    let content = serde_json::to_string_pretty(&data).map_err(|e| format!("序列化配置失败: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("写入配置失败: {}", e))
}

// xuechong 2026-08-07 0.3.00 ===== 自动备份 =====
// xuechong 2026-06-20 0.3.00

struct BackupState {
    running: bool,
    last_hash: String,
}

static BACKUP_STATES: LazyLock<Mutex<HashMap<String, BackupState>>> = LazyLock::new(|| Mutex::new(HashMap::new()));
static FILE_MODIFIED: LazyLock<Mutex<HashMap<String, u64>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

/// xuechong 2026-08-07 0.3.00 计算文件内容简单哈希
fn file_hash(path: &PathBuf) -> String {
    use std::hash::{Hash, Hasher};
    fs::read_to_string(path)
        .map(|s| { let mut h = std::collections::hash_map::DefaultHasher::new(); s.hash(&mut h); format!("{:x}", h.finish()) })
        .unwrap_or_default()
}

/// xuechong 2026-08-07 0.3.00 简易日期格式化 YYYY-MM-DD
fn format_date() -> String {
    let t = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    let secs = t.as_secs();
    let days = secs / 86400 + 719468;
    let era = if days >= 0 { days } else { days - 146096 };
    let doe = era as u32 - (era as u32 / 146097) * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + (era as u32 / 146097) * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let d = doy - (153 * mp + 2) / 5 + 1;
    format!("{:04}-{:02}-{:02}", y, m, d)
}

/// xuechong 2026-08-07 0.3.00 简易时间戳 HH-MM-SS
fn format_time() -> String {
    let t = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    let secs = t.as_secs() % 86400;
    format!("{:02}-{:02}-{:02}", secs / 3600, (secs % 3600) / 60, secs % 60)
}

/// xuechong 2026-08-07 0.3.00 启动备份监视（后台线程）
#[tauri::command]
fn start_backup_watcher(file_path: String, backup_dir: String, interval_secs: u64) -> Result<(), String> {
    let src = PathBuf::from(&file_path);
    if !src.exists() { return Err("文件不存在".into()); }

    let mut states = BACKUP_STATES.lock().unwrap();
    if states.contains_key(&file_path) { return Ok(()); }

    let hash = file_hash(&src);
    states.insert(file_path.clone(), BackupState { running: true, last_hash: hash });

    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_secs(interval_secs));
            {
                let states = BACKUP_STATES.lock().unwrap();
                if let Some(s) = states.get(&file_path) {
                    if !s.running { break; }
                } else { break; }
            }
            let current = file_hash(&src);
            let mut states = BACKUP_STATES.lock().unwrap();
            if let Some(s) = states.get_mut(&file_path) {
                if current != s.last_hash && !current.is_empty() {
                    // xuechong 2026-08-07 0.3.00 创建备份
                    let date_dir = format_date();
                    let timestamp = format!("{}---{}", format_date(), format_time());
                    let fname = src.file_name().unwrap_or_default().to_string_lossy();
                    let backup_path = PathBuf::from(&backup_dir).join(&date_dir).join(format!("{}-{}", timestamp, fname));
                    if let Some(p) = backup_path.parent() {
                        let _ = fs::create_dir_all(p);
                    }
                    let _ = fs::copy(&src, &backup_path);
                    s.last_hash = current;
                }
            }
        }
    });
    Ok(())
}

/// xuechong 2026-08-07 0.3.00 停止备份监视
#[tauri::command]
fn stop_backup_watcher(file_path: String) -> Result<(), String> {
    let mut states = BACKUP_STATES.lock().unwrap();
    if let Some(s) = states.get_mut(&file_path) {
        s.running = false;
    }
    states.remove(&file_path);
    Ok(())
}

/// xuechong 2026-08-07 0.3.00 记录文件最后修改时间
#[tauri::command]
fn track_file(file_path: String) -> Result<(), String> {
    let path = PathBuf::from(&file_path);
    if let Ok(meta) = path.metadata() {
        if let Ok(m) = meta.modified() {
            if let Ok(d) = m.duration_since(std::time::UNIX_EPOCH) {
                FILE_MODIFIED.lock().unwrap().insert(file_path, d.as_secs());
            }
        }
    }
    Ok(())
}

/// xuechong 2026-08-07 0.3.00 检查文件是否被外部修改
#[tauri::command]
fn check_file_changed(file_path: String) -> Result<bool, String> {
    let path = PathBuf::from(&file_path);
    let mut modified = FILE_MODIFIED.lock().unwrap();
    if let Some(&last) = modified.get(&file_path) {
        if let Ok(meta) = path.metadata() {
            if let Ok(m) = meta.modified() {
                if let Ok(d) = m.duration_since(std::time::UNIX_EPOCH) {
                    if d.as_secs() != last {
                        modified.insert(file_path, d.as_secs());
                        return Ok(true);
                    }
                }
            }
        }
    }
    Ok(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // xuechong 2026-07-03 0.3.00 功能：单实例模式 — 双击 .md 文件时复用已有窗口，新建标签页
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // xuechong 2026-08-07 0.3.00 提取 .md 文件路径
            let md_files: Vec<String> = argv.iter()
                .filter(|a| {
                    let lower = a.to_lowercase();
                    lower.ends_with(".md") || lower.ends_with(".markdown") ||
                    lower.ends_with(".mdown") || lower.ends_with(".mkd")
                })
                .cloned()
                .collect();

            if !md_files.is_empty() {
                // xuechong 2026-08-07 0.3.00 发送事件到前端（首个文件路径）
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("open-file-from-os", md_files[0].clone());
                }
            }
        }))
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            save_file,
            read_file,
            set_unsaved,
            get_exe_dir,
            read_config,
            write_config,
            start_backup_watcher,
            stop_backup_watcher,
            track_file,
            check_file_changed,
            get_launch_file,
        ])
        // xuechong 2026-06-19 0.3.00 功能：关闭前 Rust 层拦截，弹出原生对话框
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if HAS_UNSAVED.load(Ordering::SeqCst) {
                    api.prevent_close();
                    let handle = window.app_handle().clone();
                    let label = window.label().to_string();

                    std::thread::spawn(move || {
                        use tauri_plugin_dialog::DialogExt;
                        let confirmed = handle
                            .dialog()
                            .message("有未保存的修改，确定要退出吗？\n\n未保存的修改将丢失。")
                            .title("Quillium — 确认退出")
                            .kind(tauri_plugin_dialog::MessageDialogKind::Warning)
                            .buttons(tauri_plugin_dialog::MessageDialogButtons::OkCancel)
                            .blocking_show();

                        if confirmed {
                            let _ = handle
                                .get_webview_window(&label)
                                .unwrap()
                                .close();
                        }
                    });
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
