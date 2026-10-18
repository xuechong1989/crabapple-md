/**
 * 搜索替换栏组件
 * xuechong 2026-06-20 0.3.00 功能：查找/替换 + 上下翻 + 大小写/整词
 */

import { useState, useRef, type RefObject } from 'react';
import { EditorHandle } from '../Editor/Editor';
import './SearchBar.css';

interface Props {
  editorRef: RefObject<EditorHandle | null>;
}

export default function SearchBar({ editorRef }: Props) {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  // ref 避免 React state 异步导致的搜索延迟 xuechong 2026-06-20 0.3.00
  const refs = useRef({ find: '', replace: '', cs: false, ww: false });

  const execFind = () => {
    const r = refs.current;
    if (r.find) editorRef.current?.findQuery(r.find, r.cs, r.ww);
    else editorRef.current?.clearSearch();
  };

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flex: 1, minWidth: '280px' }}>
      <input className="sr-input" placeholder="查找..." value={find}
        onChange={e => { const v = e.target.value; setFind(v); refs.current.find = v; if (v) execFind(); else editorRef.current?.clearSearch(); }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? editorRef.current?.findPrev() : execFind(); } }} />
      <input className="sr-input" placeholder="替换..." value={replace}
        onChange={e => { const v = e.target.value; setReplace(v); refs.current.replace = v; }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); editorRef.current?.replaceCurrent(refs.current.find, refs.current.cs, refs.current.ww, refs.current.replace); execFind(); } }} />
      <button className="sr-btn" onClick={() => editorRef.current?.findPrev()} title="上一个">↑</button>
      <button className="sr-btn" onClick={execFind} title="下一个">↓</button>
      <label className="sr-check"><input type="checkbox" checked={caseSensitive} onChange={e => { setCaseSensitive(e.target.checked); refs.current.cs = e.target.checked; }} />Aa</label>
      <label className="sr-check"><input type="checkbox" checked={wholeWord} onChange={e => { setWholeWord(e.target.checked); refs.current.ww = e.target.checked; }} />W</label>
      <button className="sr-btn sr-replace" onClick={() => { editorRef.current?.replaceCurrent(refs.current.find, refs.current.cs, refs.current.ww, refs.current.replace); execFind(); }}>替换</button>
      <button className="sr-btn sr-replace-all" onClick={() => editorRef.current?.replaceAllMatches(refs.current.find, refs.current.cs, refs.current.ww, refs.current.replace)}>全部</button>
    </span>
  );
}
