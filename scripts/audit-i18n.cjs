const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function parse(file) { return ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); }
function walk(node, visit) { visit(node); ts.forEachChild(node, child => walk(child, visit)); }
function obj(node) { return new Map(node && ts.isObjectLiteralExpression(node) ? node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.text, p.initializer]) : []); }
const i18n = parse('src/content/i18n.ts');
const declarations = new Map();
walk(i18n, n => { if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) declarations.set(n.name.text, n.initializer); });
const uiFile = parse('src/content/ui-translations.ts');
walk(uiFile, n => { if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) declarations.set(n.name.text, n.initializer); });
const tables = ['dictionaries', 'extra', 'aliases'].map(name => obj(declarations.get(name)));
const uiTable = obj(declarations.get('uiTranslations'));
const locales = ['ru', 'en', 'es', 'fr'];
const keys = new Set([...tables.flatMap(table => locales.flatMap(locale => [...obj(table.get(locale)).keys()])), ...uiTable.keys()]);
const errors = [];
for (const name of ['uiTranslations', 'difficultyTranslations', 'starDesignTranslations']) {
  const table = declarations.get(name);
  const seen = new Set();
  for (const property of table.properties) {
    const key = property.name.text;
    if (seen.has(key)) errors.push(`${name}: duplicate key ${key}`);
    seen.add(key);
    for (const locale of locales) {
      const value = obj(property.initializer).get(locale);
      if (!value || !ts.isStringLiteral(value) || !value.text.trim()) errors.push(`${name}: ${key} missing ${locale}`);
    }
  }
}
for (const name of ['moreTaskTitles', 'categoryTranslations', 'themeLabels']) {
  for (const [key, value] of obj(declarations.get(name))) for (const locale of locales) {
    if (!obj(value).has(locale)) errors.push(`${name}: ${key} missing ${locale}`);
  }
}
for (const [key, value] of obj(declarations.get('taskTranslations'))) for (const locale of ['en', 'es', 'fr']) {
  const entry = obj(value).get(locale);
  if (!entry) errors.push(`taskTranslations: ${key} missing ${locale}`);
  else if (!obj(entry).has('title') || !obj(entry).has('steps')) errors.push(`taskTranslations: ${key} incomplete ${locale}`);
}
const catalog = parse('src/content/catalog.ts');
const catalogIds = new Set();
walk(catalog, n => {
  if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'task' && ts.isStringLiteral(n.arguments[0])) catalogIds.add(n.arguments[0].text);
});
const fullTasks = obj(declarations.get('taskTranslations'));
const taskTitles = obj(declarations.get('moreTaskTitles'));
const genericSteps = obj(declarations.get('steps'));
for (const id of catalogIds) {
  if (!fullTasks.has(id) && !taskTitles.has(id)) errors.push(`catalog: ${id} title untranslated`);
  if (!fullTasks.has(id) && !genericSteps.has(id)) errors.push(`catalog: ${id} steps untranslated`);
  if (genericSteps.has(id)) for (const locale of ['en', 'es', 'fr']) {
    const steps = obj(genericSteps.get(id)).get(locale);
    if (!steps || !ts.isArrayLiteralExpression(steps) || steps.elements.length === 0) errors.push(`catalog: ${id} steps missing ${locale}`);
  }
}
function literalProperties(file, property) {
  const values = new Set();
  walk(parse(file), n => {
    if (ts.isPropertyAssignment(n) && n.name.text === property && ts.isStringLiteral(n.initializer)) values.add(n.initializer.text);
  });
  return values;
}
for (const id of literalProperties('src/domain/star-designs.ts', 'id')) if (!obj(declarations.get('starDesignTranslations')).has(id)) errors.push(`starDesignTranslations: ${id} missing`);
for (const id of literalProperties('src/domain/difficulty.ts', 'value')) if (!obj(declarations.get('difficultyTranslations')).has(id)) errors.push(`difficultyTranslations: ${id} missing`);
for (const key of keys) for (const locale of locales) {
  const count = tables.filter(table => obj(table.get(locale)).has(key)).length + (obj(uiTable.get(key)).has(locale) ? 1 : 0);
  if (count !== 1) errors.push(`${locale}: ${key} (${count === 0 ? 'missing' : 'duplicate'})`);
}
const used = new Set(); const russian = []; const literals = [];
for (const name of ['app/index.tsx', 'src/ui/ChildDashboard.tsx', 'src/ui/StarIcon.tsx', 'src/content/messages.ts']) {
  const ast = parse(name);
  walk(ast, n => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ['tr', 'genderTr'].includes(n.expression.text)) walk(n.arguments[1], a => {
      if (!ts.isStringLiteral(a)) return;
      if (n.expression.text === 'genderTr') { used.add(`${a.text}Male`); used.add(`${a.text}Female`); }
      else used.add(a.text);
    });
    const text = ts.isJsxText(n) ? n.text.trim() : ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer) ? n.initializer.text : '';
    if (/[А-Яа-яЁё]/.test(text)) russian.push(`${name}:${ast.getLineAndCharacterOfPosition(n.getStart()).line + 1}: ${text.slice(0, 80)}`);
    if (ts.isStringLiteral(n) && /[А-Яа-яЁё]/.test(n.text) && !ts.isJsxAttribute(n.parent)) literals.push(`${name}:${ast.getLineAndCharacterOfPosition(n.getStart()).line + 1}: ${n.text.slice(0, 90)}`);
  });
}
for (const key of used) if (!keys.has(key)) errors.push(`used but missing: ${key}`);
console.log(`keys=${keys.size} used=${used.size} unlocalized JSX=${russian.length}`);
if (errors.length) console.log(errors.join('\n'));
if (russian.length) console.log(russian.join('\n'));
if (process.env.I18N_AUDIT_LITERALS === '1') console.log('Russian string literals:\n' + literals.join('\n'));
process.exitCode = errors.length || russian.length ? 1 : 0;
