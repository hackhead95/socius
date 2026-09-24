import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../../src/core/store';
import { emptyCodingProject } from '../../src/core/coding-types';
import { addCoder, canUndo, createCode, setActiveCoder, setWholeResponseCode, undoCoding, addDocs } from '../../src/features/coding/actions';
import { useCodingUi } from '../../src/features/coding/uiStore';

beforeEach(() => {
  useStore.getState().setCoding(emptyCodingProject());
  useCodingUi.getState().set({ history: [] });
});

describe('coding undo history', () => {
  it('survives switching the active coder', () => {
    addDocs([{ id: 'r1', name: 'R1', kind: 'response', text: 'water', createdAt: 0 }]);
    const code = createCode('water');
    setWholeResponseCode(['r1'], code.id);
    expect(addCoder('Priya')).toBe(true);
    setActiveCoder('Priya');
    expect(useStore.getState().coding.activeCoder).toBe('Priya');
    expect(canUndo()).toBe(true);
    setWholeResponseCode(['r1'], code.id);
    expect(useStore.getState().coding.segments.map((s) => s.coder).sort()).toEqual(['Coder 1', 'Priya']);
    expect(undoCoding()).toBe('Code response');
    expect(useStore.getState().coding.segments.map((s) => s.coder)).toEqual(['Coder 1']);
    // Undoing past the coder switch keeps Priya coding while she exists.
    expect(undoCoding()).toBe('Add coder');
    expect(useStore.getState().coding.coders).toEqual(['Coder 1']);
    expect(useStore.getState().coding.activeCoder).toBe('Coder 1');
    expect(undoCoding()).toBe('Code response');
    expect(useStore.getState().coding.segments).toHaveLength(0);
  });
});
