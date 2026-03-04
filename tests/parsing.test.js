import { parseAgentsJson, parseCronList, calculateHeartbeatAge, countInboxEntries } from '../server/utils.js';

describe('Server Utils - Parsing Logic', () => {

    test('parseAgentsJson should return a map of agents', () => {
        const stdout = JSON.stringify([
            { id: 'agent1', identityName: 'Alpha', identityEmoji: '🦅' },
            { id: 'agent2', identityName: 'Beta', identityEmoji: '🔮' }
        ]);
        const result = parseAgentsJson(stdout);
        expect(result.agent1.identityName).toBe('Alpha');
        expect(result.agent2.identityEmoji).toBe('🔮');
    });

    test('parseAgentsJson should handle invalid JSON', () => {
        const result = parseAgentsJson('invalid-json');
        expect(result).toEqual({});
    });

    test('parseCronList should parse running crons as busy', () => {
        const stdout = `ID      STATUS      LAST RUN    NEXT RUN    AGENT_ID
cron1   RUNNING     10s         50s         agent1
cron2   OK          1m          10m         agent2`;
        const result = parseCronList(stdout);
        expect(result.agent1).toBe('busy');
        expect(result.agent2).toBeUndefined();
    });

    test('parseCronList should parse error crons', () => {
        const stdout = `ID      STATUS      LAST RUN    NEXT RUN    AGENT_ID
cron3   ERROR       5m          1h          agent3`;
        const result = parseCronList(stdout);
        expect(result.agent3).toBe('error');
    });

    test('calculateHeartbeatAge should return age in minutes', () => {
        const now = new Date();
        const tenMinsAgo = new Date(now.getTime() - 10 * 60000).toISOString();
        const content = `Heartbeat: ${tenMinsAgo}`;
        const age = calculateHeartbeatAge(content);
        expect(age).toBeLessThanOrEqual(10);
        expect(age).toBeGreaterThanOrEqual(9);
    });

    test('countInboxEntries should return count of headers', () => {
        const content = `## Task 1\nSome info\n\n## Task 2\nMore info`;
        expect(countInboxEntries(content)).toBe(2);
        expect(countInboxEntries('')).toBe(0);
    });

});
