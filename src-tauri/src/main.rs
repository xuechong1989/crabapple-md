// xuechong 2026-08-07 0.3.00 程序入口：调用 lib.rs 的 run 启动 Tauri 应用
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    crabapple_md_lib::run()
}
