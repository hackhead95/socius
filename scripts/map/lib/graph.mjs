// In-memory relationship graph with typed nodes and edges. Deterministic: ids are stable strings and
// every export sorts nodes and edges.

export class Graph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  node(id, type, label, props = {}) {
    let n = this.nodes.get(id);
    if (!n) {
      n = { id, type, label: label ?? id };
      this.nodes.set(id, n);
    } else {
      if (type && n.type !== type && n.type === 'unknown') n.type = type;
      if (label && n.label === n.id) n.label = label;
    }
    for (const [k, v] of Object.entries(props)) if (v !== undefined && v !== null && v !== '') n[k] = v;
    return n;
  }

  has(id) {
    return this.nodes.has(id);
  }

  get(id) {
    return this.nodes.get(id);
  }

  /** Add (or merge) an edge. `via` values accumulate as a sorted unique list. */
  edge(source, target, type, props = {}) {
    if (!source || !target || source === target) return null;
    const key = `${source}\u0000${target}\u0000${type}`;
    let e = this.edges.get(key);
    if (!e) {
      e = { source, target, type };
      this.edges.set(key, e);
    }
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === '') continue;
      if (k === 'via' || k === 'lines') {
        const list = new Set([...(e[k] ?? []), ...(Array.isArray(v) ? v : [v])]);
        e[k] = [...list].sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
      } else e[k] = v;
    }
    return e;
  }

  out(id, type) {
    const r = [];
    for (const e of this.edges.values()) if (e.source === id && (!type || e.type === type)) r.push(e);
    return r;
  }

  in(id, type) {
    const r = [];
    for (const e of this.edges.values()) if (e.target === id && (!type || e.type === type)) r.push(e);
    return r;
  }

  /** Build adjacency indexes (call after the graph is complete). */
  freeze() {
    this.outIdx = new Map();
    this.inIdx = new Map();
    for (const e of this.edges.values()) {
      if (!this.outIdx.has(e.source)) this.outIdx.set(e.source, []);
      if (!this.inIdx.has(e.target)) this.inIdx.set(e.target, []);
      this.outIdx.get(e.source).push(e);
      this.inIdx.get(e.target).push(e);
    }
    this.out = (id, type) => (this.outIdx.get(id) ?? []).filter((e) => !type || e.type === type);
    this.in = (id, type) => (this.inIdx.get(id) ?? []).filter((e) => !type || e.type === type);
  }

  sortedNodes() {
    return [...this.nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  sortedEdges() {
    return [...this.edges.values()].sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target) || a.type.localeCompare(b.type));
  }
}

export const symId = (file, name) => `sym:${file}#${name}`;
export const modId = (file) => `module:${file}`;
