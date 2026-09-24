// Code index: every file's imports, top-level declarations and value references, with cross-file
// resolution (through re-exports). Domain extractors (stores, menus, dialogs...) build on this.

import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { FileText, SK, TYPE_ONLY_KINDS, hasModifier, is, isFunctionLike, kindName, nameText, unwrap, walk } from './ast.mjs';

const CODE_EXT = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'];
const RESOLVE_EXT = ['', '.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.json', '/index.ts', '/index.tsx', '/index.js'];

/** Area of a repository-relative path (the groups the map is organised by). */
export function areaOf(rel) {
  const p = rel.split('/');
  if (p[0] === 'e2e') return 'e2e';
  if (p[0] === 'tests') return 'tests';
  if (p[0] !== 'src') return p[0];
  if (p.length === 2) return 'app'; // src/main.tsx
  const top = p[1];
  if (top === 'lib' || top === 'features') return p.length > 3 ? `${top}/${p[2]}` : top;
  return top; // core, platform, procedures, app, ui, samples, styles
}

export function isTestPath(rel) {
  return rel.startsWith('tests/') || rel.startsWith('e2e/') || /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel);
}

function listFiles(dir, root, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const abs = path.join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) listFiles(abs, root, out);
    else out.push(path.relative(root, abs).split(path.sep).join('/'));
  }
  return out;
}

export class CodeIndex {
  constructor(root, project) {
    this.root = root;
    this.project = project;
    /** rel -> FileInfo */
    this.files = new Map();
    this.K = SK();
  }

  build(dirs) {
    const onDisk = dirs.flatMap((d) => listFiles(path.join(this.root, d), this.root));
    this.assets = onDisk.filter((f) => !CODE_EXT.some((e) => f.endsWith(e)));
    const code = new Set(onDisk.filter((f) => CODE_EXT.some((e) => f.endsWith(e)) && !f.endsWith('.d.ts')));
    for (const abs of this.project.files) {
      const rel = path.relative(this.root, abs).split(path.sep).join('/');
      if (dirs.some((d) => rel === d || rel.startsWith(d + '/')) && !rel.endsWith('.d.ts') && CODE_EXT.some((e) => rel.endsWith(e))) code.add(rel);
    }
    this.missing = [];
    for (const rel of [...code].sort()) {
      const sf = this.project.sourceFile(path.join(this.root, rel));
      if (!sf) {
        this.missing.push(rel);
        continue;
      }
      this.files.set(rel, this.indexFile(rel, sf));
    }
    for (const f of this.files.values()) this.collectRefs(f);
    return this;
  }

  // ---------- resolution ----------

  resolveSpec(fromRel, spec) {
    let base;
    if (spec.startsWith('./') || spec.startsWith('../')) base = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
    else if (spec.startsWith('@/')) base = 'src/' + spec.slice(2);
    else if (spec.startsWith('/')) base = spec.slice(1);
    else return { external: spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0] };
    const noQuery = base.replace(/\?.*$/, '');
    for (const ext of RESOLVE_EXT) {
      const cand = noQuery + ext;
      if (this.files.has(cand) || existsSync(path.join(this.root, cand))) {
        if (existsSync(path.join(this.root, cand)) && statSync(path.join(this.root, cand)).isDirectory()) continue;
        return { file: cand };
      }
    }
    // .js written for a .ts file
    const js = noQuery.replace(/\.m?js$/, '');
    for (const ext of ['.ts', '.tsx']) if (existsSync(path.join(this.root, js + ext))) return { file: js + ext };
    return { unresolved: noQuery };
  }

  // ---------- per-file index ----------

  indexFile(rel, sf) {
    const ft = new FileText(sf);
    const f = {
      rel,
      area: areaOf(rel),
      isTest: isTestPath(rel),
      tsx: rel.endsWith('x'),
      sf,
      ft,
      imports: [], // { spec, target:{file|external|unresolved}, typeOnly, dynamic, sideEffect, line, names:[{local, imported, typeOnly}], namespace }
      reexports: [], // { target, star, names:[{exported, imported}] }
      decls: new Map(), // name -> Decl
      bindings: new Map(), // local name -> { kind:'import', target, imported } | { kind:'decl', name }
      exportsMap: new Map(), // exported name -> local name (or {reexport})
      moduleStatements: [], // top-level statements that are not declarations
    };
    const K = this.K;
    for (const st of sf.statements) {
      const k = kindName(st);
      if (k === 'ImportDeclaration') {
        const spec = st.moduleSpecifier.text;
        const clause = st.importClause;
        const imp = { spec, target: this.resolveSpec(rel, spec), typeOnly: !!clause?.isTypeOnly, dynamic: false, sideEffect: !clause, line: ft.line(st), names: [], namespace: null };
        if (clause) {
          if (clause.name) imp.names.push({ local: clause.name.text, imported: 'default', typeOnly: imp.typeOnly });
          const nb = clause.namedBindings;
          if (nb && is.NamespaceImport(nb)) imp.namespace = nb.name.text;
          else if (nb) for (const el of nb.elements) imp.names.push({ local: el.name.text, imported: el.propertyName ? nameText(el.propertyName) : el.name.text, typeOnly: imp.typeOnly || !!el.isTypeOnly });
        }
        f.imports.push(imp);
        for (const n of imp.names) f.bindings.set(n.local, { kind: 'import', target: imp.target, imported: n.imported, typeOnly: n.typeOnly });
        if (imp.namespace) f.bindings.set(imp.namespace, { kind: 'namespace', target: imp.target });
        continue;
      }
      if (k === 'ExportDeclaration') {
        const target = st.moduleSpecifier ? this.resolveSpec(rel, st.moduleSpecifier.text) : null;
        const ec = st.exportClause;
        if (target) {
          const re = { target, star: !ec, names: [], typeOnly: !!st.isTypeOnly };
          if (ec && is.NamedExports(ec)) for (const el of ec.elements) re.names.push({ exported: nameText(el.name), imported: el.propertyName ? nameText(el.propertyName) : nameText(el.name) });
          if (ec && is.NamespaceExport(ec)) re.names.push({ exported: nameText(ec.name), imported: '*' });
          f.reexports.push(re);
          f.imports.push({ spec: st.moduleSpecifier.text, target, typeOnly: re.typeOnly, dynamic: false, sideEffect: false, line: ft.line(st), names: re.names.map((n) => ({ local: null, imported: n.imported })), namespace: null, reexport: true });
        } else if (ec && is.NamedExports(ec)) {
          for (const el of ec.elements) f.exportsMap.set(nameText(el.name), el.propertyName ? nameText(el.propertyName) : nameText(el.name));
        }
        continue;
      }
      if (k === 'ExportAssignment') {
        f.exportsMap.set('default', unwrap(st.expression) && is.Identifier(unwrap(st.expression)) ? unwrap(st.expression).text : '<default>');
        f.moduleStatements.push(st);
        continue;
      }
      const exported = hasModifier(st, 'ExportKeyword');
      const isDefault = hasModifier(st, 'DefaultKeyword');
      const add = (name, kind, node, init) => {
        if (!name) return;
        const d = { name, kind, node, init, file: rel, line: ft.line(node), exported, isDefault };
        f.decls.set(name, d);
        f.bindings.set(name, { kind: 'decl', name });
        if (exported) f.exportsMap.set(isDefault ? 'default' : name, name);
      };
      if (k === 'FunctionDeclaration') add(st.name ? st.name.text : 'default', 'function', st, st);
      else if (k === 'ClassDeclaration') add(st.name ? st.name.text : 'default', 'class', st, st);
      else if (k === 'InterfaceDeclaration') add(st.name.text, 'interface', st);
      else if (k === 'TypeAliasDeclaration') add(st.name.text, 'type', st);
      else if (k === 'EnumDeclaration') add(st.name.text, 'enum', st);
      else if (k === 'VariableStatement') {
        const isConst = /^(export\s+)?(declare\s+)?const\b/.test(ft.src(st));
        for (const d of st.declarationList.declarations) {
          if (is.Identifier(d.name)) {
            add(d.name.text, 'const', d, d.initializer);
            f.decls.get(d.name.text).mutable = !isConst;
          }
          else {
            // destructured top-level binding: register each name
            walk(d.name, (n) => {
              if (is.BindingElement(n) && is.Identifier(n.name)) add(n.name.text, 'const', n, undefined);
            });
            f.moduleStatements.push(st);
          }
        }
      } else if (k === 'ModuleDeclaration') {
        // declare module / namespace: ignored
      } else f.moduleStatements.push(st);
    }
    // dynamic imports anywhere in the file
    walk(sf, (n) => {
      if (is.CallExpression(n) && n.expression.kind === K.ImportKeyword) {
        const a = n.arguments[0];
        if (a && (is.StringLiteral(a) || is.NoSubstitutionTemplateLiteral(a))) {
          f.imports.push({ spec: a.text, target: this.resolveSpec(rel, a.text), typeOnly: false, dynamic: true, sideEffect: false, line: ft.line(n), names: [], namespace: null });
        }
      }
    });
    for (const d of f.decls.values()) d.kind = this.classifyDecl(f, d);
    return f;
  }

  classifyDecl(f, d) {
    if (d.kind === 'interface' || d.kind === 'type' || d.kind === 'enum' || d.kind === 'class') return d.kind;
    const init = d.init ? unwrap(d.init) : undefined;
    const fnNode = d.kind === 'function' ? d.node : init && isFunctionLike(init) ? init : init && is.CallExpression(init) && init.arguments?.length && isFunctionLike(unwrap(init.arguments[0])) && /^(memo|forwardRef|React\.memo|React\.forwardRef|lazy)$/.test(f.ft.src(init.expression)) ? unwrap(init.arguments[0]) : undefined;
    if (init && is.CallExpression(init) && this.isZustandCreate(f, init)) return 'store';
    if (fnNode) {
      d.fn = fnNode;
      if (/^use[A-Z0-9]/.test(d.name)) return 'hook';
      if (/^[A-Z]/.test(d.name) && this.containsJsx(fnNode)) return 'component';
      return 'function';
    }
    return 'const';
  }

  isZustandCreate(f, call) {
    let c = call;
    // create<T>()(fn) or create<T>(fn)
    while (c && is.CallExpression(c)) {
      const callee = unwrap(c.expression);
      if (is.Identifier(callee)) {
        const b = f.bindings.get(callee.text);
        return !!(b && b.kind === 'import' && b.target.external === 'zustand' && (b.imported === 'create' || b.imported === 'createStore'));
      }
      c = callee;
    }
    return false;
  }

  containsJsx(node) {
    let found = false;
    walk(node, (n) => {
      if (found) return false;
      const k = kindName(n);
      if (k === 'JsxElement' || k === 'JsxSelfClosingElement' || k === 'JsxFragment') {
        found = true;
        return false;
      }
      return undefined;
    });
    return found;
  }

  // ---------- symbol resolution ----------

  /** Resolve an exported name of a file to its declaration { file, name } (following re-exports). */
  resolveExport(file, name, seen = new Set()) {
    const key = `${file}#${name}`;
    if (seen.has(key)) return null;
    seen.add(key);
    const f = this.files.get(file);
    if (!f) return null;
    const local = f.exportsMap.get(name);
    if (local !== undefined) {
      if (f.decls.has(local)) return { file, name: local };
      const b = f.bindings.get(local);
      if (b?.kind === 'import' && b.target.file) return this.resolveExport(b.target.file, b.imported, seen);
      return { file, name: local };
    }
    for (const re of f.reexports) {
      if (!re.target.file) continue;
      if (re.star) {
        const r = this.resolveExport(re.target.file, name, seen);
        if (r) return r;
      } else {
        const hit = re.names.find((n) => n.exported === name);
        if (hit) return hit.imported === '*' ? { file: re.target.file, name: '*' } : this.resolveExport(re.target.file, hit.imported, seen);
      }
    }
    return null;
  }

  /** Resolve a local identifier in a file to { file, name, decl } or { external } or null. */
  resolveLocal(f, name) {
    const b = f.bindings.get(name);
    if (!b) return null;
    if (b.kind === 'decl') return { file: f.rel, name, decl: f.decls.get(name) };
    if (b.kind === 'namespace') return b.target.file ? { file: b.target.file, name: '*', namespace: true } : { external: b.target.external };
    if (b.target.external) return { external: b.target.external, name: b.imported };
    if (!b.target.file) return null;
    const r = this.resolveExport(b.target.file, b.imported);
    if (!r) return { file: b.target.file, name: b.imported, unresolved: true };
    return { ...r, decl: this.files.get(r.file)?.decls.get(r.name) };
  }

  decl(file, name) {
    return this.files.get(file)?.decls.get(name);
  }

  /** Top-level declaration (or '<module>') that contains node n. */
  ownerOf(f, n) {
    let cur = n;
    while (cur && cur.parent && cur.parent !== f.sf) cur = cur.parent;
    if (!cur) return '<module>';
    for (const d of f.decls.values()) {
      const node = d.node;
      if (node === cur || (is.VariableDeclaration(node) && node.parent?.parent === cur && node.pos <= n.pos && n.end <= node.end)) return d.name;
      if (is.BindingElement(node) && cur.pos <= node.pos && node.end <= cur.end && is.VariableStatement(cur)) return d.name;
    }
    return '<module>';
  }

  // ---------- references ----------

  collectRefs(f) {
    // refs: { from (decl name or <module>), to: {file,name}|{external}, how: calls|renders|uses, line }
    f.refs = [];
    const K = this.K;
    const visit = (n, owner) => {
      const k = kindName(n);
      if (TYPE_ONLY_KINDS.has(k)) return;
      if (k === 'ImportDeclaration' || k === 'ExportDeclaration') return;
      if (k === 'Identifier') {
        const name = n.text;
        const b = f.bindings.get(name);
        if (b && !this.isDeclarationName(n) && !this.isPropertyName(n)) {
          const r = this.resolveLocal(f, name);
          if (r && !(r.file === f.rel && r.name === owner)) {
            const p = n.parent;
            let how = 'uses';
            if (p && (is.CallExpression(p) || is.NewExpression(p)) && p.expression === n) how = 'calls';
            else if (p && (is.JsxOpeningElement(p) || is.JsxSelfClosingElement(p)) && p.tagName === n) how = 'renders';
            else if (p && is.JsxClosingElement(p)) how = null;
            else if (p && is.PropertyAccessExpression(p) && p.expression === n && b.kind === 'namespace') {
              // ns.member
              const member = p.name.text;
              const rr = r.file ? this.resolveExport(r.file, member) : null;
              const gp = p.parent;
              const h2 = gp && is.CallExpression(gp) && gp.expression === p ? 'calls' : gp && (is.JsxOpeningElement(gp) || is.JsxSelfClosingElement(gp)) ? 'renders' : 'uses';
              f.refs.push({ from: owner, to: rr ?? { file: r.file, name: member }, how: h2, line: f.ft.line(n) });
              how = null;
            }
            if (how) f.refs.push({ from: owner, to: r.external ? { external: r.external, name: r.name } : { file: r.file, name: r.name }, how, line: f.ft.line(n), typeOnly: b.typeOnly });
          }
        }
        return;
      }
      n.forEachChild((c) => visit(c, owner));
    };
    for (const d of f.decls.values()) {
      if (d.kind === 'interface' || d.kind === 'type') continue;
      const target = d.node;
      if (is.VariableDeclaration(target)) {
        if (target.initializer) visit(target.initializer, d.name);
      } else if (is.BindingElement(target)) {
        // covered by moduleStatements
      } else target.forEachChild((c) => visit(c, d.name));
    }
    for (const st of f.moduleStatements) visit(st, '<module>');
    // JSX closing tags produce no refs; dedupe
    const seen = new Set();
    f.refs = f.refs.filter((r) => {
      const key = `${r.from}|${r.to.file ?? r.to.external}|${r.to.name}|${r.how}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    void K;
  }

  isDeclarationName(n) {
    const p = n.parent;
    if (!p) return false;
    const k = kindName(p);
    if ((k === 'VariableDeclaration' || k === 'FunctionDeclaration' || k === 'ClassDeclaration' || k === 'Parameter' || k === 'BindingElement' || k === 'InterfaceDeclaration' || k === 'TypeAliasDeclaration' || k === 'EnumDeclaration' || k === 'FunctionExpression' || k === 'ImportSpecifier' || k === 'ExportSpecifier' || k === 'ImportClause' || k === 'NamespaceImport' || k === 'LabeledStatement' || k === 'EnumMember' || k === 'TypeParameter') && p.name === n) return true;
    if (k === 'BindingElement' && p.propertyName === n) return true;
    return false;
  }

  isPropertyName(n) {
    const p = n.parent;
    if (!p) return false;
    const k = kindName(p);
    if (k === 'PropertyAccessExpression' && p.name === n) return true;
    if ((k === 'PropertyAssignment' || k === 'PropertyDeclaration' || k === 'PropertySignature' || k === 'MethodDeclaration' || k === 'MethodSignature' || k === 'GetAccessor' || k === 'SetAccessor') && p.name === n) return true;
    if (k === 'JsxAttribute' && p.name === n) return true;
    if (k === 'QualifiedName' && p.right === n) return true;
    return false;
  }
}
