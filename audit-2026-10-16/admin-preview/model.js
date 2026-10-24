export const areas = {
    home: 'Página inicial',
    institution: 'Institucional',
    courses: 'Cursos',
    postgraduate: 'Pós-graduação',
    utilities: 'Serviços e utilidades',
    publications: 'Notícias, Blog e Eventos',
    extension: 'Extensão',
    journals: 'Revistas UCP',
    evaluation: 'Avaliação institucional',
    contact: 'Contato e atendimento',
    other: 'Outras páginas',
    policies: 'Políticas do site',
    shared: 'Cabeçalho e rodapé',
};
export function areaFor(e) {
    if (e.kind === 'shared')
        return 'shared';
    if (e.kind === 'banner' || e.route === '/index.html')
        return 'home';
    if (e.kind === 'course' ||
        e.route?.startsWith('/cursos/') ||
        (e.kind === 'runtime' && e.title === 'Cards dos cursos'))
        return 'courses';
    if (e.route?.startsWith('/pos-graduacao'))
        return 'postgraduate';
    if (e.route?.startsWith('/institucional'))
        return 'institution';
    if (e.route?.startsWith('/extensao'))
        return 'extension';
    if (/^\/(blog|noticias|eventos)/.test(e.route))
        return 'publications';
    if (e.route?.startsWith('/revistas'))
        return 'journals';
    if (e.route?.startsWith('/cpa'))
        return 'evaluation';
    if (e.route?.startsWith('/contato'))
        return 'contact';
    if (e.route?.startsWith('/politicas'))
        return 'policies';
    if (e.route?.startsWith('/utilidades'))
        return 'utilities';
    return 'other';
}
export function publicPath(route) {
    return route === '/index.html' ? '/' : route?.replace(/\.html(?=[?#]|$)/, '') || '/';
}
export const stateLabels = {
    published: 'Publicado',
    draft: 'Rascunho',
    archived: 'Oculto',
    trash: 'Na lixeira',
};
export function normalize(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
export async function api(endpoint, method = 'GET', data) {
    const response = await fetch('/api/admin/' + endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
    const result = await response.json();
    if (!response.ok)
        throw Error(result.error || 'Não foi possível concluir.');
    return result;
}
export async function upload(file) {
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    return api('upload', 'POST', { name: file.name, base64 });
}
