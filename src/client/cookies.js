(() => {
  const key = 'ucp-privacy-v1';
  let consent = null,
    pendingVideo = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (
      saved?.version === 1 &&
      Date.now() - saved.savedAt < 180 * 24 * 60 * 60 * 1000 &&
      typeof saved.externalMedia === 'boolean'
    )
      consent = saved;
  } catch {}
  const banner = document.createElement('section');
  banner.className = 'cookie-banner';
  banner.setAttribute('aria-label', 'Preferências de cookies');
  banner.innerHTML =
    '<div class="cookie-copy"><strong>Cookies e privacidade</strong><p>Usamos armazenamento necessário para lembrar suas preferências. Conteúdos externos, como vídeos do YouTube, só são carregados com sua permissão. Você pode rever sua escolha a qualquer momento. <a href="/politicas/privacidade">Privacidade</a> · <a href="/politicas/cookies">Cookies</a></p></div><div class="cookie-actions"><button data-consent="necessary">Somente necessários</button><button data-consent="settings">Personalizar</button><button class="cookie-accept" data-consent="all">Aceitar todos</button></div>';
  banner.hidden = !!consent;
  document.body.append(banner);
  const dialog = document.createElement('dialog');
  dialog.className = 'cookie-dialog';
  dialog.setAttribute('aria-labelledby', 'cookie-title');
  dialog.innerHTML =
    '<button class="cookie-close" aria-label="Fechar preferências de cookies"><span class="material-icons-outlined" aria-hidden="true">close</span></button><h2 id="cookie-title">Suas preferências de privacidade</h2><p>Escolha quais recursos deseja permitir. Não usamos cookies de publicidade nem ferramentas de análise de navegação nesta versão.</p><label class="cookie-option"><span><strong>Necessários</strong><small>Guardam sua escolha de privacidade neste navegador.</small></span><input type="checkbox" checked disabled aria-label="Armazenamento necessário, sempre ativo"></label><label class="cookie-option"><span><strong>Mídia externa</strong><small>Permite vídeos incorporados do YouTube. O provedor pode usar cookies conforme suas próprias políticas.</small></span><input id="external-media-consent" type="checkbox"></label><p class="cookie-media-note" hidden>Para reproduzir este vídeo, permita mídia externa e salve suas preferências.</p><div class="cookie-settings-actions"><button data-save-necessary>Somente necessários</button><button class="cookie-accept" data-save-consent>Salvar preferências</button></div>';
  document.body.append(dialog);
  const checkbox = dialog.querySelector('#external-media-consent');
  function showSettings() {
    checkbox.checked = !!consent?.externalMedia;
    dialog.querySelector('.cookie-media-note').hidden = !pendingVideo;
    dialog.showModal();
  }
  function save(externalMedia) {
    consent = { version: 1, savedAt: Date.now(), externalMedia };
    try {
      localStorage.setItem(key, JSON.stringify(consent));
    } catch {}
    banner.hidden = true;
    dialog.close();
    if (!externalMedia) {
      document.querySelectorAll('iframe[src*="youtube"]').forEach((frame) => frame.remove());
      document.querySelector('#media-dialog')?.close();
    }
    const video = pendingVideo;
    pendingVideo = null;
    if (externalMedia && video) video.click();
  }
  banner.querySelector('[data-consent="necessary"]').addEventListener('click', () => save(false));
  banner.querySelector('[data-consent="all"]').addEventListener('click', () => save(true));
  banner.querySelector('[data-consent="settings"]').addEventListener('click', showSettings);
  dialog.querySelector('[data-save-necessary]').addEventListener('click', () => save(false));
  dialog
    .querySelector('[data-save-consent]')
    .addEventListener('click', () => save(checkbox.checked));
  dialog.querySelector('.cookie-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    pendingVideo = null;
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-cookie-settings]')) showSettings();
  });
  const footer = document.querySelector('.footer-nav>div:last-child');
  if (footer) {
    const button = document.createElement('button');
    button.className = 'footer-link';
    button.textContent = 'Preferências de cookies';
    button.addEventListener('click', showSettings);
    footer.append(button);
  }
  document.addEventListener(
    'click',
    (event) => {
      const video = event.target.closest('[data-video]');
      if (video && !consent?.externalMedia) {
        event.preventDefault();
        event.stopImmediatePropagation();
        pendingVideo = video;
        showSettings();
      }
    },
    true,
  );
})();
