import {
  EMPTY_STATE,
  createHistory,
  apply,
  canUndo as _canUndo,
  canRedo as _canRedo,
  undo as _undo,
  redo as _redo,
  lookupAction,
  actionToCommand,
  DEFAULT_BINDINGS,
  startDrag,
  updateDrag,
  endDrag,
  cancelDrag,
} from '@signwriter/editor';
import type { Command, EditorState, History, DragState } from '@signwriter/editor';

const PREVENT_DEFAULT_KEYS = new Set([8, 9, 191]);

/**
 * `<sign-editor>` — a framework-independent custom element that wraps the
 * SignWriter editor state machine.
 *
 * Usage:
 * ```html
 * <sign-editor tabindex="0"></sign-editor>
 * ```
 *
 * ```typescript
 * import { define } from '@signwriter/web-components';
 * define();
 *
 * const el = document.querySelector('sign-editor') as SignEditorElement;
 * el.addEventListener('statechange', (e) => console.log(e.detail.state));
 * el.dispatch(addSymbol('S14c20', 500, 500, idGen));
 * ```
 */
export class SignEditorElement extends HTMLElement {
  private _history: History = createHistory(EMPTY_STATE);
  private _drag: DragState | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _removeKeyboard: (() => void) | null = null;

  connectedCallback(): void {
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    this._removeKeyboard = this._attachKeyboard();
  }

  disconnectedCallback(): void {
    this._removeKeyboard?.();
    this._removeKeyboard = null;
  }

  // ── State accessors ─────────────────────────────────────────────────────────

  /** Current editor state (immutable snapshot). */
  get state(): EditorState {
    return this._history.present;
  }

  /** True when there is at least one state to undo to. */
  get canUndo(): boolean {
    return _canUndo(this._history);
  }

  /** True when there is at least one state to redo to. */
  get canRedo(): boolean {
    return _canRedo(this._history);
  }

  // ── Command API ─────────────────────────────────────────────────────────────

  /**
   * Apply a command to the present state and push it onto the undo stack.
   * Fires a `statechange` event with the new state.
   */
  dispatch(command: Command): void {
    this._history = apply(this._history, command);
    this._emitStateChange();
  }

  /**
   * Replace the present state without creating a history entry.
   * Used for transient UI changes (e.g. drag start selection) that should not
   * produce a separate undo step.
   */
  replaceState(state: EditorState): void {
    this._history = { ...this._history, present: state };
    this._emitStateChange();
  }

  /** Undo the last dispatched command. No-op when canUndo is false. */
  undo(): void {
    this._history = _undo(this._history);
    this._emitStateChange();
  }

  /** Redo the last undone command. No-op when canRedo is false. */
  redo(): void {
    this._history = _redo(this._history);
    this._emitStateChange();
  }

  // ── Drag API ────────────────────────────────────────────────────────────────

  /**
   * Begin dragging a symbol. Selects the symbol via replaceState (no history
   * entry). Call from a pointerdown handler.
   */
  startSymbolDrag(symbolId: string, clientX: number, clientY: number): void {
    const { editorState, drag } = startDrag(this.state, symbolId);
    this._drag = drag;
    this._dragStartX = clientX;
    this._dragStartY = clientY;
    this.replaceState(editorState);
  }

  /**
   * Update the in-flight drag delta. Call from a pointermove handler.
   * Does not modify state until endSymbolDrag is called.
   */
  moveSymbolDrag(clientX: number, clientY: number): void {
    if (!this._drag) return;
    const deltaX = clientX - this._dragStartX;
    const deltaY = clientY - this._dragStartY;
    this._drag = updateDrag(this._drag, deltaX, deltaY);
  }

  /**
   * Commit the drag delta as a dispatch (creates a history entry).
   * Call from a pointerup handler.
   */
  endSymbolDrag(): void {
    if (!this._drag) return;
    const drag = this._drag;
    this._drag = null;
    this.dispatch((state: EditorState) => endDrag(state, drag));
  }

  /**
   * Cancel the drag, restoring the symbol to its pre-drag position.
   * Call from a pointercancel handler.
   */
  cancelSymbolDrag(): void {
    if (!this._drag) return;
    this._drag = null;
    this.replaceState(cancelDrag(this.state));
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _emitStateChange(): void {
    this.dispatchEvent(
      new CustomEvent('statechange', {
        detail: { state: this.state },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _attachKeyboard(): () => void {
    const onKeyDown = (event: Event): void => {
      const e = event as KeyboardEvent;

      const target = e.target as HTMLElement | null;
      if (target && target.tagName) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
      }

      const action = lookupAction(DEFAULT_BINDINGS, e.keyCode, e.shiftKey, e.ctrlKey);
      if (action === null) return;

      if (PREVENT_DEFAULT_KEYS.has(e.keyCode)) {
        e.preventDefault();
      }

      if (action === 'undo') { this.undo(); return; }
      if (action === 'redo') { this.redo(); return; }

      const command = actionToCommand(action);
      if (command) {
        this.dispatch(command);
      }
    };

    this.addEventListener('keydown', onKeyDown);
    return () => this.removeEventListener('keydown', onKeyDown);
  }
}

/**
 * Register the `SignEditorElement` with the custom elements registry.
 * Safe to call multiple times — skips registration if already registered.
 *
 * @param tagName Custom element tag name (default: `'sign-editor'`)
 */
export function define(tagName = 'sign-editor'): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, SignEditorElement);
  }
}
