/**
 * I18N — minimal in-process localisation.
 *
 * Two roles:
 *   1. A subsystem registered with the engine (`engine.add(I18nSystem)`), so it
 *      shows up in `ctx.get('i18n')` like everything else.
 *   2. A pure-function facade (`import { t, setLocale, getLocale } from '...'`).
 *
 * Designed for the constraint set in ARCHITECTURE.md:
 *   - Strings are loaded **statically** (no async fetch). The game runs fully
 *     offline and a missing translation must never hang a frame.
 *   - The English locale is the **fallback**. A missing key in any other
 *     locale returns the English string, never throws.
 *   - Locale is resolved once at boot from:
 *         1) `?lang=` URL parameter (forces a value)
 *         2) `localStorage.minimax.lang` (user preference, persistent)
 *         3) navigator.language (best-effort browser hint)
 *         4) DEFAULT_LOCALE
 *     `setLocale()` writes through to localStorage and emits `i18n:change` on
 *     the event bus so live HUD/menus re-render.
 *
 * The default locale is `ko`. Most of the user base reads Korean; English is
 * exposed as a toggle in the pause menu.
 */

import { ko } from './locales/ko.js';
import { en } from './locales/en.js';

export const SUPPORTED_LOCALES = ['ko', 'en'];
export const DEFAULT_LOCALE = 'ko';

const TABLES = { ko, en };
const FALLBACK = en;

let _locale = DEFAULT_LOCALE;
const _subs = new Set();

function resolveLocale() {
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const fromUrl = params.get('lang');
  if (fromUrl && SUPPORTED_LOCALES.includes(fromUrl)) return fromUrl;

  try {
    const stored = localStorage.getItem('minimax.lang');
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch {
    /* private mode etc. — ignore */
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith('ko')) return 'ko';
    if (nav.startsWith('en')) return 'en';
  }

  return DEFAULT_LOCALE;
}

/**
 * Translation lookup.
 *
 *   t('menu.paused')                    // → "일시정지" / "Paused"
 *   t('xp.headshot', { xp: 150 })        // → "+150 XP · 헤드샷" / ...
 *   t('imaginary.key', 'fallback text')  // → "fallback text"
 *
 * Returns the key itself if both the active locale and the English fallback
 * are missing it (better than throwing during render).
 */
export function t(key, params) {
  const active = TABLES[_locale]?.[key];
  const value = active ?? FALLBACK[key] ?? key;
  if (typeof value !== 'string') return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : m
  );
}

/** Switch the active locale. Safe to call any time after init(). */
export function setLocale(loc) {
  if (!SUPPORTED_LOCALES.includes(loc)) return;
  if (loc === _locale) return;
  _locale = loc;
  try { localStorage.setItem('minimax.lang', loc); } catch { /* ignore */ }
  for (const fn of _subs) {
    try { fn(loc); } catch (e) { console.warn('[i18n] subscriber error', e); }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('i18n:change', { detail: { locale: loc } }));
  }
}

export function getLocale() { return _locale; }
export function onLocaleChange(fn) { _subs.add(fn); return () => _subs.delete(fn); }

/**
 * Subsystem wrapper. Engine calls `init(ctx)` and stores nothing back here —
 * other systems pick translations off the module-level `t()` export. We
 * exist only so the dev console and registry list show "i18n" cleanly.
 */
export class I18nSystem {
  static id = 'i18n';
  static deps = [];

  init() {
    _locale = resolveLocale();
    // Mirror to storage so other tabs / reloads agree.
    try { localStorage.setItem('minimax.lang', _locale); } catch { /* ignore */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = _locale;
    }
    if (typeof window !== 'undefined') {
      window.__I18N__ = { t, setLocale, getLocale, SUPPORTED_LOCALES };
    }
    return this;
  }

  dispose() {
    _subs.clear();
  }
}
