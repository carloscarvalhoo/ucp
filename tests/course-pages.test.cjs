const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');
const root = path.join(__dirname, '..');
const courses = JSON.parse(fs.readFileSync(path.join(root, 'content-source.json'), 'utf8')).courses;

test('todos os cursos mostram informações completas sem abas ou painéis ocultos', () => {
  for (const course of courses) {
    const html = fs.readFileSync(path.join(root, 'dist/cursos', course.slug + '.html'), 'utf8');
    const { document } = parseHTML(html);
    assert.equal(document.querySelector('[role=tablist]'), null, course.name);
    assert.equal(document.querySelector('[role=tabpanel]'), null, course.name);
    const sections = [...document.querySelectorAll('.course-content-section')];
    assert(sections.length >= 2, course.name);
    assert(
      sections.every((section) => !section.hasAttribute('hidden')),
      course.name,
    );
    const text = sections.map((section) => section.textContent).join(' ');
    assert(text.includes('Sobre o curso'), course.name);
    assert(text.includes('Investimento'), course.name);
    if (course.teachers.length) assert(text.includes(course.teachers[0].name), course.name);
    for (const document of course.documents) assert(text.includes(document.title), course.name);
  }
});
