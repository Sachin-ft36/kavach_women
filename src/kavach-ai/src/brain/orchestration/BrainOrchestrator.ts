// ============================================================
// orchestration/BrainOrchestrator.ts — Coordinates brain layers
// Runs on each user message: build context → score safety →
// update memory → return resolved BrainState + SafetyScore.
// This is the ONLY class that imports from multiple brain modules.
// ============================================================

import type { BrainState, ContextFrame, SafetyScore } from "../BrainTypes";
import { ContextBuilder, type ContextBuilderInput } from "../context/ContextBuilder";
import { MemoryStore } from "../memory/MemoryStore";
import { scoreSafety } from "../safety/SafetyScorer";
import { logger } from "../../core/Logger";

const TAG = "BrainOrchestrator";

export interface BrainResult {
  brainState: BrainState;
  safetyScore: SafetyScore;
  context: ContextFrame;
}

export class BrainOrchestrator {
  private memory: MemoryStore;
  private contextInput: ContextBuilderInput;

  constructor(memory: MemoryStore, contextInput: ContextBuilderInput) {
    this.memory       = memory;
    this.contextInput = contextInput;
  }

  /**
   * Process a user message through all brain layers.
   * Returns a resolved BrainResult for the AI to act on.
   */
  public async process(userMessage: string): Promise<BrainResult> {
    logger.debug(TAG, "Starting brain process cycle.");

    // 1. Build context
    const builder = new ContextBuilder(this.contextInput);
    const context = await builder.build();

    // 2. Safety scoring — pure, synchronous
    const safetyScore = scoreSafety(userMessage, context);
    logger.debug(TAG, `Safety score: ${safetyScore.score.toFixed(2)}`, safetyScore.signals);

    // 3. Memory update — async, non-blocking write
    if (userMessage.trim().length > 3) {
      this.memory.add({
        summary: userMessage.slice(0, 120),
        weight:  safetyScore.score > 0.4 ? 0.9 : 0.4,
        tags:    safetyScore.signals.length > 0 ? ["safety"] : ["general"],
      }).catch((err) => logger.warn(TAG, "Memory write failed", err));
    }

    // 4. Determine BrainState from safety output
    let brainState: BrainState = "reasoning";
    if (safetyScore.score >= 0.5) {
      brainState = "safetyAnalysis";
    } else if (safetyScore.score >= 0.2) {
      brainState = "planning";
    }

    return { brainState, safetyScore, context };
  }

  /** Retrieve top memories for injecting into LLM prompt context */
  public getRelevantMemories(topN: number = 5) {
    return this.memory.retrieve(topN);
  }
}
