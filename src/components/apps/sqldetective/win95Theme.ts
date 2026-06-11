import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

// Win95 light editor theme — white page, black text, gray gutter. The
// { dark: false } flag tells CodeMirror this is a light theme (matters for
// native selection visibility).
export const win95LightTheme = EditorView.theme(
  {
    '&': {
      background: '#ffffff',
      color: '#000000',
      fontFamily: "'Courier New', Consolas, monospace",
      fontSize: '13px',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#000000',
      padding: '8px 0',
    },
    '.cm-cursor': {
      borderLeftColor: '#000000',
      borderLeftWidth: '2px',
    },
    '.cm-focused': {
      outline: 'none',
    },
    '.cm-line': {
      padding: '0 8px 0 0',
    },
    '.cm-gutters': {
      background: '#f0f0f0',
      color: '#888888',
      border: 'none',
      borderRight: '1px solid #cccccc',
      minWidth: '32px',
    },
    '.cm-gutter': {
      minWidth: '32px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 6px 0 4px',
      fontFamily: "'Courier New', monospace",
      fontSize: '12px',
    },
    '.cm-activeLine': {
      background: '#f5f5ff',
    },
    '.cm-activeLineGutter': {
      background: '#e8e8f0',
      color: '#000080',
    },
    '.cm-selectionBackground': {
      background: '#000080 !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      background: '#000080 !important',
    },
    '.cm-selectionMatch': {
      background: '#c8c8ff',
    },
    '.cm-matchingBracket': {
      background: '#c0d0c0',
      outline: '1px solid #808080',
    },
    '.cm-tooltip': {
      background: '#c0c0c0',
      border: '2px solid',
      borderColor: '#ffffff #404040 #404040 #ffffff',
      fontFamily: "'Courier New', monospace",
      fontSize: '12px',
      color: '#000000',
      borderRadius: '0',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      background: '#000080',
      color: '#ffffff',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
  },
  { dark: false },
)

// Win95 SQL syntax colors — bold navy keywords, purple identifiers,
// dark-red strings, green italic comments.
export const win95SqlSyntax = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: '#000080', fontWeight: 'bold' },
    { tag: tags.function(tags.variableName), color: '#000080' },
    { tag: tags.standard(tags.name), color: '#000080', fontWeight: 'bold' },
    { tag: tags.string, color: '#a31515' },
    { tag: tags.number, color: '#098658' },
    { tag: tags.variableName, color: '#800080' },
    { tag: tags.name, color: '#800080' },
    { tag: tags.comment, color: '#008000', fontStyle: 'italic' },
    { tag: tags.operator, color: '#000000' },
    { tag: tags.punctuation, color: '#000000' },
    { tag: tags.bool, color: '#000080', fontWeight: 'bold' },
    { tag: tags.null, color: '#000080', fontWeight: 'bold' },
  ]),
)
