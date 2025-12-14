/**
 * BUDDY Metrics Tracker
 * Track and analyze life systems: health, energy, mood, learning, money
 */

import * as fs from 'fs';
import * as path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

// Base metric entry interface
export interface MetricEntry {
  id: string;
  timestamp: string;
  date: string; // YYYY-MM-DD for easy grouping
  notes?: string;
}

// Health metrics
export interface HealthEntry extends MetricEntry {
  system: 'health';
  sleep_hours?: number;
  sleep_quality?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  exercise?: {
    type: string;
    duration_minutes: number;
    intensity?: 'low' | 'medium' | 'high';
  };
  nutrition_score?: 1 | 2 | 3 | 4 | 5;
  water_intake_liters?: number;
  symptoms?: string[];
  wellness_score?: 1 | 2 | 3 | 4 | 5;
  weight_kg?: number;
}

// Energy metrics
export interface EnergyEntry extends MetricEntry {
  system: 'energy';
  time_of_day: string; // HH:MM format
  level: 1 | 2 | 3 | 4 | 5; // 1=drained, 5=energized
  context?: string; // What were you doing?
  drains?: string[]; // What drained energy?
  sources?: string[]; // What gave energy?
}

// Mood metrics
export interface MoodEntry extends MetricEntry {
  system: 'mood';
  emotional_state: string; // e.g., "happy", "anxious", "calm"
  valence?: 1 | 2 | 3 | 4 | 5; // 1=negative, 5=positive
  arousal?: 1 | 2 | 3 | 4 | 5; // 1=low energy, 5=high energy
  triggers?: string[];
  gratitude?: string[];
  wins?: string[];
  challenges?: string[];
}

// Learning metrics
export interface LearningEntry extends MetricEntry {
  system: 'learning';
  activity_type: 'reading' | 'course' | 'practice' | 'research' | 'project' | 'other';
  topic: string;
  duration_minutes?: number;
  resource?: string; // Book, course, article, etc.
  key_takeaways?: string[];
  skill_practiced?: string;
  quality_rating?: 1 | 2 | 3 | 4 | 5; // How valuable was this?
  retention_score?: 1 | 2 | 3 | 4 | 5; // How well retained?
}

// Money metrics
export interface MoneyEntry extends MetricEntry {
  system: 'money';
  type: 'expense' | 'income' | 'investment' | 'goal_progress';
  category?: string; // e.g., "food", "housing", "learning", "health"
  amount?: number;
  currency?: string;
  description?: string;
  recurring?: boolean;
  goal_id?: string;
}

export type AnyMetricEntry = HealthEntry | EnergyEntry | MoodEntry | LearningEntry | MoneyEntry;

export interface Correlation {
  id: string;
  systems: string[]; // Which systems are correlated
  pattern: string;
  strength: number; // 0-1
  direction: 'positive' | 'negative' | 'complex';
  evidence: string[];
  discovered_at: string;
  status: 'hypothesis' | 'observed' | 'confirmed';
}

export class MetricsTracker {
  private metricsPath: string;
  private data: any;

  constructor(memoryDir?: string) {
    const baseDir = memoryDir || path.join(process.cwd(), '.claude', 'memory');
    this.metricsPath = path.join(baseDir, 'metrics.json');
    this.loadMetrics();
  }

  /**
   * Load metrics from disk
   */
  private loadMetrics(): void {
    try {
      if (fs.existsSync(this.metricsPath)) {
        const content = fs.readFileSync(this.metricsPath, 'utf8');
        this.data = JSON.parse(content);
      } else {
        this.data = this.getEmptyMetrics();
        this.saveMetrics();
      }
    } catch (error) {
      logger.error('METRICS', 'Failed to load metrics', { error: String(error) });
      this.data = this.getEmptyMetrics();
    }
  }

  /**
   * Save metrics to disk
   */
  private saveMetrics(): boolean {
    try {
      this.data.last_updated = new Date().toISOString();
      const json = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.metricsPath, json, 'utf8');
      return true;
    } catch (error) {
      logger.error('METRICS', 'Failed to save metrics', { error: String(error) });
      return false;
    }
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): any {
    return {
      version: '1.0.0',
      last_updated: null,
      user: 'Anton',
      systems: {
        health: { enabled: true, entries: [] },
        energy: { enabled: true, entries: [] },
        mood: { enabled: true, entries: [] },
        learning: { enabled: true, entries: [] },
        money: { enabled: true, entries: [] },
      },
      correlations: { discovered: [], confirmed: [] },
      insights: { weekly: [], monthly: [] },
      metadata: {
        total_entries: 0,
        tracking_start_date: null,
        tracking_days: 0,
        last_correlation_analysis: null,
      },
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(system: string): string {
    return `${system}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Add a metric entry
   */
  public addEntry(system: keyof typeof this.data.systems, entry: Partial<AnyMetricEntry>): boolean {
    try {
      if (!this.data.systems[system]) {
        logger.error('METRICS', `Unknown system: ${system}`);
        return false;
      }

      const fullEntry = {
        id: this.generateId(system),
        timestamp: new Date().toISOString(),
        date: this.getCurrentDate(),
        system,
        ...entry,
      };

      this.data.systems[system].entries.push(fullEntry);
      this.data.metadata.total_entries++;

      // Update tracking start date if first entry
      if (!this.data.metadata.tracking_start_date) {
        this.data.metadata.tracking_start_date = this.getCurrentDate();
      }

      // Calculate tracking days
      if (this.data.metadata.tracking_start_date) {
        const start = new Date(this.data.metadata.tracking_start_date);
        const now = new Date();
        this.data.metadata.tracking_days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }

      logger.buddy('TRACKING', `Added ${system} entry`, { entry: fullEntry });
      return this.saveMetrics();
    } catch (error) {
      logger.error('METRICS', `Failed to add ${system} entry`, { error: String(error) });
      return false;
    }
  }

  /**
   * Get entries for a system
   */
  public getEntries(
    system: keyof typeof this.data.systems,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    }
  ): AnyMetricEntry[] {
    if (!this.data.systems[system]) {
      return [];
    }

    let entries = [...this.data.systems[system].entries];

    // Filter by date range
    if (options?.startDate) {
      entries = entries.filter(e => e.date >= options.startDate!);
    }
    if (options?.endDate) {
      entries = entries.filter(e => e.date <= options.endDate!);
    }

    // Sort by timestamp (newest first)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply offset and limit
    if (options?.offset) {
      entries = entries.slice(options.offset);
    }
    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  }

  /**
   * Get entries for today
   */
  public getTodayEntries(system: keyof typeof this.data.systems): AnyMetricEntry[] {
    const today = this.getCurrentDate();
    return this.getEntries(system, { startDate: today, endDate: today });
  }

  /**
   * Get entries for a date range
   */
  public getEntriesInRange(
    system: keyof typeof this.data.systems,
    startDate: string,
    endDate: string
  ): AnyMetricEntry[] {
    return this.getEntries(system, { startDate, endDate });
  }

  /**
   * Calculate average for numeric field
   */
  public calculateAverage(
    system: keyof typeof this.data.systems,
    field: string,
    days: number = 7
  ): number | null {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const entries = this.getEntries(system, { startDate: startDateStr });

    if (entries.length === 0) return null;

    const values = entries
      .map(e => (e as any)[field])
      .filter(v => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return null;

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get summary statistics for a system
   */
  public getSystemSummary(system: keyof typeof this.data.systems, days: number = 7): any {
    const entries = this.getEntries(system, {
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    return {
      system,
      total_entries: entries.length,
      entries_per_day: entries.length / days,
      date_range: {
        start: days + ' days ago',
        end: 'today',
      },
      latest_entry: entries[0] || null,
    };
  }

  /**
   * Get dashboard summary
   */
  public getDashboard(days: number = 7): any {
    const systems = ['health', 'energy', 'mood', 'learning', 'money'] as const;

    const dashboard: any = {
      period: `Last ${days} days`,
      generated_at: new Date().toISOString(),
      systems: {},
      total_entries: 0,
      tracking_days: this.data.metadata.tracking_days,
    };

    for (const system of systems) {
      const summary = this.getSystemSummary(system, days);
      dashboard.systems[system] = summary;
      dashboard.total_entries += summary.total_entries;
    }

    // Add correlations if any
    dashboard.correlations = this.data.correlations.confirmed.length;

    // Add recent insights
    dashboard.recent_insights = [
      ...(this.data.insights.weekly || []),
      ...(this.data.insights.monthly || []),
    ].slice(0, 5);

    return dashboard;
  }

  /**
   * Add correlation
   */
  public addCorrelation(correlation: Omit<Correlation, 'id' | 'discovered_at'>): boolean {
    const fullCorrelation: Correlation = {
      id: this.generateId('correlation'),
      discovered_at: new Date().toISOString(),
      ...correlation,
    };

    this.data.correlations.discovered.push(fullCorrelation);
    logger.buddy('INSIGHT', `Discovered correlation: ${correlation.pattern}`);
    return this.saveMetrics();
  }

  /**
   * Confirm correlation
   */
  public confirmCorrelation(correlationId: string): boolean {
    const index = this.data.correlations.discovered.findIndex((c: Correlation) => c.id === correlationId);

    if (index === -1) return false;

    const correlation = this.data.correlations.discovered[index];
    correlation.status = 'confirmed';

    this.data.correlations.confirmed.push(correlation);
    this.data.correlations.discovered.splice(index, 1);

    logger.buddy('INSIGHT', `Confirmed correlation: ${correlation.pattern}`);
    return this.saveMetrics();
  }

  /**
   * Add insight
   */
  public addInsight(period: 'weekly' | 'monthly', insight: string): boolean {
    this.data.insights[period].push({
      content: insight,
      timestamp: new Date().toISOString(),
    });

    logger.buddy('INSIGHT', `${period} insight: ${insight}`);
    return this.saveMetrics();
  }

  /**
   * Get all metrics data
   */
  public getAllData(): any {
    return this.data;
  }
}

// Singleton instance
let trackerInstance: MetricsTracker | null = null;

export function getMetricsTracker(): MetricsTracker {
  if (!trackerInstance) {
    trackerInstance = new MetricsTracker();
  }
  return trackerInstance;
}

export default getMetricsTracker();
