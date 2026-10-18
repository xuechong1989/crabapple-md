/**
 * 文件系统操作工具
 * 封装Tauri文件系统API
 * 作者 xuechong 2026-06-17 0.3.00
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * 文件信息接口
 */
export interface FileInfo {
  path: string;
  name: string;
  content: string;
}

/**
 * 打开文件对话框并读取文件内容
 * xuechong 2026-06-17 0.3.00 功能：打开文件对话框并读取文件内容
 * @returns 文件信息，如果用户取消则返回null
 */
export async function openFile(): Promise<FileInfo | null> {
  try {
    const result = await invoke<FileInfo | null>('open_file_dialog');
    return result;
  } catch (error) {
    console.error('打开文件失败:', error);
    return null;
  }
}

/**
 * 保存文件到指定路径
 * xuechong 2026-06-17 0.3.00 功能：保存文件到指定路径
 * @param content 文件内容
 * @param filePath 文件路径，如果不指定则显示另存为对话框
 * @returns 是否保存成功
 */
export async function saveFile(content: string, filePath?: string): Promise<boolean> {
  try {
    const result = await invoke<boolean>('save_file', {
      content,
      filePath: filePath || null
    });
    return result;
  } catch (error) {
    console.error('保存文件失败:', error);
    return false;
  }
}

/**
 * 读取指定路径的文件内容
 * xuechong 2026-06-17 0.3.00 功能：读取指定路径的文件内容
 * @param filePath 文件路径
 * @returns 文件内容
 */
export async function readFile(filePath: string): Promise<string | null> {
  try {
    const content = await invoke<string | null>('read_file', { filePath });
    return content;
  } catch (error) {
    console.error('读取文件失败:', error);
    return null;
  }
}

/**
 * 获取文件名（不含路径）
 * xuechong 2026-06-17 0.3.00 功能：获取文件名（不含路径）
 * @param filePath 文件路径
 * @returns 文件名
 */
export function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}

/**
 * 获取文件扩展名
 * xuechong 2026-06-17 0.3.00 功能：获取文件扩展名
 * @param filePath 文件路径
 * @returns 扩展名（小写）
 */
export function getFileExtension(filePath: string): string {
  const fileName = getFileName(filePath);
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * 检查文件是否为Markdown文件
 * xuechong 2026-06-17 0.3.00 功能：检查文件是否为Markdown文件
 * @param filePath 文件路径
 * @returns 是否为Markdown文件
 */
export function isMarkdownFile(filePath: string): boolean {
  const extension = getFileExtension(filePath);
  return ['md', 'markdown', 'mdown', 'mkd'].includes(extension);
}
