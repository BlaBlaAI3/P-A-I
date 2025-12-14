/**
 * BUDDY Personal Context Manager
 * Tools for managing and learning about Anton
 */

import * as fs from 'fs';
import * as path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

export interface PersonalContext {
  version: string;
  last_updated: string;
  user: {
    name: string;
    timezone: string;
    locale: string;
  };
  identity: {
    core_values: string[];
    principles: string[];
    long_term_vision: string;
    life_philosophy: string;
  };
  routines: any;
  habits: any;
  goals: any;
  preferences: any;
  life_domains: any;
  patterns: any;
  insights: any;
  buddy_relationship: any;
  metadata: any;
}

export class ContextManager {
  private contextPath: string;
  private interactionPath: string;
  private patternsPath: string;
  private knowledgeGraphPath: string;
  private context: PersonalContext | null = null;

  constructor(memoryDir?: string) {
    const baseDir = memoryDir || path.join(process.cwd(), '.claude', 'memory');
    this.contextPath = path.join(baseDir, 'personal-context.json');
    this.interactionPath = path.join(baseDir, 'interaction-history.json');
    this.patternsPath = path.join(baseDir, 'patterns.json');
    this.knowledgeGraphPath = path.join(baseDir, 'knowledge-graph.json');

    this.ensureMemoryDir(baseDir);
  }

  private ensureMemoryDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info('CONTEXT', `Created memory directory: ${dir}`);
    }
  }

  /**
   * Load personal context from disk
   */
  public loadContext(): PersonalContext {
    try {
      if (fs.existsSync(this.contextPath)) {
        const data = fs.readFileSync(this.contextPath, 'utf8');
        this.context = JSON.parse(data);
        logger.info('CONTEXT', 'Loaded personal context');
        return this.context!;
      }
    } catch (error) {
      logger.error('CONTEXT', 'Failed to load context', { error: String(error) });
    }

    // Return empty context if file doesn't exist or fails to load
    this.context = this.getEmptyContext();
    return this.context;
  }

  /**
   * Save personal context to disk
   */
  public saveContext(context: PersonalContext): boolean {
    try {
      context.last_updated = new Date().toISOString();
      const json = JSON.stringify(context, null, 2);
      fs.writeFileSync(this.contextPath, json, 'utf8');
      this.context = context;
      logger.info('CONTEXT', 'Saved personal context');
      return true;
    } catch (error) {
      logger.error('CONTEXT', 'Failed to save context', { error: String(error) });
      return false;
    }
  }

  /**
   * Get empty context template
   */
  private getEmptyContext(): PersonalContext {
    return {
      version: '1.0.0',
      last_updated: new Date().toISOString(),
      user: {
        name: 'User',
        timezone: 'UTC',
        locale: 'en-US',
      },
      identity: {
        core_values: [],
        principles: [],
        long_term_vision: '',
        life_philosophy: '',
      },
      routines: {},
      habits: {},
      goals: {},
      preferences: {},
      life_domains: {},
      patterns: {},
      insights: {},
      buddy_relationship: {},
      metadata: {},
    };
  }

  /**
   * Update a specific field in context
   */
  public updateField(path: string, value: any): boolean {
    const context = this.context || this.loadContext();
    const parts = path.split('.');

    let current: any = context;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
    return this.saveContext(context);
  }

  /**
   * Get a specific field from context
   */
  public getField(path: string): any {
    const context = this.context || this.loadContext();
    const parts = path.split('.');

    let current: any = context;
    for (const part of parts) {
      if (!current || !(part in current)) {
        return null;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Add a core value
   */
  public addCoreValue(value: string): boolean {
    const context = this.context || this.loadContext();
    if (!context.identity.core_values.includes(value)) {
      context.identity.core_values.push(value);
      logger.buddy('LEARNING', `Added core value: ${value}`);
      return this.saveContext(context);
    }
    return false;
  }

  /**
   * Add a goal
   */
  public addGoal(timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term', goal: any): boolean {
    const context = this.context || this.loadContext();
    if (!context.goals[timeframe]) {
      context.goals[timeframe] = { items: [] };
    }
    context.goals[timeframe].items.push({
      ...goal,
      created_at: new Date().toISOString(),
      status: 'active',
    });
    logger.buddy('LEARNING', `Added ${timeframe} goal: ${goal.title || goal}`);
    return this.saveContext(context);
  }

  /**
   * Add a habit
   */
  public addHabit(category: 'current' | 'building' | 'want_to_build', habit: any): boolean {
    const context = this.context || this.loadContext();
    if (!context.habits[category]) {
      context.habits[category] = [];
    }
    context.habits[category].push({
      ...habit,
      added_at: new Date().toISOString(),
    });
    logger.buddy('LEARNING', `Added habit to ${category}: ${habit.name || habit}`);
    return this.saveContext(context);
  }

  /**
   * Add an insight
   */
  public addInsight(category: 'about_self' | 'learnings' | 'breakthroughs', insight: string): boolean {
    const context = this.context || this.loadContext();
    if (!context.insights[category]) {
      context.insights[category] = [];
    }
    context.insights[category].push({
      content: insight,
      timestamp: new Date().toISOString(),
    });
    logger.buddy('INSIGHT', insight);
    return this.saveContext(context);
  }

  /**
   * Get context summary for display
   */
  public getContextSummary(): string {
    const context = this.context || this.loadContext();

    const lines: string[] = [];
    lines.push('=== Personal Context Summary ===\n');

    // Identity
    if (context.identity.core_values.length > 0) {
      lines.push(`Core Values: ${context.identity.core_values.join(', ')}`);
    }

    // Goals
    const goalCounts = {
      immediate: context.goals.immediate?.items?.length || 0,
      short_term: context.goals.short_term?.items?.length || 0,
      medium_term: context.goals.medium_term?.items?.length || 0,
      long_term: context.goals.long_term?.items?.length || 0,
    };
    const totalGoals = Object.values(goalCounts).reduce((a, b) => a + b, 0);
    if (totalGoals > 0) {
      lines.push(`\nGoals: ${totalGoals} total`);
      if (goalCounts.immediate > 0) lines.push(`  - Immediate: ${goalCounts.immediate}`);
      if (goalCounts.short_term > 0) lines.push(`  - Short-term: ${goalCounts.short_term}`);
      if (goalCounts.medium_term > 0) lines.push(`  - Medium-term: ${goalCounts.medium_term}`);
      if (goalCounts.long_term > 0) lines.push(`  - Long-term: ${goalCounts.long_term}`);
    }

    // Habits
    const habitCounts = {
      current: context.habits.current?.length || 0,
      building: context.habits.building?.length || 0,
      want_to_build: context.habits.want_to_build?.length || 0,
    };
    const totalHabits = Object.values(habitCounts).reduce((a, b) => a + b, 0);
    if (totalHabits > 0) {
      lines.push(`\nHabits: ${totalHabits} total`);
      if (habitCounts.current > 0) lines.push(`  - Current: ${habitCounts.current}`);
      if (habitCounts.building > 0) lines.push(`  - Building: ${habitCounts.building}`);
      if (habitCounts.want_to_build > 0) lines.push(`  - Want to build: ${habitCounts.want_to_build}`);
    }

    // Insights
    const insightCount = (context.insights.about_self?.length || 0) +
                        (context.insights.learnings?.length || 0) +
                        (context.insights.breakthroughs?.length || 0);
    if (insightCount > 0) {
      lines.push(`\nInsights: ${insightCount} captured`);
    }

    // Metadata
    lines.push(`\nOnboarding: ${context.metadata.onboarding_completed ? 'Complete' : 'Not started'}`);
    lines.push(`Last updated: ${context.last_updated}`);

    return lines.join('\n');
  }

  /**
   * Record an interaction
   */
  public recordInteraction(interaction: any): boolean {
    try {
      let history: any = { interactions: [] };

      if (fs.existsSync(this.interactionPath)) {
        const data = fs.readFileSync(this.interactionPath, 'utf8');
        history = JSON.parse(data);
      }

      history.interactions.push({
        ...interaction,
        timestamp: new Date().toISOString(),
      });

      history.effectiveness = history.effectiveness || {};
      history.effectiveness.total_interactions = (history.effectiveness.total_interactions || 0) + 1;

      fs.writeFileSync(this.interactionPath, JSON.stringify(history, null, 2), 'utf8');
      logger.logInteraction(interaction.type || 'general', interaction);
      return true;
    } catch (error) {
      logger.error('CONTEXT', 'Failed to record interaction', { error: String(error) });
      return false;
    }
  }

  /**
   * Mark onboarding as complete
   */
  public completeOnboarding(): boolean {
    const context = this.context || this.loadContext();
    context.metadata.onboarding_completed = true;
    context.metadata.onboarding_date = new Date().toISOString();
    logger.buddy('MILESTONE', 'Onboarding completed!');
    return this.saveContext(context);
  }

  /**
   * Get context richness score (0-100)
   */
  public getContextRichness(): number {
    const context = this.context || this.loadContext();

    let score = 0;

    // Identity (max 20)
    if (context.identity.core_values.length > 0) score += 5;
    if (context.identity.core_values.length >= 3) score += 5;
    if (context.identity.long_term_vision) score += 5;
    if (context.identity.life_philosophy) score += 5;

    // Goals (max 20)
    const totalGoals = (context.goals.immediate?.items?.length || 0) +
                      (context.goals.short_term?.items?.length || 0) +
                      (context.goals.medium_term?.items?.length || 0) +
                      (context.goals.long_term?.items?.length || 0);
    score += Math.min(20, totalGoals * 2);

    // Habits (max 15)
    const totalHabits = (context.habits.current?.length || 0) +
                       (context.habits.building?.length || 0) +
                       (context.habits.want_to_build?.length || 0);
    score += Math.min(15, totalHabits * 3);

    // Routines (max 15)
    const routineKeys = Object.keys(context.routines || {});
    score += Math.min(15, routineKeys.length * 5);

    // Preferences (max 10)
    const prefKeys = Object.keys(context.preferences || {});
    score += Math.min(10, prefKeys.length * 2);

    // Life domains (max 10)
    const domainKeys = Object.keys(context.life_domains || {});
    score += Math.min(10, domainKeys.length * 2);

    // Insights (max 10)
    const totalInsights = (context.insights.about_self?.length || 0) +
                         (context.insights.learnings?.length || 0) +
                         (context.insights.breakthroughs?.length || 0);
    score += Math.min(10, totalInsights);

    return Math.min(100, score);
  }
}

// Singleton instance
let contextInstance: ContextManager | null = null;

export function getContextManager(): ContextManager {
  if (!contextInstance) {
    contextInstance = new ContextManager();
  }
  return contextInstance;
}

export default getContextManager();
