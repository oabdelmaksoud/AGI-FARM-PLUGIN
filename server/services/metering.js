import path from 'path';
import { ensureJsonFile, safeReadJson, safeWriteJson } from './storage.js';

const DEFAULT_METERING = {
  records: [],
  perAgent: {},
  perModel: {},
  totals: { tokensIn: 0, tokensOut: 0, durationMs: 0, estimatedCostUsd: 0 },
};

export class MeteringService {
  constructor(workspace) {
    this.filePath = path.join(workspace, 'USAGE_METERING.json');
    ensureJsonFile(this.filePath, DEFAULT_METERING);
  }

  addRecord(record) {
    const data = safeReadJson(this.filePath, DEFAULT_METERING);
    const row = {
      jobId: record.jobId || 'unknown',
      agentId: record.agentId || 'unknown',
      model: record.model || 'unknown',
      tokensIn: Number(record.tokensIn || 0),
      tokensOut: Number(record.tokensOut || 0),
      durationMs: Number(record.durationMs || 0),
      estimatedCostUsd: Number(record.estimatedCostUsd || 0),
      timestamp: record.timestamp || new Date().toISOString(),
    };

    data.records = Array.isArray(data.records) ? data.records : [];
    data.records.push(row);
    const prevLen = data.records.length;
    data.records = data.records.slice(-5000);

    if (prevLen > 5000) {
      // Recompute aggregates from retained records to prevent drift
      data.perAgent = {};
      data.perModel = {};
      data.totals = { tokensIn: 0, tokensOut: 0, durationMs: 0, estimatedCostUsd: 0 };
      for (const r of data.records) {
        const bumpR = (bucket, key, rec) => {
          if (!bucket[key]) bucket[key] = { spent: 0, calls: 0, tokensIn: 0, tokensOut: 0, durationMs: 0 };
          bucket[key].spent += rec.estimatedCostUsd || 0;
          bucket[key].calls += 1;
          bucket[key].tokensIn += rec.tokensIn || 0;
          bucket[key].tokensOut += rec.tokensOut || 0;
          bucket[key].durationMs += rec.durationMs || 0;
        };
        bumpR(data.perAgent, r.agentId || 'unknown', r);
        bumpR(data.perModel, r.model || 'unknown', r);
        data.totals.tokensIn += r.tokensIn || 0;
        data.totals.tokensOut += r.tokensOut || 0;
        data.totals.durationMs += r.durationMs || 0;
        data.totals.estimatedCostUsd += r.estimatedCostUsd || 0;
      }
    } else {
      const bump = (bucket, key) => {
        if (!bucket[key]) bucket[key] = { spent: 0, calls: 0, tokensIn: 0, tokensOut: 0, durationMs: 0 };
        bucket[key].spent += row.estimatedCostUsd;
        bucket[key].calls += 1;
        bucket[key].tokensIn += row.tokensIn;
        bucket[key].tokensOut += row.tokensOut;
        bucket[key].durationMs += row.durationMs;
      };

      data.perAgent = data.perAgent || {};
      data.perModel = data.perModel || {};
      data.totals = data.totals || { tokensIn: 0, tokensOut: 0, durationMs: 0, estimatedCostUsd: 0 };

      bump(data.perAgent, row.agentId);
      bump(data.perModel, row.model);

      data.totals.tokensIn += row.tokensIn;
      data.totals.tokensOut += row.tokensOut;
      data.totals.durationMs += row.durationMs;
      data.totals.estimatedCostUsd += row.estimatedCostUsd;
    }

    safeWriteJson(this.filePath, data);
    return row;
  }

  getUsage() {
    return safeReadJson(this.filePath, DEFAULT_METERING);
  }
}
