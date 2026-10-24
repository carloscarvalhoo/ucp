'use client';
import { useConfirmation } from './confirmation';
import { useState } from 'react';
import { upload } from './model';
export type Item = {
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  link?: string;
  hidden?: boolean;
  automatic?: boolean;
  children?: Item[];
};
export type Collection = {
  type: 'gallery' | 'quick' | 'projects' | 'community' | 'instagram' | 'header' | 'footer';
  items: Item[];
  fieldIndices: number[];
  embedUrl?: string;
  auto?: boolean;
};
export function CollectionEditor({
  value,
  onChange,
}: {
  value: Collection;
  onChange: (value: Collection) => void;
}) {
  const confirm = useConfirmation();
  const [open, setOpen] = useState<number | null>(0),
    [message, setMessage] = useState(''),
    [uploading, setUploading] = useState(false);
  const menu = ['header', 'footer'].includes(value.type),
    images = ['gallery', 'community', 'instagram'].includes(value.type);
  function update(index: number, change: (item: Item) => void) {
    const next = structuredClone(value);
    change(next.items[index]);
    onChange(next);
  }
  function move(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= value.items.length) return;
    const next = structuredClone(value);
    [next.items[index], next.items[target]] = [next.items[target], next.items[index]];
    onChange(next);
    setOpen(target);
  }
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            {menu
              ? 'Itens de navegação'
              : value.type === 'instagram'
                ? 'Publicações do Instagram'
                : value.type === 'gallery'
                  ? 'Fotos da galeria'
                  : 'Itens desta seção'}
          </h3>
          <p className="admin-muted text-xs">
            Adicione, organize e escolha o que aparece no site. Salve e publique ao terminar.
          </p>
        </div>
        <button
          type="button"
          className="admin-button"
          hidden={value.type === 'instagram' && (value.embedUrl !== undefined || value.auto)}
          disabled={value.type === 'instagram' && value.items.length >= 4}
          onClick={() => {
            onChange({
              ...value,
              items: [
                ...value.items,
                {
                  title: images ? 'Nova foto' : menu ? 'Novo grupo' : 'Novo item',
                  ...(menu ? { children: [] } : {}),
                },
              ],
            });
            setOpen(value.items.length);
          }}
        >
          ＋{' '}
          {value.type === 'instagram'
            ? 'Adicionar publicação'
            : images
              ? 'Adicionar foto'
              : menu
                ? 'Adicionar grupo'
                : 'Adicionar item'}
        </button>
      </div>
      {message && (
        <p role="status" className="admin-message">
          {message}
        </p>
      )}
      {value.type === 'instagram' &&
        (() => {
          const mode = value.auto ? 'auto' : value.embedUrl !== undefined ? 'widget' : 'manual';
          const chip = (active: boolean) =>
            'rounded-full border px-3 py-1 text-xs font-medium ' +
            (active ? 'border-ucp bg-ucp text-white' : 'border-gray-300 text-gray-600');
          return (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={chip(mode === 'manual')}
                onClick={() => onChange({ ...value, embedUrl: undefined, auto: false })}
              >
                Posts manuais
              </button>
              <button
                type="button"
                className={chip(mode === 'auto')}
                onClick={() => onChange({ ...value, embedUrl: undefined, auto: true })}
              >
                Automático (busca os 5 últimos posts sozinho)
              </button>
              <button
                type="button"
                className={chip(mode === 'widget')}
                onClick={() => onChange({ ...value, embedUrl: value.embedUrl || '', auto: false })}
              >
                Widget externo
              </button>
            </div>
          );
        })()}
      {value.type === 'instagram' && value.auto && (
        <p className="admin-muted mb-5 text-xs">
          O site busca sozinho os 5 posts mais recentes de @ucpparana a cada poucos minutos, sem
          precisar de login nem de token — não é necessário configurar nada aqui. Se o Instagram
          mudar o formato da página, o feed pode parar de atualizar até ser ajustado no código.
        </p>
      )}
      {value.type === 'instagram' && value.embedUrl !== undefined && (
        <label className="mb-5 block text-sm">
          URL do widget (LightWidget, Elfsight ou SnapWidget)
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            value={value.embedUrl}
            placeholder="https://lightwidget.com/widgets/xxxxxxxxxxxxxxxxxxxxxxxx.html"
            onChange={(e) => onChange({ ...value, embedUrl: e.target.value })}
          />
          <span className="admin-muted mt-1 block text-xs">
            Crie um widget gratuito conectando a conta @ucpparana em lightwidget.com (ou
            elfsight.com / snapwidget.com) e cole aqui o link gerado. Ele atualiza sozinho, sem
            precisar de token da Meta.
          </span>
        </label>
      )}
      {!(value.type === 'instagram' && (value.embedUrl !== undefined || value.auto)) && (
        <ol className="grid gap-3">
        {value.items.map((item, index) => (
          <li className={'admin-collection-item ' + (item.hidden ? 'is-hidden' : '')} key={index}>
            <div className="flex items-center gap-3">
              <span className="admin-collection-number">{String(index + 1).padStart(2, '0')}</span>
              {item.image && (
                <img src={item.image} alt="" className="h-10 w-14 rounded object-cover" />
              )}
              <button
                className="min-w-0 flex-1 text-left text-sm font-semibold"
                type="button"
                aria-expanded={open === index}
                onClick={() => setOpen(open === index ? null : index)}
              >
                {item.title}
                <small className="ml-2 font-normal text-gray-500">
                  {item.hidden ? 'Oculto' : item.automatic ? 'Cursos automáticos' : ''}
                </small>
              </button>
              <button
                type="button"
                className="admin-icon-button"
                aria-label={'Mover ' + item.title + ' para cima'}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="admin-icon-button"
                aria-label={'Mover ' + item.title + ' para baixo'}
                disabled={index === value.items.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="admin-icon-button"
                aria-label={'Editar ' + item.title}
                onClick={() => setOpen(open === index ? null : index)}
              >
                ⌄
              </button>
            </div>
            {open === index && (
              <div className="admin-form mt-5 border-t border-gray-100 pt-5">
                <label>
                  {value.type === 'gallery' ? 'Descrição da foto' : 'Título'}
                  <input
                    value={item.title}
                    maxLength={150}
                    onChange={(e) =>
                      update(index, (d) => {
                        d.title = e.target.value;
                      })
                    }
                  />
                </label>
                {!menu && !['gallery', 'instagram'].includes(value.type) && (
                  <label>
                    Descrição
                    <textarea
                      rows={2}
                      value={item.description || ''}
                      maxLength={2000}
                      onChange={(e) =>
                        update(index, (d) => {
                          d.description = e.target.value;
                        })
                      }
                    />
                  </label>
                )}
                {images && (
                  <label>
                    Imagem
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const result = await upload(file);
                          update(index, (d) => {
                            d.image = result.url;
                          });
                          setMessage('Imagem enviada. Salve o rascunho para mantê-la.');
                        } catch (error) {
                          setMessage((error as Error).message);
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                    <input
                      aria-label="Link da imagem"
                      inputMode="url"
                      placeholder="Ou cole o link da imagem: https://…"
                      value={item.image || ''}
                      onChange={(e) =>
                        update(index, (d) => {
                          d.image = e.target.value;
                        })
                      }
                    />
                  </label>
                )}
                {!images && !menu && (
                  <label>
                    Ícone
                    <input
                      value={item.icon || ''}
                      placeholder="Ex.: school, event_note, menu_book"
                      maxLength={60}
                      onChange={(e) =>
                        update(index, (d) => {
                          d.icon = e.target.value;
                        })
                      }
                    />
                  </label>
                )}
                {value.type !== 'gallery' && !item.children && (
                  <label>
                    {value.type === 'instagram'
                      ? 'Link da publicação no Instagram'
                      : 'Ao clicar, abrir'}
                    <input
                      value={item.link || ''}
                      placeholder={
                        value.type === 'instagram'
                          ? 'https://www.instagram.com/p/…/'
                          : 'Ex.: /contato'
                      }
                      onChange={(e) =>
                        update(index, (d) => {
                          d.link = e.target.value;
                        })
                      }
                    />
                  </label>
                )}
                {menu && !item.automatic && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold">Links deste grupo</h4>
                    {item.children?.map((child, j) => (
                      <div key={j} className="mb-3 grid gap-2 rounded-lg bg-gray-50 p-3">
                        <label>
                          Nome do link
                          <input
                            value={child.title}
                            onChange={(e) =>
                              update(index, (d) => {
                                d.children![j].title = e.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Destino
                          <input
                            value={child.link || ''}
                            onChange={(e) =>
                              update(index, (d) => {
                                d.children![j].link = e.target.value;
                              })
                            }
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="admin-button"
                            disabled={j === 0}
                            onClick={() =>
                              update(index, (d) => {
                                [d.children![j], d.children![j - 1]] = [
                                  d.children![j - 1],
                                  d.children![j],
                                ];
                              })
                            }
                          >
                            ↑ Subir
                          </button>
                          <button
                            type="button"
                            className="admin-button"
                            disabled={j === item.children!.length - 1}
                            onClick={() =>
                              update(index, (d) => {
                                [d.children![j], d.children![j + 1]] = [
                                  d.children![j + 1],
                                  d.children![j],
                                ];
                              })
                            }
                          >
                            ↓ Descer
                          </button>
                          <button
                            type="button"
                            className="admin-button"
                            onClick={() =>
                              update(index, (d) => {
                                d.children!.splice(j, 1);
                              })
                            }
                          >
                            Remover link
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() =>
                        update(index, (d) => {
                          d.children = [...(d.children || []), { title: 'Novo link', link: '/' }];
                        })
                      }
                    >
                      ＋ Adicionar link
                    </button>
                  </div>
                )}
                {item.automatic && (
                  <p className="admin-muted text-xs">
                    Os links deste grupo são preenchidos pelos cursos publicados. Cadastre e edite
                    os cursos na área Cursos.
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex! items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!item.hidden}
                      onChange={(e) =>
                        update(index, (d) => {
                          d.hidden = !e.target.checked;
                        })
                      }
                      style={{ width: 16, minHeight: 16 }}
                    />
                    Mostrar no site
                  </label>
                  <button
                    type="button"
                    className="admin-button text-red-700"
                    onClick={async () => {
                      if (
                        !(await confirm(
                          'Remover este item do rascunho? Você poderá desfazer antes de salvar.',
                        ))
                      )
                        return;
                      onChange({ ...value, items: value.items.filter((_, i) => i !== index) });
                      setOpen(null);
                    }}
                  >
                    Remover item
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
      )}
      {!(value.type === 'instagram' && (value.embedUrl !== undefined || value.auto)) &&
        !value.items.length && (
        <p className="admin-muted py-8 text-center">
          Nenhum item cadastrado. Use o botão acima para começar.
        </p>
      )}
    </section>
  );
}
