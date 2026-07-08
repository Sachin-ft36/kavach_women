// ============================================================
// memory/MemoryStore.ts — Local in-memory + localStorage store
// Stores and retrieves MemoryEntry items via StorageAdapter.
// Manages recency and importance-weighted retrieval.
// ============================================================

import type { MemoryEntry } from "../BrainTypes";
import { StorageAdapter } from "../../core/StorageAdapter";
import { logger } from "../../core/Logger";

const MEMORY_KEY     = "kavach:memories";
const MAX_ENTRIES    = 50;
const TAG = "MemoryStore";

export class MemoryStore {
  private adapter: StorageAdapter;
  private cache: MemoryEntry[] = [];

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  public async load(): Promise<void> {
    const stored = await this.adapter.getItem<MemoryEntry[]>(MEMORY_KEY);
    this.cache = stored ?? [];
    logger.debug(TAG, `Loaded ${this.cache.length} memory entries.`);
  }

  public async add(entry: Omit<MemoryEntry, "id" | "createdAt">): Promise<void> {
    const newEntry: MemoryEntry = {
      id:        `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      ...entry,
    };

    this.cache.push(newEntry);

    // Trim to max — evict lowest weight + oldest
    if (this.cache.length > MAX_ENTRIES) {
      this.cache.sort((a, b) => b.weight - a.weight || b.createdAt - a.createdAt);
      this.cache = this.cache.slice(0, MAX_ENTRIES);
    }

    await this.adapter.setItem(MEMORY_KEY, this.cache);
    logger.debug(TAG, `Added memory: "${newEntry.summary}"`);
  }

  /** Returns top-N entries by importance + recency */
  public retrieve(topN: number = 5): MemoryEntry[] {
    return [...this.cache]
      .sort((a, b) => b.weight - a.weight || b.createdAt - a.createdAt)
      .slice(0, topN);
  }

  public async clear(): Promise<void> {
    this.cache = [];
    await this.adapter.removeItem(MEMORY_KEY);
    logger.info(TAG, "Memory cleared.");
  }
}
