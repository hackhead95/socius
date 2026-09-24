// @vitest-environment jsdom
// Help > About Socius: the note on what Socius stores in this browser, that other websites on the same
// github.io account could read it, and what to do about it.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AboutDialog, sharedPagesHost } from '../../src/app/HelpDialogs';

afterEach(() => cleanup());

describe('About: what Socius stores in this browser', () => {
  it('recognises a GitHub Pages host, whose sites share one origin', () => {
    expect(sharedPagesHost('hackhead95.github.io')).toBe('hackhead95.github.io');
    expect(sharedPagesHost('HackHead95.GitHub.io')).toBe('hackhead95.github.io');
    expect(sharedPagesHost('localhost')).toBeNull();
    expect(sharedPagesHost('socius.example.org')).toBeNull();
    expect(sharedPagesHost('evil.github.io.example.com')).toBeNull();
  });

  it('lists what is stored and says that other sites on the github.io account could read it', () => {
    render(<AboutDialog onClose={() => undefined} host="hackhead95.github.io" />);
    const note = screen.getByRole('region', { name: 'What Socius stores in this browser' });
    const text = note.textContent ?? '';
    for (const part of ['Autosave', 'Preferences', 'Error log', 'AI assistant settings', 'hackhead95.github.io', 'another website hosted there could read', 'Save project', 'Close data and start fresh', 'remember option']) {
      expect(text, part).toContain(part);
    }
    expect(text).not.toMatch(/—/);
  });

  it('elsewhere, gives the general caution without naming github.io', () => {
    render(<AboutDialog onClose={() => undefined} host="localhost" />);
    const text = screen.getByRole('region', { name: 'What Socius stores in this browser' }).textContent ?? '';
    expect(text).not.toContain('github.io');
    expect(text).toContain('same web address');
  });

  it('names AI > AI assistant settings for the remember option, without a second way into settings', () => {
    render(<AboutDialog onClose={() => undefined} host="hackhead95.github.io" />);
    const note = screen.getByRole('region', { name: 'What Socius stores in this browser' });
    expect(note.textContent).toContain('AI > AI assistant settings');
    // AI set-up has one home, the AI menu (docs/NAVIGATION.md): no button here.
    expect(note.querySelectorAll('button')).toHaveLength(0);
  });
});
