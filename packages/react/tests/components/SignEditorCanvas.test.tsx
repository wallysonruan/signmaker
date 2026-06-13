import { render, fireEvent } from '@testing-library/react';

jest.mock('@signwriter/renderer', () => ({
  renderSymbol: (key: string) => `<svg data-key="${key}"></svg>`,
  getSymbolSize: () => ({ width: 40, height: 40 }),
}));

import { SignEditorCanvas } from '../../src/components/SignEditorCanvas';
import { EMPTY_STATE } from '@signwriter/editor';
import type { EditorState } from '@signwriter/editor';

describe('SignEditorCanvas', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SignEditorCanvas state={EMPTY_STATE} dispatch={jest.fn()} replaceState={jest.fn()} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders one element per symbol', () => {
    const state: EditorState = {
      ...EMPTY_STATE,
      symbols: [
        { id: 'sym1', key: 'S10000', x: 500, y: 500 },
        { id: 'sym2', key: 'S20500', x: 550, y: 550 },
      ],
    };
    const { container } = render(
      <SignEditorCanvas state={state} dispatch={jest.fn()} replaceState={jest.fn()} />,
    );
    const svgs = container.querySelectorAll('svg[data-key]');
    expect(svgs.length).toBe(2);
  });

  it('calls dispatch on canvas click to deselect', () => {
    const dispatch = jest.fn();
    const { container } = render(
      <SignEditorCanvas state={EMPTY_STATE} dispatch={dispatch} replaceState={jest.fn()} />,
    );
    fireEvent.click(container.firstChild as Element);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('prevents default on dragover', () => {
    const { container } = render(
      <SignEditorCanvas state={EMPTY_STATE} dispatch={jest.fn()} replaceState={jest.fn()} />,
    );
    const event = new Event('dragover', { bubbles: true, cancelable: true });
    container.firstChild!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
