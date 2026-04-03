import { describe, it, expect, beforeEach } from 'vitest';
import { VectorStore } from './vectorStore.js';

describe('VectorStore', () => {
  let store: VectorStore;

  beforeEach(() => {
    store = new VectorStore();
  });

  describe('initialize', () => {
    it('populates the store from chunks', () => {
      store.initialize([
        { id: 'a', vector: [1, 0, 0] },
        { id: 'b', vector: [0, 1, 0] },
      ]);
      expect(store.size).toBe(2);
    });

    it('clears previous data on re-initialize', () => {
      store.initialize([{ id: 'a', vector: [1, 0] }]);
      store.initialize([{ id: 'b', vector: [0, 1] }]);
      expect(store.size).toBe(1);
    });
  });

  describe('addVectors', () => {
    it('adds vectors to the store', () => {
      store.addVectors([[1, 0], [0, 1]], ['x', 'y']);
      expect(store.size).toBe(2);
    });

    it('overwrites existing IDs', () => {
      store.addVectors([[1, 0]], ['x']);
      store.addVectors([[0, 1]], ['x']);
      expect(store.size).toBe(1);
    });
  });

  describe('removeVectors', () => {
    it('removes vectors by ID', () => {
      store.initialize([
        { id: 'a', vector: [1, 0] },
        { id: 'b', vector: [0, 1] },
      ]);
      store.removeVectors(['a']);
      expect(store.size).toBe(1);
    });

    it('ignores non-existent IDs', () => {
      store.initialize([{ id: 'a', vector: [1, 0] }]);
      store.removeVectors(['z']);
      expect(store.size).toBe(1);
    });
  });

  describe('search', () => {
    it('returns results ranked by descending similarity', () => {
      store.initialize([
        { id: 'exact', vector: [1, 0, 0] },
        { id: 'partial', vector: [0.7, 0.7, 0] },
        { id: 'orthogonal', vector: [0, 0, 1] },
      ]);

      const results = store.search([1, 0, 0], 3);
      expect(results[0].id).toBe('exact');
      expect(results[0].score).toBeCloseTo(1);
      expect(results[1].id).toBe('partial');
      expect(results[2].id).toBe('orthogonal');
    });

    it('returns all non-negative scores', () => {
      store.initialize([
        { id: 'a', vector: [1, 0] },
        { id: 'b', vector: [-1, 0] },
      ]);

      const results = store.search([1, 0], 2);
      for (const r of results) {
        expect(r.score).toBeGreaterThanOrEqual(0);
      }
    });

    it('limits results to topK', () => {
      store.initialize([
        { id: 'a', vector: [1, 0] },
        { id: 'b', vector: [0, 1] },
        { id: 'c', vector: [0.5, 0.5] },
      ]);

      const results = store.search([1, 0], 2);
      expect(results).toHaveLength(2);
    });

    it('returns empty array when store is empty', () => {
      const results = store.search([1, 0, 0], 5);
      expect(results).toEqual([]);
    });

    it('handles zero vectors gracefully', () => {
      store.initialize([{ id: 'zero', vector: [0, 0, 0] }]);
      const results = store.search([1, 0, 0], 1);
      expect(results[0].score).toBe(0);
    });
  });
});
