import { useEditorState } from '../src/useEditorState';
import { useSymbolDrag } from '../src/useSymbolDrag';
import { addSymbol } from '@wallysonruan/signmaker-editor-engine';

let counter = 0;
const idGen = () => `id${++counter}`;

beforeEach(() => {
  counter = 0;
});

describe('useSymbolDrag', () => {
  function setup() {
    const editorState = useEditorState();
    const drag = useSymbolDrag(
      () => editorState.state.value,
      editorState.replaceState,
      editorState.dispatch,
    );
    return { editorState, drag };
  }

  test('isDragging starts false', () => {
    const { drag } = setup();
    expect(drag.isDragging.value).toBe(false);
  });

  test('onPointerDown sets isDragging true, calls replaceState (selection changes)', () => {
    const { editorState, drag } = setup();
    // Add a symbol first
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));
    const symbolId = editorState.state.value.symbols[0].id;

    drag.onPointerDown(symbolId, 50, 60);

    expect(drag.isDragging.value).toBe(true);
    // Symbol should be selected
    expect(editorState.state.value.selection.has(symbolId)).toBe(true);
  });

  test('onPointerMove updates drag delta', () => {
    const { editorState, drag } = setup();
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));
    const symbolId = editorState.state.value.symbols[0].id;

    drag.onPointerDown(symbolId, 50, 60);
    drag.onPointerMove(60, 75);

    // isDragging should still be true
    expect(drag.isDragging.value).toBe(true);
    // We can't directly inspect activeDrag, but we can verify state after up
  });

  test('onPointerUp dispatches command with endDrag, isDragging becomes false', () => {
    const { editorState, drag } = setup();
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));
    const symbolId = editorState.state.value.symbols[0].id;

    drag.onPointerDown(symbolId, 50, 60);
    drag.onPointerMove(60, 75); // delta: +10, +15

    drag.onPointerUp();

    expect(drag.isDragging.value).toBe(false);
    // The symbol position should have been updated by endDrag
    const sym = editorState.state.value.symbols[0];
    expect(sym.x).toBe(110); // 100 + 10
    expect(sym.y).toBe(215); // 200 + 15
  });

  test('onPointerCancel resets drag, isDragging false', () => {
    const { editorState, drag } = setup();
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));
    const symbolId = editorState.state.value.symbols[0].id;

    drag.onPointerDown(symbolId, 50, 60);
    drag.onPointerMove(70, 80);

    const stateBefore = editorState.state.value;
    drag.onPointerCancel();

    expect(drag.isDragging.value).toBe(false);
    // cancelDrag returns editorState unchanged, so symbol position stays same
    const sym = editorState.state.value.symbols[0];
    expect(sym.x).toBe(stateBefore.symbols[0].x);
    expect(sym.y).toBe(stateBefore.symbols[0].y);
  });
});
