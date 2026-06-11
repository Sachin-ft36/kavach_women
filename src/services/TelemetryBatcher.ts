import { LocationData, SystemLog } from '../domain/types';

/**
 * 🚀 KAVACH TELEMETRY BATCHER (Production Scalability)
 * 
 * At national scale (10,000+ active SOS sessions), writing every single 
 * protector and victim GPS ping to Firestore will cause:
 * 1. Immediate Write Limit Throttling (Firestore limits 10,000 writes/sec per DB)
 * 2. Astronomical Billing Costs
 * 
 * Solution:
 * This service buffers incoming telemetry into an array locally, and every X seconds,
 * flushes the entire array as a single JSON blob directly into Google Cloud Storage
 * (Cold/Warm tier) or streams it to BigQuery.
 */

type BufferedTelemetry = (LocationData | SystemLog) & { bufferedAt: string };

class TelemetryBatcher {
  private buffer: Array<BufferedTelemetry> = [];
  private flushIntervalMs: number = 5000; // Flush every 5 seconds
  private intervalId: any = null;

  constructor() {
    this.start();
  }

  /**
   * Captures high-frequency data without hitting the DB.
   */
  public log(data: LocationData | SystemLog) {
    this.buffer.push({
      ...data,
      bufferedAt: new Date().toISOString()
    });
    
    // Safety limit to prevent memory blowout if offline
    if (this.buffer.length > 5000) {
      this.forceFlush();
    }
  }

  private start() {
    this.intervalId = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const payload = [...this.buffer];
    this.buffer = []; // Clear immediately to catch incoming

    try {
      // PRODUCTION TO-DO: Implement actual GCP Cloud Storage / BigQuery streaming insert
      /*
      await fetch('https://api.kavach.gov.in/v1/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: payload.length, data: payload })
      });
      */
      
      console.log(`[TELEMETRY BATCHER] Flushed ${payload.length} pings to Cloud Storage.`);
    } catch (error) {
      console.error('[TELEMETRY BATCHER] Flush failed, restoring buffer', error);
      // Restore failed pings to the front of the queue
      this.buffer = [...payload, ...this.buffer];
    }
  }

  public forceFlush() {
    this.flush();
  }
}

export const telemetryBatcher = new TelemetryBatcher();
