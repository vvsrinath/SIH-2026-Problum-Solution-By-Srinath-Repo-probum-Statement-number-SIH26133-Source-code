// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StethoscopeIcon } from 'lucide-react';
import { StatCard } from '../dashboard/StatCard';
import { StatusBadge } from './StatusBadge';
import { Avatar } from './Avatar';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="Completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('resolves a tone from a known status', () => {
    const { container } = render(<StatusBadge status="Completed" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-brand-tint text-brand');
  });

  it('falls back to neutral for unknown statuses', () => {
    const { container } = render(<StatusBadge status="Weird status" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-line-soft text-ink-500');
  });

  it('prefers an explicit tone prop', () => {
    const { container } = render(<StatusBadge status="Completed" tone="danger" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-red-50 text-red-600');
  });
});

describe('Avatar', () => {
  it('renders initials when no photo is provided', () => {
    render(<Avatar name="Arjun Sharma" />);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('drops the Dr. prefix from initials', () => {
    render(<Avatar name="Dr. Neha Verma" />);
    expect(screen.getByText('NV')).toBeInTheDocument();
  });

  it('renders the photo when src is provided', () => {
    render(<Avatar name="Ramesh Kumar" src="https://example.com/pic.jpg" />);
    const img = screen.getByAltText('Ramesh Kumar');
    expect(img.tagName).toBe('IMG');
  });

  it('picks the same gradient for the same name', () => {
    const { container: a } = render(<Avatar name="Ramesh Kumar" />);
    const { container: b } = render(<Avatar name="Ramesh Kumar" />);
    const classA = a.querySelector('span')?.className ?? '';
    const classB = b.querySelector('span')?.className ?? '';
    expect(classA).toContain('bg-gradient-to-br');
    expect(classA).toBe(classB);
  });
});

describe('StatCard', () => {
  it('renders label and value', () => {
    render(
      <MemoryRouter>
        <StatCard icon={StethoscopeIcon} label="Queue" value="9" caption="Waiting now" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Waiting now')).toBeInTheDocument();
  });

  it('renders a link when linkTo is provided', () => {
    render(
      <MemoryRouter>
        <StatCard icon={StethoscopeIcon} label="Queue" value="9" linkLabel="View" linkTo="/phc/queue" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/phc/queue');
  });

  it('renders trend bars when trend data is provided', () => {
    const { container } = render(
      <MemoryRouter>
        <StatCard icon={StethoscopeIcon} label="Queue" value="9" trend={[2, 3, 5, 7, 9]} />
      </MemoryRouter>,
    );
    const bars = container.querySelector('[aria-label="Trend sparkline"]');
    expect(bars).toBeInTheDocument();
    expect(bars?.querySelectorAll('span')).toHaveLength(5);
  });
});