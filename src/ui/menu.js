import { el, setText, setStyle, clamp, damp, ease } from './util.js';
import { t, setLocale, getLocale, onLocaleChange, SUPPORTED_LOCALES } from '../i18n/index.js';

const PRESETS = ['low', 'medium', 'high', 'ultra'];

/**
 * Pause / settings menu.
 *
 * Wired straight into `ctx.config`: the quality segments call
 * `config.setQuality`, the sliders write `config.sensitivity` and `config.fov`
 * (and push the FOV into the live camera), and every change is announced on the
 * event bus so render/player can react without importing this module.
 *
 * Events emitted: `ui:pause` {paused}, `ui:quality` {quality},
 * `ui:sensitivity` {value}, `ui:fov` {value}, `ui:setting` {key, value}.
 */
export class PauseMenu {
  constructor(parent, ctx) {
    this.ctx = ctx;
    this.root = el('div', 'ow-menu', parent);
    const inner = el('div', 'ow-menu-inner', this.root);

    const h = el('h1', null, inner, '');
    h.textContent = 'PAUSED';
    el('div', 'sub', inner, 'OVERWATCH — TACTICAL OPERATIONS');
    el('div', 'rule', inner);

    this.rows = el('div', null, inner);

    // ---- quality preset --------------------------------------------------
    this.qBtns = [];
    const qRow = this._row(t('menu.graphics'));
    const seg = el('div', 'ow-seg', qRow);
    for (const p of PRESETS) {
      const b = el('button', null, seg, '');
      b.type = 'button';
      b.addEventListener('click', () => this.setQuality(p));
      this.qBtns.push(b);
    }

    // ---- sensitivity -----------------------------------------------------
    this.sens = this._slider(t('menu.sensitivity'), 0.2, 3.0, 0.01, (v) => {
      this.ctx.config.sensitivity = 0.0022 * v;
      this.ctx.events.emit('ui:sensitivity', { value: this.ctx.config.sensitivity, multiplier: v });
      return v.toFixed(2);
    });

    // ---- field of view ---------------------------------------------------
    this.fov = this._slider(t('menu.fov'), 65, 120, 1, (v) => {
      this.ctx.config.fov = v;
      const cam = this.ctx.camera;
      if (cam) {
        cam.fov = v;
        cam.updateProjectionMatrix();
      }
      this.ctx.events.emit('ui:fov', { value: v });
      return String(v | 0);
    });

    // ---- invert look -----------------------------------------------------
    const invRow = this._row(t('menu.invertLook'));
    const invSeg = el('div', 'ow-seg', invRow);
    this.invBtns = [];
    for (const [label, val] of [
      [t('menu.off'), false],
      [t('menu.on'), true],
    ]) {
      const b = el('button', null, invSeg, label);
      b.type = 'button';
      b.addEventListener('click', () => {
        this.ctx.config.invertY = val;
        this.ctx.events.emit('ui:setting', { key: 'invertY', value: val });
        this.syncFromConfig();
      });
      this.invBtns.push([b, val]);
    }

    // ---- language toggle (한↔영) ---------------------------------------------
    const langRow = this._row(t('menu.language'));
    const langSeg = el('div', 'ow-seg', langRow);
    this.langBtns = [];
    for (const loc of SUPPORTED_LOCALES) {
      const lbl = loc === 'ko' ? '한국어' : 'English';
      const b = el('button', null, langSeg, lbl);
      b.type = 'button';
      b.addEventListener('click', () => {
        setLocale(loc);
        // Live re-render of every row label below.
        this.paintMenu();
        this.syncFromConfig();
      });
      this.langBtns.push([b, loc]);
    }

    // ---- buttons ---------------------------------------------------------
    const btns = el('div', 'ow-btns', inner);
    this.resumeBtn = el('button', 'ow-btn primary', btns, t('menu.resume'));
    this.resumeBtn.type = 'button';
    this.resumeBtn.addEventListener('click', () => this.close());
    const reset = el('button', 'ow-btn', btns, t('menu.defaults'));
    reset.type = 'button';
    this._defaultsBtn = reset;
    reset.addEventListener('click', () => {
      this.sens.set(1);
      this.fov.set(80);
      this.ctx.config.invertY = false;
      this.setQuality('ultra');
    });
    this._hintEl = el('div', 'hint', inner, t('menu.hint'));

    this.open = false;
    this.shown = 0;
    setStyle(this.root, 'display', 'none');
    setStyle(this.root, 'cursor', 'default');
    this.syncFromConfig();

    // Any future setLocale() — from any system, this tab, or another tab —
    // re-paints the visible labels so the toggle is bidirectional without a
    // reload.
    this._unsubLocale = onLocaleChange(() => this.paintMenu());
  }

  /**
   * Refresh every text node we've already created, after the active locale
   * changed. Cheap: walks a small set of DOM refs collected during build.
   * Anything that *itself* updates on a timer (preset/invert highlight)
   * lives in `syncFromConfig` and keeps working unchanged.
   */
  paintMenu() {
    if (!this._refs) return;
    for (const [el, key] of this._refs) setText(el, t(key));
    // Slider labels were created inline during _slider() so rebuild them via
    // the recorded keys.
    if (this._rowKeys) {
      const names = this.rows.querySelectorAll('.ow-row .name');
      const keys = ['menu.graphics', 'menu.sensitivity', 'menu.fov', 'menu.invertLook', 'menu.language'];
      for (let i = 0; i < names.length && i < keys.length; i++) {
        setText(names[i], t(keys[i]).toUpperCase());
      }
    }
    if (this._hintEl) setText(this._hintEl, t('menu.hint'));
    if (this.resumeBtn) setText(this.resumeBtn, t('menu.resume'));
    if (this._defaultsBtn) setText(this._defaultsBtn, t('menu.defaults'));
  }

  _row(name) {
    const r = el('div', 'ow-row', this.rows);
    el('div', 'name', r, name.toUpperCase());
    return r;
  }

  _slider(name, min, max, step, apply) {
    const row = this._row(name);
    const wrap = el('div', 'ow-slider', row);
    el('div', 'track', wrap);
    const fill = el('div', 'fill', wrap);
    const knob = el('div', 'knob', wrap);
    const input = el('input', null, wrap);
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    const val = el('div', 'val', row, '');

    const paint = (v) => {
      const t = (v - min) / (max - min);
      setStyle(fill, 'width', (t * 100).toFixed(2) + '%');
      setStyle(knob, 'left', (t * 100).toFixed(2) + '%');
      setText(val, apply(v) ?? String(v));
    };
    input.addEventListener('input', () => paint(parseFloat(input.value)));
    const api = {
      set: (v) => {
        const c = clamp(v, min, max);
        input.value = String(c);
        paint(c);
      },
    };
    return api;
  }

  setQuality(name) {
    try {
      this.ctx.config.setQuality(name);
      this.ctx.events.emit('ui:quality', { quality: name });
    } catch (err) {
      console.warn('[ui] quality switch failed', err);
    }
    this.syncFromConfig();
  }

  syncFromConfig() {
    const cfg = this.ctx.config;
    for (let i = 0; i < this.qBtns.length; i++) {
      this.qBtns[i].classList.toggle('on', PRESETS[i] === cfg.quality);
      // Buttons were created with empty textContent so we could defer
      // localisation; paint from the active locale each sync.
      this.qBtns[i].textContent = t('quality.' + PRESETS[i]);
    }
    for (const [b, v] of this.invBtns) b.classList.toggle('on', !!cfg.invertY === v);
    if (this.langBtns) {
      const cur = getLocale();
      for (const [b, loc] of this.langBtns) b.classList.toggle('on', loc === cur);
    }
    this.sens?.set((cfg.sensitivity ?? 0.0022) / 0.0022);
    this.fov?.set(cfg.fov ?? 80);
  }

  toggle() {
    this.open ? this.close() : this.show();
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.syncFromConfig();
    setStyle(this.root, 'display', '');
    document.exitPointerLock?.();
    const t = this.ctx.time;
    if (t) {
      this._prevScale = t.scale;
      t.scale = 0;
    }
    this.ctx.peek('player')?.setControlEnabled?.(false);
    this.ctx.events.emit('ui:pause', { paused: true });
  }

  close() {
    if (!this.open) return;
    this.open = false;
    const t = this.ctx.time;
    if (t) t.scale = this._prevScale ?? 1;
    this.ctx.peek('player')?.setControlEnabled?.(true);
    this.ctx.input?.requestPointerLock?.();
    this.ctx.events.emit('ui:pause', { paused: false });
  }

  /** Driven with unscaled time so the fade still runs while the game is frozen. */
  update(rawDt) {
    this.shown = damp(this.shown, this.open ? 1 : 0, 14, rawDt);
    if (this.shown < 0.004) {
      setStyle(this.root, 'display', 'none');
      setStyle(this.root, 'pointer-events', 'none');
      return;
    }
    setStyle(this.root, 'display', '');
    setStyle(this.root, 'pointer-events', this.open ? 'auto' : 'none');
    setStyle(this.root, 'opacity', ease.outQuad(this.shown).toFixed(3));
  }

  dispose() {
    this._unsubLocale?.();
    this.root.remove();
  }
}
