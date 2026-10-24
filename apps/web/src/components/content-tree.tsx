import { createElement, Fragment, type CSSProperties, type ReactNode } from 'react';
import { parseHTML } from '@/lib/content-domain';
type MarkupNode = {
  nodeType: number;
  textContent: string;
  localName?: string;
  attributes?: { name: string; value: string }[];
  childNodes?: MarkupNode[];
};
const attributes: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  playsinline: 'playsInline',
  allowfullscreen: 'allowFullScreen',
  frameborder: 'frameBorder',
  referrerpolicy: 'referrerPolicy',
  srcset: 'srcSet',
  crossorigin: 'crossOrigin',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio',
};
const booleanAttributes = new Set([
  'hidden',
  'disabled',
  'required',
  'multiple',
  'checked',
  'selected',
  'readonly',
  'autofocus',
  'autoplay',
  'controls',
  'loop',
  'muted',
  'playsinline',
  'allowfullscreen',
  'open',
  'novalidate',
  'reversed',
]);
function style(value: string) {
  return Object.fromEntries(
    value
      .split(';')
      .filter(Boolean)
      .map((rule) => {
        const i = rule.indexOf(':');
        const key = rule.slice(0, i).trim();
        return [
          key.startsWith('--') ? key : key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
          rule.slice(i + 1).trim(),
        ];
      }),
  ) as CSSProperties;
}
function render(node: MarkupNode, key: string): ReactNode {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const tag = node.localName || 'div';
  if (['script', 'base', 'meta', 'title'].includes(tag)) return null;
  const props: Record<string, unknown> = { key };
  for (const attr of Array.from(node.attributes || [])) {
    if (/^on/i.test(attr.name)) continue;
    if (attr.name === 'style') {
      props.style = style(attr.value);
      continue;
    }
    const name = attributes[attr.name] || attr.name;
    if (name === 'value' && tag === 'input') {
      props.defaultValue = attr.value;
      continue;
    }
    if (name === 'checked') {
      props.defaultChecked = true;
      continue;
    }
    if (name === 'selected') continue;
    props[name] = booleanAttributes.has(attr.name) ? true : attr.value;
  }
  if (tag === 'textarea') {
    props.defaultValue = node.textContent;
    return createElement(tag, props);
  }
  const children = Array.from(node.childNodes || []).map((child, index) =>
    render(child, key + '.' + index),
  );
  return children.length ? createElement(tag, props, ...children) : createElement(tag, props);
}
export function ContentTree({ html }: { html: string }) {
  const { document } = parseHTML('<html><body>' + html + '</body></html>');
  return createElement(
    Fragment,
    null,
    ...Array.from(document.body.childNodes).map((node, index) =>
      render(node as MarkupNode, String(index)),
    ),
  );
}
