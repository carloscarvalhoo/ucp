'use client';
import type { PublicationBlock } from '@/lib/publication-blocks';
import { RichTextEditor } from './rich-text-editor';
import { upload } from './model';
import { useState, useEffect, useMemo, createElement, type ReactNode } from 'react';
export function PublicationEditor({
  blocks,
  onChange: onCommit,
}: {
  blocks: PublicationBlock[];
  onChange: (blocks: PublicationBlock[]) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [past, setPast] = useState<PublicationBlock[][]>([]),
    [future, setFuture] = useState<PublicationBlock[][]>([]);
  function onChange(next: PublicationBlock[]) {
    setPast((h) => [...h.slice(-49), structuredClone(blocks)]);
    setFuture([]);
    onCommit(next);
  }
  function undo() {
    if (!past.length) return;
    setFuture((h) => [structuredClone(blocks), ...h]);
    onCommit(past[past.length - 1]);
    setPast((h) => h.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setPast((h) => [...h, structuredClone(blocks)]);
    onCommit(future[0]);
    setFuture((h) => h.slice(1));
  }
  const [selected, setSelected] = useState(blocks[0]?.id || '');
  const [device, setDevice] = useState('desktop');
  const active = blocks.some((b) => b.id === selected) ? selected : blocks[0]?.id;
  function add(type: PublicationBlock['type'], at = blocks.length) {
    const block = { id: crypto.randomUUID(), type, images: type === 'gallery' ? [] : undefined };
    const next = [...blocks];
    next.splice(at, 0, block);
    onChange(next);
    setSelected(block.id);
  }
  function drop(e: React.DragEvent, at: number) {
    e.preventDefault();
    try {
      const item = JSON.parse(e.dataTransfer.getData('application/x-ucp-block'));
      if (item.id) {
        const from = blocks.findIndex((b) => b.id === item.id);
        if (from < 0) return;
        const next = [...blocks],
          [block] = next.splice(from, 1);
        next.splice(from < at ? at - 1 : at, 0, block);
        onChange(next);
        setSelected(block.id);
      } else if (
        ['text', 'heading', 'section', 'image', 'gallery', 'button', 'document'].includes(item.type)
      )
        add(item.type, at);
    } catch {}
  }

  function update(i: number, patch: Partial<PublicationBlock>) {
    onChange(blocks.map((b, n) => (n === i ? { ...b, ...patch } : b)));
  }
  async function file(i: number, f: File) {
    setBusy(true);
    setError('');
    try {
      update(i, { url: (await upload(f)).url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const labels = {
    text: 'Texto',
    heading: 'Título',
    section: 'Seção',
    image: 'Imagem',
    gallery: 'Galeria',
    button: 'Botão com link',
    document: 'Documento ou PDF',
  };
  return (
    <div className="publication-visual-builder">
      <aside className="publication-builder-tools">
        <div className="publication-history">
          <button type="button" disabled={!past.length || busy} onClick={undo}>
            ↶ Desfazer
          </button>
          <button type="button" disabled={!future.length || busy} onClick={redo}>
            ↷ Refazer
          </button>
        </div>
        <h3>Componentes</h3>
        <div className="publication-palette">
          {Object.entries(labels).map(([type, label]) => (
            <button
              key={type}
              type="button"
              disabled={busy || blocks.length >= 100}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData('application/x-ucp-block', JSON.stringify({ type }))
              }
              onClick={() => add(type as PublicationBlock['type'])}
            >
              <span aria-hidden="true">
                <BlockIcon type={type as PublicationBlock['type']} />
              </span>
              {label}
              <span aria-hidden="true">⠿</span>
            </button>
          ))}
        </div>
        <div className="publication-block-editor">
          <h3>Editar bloco</h3>
          {blocks.map(
            (b, i) =>
              b.id === active && (
                <fieldset key={b.id} className="publication-block">
                  <legend>
                    {i + 1}. {labels[b.type]}
                  </legend>
                  <div className="admin-actions">
                    <button
                      type="button"
                      disabled={!i || busy}
                      aria-label="Mover bloco para cima"
                      onClick={() => {
                        const a = [...blocks];
                        [a[i - 1], a[i]] = [a[i], a[i - 1]];
                        onChange(a);
                      }}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      disabled={i === blocks.length - 1 || busy}
                      onClick={() => {
                        const a = [...blocks];
                        [a[i + 1], a[i]] = [a[i], a[i + 1]];
                        onChange(a);
                      }}
                    >
                      Descer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = { ...structuredClone(b), id: crypto.randomUUID() };
                        const next = [...blocks];
                        next.splice(i + 1, 0, copy);
                        onChange(next);
                        setSelected(copy.id);
                      }}
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(blocks.filter((_, n) => n !== i))}
                    >
                      Remover bloco
                    </button>
                  </div>
                  {['heading', 'section', 'button', 'document'].includes(b.type) && (
                    <label>
                      {b.type === 'button' ? 'Texto do botão' : 'Título'}
                      <input
                        value={b.title || ''}
                        onChange={(e) => update(i, { title: e.target.value })}
                      />
                    </label>
                  )}
                  {b.type === 'section' && (
                    <label>
                      Subtítulo
                      <input
                        value={b.subtitle || ''}
                        onChange={(e) => update(i, { subtitle: e.target.value })}
                      />
                    </label>
                  )}
                  {['text', 'section'].includes(b.type) && (
                    <RichTextEditor
                      label="Conteúdo"
                      value={b.text || ''}
                      onChange={(text) => update(i, { text })}
                    />
                  )}
                  {['button', 'document', 'image'].includes(b.type) && (
                    <label>
                      Link
                      <input
                        value={b.url || ''}
                        onChange={(e) => update(i, { url: e.target.value })}
                        placeholder="https:// ou /documentos/..."
                      />
                    </label>
                  )}
                  {['document', 'image'].includes(b.type) && (
                    <label>
                      Enviar arquivo
                      <input
                        type="file"
                        disabled={busy}
                        accept={b.type === 'image' ? 'image/jpeg,image/png,image/webp' : '.pdf'}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void file(i, f);
                        }}
                      />
                    </label>
                  )}
                  {b.type === 'image' && (
                    <label>
                      Descrição da imagem
                      <input
                        value={b.caption || ''}
                        onChange={(e) => update(i, { caption: e.target.value })}
                      />
                    </label>
                  )}
                  {b.type === 'gallery' && (
                    <>
                      <label>
                        Adicionar fotos
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          disabled={busy}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            setBusy(true);
                            setError('');
                            try {
                              const images = [...(b.images || [])];
                              for (const f of files)
                                images.push({ url: (await upload(f)).url, caption: '' });
                              update(i, { images });
                            } catch (e) {
                              setError((e as Error).message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        />
                      </label>
                      {(b.images || []).map((im, n) => (
                        <div key={n}>
                          <label>
                            Link da imagem
                            <input
                              value={im.url}
                              onChange={(e) =>
                                update(i, {
                                  images: b.images!.map((v, k) =>
                                    k === n ? { ...v, url: e.target.value } : v,
                                  ),
                                })
                              }
                            />
                          </label>
                          <label>
                            Descrição
                            <input
                              value={im.caption}
                              onChange={(e) =>
                                update(i, {
                                  images: b.images!.map((v, k) =>
                                    k === n ? { ...v, caption: e.target.value } : v,
                                  ),
                                })
                              }
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              update(i, { images: b.images!.filter((_, k) => k !== n) })
                            }
                          >
                            Remover foto
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          update(i, { images: [...(b.images || []), { url: '', caption: '' }] })
                        }
                      >
                        Adicionar imagem por link
                      </button>
                    </>
                  )}
                </fieldset>
              ),
          )}
          <p role="status">{busy ? 'Enviando arquivo…' : error}</p>
        </div>
      </aside>
      <section className="publication-builder-preview">
        <div className="publication-preview-toolbar">
          <strong>Prévia da publicação</strong>
          <div>
            <button
              type="button"
              aria-pressed={device === 'desktop'}
              onClick={() => setDevice('desktop')}
            >
              Computador
            </button>
            <button
              type="button"
              aria-pressed={device === 'mobile'}
              onClick={() => setDevice('mobile')}
            >
              Celular
            </button>
          </div>
        </div>
        <div
          className={'publication-preview-canvas ' + device}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            if (e.target === e.currentTarget) drop(e, blocks.length);
          }}
        >
          {!blocks.length && (
            <div
              className="publication-empty-canvas"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.stopPropagation();
                drop(e, 0);
              }}
            >
              Adicione ou arraste um componente para começar.
            </div>
          )}
          {blocks.map((b, i) => (
            <div
              key={b.id}
              className={'publication-preview-block ' + (active === b.id ? 'selected' : '')}
              role="button"
              tabIndex={0}
              aria-label={'Editar ' + labels[b.type] + ' ' + (i + 1)}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData('application/x-ucp-block', JSON.stringify({ id: b.id }))
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.stopPropagation();
                drop(e, i);
              }}
              onClick={() => setSelected(b.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(b.id);
                }
              }}
            >
              <span className="publication-block-caption">
                {labels[b.type]} · {i + 1}
              </span>
              <BlockPreview block={b} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
const RICH_PREVIEW_ALLOWED = new Set([
  'P',
  'STRONG',
  'B',
  'EM',
  'I',
  'UL',
  'OL',
  'LI',
  'H2',
  'H3',
  'H4',
  'BLOCKQUOTE',
  'BR',
  'TABLE',
  'THEAD',
  'TBODY',
  'TR',
  'TH',
  'TD',
]);
function renderRichPreviewNode(node: Node, key: number): ReactNode {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const el = node as Element;
  if (['SCRIPT', 'STYLE', 'IFRAME', 'IMG'].includes(el.tagName)) return null;
  const children = Array.from(el.childNodes).map((n, i) => renderRichPreviewNode(n, i));
  return createElement(
    RICH_PREVIEW_ALLOWED.has(el.tagName) ? el.tagName.toLowerCase() : 'span',
    { key },
    ...children,
  );
}
function RichPreview({ html }: { html: string }) {
  const nodes = useMemo<ReactNode>(() => {
    if (typeof DOMParser === 'undefined') return null;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.body.childNodes).map((n, i) => renderRichPreviewNode(n, i));
  }, [html]);
  return <div className="publication-preview-rich">{nodes || <p>Escreva seu texto…</p>}</div>;
}
function BlockPreview({ block: b }: { block: PublicationBlock }) {
  const image = (url?: string, caption?: string) =>
    url && /^(https?:\/\/|\/(?!\/))/.test(url) ? (
      <img src={url} alt={caption || ''} />
    ) : (
      <div className="publication-image-placeholder">Imagem</div>
    );
  switch (b.type) {
    case 'heading':
      return <h2>{b.title || 'Título'}</h2>;
    case 'text':
      return <RichPreview html={b.text || ''} />;
    case 'section':
      return (
        <section>
          <h2>{b.title || 'Título da seção'}</h2>
          {b.subtitle && <p className="publication-preview-subtitle">{b.subtitle}</p>}
          <RichPreview html={b.text || ''} />
        </section>
      );
    case 'image':
      return (
        <figure>
          {image(b.url, b.caption)}
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      );
    case 'gallery':
      return (
        <div className="publication-preview-gallery">
          {b.images?.length ? (
            b.images.map((im, i) => (
              <figure key={i}>
                {image(im.url, im.caption)}
                <figcaption>{im.caption}</figcaption>
              </figure>
            ))
          ) : (
            <div className="publication-image-placeholder">Galeria de fotos</div>
          )}
        </div>
      );
    case 'button':
      return <span className="publication-preview-cta">{b.title || 'Texto do botão'}</span>;
    case 'document':
      return (
        <div className="publication-preview-document">
          ▤ {b.title || 'Documento ou PDF'}
          <small>Abrir documento</small>
        </div>
      );
  }
}

function BlockIcon({ type }: { type: PublicationBlock['type'] }) {
  const paths: Record<PublicationBlock['type'], ReactNode> = {
    text: (
      <>
        <path d="M4 5h16M4 10h16M4 15h10M4 20h13" />
      </>
    ),
    heading: (
      <>
        <path d="M4 5v14M14 5v14M4 12h10M18 9h3M19.5 9v10" />
      </>
    ),
    section: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 9v12" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1.5" />
        <path d="m3 17 5-5 4 4 3-3 6 6" />
      </>
    ),
    gallery: (
      <>
        <rect x="7" y="3" width="14" height="15" rx="2" />
        <path d="M3 7v12a2 2 0 0 0 2 2h12M7 14l4-4 3 3 2-2 5 5" />
        <circle cx="12" cy="7" r="1" />
      </>
    ),
    button: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <path d="M6 12h12m-3-3 3 3-3 3" />
      </>
    ),
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
  };
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[type]}
    </svg>
  );
}
