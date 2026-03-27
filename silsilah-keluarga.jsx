import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// SILSILAH KELUARGA — Advanced Family Tree Application
// Modular • Scalable • Persistent Storage • Multi-View • UX Enhanced
// ═══════════════════════════════════════════════════════════════

// ─── CONSTANTS & CONFIG ──────────────────────────────────────
const STORAGE_KEY = "silsilah-syachroel-v2";
const GENDER = { MALE: "male", FEMALE: "female" };
const RELATION = { PARENT: "parent", SPOUSE: "spouse" };
const VIEWS = { TREE: "tree", LIST: "list", STATS: "stats", TIMELINE: "timeline" };

const GENERATION_COLORS = [
  "#1a5276", "#7d3c98", "#117864", "#b9770e",
  "#922b21", "#1f618d", "#6c3483", "#148f77",
  "#b7950b", "#a93226", "#2471a3", "#884ea0",
];

// ─── DATA LAYER (Storage Module) ─────────────────────────────
const Storage = {
  async load() {
    try {
      const r = await window.storage.get(STORAGE_KEY);
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  },
  async save(data) {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch { return false; }
  },
  async clear() {
    try {
      await window.storage.delete(STORAGE_KEY);
      return true;
    } catch { return false; }
  }
};

// ─── FAMILY ENGINE (Business Logic Module) ───────────────────
const FamilyEngine = {
  createPerson({ name, gender, birthDate = "", deathDate = "", birthPlace = "", photo = "", notes = "", parentId = null, spouseId = null }) {
    return {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name, gender, birthDate, deathDate, birthPlace, photo, notes,
      parentId, spouseId, createdAt: new Date().toISOString(),
    };
  },

  getChildren(people, personId) {
    return people.filter(p => p.parentId === personId);
  },

  getSpouse(people, person) {
    if (!person.spouseId) return null;
    return people.find(p => p.id === person.spouseId) || null;
  },

  getParent(people, person) {
    if (!person.parentId) return null;
    return people.find(p => p.id === person.parentId) || null;
  },

  getSiblings(people, person) {
    if (!person.parentId) return [];
    return people.filter(p => p.parentId === person.parentId && p.id !== person.id);
  },

  getRoots(people) {
    return people.filter(p => !p.parentId);
  },

  getGeneration(people, personId, gen = 0) {
    const person = people.find(p => p.id === personId);
    if (!person || !person.parentId) return gen;
    return FamilyEngine.getGeneration(people, person.parentId, gen + 1);
  },

  getDescendantCount(people, personId) {
    const children = FamilyEngine.getChildren(people, personId);
    return children.reduce((sum, c) => sum + 1 + FamilyEngine.getDescendantCount(people, c.id), 0);
  },

  getAge(person) {
    if (!person.birthDate) return null;
    const birth = new Date(person.birthDate);
    const end = person.deathDate ? new Date(person.deathDate) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
    return age;
  },

  getAncestorPath(people, personId) {
    const path = [];
    let current = people.find(p => p.id === personId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? people.find(p => p.id === current.parentId) : null;
    }
    return path;
  },

  buildTree(people) {
    const roots = FamilyEngine.getRoots(people);
    const build = (person) => ({
      ...person,
      spouse: FamilyEngine.getSpouse(people, person),
      children: FamilyEngine.getChildren(people, person.id)
        .sort((a, b) => (a.birthDate || a.createdAt || "").localeCompare(b.birthDate || b.createdAt || ""))
        .map(build),
      generation: FamilyEngine.getGeneration(people, person.id),
    });
    return roots.map(build);
  },

  getStats(people) {
    const total = people.length;
    const males = people.filter(p => p.gender === GENDER.MALE).length;
    const females = total - males;
    const living = people.filter(p => !p.deathDate).length;
    const maxGen = Math.max(0, ...people.map(p => FamilyEngine.getGeneration(people, p.id)));
    const avgChildren = total > 0
      ? (people.reduce((s, p) => s + FamilyEngine.getChildren(people, p.id).length, 0) / Math.max(1, people.filter(p => FamilyEngine.getChildren(people, p.id).length > 0).length)).toFixed(1)
      : 0;
    const oldest = people
      .filter(p => p.birthDate && !p.deathDate)
      .sort((a, b) => a.birthDate.localeCompare(b.birthDate))[0];
    return { total, males, females, living, deceased: total - living, generations: maxGen + 1, avgChildren, oldest };
  },

  search(people, query) {
    const q = query.toLowerCase().trim();
    if (!q) return people;
    return people.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.birthPlace || "").toLowerCase().includes(q) ||
      (p.notes || "").toLowerCase().includes(q)
    );
  },

  exportJSON(people) {
    return JSON.stringify(people, null, 2);
  },

  importJSON(json) {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data) && data.every(p => p.id && p.name)) return data;
      return null;
    } catch { return null; }
  }
};

// ─── FAMILY DATA: Keluarga HM Syachroel AP ──────────────────
const DEMO_DATA = (() => {
  const ids = {
    ayah: "p_syachroel", ibu: "p_djahora",
    isnawati: "p_isnawati", abdulkadir: "p_abdulkadir",
    fakhruddin: "p_fakhruddin", ertika: "p_ertika",
    budiana: "p_budiana", fadlan: "p_fadlan",
    sopian: "p_sopian", susilowati: "p_susilowati",
    firmansyah: "p_firmansyah", rissa: "p_rissa",
    reza: "p_reza", amy: "p_amy",
    aulia: "p_aulia", haris: "p_haris",
    annisa: "p_annisa", rayhan: "p_rayhan", syifa: "p_syifa",
    khalisa: "p_khalisa", athallah: "p_athallah", syakira: "p_syakira",
    kaylila: "p_kaylila", algazel: "p_algazel", alsyameera: "p_alsyameera",
    caca: "p_caca", fia: "p_fia",
  };
  return [
    { id: ids.ayah, name: "HM Syachroel AP", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Kepala Keluarga", parentId: null, spouseId: ids.ibu, createdAt: "2024-01-01" },
    { id: ids.ibu, name: "Hj. Djahora", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Ibu Keluarga", parentId: null, spouseId: ids.ayah, createdAt: "2024-01-01" },
    { id: ids.isnawati, name: "Isnawati", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak pertama", parentId: ids.ayah, spouseId: ids.abdulkadir, createdAt: "2024-01-01" },
    { id: ids.abdulkadir, name: "Abdul Kadir Saro", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Suami Isnawati", parentId: null, spouseId: ids.isnawati, createdAt: "2024-01-01" },
    { id: ids.fakhruddin, name: "M Fakhruddin", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak kedua", parentId: ids.ayah, spouseId: ids.ertika, createdAt: "2024-01-01" },
    { id: ids.ertika, name: "Ertika Sari", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Istri M Fakhruddin", parentId: null, spouseId: ids.fakhruddin, createdAt: "2024-01-01" },
    { id: ids.budiana, name: "Budiana", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak ketiga", parentId: ids.ayah, spouseId: ids.fadlan, createdAt: "2024-01-01" },
    { id: ids.fadlan, name: "Fadlan", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Suami Budiana", parentId: null, spouseId: ids.budiana, createdAt: "2024-01-01" },
    { id: ids.sopian, name: "M Sopian Hadianto", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak keempat • GRC Expert & AI-Powered Builder • BPKH", parentId: ids.ayah, spouseId: ids.susilowati, createdAt: "2024-01-01" },
    { id: ids.susilowati, name: "Susilowati", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Istri M Sopian Hadianto", parentId: null, spouseId: ids.sopian, createdAt: "2024-01-01" },
    { id: ids.firmansyah, name: "M. Firmansyah", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak kelima", parentId: ids.ayah, spouseId: ids.rissa, createdAt: "2024-01-01" },
    { id: ids.rissa, name: "Rissa", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Istri M. Firmansyah", parentId: null, spouseId: ids.firmansyah, createdAt: "2024-01-01" },
    { id: ids.reza, name: "M Reza Fahlevi", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak keenam", parentId: ids.ayah, spouseId: ids.amy, createdAt: "2024-01-01" },
    { id: ids.amy, name: "Amy", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Istri M Reza Fahlevi", parentId: null, spouseId: ids.reza, createdAt: "2024-01-01" },
    { id: ids.aulia, name: "Aulia Rahman", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak pertama Isnawati", parentId: ids.isnawati, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.haris, name: "Abdul Haris", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak kedua Isnawati", parentId: ids.isnawati, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.annisa, name: "Annisa Salsabila", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak pertama M Fakhruddin", parentId: ids.fakhruddin, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.rayhan, name: "M Rayhan", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak kedua M Fakhruddin", parentId: ids.fakhruddin, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.syifa, name: "Syifa", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak ketiga M Fakhruddin", parentId: ids.fakhruddin, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.khalisa, name: "Khalisa NF Shasie", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak pertama M Sopian Hadianto", parentId: ids.sopian, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.athallah, name: "Athallah Lintang Ahmad", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak kedua M Sopian Hadianto", parentId: ids.sopian, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.syakira, name: "Syakira Alma Kinanti", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak ketiga M Sopian Hadianto", parentId: ids.sopian, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.kaylila, name: "Kaylila Syafira", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak pertama M. Firmansyah", parentId: ids.firmansyah, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.algazel, name: "Al Gazel", gender: "male", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak kedua M. Firmansyah", parentId: ids.firmansyah, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.alsyameera, name: "Al Syameera", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak ketiga M. Firmansyah", parentId: ids.firmansyah, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.caca, name: "Caca", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak pertama M Reza Fahlevi", parentId: ids.reza, spouseId: null, createdAt: "2024-01-01" },
    { id: ids.fia, name: "Fia", gender: "female", birthDate: "", deathDate: "", birthPlace: "", photo: "", notes: "Anak kedua M Reza Fahlevi", parentId: ids.reza, spouseId: null, createdAt: "2024-01-01" },
  ];
})();

// ─── ICONS (SVG Components) ──────────────────────────────────
const Icon = {
  Male: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4M19 5h-5M19 5v5"/></svg>,
  Female: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="5"/><path d="M12 15v7M9 19h6"/></svg>,
  Tree: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M5 8h14M8 13h8M3 18h18"/></svg>,
  List: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  Chart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  Close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Heart: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  User: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Info: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  ChevronRight: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>,
  ZoomIn: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>,
  ZoomOut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/></svg>,
  ZoomReset: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6" opacity="0.4"/></svg>,
  UserPlus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>,
  HeartPlus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/><path d="M12 8v4M10 10h4" strokeWidth="1.5"/></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Warning: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
  Fullscreen: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>,
};

// ─── STYLES ──────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --bg-primary: #f5f7fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f0f2f5;
  --bg-input: #f8f9fb;
  --border: #e2e5eb;
  --border-light: #d0d5dd;
  --text-primary: #1a1d23;
  --text-secondary: #5a6170;
  --text-muted: #8b92a5;
  --accent-blue: #2b7de9;
  --accent-gold: #c8910a;
  --accent-green: #0d9668;
  --accent-rose: #d64292;
  --accent-purple: #7c5cbf;
  --male-bg: #eef4fc;
  --male-border: #b6d4f7;
  --male-text: #2563a8;
  --female-bg: #fceef8;
  --female-border: #edb8df;
  --female-text: #a8357a;
  --shadow: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.12);
  --radius: 12px;
  --radius-sm: 8px;
  --transition: all 0.25s cubic-bezier(.4,0,.2,1);
}

* { margin:0; padding:0; box-sizing:border-box; }

body, #root {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.header {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, #eef1f6 100%);
  border-bottom: 1px solid var(--border);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-brand h1 {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #7a5a0a 0%, var(--accent-gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.header-brand .badge {
  font-size: 10px;
  background: var(--accent-gold);
  color: #fff;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
  white-space: nowrap;
}
.btn:hover { background: var(--bg-card-hover); border-color: var(--border-light); transform: translateY(-1px); }
.btn:active { transform: translateY(0); }
.btn-primary { background: var(--accent-blue); border-color: var(--accent-blue); color: #fff; }
.btn-primary:hover { background: #1f6dd4; }
.btn-danger { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
.btn-danger:hover { background: #fee2e2; }
.btn-success { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
.btn-success:hover { background: #d1fae5; }
.btn-rose { background: #fdf2f8; border-color: var(--female-border); color: var(--accent-rose); }
.btn-rose:hover { background: #fce7f3; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-icon { padding: 6px; width: 32px; height: 32px; justify-content: center; }
.btn-ghost { background: transparent; border-color: transparent; }
.btn-ghost:hover { background: var(--bg-card); }

/* ── Navigation Tabs ── */
.nav-tabs {
  display: flex;
  gap: 2px;
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 3px;
  border: 1px solid var(--border);
}
.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
  position: relative;
}
.nav-tab:hover { color: var(--text-secondary); }
.nav-tab.active { background: var(--bg-card); color: var(--accent-gold); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.nav-tab .nav-count {
  font-size: 9px;
  background: var(--border);
  color: var(--text-secondary);
  padding: 1px 5px;
  border-radius: 10px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}
.nav-tab.active .nav-count {
  background: var(--accent-gold);
  color: #fff;
}

/* ── Search ── */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  min-width: 200px;
  transition: var(--transition);
}
.search-box:focus-within { border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(74,158,255,0.1); }
.search-box input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13px;
  width: 100%;
  font-family: inherit;
}
.search-box input::placeholder { color: var(--text-muted); }
.search-count {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  font-weight: 600;
}

/* ── Main Content ── */
.main {
  flex: 1;
  padding: 24px;
  overflow-x: auto;
}

/* ── TREE VIEW ── */
.tree-wrapper {
  position: relative;
}
.tree-controls {
  position: sticky;
  top: 70px;
  z-index: 50;
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  margin-bottom: 12px;
  padding: 0 8px;
}
.tree-controls .btn-icon {
  background: var(--bg-card);
  border: 1px solid var(--border);
  width: 34px;
  height: 34px;
  border-radius: 8px;
}
.tree-controls .zoom-label {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 8px;
  font-weight: 600;
}
.tree-scalable {
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
  transform-origin: top center;
}
.tree-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  min-width: fit-content;
  padding: 20px;
}

.tree-level {
  display: flex;
  justify-content: center;
  gap: 16px;
  position: relative;
  padding: 12px 0;
  flex-wrap: wrap;
}

.tree-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tree-couple {
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
}

.spouse-link {
  width: 24px;
  height: 2px;
  background: var(--accent-rose);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spouse-link::after {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--accent-rose);
  border-radius: 50%;
  position: absolute;
}

.tree-connector {
  width: 2px;
  height: 24px;
  background: var(--border-light);
  margin: 0 auto;
}

.tree-branch-h {
  height: 2px;
  background: var(--border-light);
  position: relative;
  margin: 0 auto;
}

/* ── Person Card ── */
.person-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px;
  min-width: 130px;
  max-width: 160px;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}
.person-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.person-card.male { border-color: var(--male-border); }
.person-card.male::before { background: linear-gradient(90deg, var(--male-text), transparent); }
.person-card.female { border-color: var(--female-border); }
.person-card.female::before { background: linear-gradient(90deg, var(--female-text), transparent); }
.person-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
.person-card.selected { border-color: var(--accent-gold); box-shadow: 0 0 20px rgba(240,183,68,0.15); }

.person-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Playfair Display', serif;
  overflow: hidden;
}
.person-avatar.male { background: var(--male-bg); color: var(--male-text); border: 2px solid var(--male-border); }
.person-avatar.female { background: var(--female-bg); color: var(--female-text); border: 2px solid var(--female-border); }
.person-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.person-name {
  font-weight: 600;
  font-size: 12px;
  text-align: center;
  margin-bottom: 3px;
  line-height: 1.3;
}

.person-meta {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
}

.person-gen-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  top: 8px;
  right: 8px;
}

.person-children-count {
  font-size: 9px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

/* ── List View ── */
.list-view {
  display: grid;
  gap: 8px;
  max-width: 900px;
  margin: 0 auto;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  cursor: pointer;
  transition: var(--transition);
}
.list-item:hover { background: var(--bg-card-hover); transform: translateX(4px); }

.list-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  overflow: hidden;
}
.list-avatar.male { background: var(--male-bg); color: var(--male-text); }
.list-avatar.female { background: var(--female-bg); color: var(--female-text); }
.list-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-info { flex: 1; min-width: 0; }
.list-info h4 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.list-info p { font-size: 12px; color: var(--text-muted); }

.list-badges { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
.list-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: 600;
}

/* ── Stats View ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  transition: var(--transition);
}
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.stat-value {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 4px;
}
.stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }

/* ── Timeline View ── */
.timeline {
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  padding-left: 40px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border);
}
.timeline-item {
  position: relative;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: var(--transition);
  cursor: pointer;
}
.timeline-item:hover { background: var(--bg-card-hover); transform: translateX(4px); }
.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: absolute;
  left: -33px;
  top: 18px;
  border: 2px solid var(--bg-primary);
}
.timeline-year {
  font-size: 11px;
  color: var(--accent-gold);
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.timeline-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.timeline-desc { font-size: 12px; color: var(--text-muted); }

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}
.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s cubic-bezier(.4,0,.2,1);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}
.modal-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
}
.modal-body { padding: 20px 24px; }
.modal-footer {
  padding: 16px 24px 20px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  border-top: 1px solid var(--border);
}

/* ── Confirm Dialog ── */
.confirm-dialog {
  max-width: 400px;
  text-align: center;
}
.confirm-dialog .confirm-icon {
  margin: 0 auto 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-dialog .confirm-icon.danger {
  background: #fef2f2;
  color: #dc2626;
}
.confirm-dialog .confirm-icon.warning {
  background: #fffbeb;
  color: var(--accent-gold);
}
.confirm-dialog .confirm-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}
.confirm-dialog .confirm-message {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}
.confirm-dialog .confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* ── Form ── */
.form-group { margin-bottom: 16px; }
.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}
.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  transition: var(--transition);
  outline: none;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(74,158,255,0.1);
}
.form-select { cursor: pointer; }
.form-textarea { resize: vertical; min-height: 70px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

.gender-toggle {
  display: flex;
  gap: 8px;
}
.gender-btn {
  flex: 1;
  padding: 10px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border);
  background: var(--bg-input);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
}
.gender-btn.active-male { border-color: var(--male-text); background: var(--male-bg); color: var(--male-text); }
.gender-btn.active-female { border-color: var(--female-text); background: var(--female-bg); color: var(--female-text); }

/* ── Detail Panel ── */
.detail-panel {
  padding: 24px;
}
.detail-header {
  text-align: center;
  margin-bottom: 24px;
}
.detail-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  font-size: 32px;
  font-weight: 700;
  font-family: 'Playfair Display', serif;
  overflow: hidden;
}
.detail-avatar.male { background: var(--male-bg); color: var(--male-text); border: 3px solid var(--male-border); }
.detail-avatar.female { background: var(--female-bg); color: var(--female-text); border: 3px solid var(--female-border); }
.detail-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail-name {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}
.detail-subtitle { font-size: 13px; color: var(--text-muted); }

/* ── Breadcrumb ── */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 10px;
}
.breadcrumb-item {
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: var(--transition);
}
.breadcrumb-item:hover { color: var(--accent-blue); background: rgba(74,158,255,0.1); }
.breadcrumb-item.current { color: var(--accent-gold); font-weight: 600; cursor: default; }
.breadcrumb-item.current:hover { background: transparent; color: var(--accent-gold); }
.breadcrumb-sep { color: var(--text-muted); font-size: 10px; }

/* ── Quick Actions ── */
.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.detail-section { margin-bottom: 20px; }
.detail-section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}
.detail-row-label { color: var(--text-muted); }
.detail-row-value { font-weight: 500; }
.detail-relations { display: flex; flex-direction: column; gap: 6px; }
.detail-relation {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-size: 13px;
}
.detail-relation:hover { background: var(--bg-card-hover); }
.detail-relation-type {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  min-width: 60px;
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}
.empty-state h3 {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.empty-state p { margin-bottom: 20px; font-size: 14px; }

/* ── Toast ── */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  background: var(--bg-card);
  border: 1px solid var(--accent-green);
  color: var(--accent-green);
  padding: 12px 20px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease, fadeOut 0.3s ease 2.5s forwards;
  display: flex;
  align-items: center;
  gap: 8px;
}
.toast.toast-warning {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}
.toast.toast-error {
  border-color: #dc2626;
  color: #dc2626;
}

/* ── Keyboard Hint ── */
.kbd-hint {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: monospace;
  margin-left: 6px;
}

/* ── Tooltip ── */
.tooltip-wrapper {
  position: relative;
}
.tooltip-wrapper .tooltip-text {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  z-index: 200;
  transition: opacity 0.15s ease;
  pointer-events: none;
}
.tooltip-wrapper:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

/* ── Footer ── */
.app-footer {
  border-top: 1px solid var(--border);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-secondary);
}
.app-footer .footer-stats {
  display: flex;
  gap: 16px;
}
.app-footer .footer-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Animations ── */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

/* ── Responsive ── */
@media (max-width: 768px) {
  .header { padding: 12px 16px; }
  .header-brand h1 { font-size: 18px; }
  .main { padding: 16px; }
  .form-row { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .nav-tab span { display: none; }
  .search-box { min-width: 140px; }
  .app-footer { flex-direction: column; gap: 8px; text-align: center; }
  .quick-actions { flex-direction: column; }
  .breadcrumb { font-size: 10px; }
  .detail-name { font-size: 18px; }
  .tree-controls { position: static; margin-bottom: 8px; }
}

@media (max-width: 480px) {
  .header { gap: 10px; }
  .header-actions { width: 100%; justify-content: space-between; }
  .search-box { flex: 1; min-width: 0; }
  .stats-grid { grid-template-columns: 1fr; }
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: #c4c9d4; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #a8adb8; }
`;

// ─── UTILITY COMPONENTS ──────────────────────────────────────

// Custom Confirm Dialog (replaces browser confirm/alert)
function ConfirmDialog({ title, message, confirmLabel = "Ya", cancelLabel = "Batal", onConfirm, onCancel, variant = "danger" }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onConfirm, onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-dialog" onClick={e => e.stopPropagation()} style={{ padding: "32px 24px" }}>
        <div className={`confirm-icon ${variant}`}>
          <Icon.Warning />
        </div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="btn" onClick={onCancel}>{cancelLabel} <span className="kbd-hint">Esc</span></button>
          <button className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{confirmLabel} <span className="kbd-hint">Enter</span></button>
        </div>
      </div>
    </div>
  );
}

// Tooltip wrapper
function Tooltip({ children, text }) {
  return (
    <div className="tooltip-wrapper">
      {children}
      <div className="tooltip-text">{text}</div>
    </div>
  );
}

// ─── COMPONENTS ──────────────────────────────────────────────

// Person Card (Tree & List)
function PersonCard({ person, onClick, selected, generation, people }) {
  const initials = person.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const age = FamilyEngine.getAge(person);
  const genColor = GENERATION_COLORS[generation % GENERATION_COLORS.length];
  const childCount = people ? FamilyEngine.getChildren(people, person.id).length : 0;

  return (
    <div className={`person-card ${person.gender} ${selected ? "selected" : ""}`} onClick={() => onClick(person)}>
      <div className="person-gen-dot" style={{ background: genColor }} title={`Generasi ${generation + 1}`} />
      <div className={`person-avatar ${person.gender}`}>
        {person.photo ? <img src={person.photo} alt={person.name} /> : initials}
      </div>
      <div className="person-name">{person.name}</div>
      <div className="person-meta">
        {person.birthDate && <>{new Date(person.birthDate).getFullYear()}</>}
        {person.deathDate && <> — {new Date(person.deathDate).getFullYear()}</>}
        {!person.deathDate && person.birthDate && <> — Kini</>}
        {age !== null && <> ({age} th)</>}
      </div>
      {person.birthPlace && <div className="person-meta" style={{ marginTop: 2 }}>{person.birthPlace}</div>}
      {childCount > 0 && (
        <div className="person-children-count">
          <Icon.UserPlus /> {childCount} anak
        </div>
      )}
    </div>
  );
}

// Tree Node (Recursive)
function TreeNode({ node, people, onSelect, selectedId }) {
  const spouse = node.spouse;
  const children = node.children || [];

  return (
    <div className="tree-node-wrapper">
      <div className="tree-couple">
        <PersonCard person={node} onClick={onSelect} selected={selectedId === node.id} generation={node.generation} people={people} />
        {spouse && (
          <>
            <div className="spouse-link" />
            <PersonCard person={spouse} onClick={onSelect} selected={selectedId === spouse.id} generation={node.generation} people={people} />
          </>
        )}
      </div>
      {children.length > 0 && (
        <>
          <div className="tree-connector" />
          <div className="tree-level">
            {children.map(child => (
              <TreeNode key={child.id} node={child} people={people} onSelect={onSelect} selectedId={selectedId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Tree View with Zoom
function TreeView({ people, onSelect, selectedId }) {
  const tree = useMemo(() => FamilyEngine.buildTree(people), [people]);
  const [zoom, setZoom] = useState(100);

  const zoomIn = () => setZoom(z => Math.min(z + 10, 150));
  const zoomOut = () => setZoom(z => Math.max(z - 10, 50));
  const zoomReset = () => setZoom(100);

  if (tree.length === 0) return (
    <div className="empty-state">
      <h3>Belum Ada Data Keluarga</h3>
      <p>Mulai dengan menambahkan anggota keluarga pertama</p>
    </div>
  );

  return (
    <div className="tree-wrapper">
      <div className="tree-controls">
        <Tooltip text="Perkecil (Zoom Out)">
          <button className="btn btn-icon" onClick={zoomOut} disabled={zoom <= 50}><Icon.ZoomOut /></button>
        </Tooltip>
        <div className="zoom-label">{zoom}%</div>
        <Tooltip text="Perbesar (Zoom In)">
          <button className="btn btn-icon" onClick={zoomIn} disabled={zoom >= 150}><Icon.ZoomIn /></button>
        </Tooltip>
        <Tooltip text="Reset Zoom">
          <button className="btn btn-icon" onClick={zoomReset}><Icon.ZoomReset /></button>
        </Tooltip>
      </div>
      <div className="tree-scalable" style={{ transform: `scale(${zoom / 100})` }}>
        <div className="tree-container">
          {tree.map(root => (
            <TreeNode key={root.id} node={root} people={people} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      </div>
    </div>
  );
}

// List View
function ListView({ people, onSelect, selectedId }) {
  const sorted = useMemo(() =>
    [...people].sort((a, b) => {
      const gA = FamilyEngine.getGeneration(people, a.id);
      const gB = FamilyEngine.getGeneration(people, b.id);
      return gA !== gB ? gA - gB : a.name.localeCompare(b.name);
    }), [people]);

  return (
    <div className="list-view">
      {sorted.map(p => {
        const gen = FamilyEngine.getGeneration(people, p.id);
        const age = FamilyEngine.getAge(p);
        const genColor = GENERATION_COLORS[gen % GENERATION_COLORS.length];
        const initials = p.name.split(" ").map(w => w[0]).join("").slice(0, 2);
        const childCount = FamilyEngine.getChildren(people, p.id).length;
        return (
          <div key={p.id} className="list-item" onClick={() => onSelect(p)} style={selectedId === p.id ? { borderColor: "var(--accent-gold)" } : {}}>
            <div className={`list-avatar ${p.gender}`}>
              {p.photo ? <img src={p.photo} alt={p.name} /> : initials}
            </div>
            <div className="list-info">
              <h4>{p.name}</h4>
              <p>
                {p.birthPlace || "—"} {p.birthDate ? `• ${new Date(p.birthDate).getFullYear()}` : ""} {age !== null ? `• ${age} tahun` : ""}
                {childCount > 0 ? ` • ${childCount} anak` : ""}
              </p>
            </div>
            <div className="list-badges">
              <span className="list-badge" style={{ background: genColor + "22", color: genColor, border: `1px solid ${genColor}44` }}>Gen {gen + 1}</span>
              {p.gender === GENDER.MALE
                ? <span className="list-badge" style={{ background: "var(--male-bg)", color: "var(--male-text)", border: "1px solid var(--male-border)" }}>L</span>
                : <span className="list-badge" style={{ background: "var(--female-bg)", color: "var(--female-text)", border: "1px solid var(--female-border)" }}>P</span>
              }
              {p.deathDate && <span className="list-badge" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" }}>Almarhum</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Stats View
function StatsView({ people }) {
  const stats = useMemo(() => FamilyEngine.getStats(people), [people]);

  const cards = [
    { label: "Total Anggota", value: stats.total, color: "var(--accent-blue)" },
    { label: "Laki-laki", value: stats.males, color: "var(--male-text)" },
    { label: "Perempuan", value: stats.females, color: "var(--female-text)" },
    { label: "Masih Hidup", value: stats.living, color: "var(--accent-green)" },
    { label: "Almarhum/ah", value: stats.deceased, color: "var(--text-muted)" },
    { label: "Generasi", value: stats.generations, color: "var(--accent-gold)" },
    { label: "Rata-rata Anak", value: stats.avgChildren, color: "var(--accent-purple)" },
    { label: "Tertua Hidup", value: stats.oldest ? FamilyEngine.getAge(stats.oldest) + " th" : "—", color: "var(--accent-rose)" },
  ];

  return (
    <div>
      <div className="stats-grid">
        {cards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
      {stats.total > 0 && (
        <div style={{ maxWidth: 400, margin: "24px auto 0" }}>
          <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", height: 8 }}>
            <div style={{ width: `${(stats.males / stats.total) * 100}%`, background: "var(--male-text)" }} />
            <div style={{ width: `${(stats.females / stats.total) * 100}%`, background: "var(--female-text)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            <span>Laki-laki {((stats.males / stats.total) * 100).toFixed(0)}%</span>
            <span>Perempuan {((stats.females / stats.total) * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
      {stats.oldest && (
        <div style={{ maxWidth: 400, margin: "20px auto 0", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>Anggota Tertua</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{stats.oldest.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{FamilyEngine.getAge(stats.oldest)} tahun</div>
        </div>
      )}
    </div>
  );
}

// Timeline View
function TimelineView({ people, onSelect }) {
  const events = useMemo(() => {
    const ev = [];
    people.forEach(p => {
      if (p.birthDate) ev.push({ date: p.birthDate, type: "birth", person: p, label: `Lahir: ${p.name}`, desc: p.birthPlace || "" });
      if (p.deathDate) ev.push({ date: p.deathDate, type: "death", person: p, label: `Wafat: ${p.name}`, desc: "" });
    });
    return ev.sort((a, b) => a.date.localeCompare(b.date));
  }, [people]);

  if (events.length === 0) return (
    <div className="empty-state">
      <h3>Belum Ada Peristiwa</h3>
      <p>Tambahkan tanggal lahir/wafat anggota keluarga untuk melihat timeline</p>
    </div>
  );

  return (
    <div className="timeline">
      {events.map((ev, i) => (
        <div key={i} className="timeline-item" onClick={() => onSelect(ev.person)}>
          <div className="timeline-dot" style={{ background: ev.type === "birth" ? "var(--accent-green)" : "var(--text-muted)" }} />
          <div className="timeline-year">{new Date(ev.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</div>
          <div className="timeline-title">{ev.label}</div>
          {ev.desc && <div className="timeline-desc">{ev.desc}</div>}
        </div>
      ))}
    </div>
  );
}

// Person Detail Modal
function PersonDetail({ person, people, onClose, onEdit, onDelete, onSelect, onAddChild, onAddSpouse }) {
  const parent = FamilyEngine.getParent(people, person);
  const spouse = FamilyEngine.getSpouse(people, person);
  const children = FamilyEngine.getChildren(people, person.id);
  const siblings = FamilyEngine.getSiblings(people, person);
  const age = FamilyEngine.getAge(person);
  const gen = FamilyEngine.getGeneration(people, person.id);
  const descendants = FamilyEngine.getDescendantCount(people, person.id);
  const initials = person.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const ancestorPath = FamilyEngine.getAncestorPath(people, person.id);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detail Anggota</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} title="Tutup (Esc)"><Icon.Close /></button>
        </div>
        <div className="detail-panel">
          <div className="detail-header">
            <div className={`detail-avatar ${person.gender}`}>
              {person.photo ? <img src={person.photo} alt={person.name} /> : initials}
            </div>
            <div className="detail-name">{person.name}</div>
            <div className="detail-subtitle">
              {person.gender === GENDER.MALE ? "Laki-laki" : "Perempuan"} • Generasi {gen + 1}
              {person.deathDate && " • Almarhum/ah"}
            </div>

            {/* Breadcrumb / Lineage Path */}
            {ancestorPath.length > 1 && (
              <div className="breadcrumb">
                {ancestorPath.map((ancestor, i) => (
                  <span key={ancestor.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {i > 0 && <span className="breadcrumb-sep"><Icon.ChevronRight /></span>}
                    <span
                      className={`breadcrumb-item ${ancestor.id === person.id ? "current" : ""}`}
                      onClick={() => { if (ancestor.id !== person.id) { onClose(); setTimeout(() => onSelect(ancestor), 100); } }}
                    >
                      {ancestor.name}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="btn btn-success btn-sm" onClick={() => onAddChild(person)}>
                <Icon.UserPlus /> Tambah Anak
              </button>
              {!spouse && (
                <button className="btn btn-rose btn-sm" onClick={() => onAddSpouse(person)}>
                  <Icon.HeartPlus /> Tambah Pasangan
                </button>
              )}
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Informasi Pribadi</div>
            {person.birthDate && <div className="detail-row"><span className="detail-row-label">Tanggal Lahir</span><span className="detail-row-value">{new Date(person.birthDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span></div>}
            {person.deathDate && <div className="detail-row"><span className="detail-row-label">Tanggal Wafat</span><span className="detail-row-value">{new Date(person.deathDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span></div>}
            {age !== null && <div className="detail-row"><span className="detail-row-label">Usia</span><span className="detail-row-value">{age} tahun</span></div>}
            {person.birthPlace && <div className="detail-row"><span className="detail-row-label">Tempat Lahir</span><span className="detail-row-value">{person.birthPlace}</span></div>}
            <div className="detail-row"><span className="detail-row-label">Total Keturunan</span><span className="detail-row-value">{descendants}</span></div>
            {person.notes && <div className="detail-row"><span className="detail-row-label">Catatan</span><span className="detail-row-value">{person.notes}</span></div>}
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Hubungan Keluarga</div>
            <div className="detail-relations">
              {parent && (
                <div className="detail-relation" onClick={() => { onClose(); setTimeout(() => onSelect(parent), 100); }}>
                  <span className="detail-relation-type">Orang Tua</span>
                  <span>{parent.name}</span>
                </div>
              )}
              {spouse && (
                <div className="detail-relation" onClick={() => { onClose(); setTimeout(() => onSelect(spouse), 100); }}>
                  <span className="detail-relation-type" style={{ color: "var(--accent-rose)" }}>Pasangan</span>
                  <span>{spouse.name}</span>
                </div>
              )}
              {siblings.map(s => (
                <div key={s.id} className="detail-relation" onClick={() => { onClose(); setTimeout(() => onSelect(s), 100); }}>
                  <span className="detail-relation-type" style={{ color: "var(--accent-purple)" }}>Saudara</span>
                  <span>{s.name}</span>
                </div>
              ))}
              {children.map(c => (
                <div key={c.id} className="detail-relation" onClick={() => { onClose(); setTimeout(() => onSelect(c), 100); }}>
                  <span className="detail-relation-type" style={{ color: "var(--accent-green)" }}>Anak</span>
                  <span>{c.name}</span>
                </div>
              ))}
              {!parent && !spouse && siblings.length === 0 && children.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 12 }}>Belum ada hubungan keluarga tercatat</div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(person.id)}><Icon.Trash /> Hapus</button>
          <button className="btn btn-primary btn-sm" onClick={() => onEdit(person)}><Icon.Edit /> Edit</button>
        </div>
      </div>
    </div>
  );
}

// Person Form Modal
function PersonForm({ person, people, onSave, onClose, prefill }) {
  const isEdit = !!person?.id;
  const [form, setForm] = useState({
    name: person?.name || prefill?.name || "",
    gender: person?.gender || prefill?.gender || GENDER.MALE,
    birthDate: person?.birthDate || prefill?.birthDate || "",
    deathDate: person?.deathDate || prefill?.deathDate || "",
    birthPlace: person?.birthPlace || prefill?.birthPlace || "",
    photo: person?.photo || prefill?.photo || "",
    notes: person?.notes || prefill?.notes || "",
    parentId: person?.parentId || prefill?.parentId || "",
    spouseId: person?.spouseId || prefill?.spouseId || "",
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Nama wajib diisi";
    if (form.deathDate && form.birthDate && form.deathDate < form.birthDate) errs.deathDate = "Tanggal wafat tidak boleh sebelum tanggal lahir";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (isEdit) {
      onSave({ ...person, ...form, parentId: form.parentId || null, spouseId: form.spouseId || null });
    } else {
      const newPerson = FamilyEngine.createPerson({ ...form, parentId: form.parentId || null, spouseId: form.spouseId || null });
      onSave(newPerson);
    }
    if (form.spouseId) {
      onSave(null, form.spouseId, isEdit ? person.id : null);
    }
    onClose();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const potentialParents = people.filter(p => !isEdit || p.id !== person?.id);
  const potentialSpouses = people.filter(p => (!isEdit || p.id !== person?.id) && !p.spouseId);

  const formTitle = isEdit ? "Edit Anggota" : (prefill?.parentId ? `Tambah Anak dari ${people.find(p => p.id === prefill.parentId)?.name || ""}` : prefill?.spouseId ? `Tambah Pasangan untuk ${people.find(p => p.id === prefill.spouseId)?.name || ""}` : "Tambah Anggota Baru");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{formTitle}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} title="Tutup (Esc)"><Icon.Close /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input className="form-input" placeholder="Masukkan nama lengkap" value={form.name} onChange={e => set("name", e.target.value)} autoFocus style={errors.name ? { borderColor: "#dc2626" } : {}} />
            {errors.name && <div className="form-hint" style={{ color: "#dc2626" }}>{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Jenis Kelamin</label>
            <div className="gender-toggle">
              <button className={`gender-btn ${form.gender === GENDER.MALE ? "active-male" : ""}`} onClick={() => set("gender", GENDER.MALE)}>
                <Icon.Male /> Laki-laki
              </button>
              <button className={`gender-btn ${form.gender === GENDER.FEMALE ? "active-female" : ""}`} onClick={() => set("gender", GENDER.FEMALE)}>
                <Icon.Female /> Perempuan
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal Lahir</label>
              <input className="form-input" type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Wafat</label>
              <input className="form-input" type="date" value={form.deathDate} onChange={e => set("deathDate", e.target.value)} style={errors.deathDate ? { borderColor: "#dc2626" } : {}} />
              {errors.deathDate && <div className="form-hint" style={{ color: "#dc2626" }}>{errors.deathDate}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tempat Lahir</label>
            <input className="form-input" placeholder="Kota / Daerah" value={form.birthPlace} onChange={e => set("birthPlace", e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">URL Foto</label>
            <input className="form-input" placeholder="https://contoh.com/foto.jpg" value={form.photo} onChange={e => set("photo", e.target.value)} />
            <div className="form-hint">Masukkan URL foto untuk ditampilkan di avatar</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Orang Tua (dari ayah/ibu)</label>
              <select className="form-select" value={form.parentId} onChange={e => set("parentId", e.target.value)}>
                <option value="">— Tidak ada / Root —</option>
                {potentialParents.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pasangan (Suami/Istri)</label>
              <select className="form-select" value={form.spouseId} onChange={e => set("spouseId", e.target.value)}>
                <option value="">— Belum ada —</option>
                {potentialSpouses.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea className="form-textarea" placeholder="Profesi, hobi, atau catatan lainnya..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? "Simpan Perubahan" : "Tambah Anggota"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Import/Export Modal
function ImportExportModal({ people, onImport, onClose, showToast }) {
  const [json, setJson] = useState("");
  const [tab, setTab] = useState("export");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleImport = () => {
    const data = FamilyEngine.importJSON(json);
    if (data) { onImport(data); onClose(); }
    else showToast("Format JSON tidak valid! Pastikan data sesuai format.", "error");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FamilyEngine.exportJSON(people));
      setCopied(true);
      showToast("Data berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Gagal menyalin. Silakan salin manual.", "warning");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([FamilyEngine.exportJSON(people)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `silsilah-keluarga-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("File JSON berhasil diunduh!");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import / Export Data</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} title="Tutup (Esc)"><Icon.Close /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className={`btn btn-sm ${tab === "export" ? "btn-primary" : ""}`} onClick={() => setTab("export")}>
              <Icon.Download /> Export
            </button>
            <button className={`btn btn-sm ${tab === "import" ? "btn-primary" : ""}`} onClick={() => setTab("import")}>
              <Icon.Upload /> Import
            </button>
          </div>
          {tab === "export" ? (
            <>
              <textarea className="form-textarea" style={{ minHeight: 200, fontFamily: "monospace", fontSize: 11 }} readOnly value={FamilyEngine.exportJSON(people)} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-sm" onClick={handleCopy}>
                  <Icon.Copy /> {copied ? "Tersalin!" : "Salin ke Clipboard"}
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleDownload}>
                  <Icon.Download /> Unduh File JSON
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                Data silsilah berisi {people.length} anggota keluarga.
              </p>
            </>
          ) : (
            <>
              <textarea className="form-textarea" style={{ minHeight: 200, fontFamily: "monospace", fontSize: 11 }} placeholder='Paste data JSON di sini...' value={json} onChange={e => setJson(e.target.value)} />
              <div className="form-hint" style={{ marginBottom: 12 }}>Tempelkan data JSON yang sudah di-export sebelumnya. Data lama akan diganti dengan data baru.</div>
              <button className="btn btn-primary btn-sm" onClick={handleImport} disabled={!json.trim()}>
                <Icon.Upload /> Import Data
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── APP (Main Container) ────────────────────────────────────
export default function App() {
  const [people, setPeople] = useState([]);
  const [view, setView] = useState(VIEWS.TREE);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const searchRef = useRef(null);

  // Load data
  useEffect(() => {
    (async () => {
      const data = await Storage.load();
      if (data && data.length > 0) {
        setPeople(data);
      } else {
        setPeople(DEMO_DATA);
        await Storage.save(DEMO_DATA);
      }
      setLoaded(true);
    })();
  }, []);

  // Save on change
  useEffect(() => {
    if (loaded && people.length > 0) Storage.save(people);
  }, [people, loaded]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+K or Ctrl+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Ctrl+N to add new person
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !showForm && !selectedPerson && !showImportExport) {
        e.preventDefault();
        setEditPerson(null);
        setFormPrefill(null);
        setShowForm(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showForm, selectedPerson, showImportExport]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = useCallback((person, linkSpouseId, linkToId) => {
    if (linkSpouseId && linkToId) {
      setPeople(prev => prev.map(p => p.id === linkSpouseId ? { ...p, spouseId: linkToId } : p));
      return;
    }
    if (!person) return;
    setPeople(prev => {
      const exists = prev.find(p => p.id === person.id);
      if (exists) {
        showToast(`${person.name} berhasil diperbarui`);
        return prev.map(p => p.id === person.id ? person : p);
      }
      showToast(`${person.name} berhasil ditambahkan`);
      return [...prev, person];
    });
  }, [showToast]);

  const handleDelete = useCallback((id) => {
    const person = people.find(p => p.id === id);
    const children = FamilyEngine.getChildren(people, id);
    if (children.length > 0) {
      setConfirmDialog({
        title: "Tidak Bisa Menghapus",
        message: `${person.name} masih memiliki ${children.length} anak di silsilah. Hapus anak-anaknya terlebih dahulu sebelum menghapus ${person.name}.`,
        confirmLabel: "Mengerti",
        cancelLabel: null,
        variant: "warning",
        onConfirm: () => setConfirmDialog(null),
        onCancel: () => setConfirmDialog(null),
      });
      return;
    }
    setConfirmDialog({
      title: "Hapus Anggota?",
      message: `Yakin ingin menghapus ${person.name} dari silsilah keluarga? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: "Ya, Hapus",
      cancelLabel: "Batal",
      variant: "danger",
      onConfirm: () => {
        setPeople(prev => prev
          .filter(p => p.id !== id)
          .map(p => p.spouseId === id ? { ...p, spouseId: null } : p)
        );
        setSelectedPerson(null);
        setConfirmDialog(null);
        showToast(`${person.name} berhasil dihapus`);
      },
      onCancel: () => setConfirmDialog(null),
    });
  }, [people, showToast]);

  const handleReset = useCallback(() => {
    setConfirmDialog({
      title: "Reset Data?",
      message: "Semua perubahan akan hilang dan data akan dikembalikan ke data awal keluarga Syachroel. Pastikan Anda sudah meng-export data jika diperlukan.",
      confirmLabel: "Ya, Reset",
      cancelLabel: "Batal",
      variant: "danger",
      onConfirm: () => {
        setPeople(DEMO_DATA);
        Storage.save(DEMO_DATA);
        setConfirmDialog(null);
        showToast("Data berhasil direset ke data awal");
      },
      onCancel: () => setConfirmDialog(null),
    });
  }, [showToast]);

  const handleAddChild = useCallback((parent) => {
    setSelectedPerson(null);
    setEditPerson(null);
    setFormPrefill({ parentId: parent.id });
    setShowForm(true);
  }, []);

  const handleAddSpouse = useCallback((person) => {
    setSelectedPerson(null);
    setEditPerson(null);
    setFormPrefill({
      spouseId: person.id,
      gender: person.gender === GENDER.MALE ? GENDER.FEMALE : GENDER.MALE,
    });
    setShowForm(true);
  }, []);

  const filteredPeople = useMemo(() => FamilyEngine.search(people, search), [people, search]);
  const viewData = search ? filteredPeople : people;
  const stats = useMemo(() => FamilyEngine.getStats(people), [people]);

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            <h1>Silsilah Keluarga Syachroel</h1>
            <span className="badge">v2.0</span>
          </div>

          <nav className="nav-tabs">
            {[
              { id: VIEWS.TREE, icon: <Icon.Tree />, label: "Pohon" },
              { id: VIEWS.LIST, icon: <Icon.List />, label: "Daftar", count: people.length },
              { id: VIEWS.STATS, icon: <Icon.Chart />, label: "Statistik" },
              { id: VIEWS.TIMELINE, icon: <Icon.Clock />, label: "Timeline" },
            ].map(t => (
              <button key={t.id} className={`nav-tab ${view === t.id ? "active" : ""}`} onClick={() => setView(t.id)}>
                {t.icon}<span>{t.label}</span>
                {t.count != null && <span className="nav-count">{t.count}</span>}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <div className="search-box">
              <Icon.Search />
              <input ref={searchRef} placeholder="Cari anggota... (Ctrl+K)" value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <>
                  <span className="search-count">{filteredPeople.length} hasil</span>
                  <button className="btn btn-icon btn-ghost" style={{ width: 20, height: 20, padding: 0 }} onClick={() => setSearch("")} title="Hapus pencarian">
                    <Icon.Close />
                  </button>
                </>
              )}
            </div>
            <Tooltip text="Import / Export Data">
              <button className="btn" onClick={() => setShowImportExport(true)}>
                <Icon.Download /> <span>Data</span>
              </button>
            </Tooltip>
            <Tooltip text="Reset ke data awal">
              <button className="btn btn-sm" onClick={handleReset}>Reset</button>
            </Tooltip>
            <Tooltip text="Tambah anggota baru (Ctrl+N)">
              <button className="btn btn-primary" onClick={() => { setEditPerson(null); setFormPrefill(null); setShowForm(true); }}>
                <Icon.Plus /> Tambah
              </button>
            </Tooltip>
          </div>
        </header>

        {/* Search Results Banner */}
        {search && (
          <div style={{ padding: "8px 24px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon.Search />
            Menampilkan <strong>{filteredPeople.length}</strong> dari <strong>{people.length}</strong> anggota untuk pencarian "<strong>{search}</strong>"
            {filteredPeople.length === 0 && <span style={{ color: "var(--accent-gold)", marginLeft: 8 }}>— Coba kata kunci lain</span>}
          </div>
        )}

        {/* Main Content */}
        <main className="main">
          {view === VIEWS.TREE && <TreeView people={viewData} onSelect={setSelectedPerson} selectedId={selectedPerson?.id} />}
          {view === VIEWS.LIST && <ListView people={viewData} onSelect={setSelectedPerson} selectedId={selectedPerson?.id} />}
          {view === VIEWS.STATS && <StatsView people={viewData} />}
          {view === VIEWS.TIMELINE && <TimelineView people={viewData} onSelect={setSelectedPerson} />}
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-stats">
            <span className="footer-stat"><Icon.User /> {stats.total} anggota</span>
            <span className="footer-stat"><Icon.Male /> {stats.males} laki-laki</span>
            <span className="footer-stat"><Icon.Female /> {stats.females} perempuan</span>
            <span className="footer-stat">{stats.generations} generasi</span>
          </div>
          <span>Silsilah Keluarga HM Syachroel AP</span>
        </footer>

        {/* Modals */}
        {selectedPerson && (
          <PersonDetail
            person={selectedPerson}
            people={people}
            onClose={() => setSelectedPerson(null)}
            onEdit={(p) => { setSelectedPerson(null); setEditPerson(p); setFormPrefill(null); setShowForm(true); }}
            onDelete={handleDelete}
            onSelect={setSelectedPerson}
            onAddChild={handleAddChild}
            onAddSpouse={handleAddSpouse}
          />
        )}

        {showForm && (
          <PersonForm
            person={editPerson}
            people={people}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditPerson(null); setFormPrefill(null); }}
            prefill={formPrefill}
          />
        )}

        {showImportExport && (
          <ImportExportModal
            people={people}
            onImport={(data) => { setPeople(data); showToast("Data berhasil diimport"); }}
            onClose={() => setShowImportExport(false)}
            showToast={showToast}
          />
        )}

        {/* Confirm Dialog */}
        {confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={confirmDialog.confirmLabel}
            cancelLabel={confirmDialog.cancelLabel}
            onConfirm={confirmDialog.onConfirm}
            onCancel={confirmDialog.onCancel}
            variant={confirmDialog.variant}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className="toast-container">
            <div className={`toast ${toast.type === "warning" ? "toast-warning" : toast.type === "error" ? "toast-error" : ""}`}>
              {toast.msg}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
