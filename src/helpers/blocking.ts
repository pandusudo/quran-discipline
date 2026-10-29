import type { BlockRule, TemporaryUnlock } from "../storage";
import { isRuleSatisfied, pickStrictestRule } from "../storage";
import type { BlockContext } from "../types";

export interface BlockingInput {
  /** Normalized hostname (no scheme, no "www."). */
  hostname: string;
  /** The popup's master toggle (`settings.blockingEnabled`). */
  isEnabled: boolean;
  /** A Pomodoro focus phase is running right now. */
  isFocusBlocking: boolean;
  /** Every rule currently covering the hostname (schedule-active, site-enabled). */
  matchingRules: BlockRule[];
  /** Non-expired temporary unlocks. */
  activeUnlocks: TemporaryUnlock[];
  /** The active Pomodoro session's list contains this hostname. */
  isInPomodoroList: boolean;
  /** The hostname is on the bundled always-block ("haram") list. */
  isInHaramList: boolean;
}

export interface BlockingDecision {
  shouldBlock: boolean;
  context: BlockContext;
  /** Matching rules that are not yet satisfied by a temporary unlock. */
  ruleBlockers: BlockRule[];
  /** The rule whose mode/config the block page should display. */
  governing: BlockRule | null;
}

/**
 * Pure blocking decision for one hostname — shared by the background worker
 * and unit tests.
 *
 * Rules:
 * - Every matching rule unlocks on its own: the site stays blocked while at
 *   least one active rule has not been unlocked for this hostname.
 * - The bundled haram list is always blocked and never unlockable.
 * - During an active Pomodoro focus phase, blocking ignores the popup toggle
 *   and temporary unlocks; the session's site list is blocked on top of the
 *   usual rules.
 */
export const evaluateBlocking = (input: BlockingInput): BlockingDecision => {
  const {
    hostname,
    isEnabled,
    isFocusBlocking,
    matchingRules,
    activeUnlocks,
    isInPomodoroList,
    isInHaramList,
  } = input;

  const ruleBlockers = matchingRules.filter(
    (rule) => !isRuleSatisfied(activeUnlocks, rule.id, hostname),
  );

  const isBlocked = ruleBlockers.length > 0 || isInHaramList;

  const shouldBlock = isFocusBlocking
    ? matchingRules.length > 0 || isInHaramList || isInPomodoroList
    : isBlocked && isEnabled;

  const context: BlockContext = isFocusBlocking ? "focus" : "standard";

  // The strictest rule still blocking — all matching rules during focus.
  const governing = pickStrictestRule(
    isFocusBlocking ? matchingRules : ruleBlockers,
  );

  return { shouldBlock, context, ruleBlockers, governing };
};
