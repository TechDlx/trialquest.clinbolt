/** The reveal reads named curves at the committed value, so projection and live preview agree. */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { content } from '@/content';
import type { AllocatorConfig } from '@/content/types';
import { Allocator } from './Allocator';
import type { EngineResult } from '@/engine/scoring';

const host = () => ({
  seed: 1,
  paused: false,
  relaxed: true,
  remainingFraction: 1,
  timeUp: false,
  mode: 'level' as const,
  onMistake: vi.fn(() => ({ heartLost: true })),
  onShortcut: vi.fn(),
  onMeters: vi.fn(),
  onComplete: vi.fn<(r: EngineResult) => void>(),
});

describe('Allocator projections', () => {
  it('trial-power: 200 patients previews and projects the same power, cost and months', () => {
    const cfg = content.levelById['w2-l2']!.stages[0]!.game as AllocatorConfig;
    render(<Allocator {...host()} config={cfg} />);
    fireEvent.change(screen.getByTestId('slider-n'), { target: { value: '200' } });
    expect(screen.getByTestId('curve-power')).toHaveTextContent('80%');
    expect(screen.getByTestId('curve-cost')).toHaveTextContent('$12M');
    expect(screen.getByTestId('curve-months')).toHaveTextContent('25');
    fireEvent.click(screen.getByTestId('allocator-commit'));
    const reveal = screen.getByTestId('reveal');
    expect(reveal).toHaveAttribute('data-band', 'powered');
    expect(reveal).toHaveTextContent('80%');
    expect(reveal).toHaveTextContent('$12M');
    expect(reveal).toHaveTextContent('25');
  });

  it('price-access: the reveal coverage follows the curve at the chosen price', () => {
    const cfg = content.levelById['w8-l2']!.stages[0]!.game as AllocatorConfig;
    render(<Allocator {...host()} config={cfg} />);
    fireEvent.change(screen.getByTestId('slider-price'), { target: { value: '1200' } });
    fireEvent.click(screen.getByTestId('allocator-commit'));
    const reveal = screen.getByTestId('reveal');
    expect(reveal).toHaveAttribute('data-band', 'fair');
    expect(reveal).toHaveTextContent('85%'); // coverage curve: 92 at 800 → 78 at 1600, so 85 at 1200
  });
});
