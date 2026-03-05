import { extractExperiments, extractBacklogItems, extractProcesses } from '../server/utils.js';

describe('Data Extraction Helpers', () => {

  describe('extractExperiments', () => {
    test('extracts from wrapper object { experiments: [] }', () => {
      const raw = { experiments: [{ id: 'exp1' }, { id: 'exp2' }] };
      expect(extractExperiments(raw)).toEqual([{ id: 'exp1' }, { id: 'exp2' }]);
    });

    test('returns plain array as-is', () => {
      const raw = [{ id: 'exp1' }];
      expect(extractExperiments(raw)).toEqual([{ id: 'exp1' }]);
    });

    test('returns empty array for null', () => {
      expect(extractExperiments(null)).toEqual([]);
    });

    test('returns empty array for undefined', () => {
      expect(extractExperiments(undefined)).toEqual([]);
    });

    test('returns empty array for empty object', () => {
      expect(extractExperiments({})).toEqual([]);
    });

    test('returns empty array for string input', () => {
      expect(extractExperiments('not an object')).toEqual([]);
    });
  });

  describe('extractBacklogItems', () => {
    test('extracts from { items: [] } wrapper', () => {
      const raw = { items: [{ id: 'item1' }] };
      expect(extractBacklogItems(raw)).toEqual([{ id: 'item1' }]);
    });

    test('extracts from { backlog: [] } wrapper', () => {
      const raw = { backlog: [{ id: 'b1' }, { id: 'b2' }] };
      expect(extractBacklogItems(raw)).toEqual([{ id: 'b1' }, { id: 'b2' }]);
    });

    test('prefers items over backlog key', () => {
      const raw = { items: [{ id: 'item1' }], backlog: [{ id: 'b1' }] };
      expect(extractBacklogItems(raw)).toEqual([{ id: 'item1' }]);
    });

    test('returns plain array as-is', () => {
      expect(extractBacklogItems([{ id: 'x' }])).toEqual([{ id: 'x' }]);
    });

    test('returns empty array for null', () => {
      expect(extractBacklogItems(null)).toEqual([]);
    });

    test('returns empty array for empty object', () => {
      expect(extractBacklogItems({})).toEqual([]);
    });
  });

  describe('extractProcesses', () => {
    test('extracts from { processes: [] } wrapper', () => {
      const raw = { processes: [{ id: 'proc1', name: 'Deploy' }] };
      expect(extractProcesses(raw)).toEqual([{ id: 'proc1', name: 'Deploy' }]);
    });

    test('returns plain array as-is', () => {
      expect(extractProcesses([{ id: 'proc1' }])).toEqual([{ id: 'proc1' }]);
    });

    test('returns empty array for null', () => {
      expect(extractProcesses(null)).toEqual([]);
    });

    test('returns empty array for undefined', () => {
      expect(extractProcesses(undefined)).toEqual([]);
    });

    test('returns empty array for object without processes key', () => {
      expect(extractProcesses({ other: [] })).toEqual([]);
    });
  });

});
