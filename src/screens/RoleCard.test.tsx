import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleCardScreen } from './RoleCard';
import { useProgress } from '@/store/progress';

beforeEach(() => {
  useProgress.getState().resetProgress();
  window.location.hash = '';
});

describe('RoleCardScreen gating', () => {
  it('keeps "Start task" disabled until the card is flipped, then awards XP once', () => {
    render(<RoleCardScreen roleId="patient-advocate" levelId="w1-l1" />);
    const start = screen.getByTestId('start-task');
    expect(start).toBeDisabled();
    expect(screen.getByTestId('rolecard-front')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('flip-card'));
    expect(screen.getByTestId('rolecard-back')).toBeInTheDocument();
    expect(screen.getByTestId('start-task')).toBeEnabled();
    expect(useProgress.getState().xp).toBe(5);
    expect(useProgress.getState().cardsViewed['patient-advocate']?.flipped).toBe(true);

    fireEvent.click(screen.getByTestId('flip-card'));
    fireEvent.click(screen.getByTestId('flip-card'));
    expect(useProgress.getState().xp).toBe(5);
  });

  it('shows both faces of the card content', () => {
    render(<RoleCardScreen roleId="cmc-scientist" levelId="w1-l4" />);
    expect(screen.getByText(/What I do/i)).toBeInTheDocument();
    // The relay: who hands work to the role, the role itself, who it hands work to.
    const relay = screen.getByTestId('relay');
    expect(relay).toHaveTextContent('Hands work to me');
    expect(relay).toHaveTextContent('Me · CMC Scientist');
    expect(relay).toHaveTextContent('I hand my work to');
    fireEvent.click(screen.getByTestId('flip-card'));
    expect(screen.getByText(/A day in the life/i)).toBeInTheDocument();
    expect(screen.getByText(/Key responsibilities/i)).toBeInTheDocument();
  });

  it('starts the relay with the patient, who receives from nobody', () => {
    render(<RoleCardScreen roleId="patient-advocate" levelId="w1-l1" />);
    const relay = screen.getByTestId('relay');
    expect(relay).toHaveTextContent('The relay starts with me.');
    expect(relay).not.toHaveTextContent('Hands work to me');
    expect(relay).toHaveTextContent('I hand my work to');
  });
});
