import { render, screen, fireEvent } from '@testing-library/react';
import { FswPanel } from '../../src/components/FswPanel';

describe('FswPanel', () => {
  it('displays the fsw prop', () => {
    render(<FswPanel fsw="AS14c20M518x529S14c20481x471" onLoadFsw={jest.fn()} />);
    expect(screen.getByText('AS14c20M518x529S14c20481x471')).toBeTruthy();
  });

  it('shows (empty) when fsw is empty string', () => {
    render(<FswPanel fsw="" onLoadFsw={jest.fn()} />);
    expect(screen.getByText('(empty)')).toBeTruthy();
  });

  it('calls onLoadFsw when Load button is clicked', () => {
    const onLoadFsw = jest.fn();
    render(<FswPanel fsw="" onLoadFsw={onLoadFsw} />);
    const input = screen.getByPlaceholderText('Paste FSW to load a sign…');
    fireEvent.change(input, { target: { value: 'AS14c20M500x500' } });
    fireEvent.click(screen.getByText('Load'));
    expect(onLoadFsw).toHaveBeenCalledWith('AS14c20M500x500');
  });

  it('calls onLoadFsw when Enter is pressed', () => {
    const onLoadFsw = jest.fn();
    render(<FswPanel fsw="" onLoadFsw={onLoadFsw} />);
    const input = screen.getByPlaceholderText('Paste FSW to load a sign…');
    fireEvent.change(input, { target: { value: 'AS14c20M500x500' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onLoadFsw).toHaveBeenCalledWith('AS14c20M500x500');
  });

  it('clears input after loading', () => {
    const onLoadFsw = jest.fn();
    render(<FswPanel fsw="" onLoadFsw={onLoadFsw} />);
    const input = screen.getByPlaceholderText('Paste FSW to load a sign…') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'AS14c20M500x500' } });
    fireEvent.click(screen.getByText('Load'));
    expect(input.value).toBe('');
  });

  it('does not call onLoadFsw for empty input', () => {
    const onLoadFsw = jest.fn();
    render(<FswPanel fsw="" onLoadFsw={onLoadFsw} />);
    fireEvent.click(screen.getByText('Load'));
    expect(onLoadFsw).not.toHaveBeenCalled();
  });
});
