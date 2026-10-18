/**
 * CodeMirror 6 Markdown编辑器组件
 * 作者 xuechong 2026-06-17 0.3.00
 * 更新 xuechong 2026-06-19 0.3.00 功能：forwardRef暴露scroll DOM + 防重创建
 */

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration, DecorationSet } from '@codemirror/view';
import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { search } from '@codemirror/search';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput, bracketMatching, indentUnit } from '@codemirror/language';
import { languages } from '@codemirror/language-data';

// 搜索高亮效果 xuechong 2026-06-20 0.3.00
const setSearchHighlight = StateEffect.define<{ from: number; to: number }[]>();
const searchHighlightField = StateField.define<DecorationSet>({
  create() { return Decoration.none; },
  update(deco, tr) {
    for (const e of tr.effects) {
      if (e.is(setSearchHighlight)) {
        const b = new RangeSetBuilder<Decoration>();
        for (const { from, to } of e.value) b.add(from, to, Decoration.mark({ class: 'cm-search-highlight' }));
        return b.finish();
      }
    }
    return deco;
  },
  provide: f => EditorView.decorations.from(f),
});

interface EditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  className?: string;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: boolean;
  lineNumbers?: boolean;
}

export interface EditorHandle {
  getScrollContainer: () => HTMLElement | null;
  setCursorLine: (line: number) => void;
  getLineTop: (line: number) => number;
  findQuery: (query: string, caseSensitive: boolean, wholeWord: boolean) => void;
  findNext: () => void;
  findPrev: () => void;
  replaceCurrent: (query: string, caseSensitive: boolean, wholeWord: boolean, replaceText: string) => void;
  replaceAllMatches: (query: string, caseSensitive: boolean, wholeWord: boolean, replaceText: string) => void;
  clearSearch: () => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({
  initialContent = '', onChange, onSave, className = '',
  fontSize = 16, tabSize = 2, wordWrap = true, lineNumbers: showLineNumbers = true,
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    getScrollContainer: () => viewRef.current?.scrollDOM ?? null,
    // xuechong 2026-06-20 0.3.00 功能：光标跳转到指定行（预览区点击联动）
    setCursorLine: (line: number) => {
      const view = viewRef.current;
      if (!view || line < 1) return;
      const doc = view.state.doc;
      const targetLine = Math.min(line, doc.lines);
      const pos = doc.line(targetLine).from;
      view.dispatch({
        selection: { anchor: pos, head: pos },
        scrollIntoView: false,
      });
      view.focus();
    },
    // xuechong 2026-06-20 0.3.00 功能：获取指定行的像素偏移
    getLineTop: (line: number) => {
      const view = viewRef.current;
      if (!view || line < 1) return 0;
      const doc = view.state.doc;
      const l = Math.min(line, doc.lines);
      return view.lineBlockAt(doc.line(l).from).top;
    },
    // xuechong 2026-06-20 0.3.00 功能：搜索替换
    // xuechong 2026-06-20 0.3.00 功能：搜索替换——纯 JS 字符串匹配，直接操作 CodeMirror
    findQuery: (q: string, cs: boolean, ww: boolean) => {
      const view = viewRef.current;
      if (!view || !q) return;
      const text = view.state.doc.toString();
      const src = cs ? text : text.toLowerCase();
      const pat = cs ? q : q.toLowerCase();
      const matches: number[] = [];
      let idx = 0;
      while ((idx = src.indexOf(pat, idx)) !== -1) {
        if (ww) {
          const before = idx === 0 || /\W/.test(src[idx - 1]);
          const after = idx + pat.length >= src.length || /\W/.test(src[idx + pat.length]);
          if (before && after) matches.push(idx);
        } else {
          matches.push(idx);
        }
        idx++;
      }
      (view as any)._s = matches; (view as any)._i = 0; (view as any)._ql = q.length;
      if (matches.length > 0) {
        view.dispatch({
          effects: setSearchHighlight.of(matches.map(p => ({ from: p, to: p + q.length }))),
          selection: { anchor: matches[0], head: matches[0] + q.length },
          scrollIntoView: true,
        });
      }
    },
    findNext: () => {
      const view = viewRef.current; if (!view) return;
      const m: number[] = (view as any)._s; const ql: number = (view as any)._ql;
      if (!m || m.length === 0) return;
      let i = ((view as any)._i ?? -1) + 1; if (i >= m.length) i = 0;
      (view as any)._i = i;
      view.dispatch({ selection: { anchor: m[i], head: m[i] + ql }, scrollIntoView: true });
    },
    findPrev: () => {
      const view = viewRef.current; if (!view) return;
      const m: number[] = (view as any)._s; const ql: number = (view as any)._ql;
      if (!m || m.length === 0) return;
      let i = ((view as any)._i ?? 0) - 1; if (i < 0) i = m.length - 1;
      (view as any)._i = i;
      view.dispatch({ selection: { anchor: m[i], head: m[i] + ql }, scrollIntoView: true });
    },
    replaceCurrent: (_q: string, _cs: boolean, _ww: boolean, rep: string) => {
      const view = viewRef.current; if (!view) return;
      const m: number[] = (view as any)._s; const ql: number = (view as any)._ql;
      const i: number = (view as any)._i ?? -1;
      if (!m || i < 0 || i >= m.length) return;
      const pos = m[i];
      view.dispatch({ changes: { from: pos, to: pos + ql, insert: rep } });
      const diff = rep.length - ql;
      const nm = m.map((p, j) => j > i ? p + diff : p);
      (view as any)._s = nm; (view as any)._ql = rep.length;
      view.dispatch({ effects: setSearchHighlight.of(nm.map(p => ({ from: p, to: p + rep.length }))) });
    },
    replaceAllMatches: (_q: string, _cs: boolean, _ww: boolean, rep: string) => {
      const view = viewRef.current; if (!view) return;
      const m: number[] = (view as any)._s; const ql: number = (view as any)._ql;
      if (!m || m.length === 0) return;
      let text = view.state.doc.toString(); let diff = 0;
      for (const pos of m) { const p = pos + diff; text = text.slice(0, p) + rep + text.slice(p + ql); diff += rep.length - ql; }
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
      (view as any)._s = []; (view as any)._i = -1;
      view.dispatch({ effects: setSearchHighlight.of([]) });
    },
    clearSearch: () => { const v = viewRef.current; if (v) { (v as any)._s = []; (v as any)._i = -1; v.dispatch({ effects: setSearchHighlight.of([]) }); } },
  }), []);

  const saveKeymap = useCallback(() => {
    return keymap.of([{
      key: 'Mod-s',
      run: () => { onSave?.(); return true; }
    }]);
  }, [onSave]);

  // xuechong 2026-08-07 0.3.00 挂载或设置变更时重建（设置变更低频，可接受）
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        ...(showLineNumbers ? [lineNumbers()] : []),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        indentUnit.of(' '.repeat(tabSize)),
        bracketMatching(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle),
        searchHighlightField,
        search({ top: true }), // xuechong 2026-06-20 0.3.00 Ctrl+F 搜索
        ...(wordWrap ? [EditorView.lineWrapping] : []),
        saveKeymap(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: `${fontSize}px` },
          '.cm-content': {
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
            fontSize: `${fontSize}px`,
            padding: '16px',
          },
          '.cm-line': { lineHeight: '1.6' },
          '&.cm-focused': { outline: 'none' },
          '.cm-gutters': {
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e9ecef',
          },
          '.cm-activeLineGutter': { backgroundColor: '#e9ecef' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return () => { view.destroy(); };
  // xuechong 2026-08-07 0.3.00 initialContent 不入 deps（key={tab.id} 控制切换，同标签内不重建）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveKeymap, fontSize, tabSize, wordWrap, showLineNumbers]);

  return (
    <div
      ref={editorRef}
      className={`editor-container ${className}`}
      style={{ height: '100%', overflow: 'hidden' }}
    />
  );
});

Editor.displayName = 'Editor';
export default Editor;
