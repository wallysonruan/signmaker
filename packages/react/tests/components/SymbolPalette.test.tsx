import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@signwriter/renderer', () => ({
  renderSymbol: (key: string) => `<svg data-key="${key}"></svg>`,
}));

jest.mock('../../src/data/alphabet', () => ({
  GROUPS: ['S10000', 'S20500'],
  ALPHABET: {
    S10000: ['S10000', 'S10110'],
    S20500: ['S20500'],
  },
}));

import { SymbolPalette } from '../../src/components/SymbolPalette';

describe('SymbolPalette', () => {
  it('renders group grid at level 0', () => {
    render(<SymbolPalette onAddSymbol={jest.fn()} />);
    expect(screen.getByText('Symbol Groups')).toBeTruthy();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('navigates to base level on group click', () => {
    render(<SymbolPalette onAddSymbol={jest.fn()} />);
    const groupButtons = screen.getAllByRole('button');
    fireEvent.click(groupButtons[0]);
    expect(screen.getByText('← Groups')).toBeTruthy();
  });

  it('goes back to group level from base level', () => {
    render(<SymbolPalette onAddSymbol={jest.fn()} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByText('← Groups'));
    expect(screen.getByText('Symbol Groups')).toBeTruthy();
  });

  it('navigates to variant level on base symbol click', () => {
    render(<SymbolPalette onAddSymbol={jest.fn()} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const baseButtons = screen.getAllByRole('button').filter((b) => b.textContent !== '← Groups');
    fireEvent.click(baseButtons[0]);
    expect(screen.getByText('← Base')).toBeTruthy();
    expect(screen.getByText('0–7')).toBeTruthy();
    expect(screen.getByText('8–f')).toBeTruthy();
  });

  it('calls onAddSymbol when a variant is clicked', () => {
    const onAddSymbol = jest.fn();
    render(<SymbolPalette onAddSymbol={onAddSymbol} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const baseButtons = screen.getAllByRole('button').filter((b) => b.textContent !== '← Groups');
    fireEvent.click(baseButtons[0]);
    const variantButtons = screen.getAllByRole('button').filter(
      (b) => b.textContent !== '← Base' && b.textContent !== '0–7' && b.textContent !== '8–f',
    );
    fireEvent.click(variantButtons[0]);
    expect(onAddSymbol).toHaveBeenCalledTimes(1);
  });

  it('sets dataTransfer on drag start', () => {
    render(<SymbolPalette onAddSymbol={jest.fn()} />);
    const groupButtons = screen.getAllByRole('button');
    const dataTransfer = { setData: jest.fn(), effectAllowed: '' };
    fireEvent.dragStart(groupButtons[0], { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', expect.any(String));
  });
});
