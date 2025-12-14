/**
 * BUDDY Pattern Detector
 * Identifies patterns in behavior, notes, and life systems
 */

import * as fs from 'fs';
import * as path from 'path';
import { getLogger } from './logger';
import { getVaultParser } from './vault-parser';
import { getNoteAnalyzer } from './note-analyzer';

const logger = getLogger();

export interface Pattern {
  id: string;
  type: 'time_based' | 'behavioral' | 'correlation' | 'trend';
  category: string;
  description: string;
  confidence: number;
  evidence: string[];
  discovered_at: string;
  status: 'hypothesis' | 'observed' | 'confirmed';
  actionable_insight?: string;
}

export class PatternDetector {
  private patternsPath: string;

  constructor(memoryDir?: string) {
    const baseDir = memoryDir || path.join(process.cwd(), '.claude', 'memory');
    this.patternsPath = path.join(baseDir, 'patterns.json');
  }

  /**
   * Load patterns from disk
   */
  public loadPatterns(): any {
    try {
      if (fs.existsSync(this.patternsPath)) {
        const data = fs.readFileSync(this.patternsPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('PATTERN', 'Failed to load patterns', { error: String(error) });
    }

    return {
      version: '1.0.0',
      last_analysis: null,
      patterns: {},
      insights: {},
      recommendations: {},
    };
  }

  /**
   * Save patterns to disk
   */
  public savePatterns(patterns: any): boolean {
    try {
      patterns.last_analysis = new Date().toISOString();
      const json = JSON.stringify(patterns, null, 2);
      fs.writeFileSync(this.patternsPath, json, 'utf8');
      logger.info('PATTERN', 'Saved patterns');
      return true;
    } catch (error) {
      logger.error('PATTERN', 'Failed to save patterns', { error: String(error) });
      return false;
    }
  }

  /**
   * Add a discovered pattern
   */
  public addPattern(pattern: Pattern): boolean {
    const patterns = this.loadPatterns();

    const categoryKey = this.getCategoryKey(pattern.category);
    if (!patterns.patterns[categoryKey]) {
      patterns.patterns[categoryKey] = [];
    }

    patterns.patterns[categoryKey].push(pattern);
    logger.logPattern(pattern.description, { confidence: pattern.confidence });

    return this.savePatterns(patterns);
  }

  /**
   * Get category key from pattern category
   */
  private getCategoryKey(category: string): string {
    const mapping: Record<string, string> = {
      'daily': 'time_based.daily',
      'weekly': 'time_based.weekly',
      'monthly': 'time_based.monthly',
      'energy': 'energy',
      'mood': 'mood',
      'productivity': 'productivity',
      'habits': 'habits',
      'learning': 'learning',
      'decision_making': 'decision_making',
    };

    return mapping[category] || 'cross_domain.correlations';
  }

  /**
   * Analyze vault for temporal patterns
   */
  public analyzeTemporalPatterns(): Pattern[] {
    logger.info('PATTERN', 'Analyzing temporal patterns');

    const vault = getVaultParser();
    const recentNotes = vault.getRecentNotes(50);

    const patterns: Pattern[] = [];

    // Analyze note creation patterns by day of week
    const dayOfWeekCount: Record<string, number> = {};
    const hourOfDayCount: Record<number, number> = {};

    for (const note of recentNotes) {
      if (!note.created) continue;

      const date = note.created;
      const dayOfWeek = date.getDay();
      const hour = date.getHours();

      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      dayOfWeekCount[dayName] = (dayOfWeekCount[dayName] || 0) + 1;
      hourOfDayCount[hour] = (hourOfDayCount[hour] || 0) + 1;
    }

    // Find most active day
    const mostActiveDay = Object.entries(dayOfWeekCount)
      .sort(([, a], [, b]) => b - a)[0];

    if (mostActiveDay && mostActiveDay[1] >= 3) {
      patterns.push({
        id: `temporal_day_${Date.now()}`,
        type: 'time_based',
        category: 'weekly',
        description: `Most active on ${mostActiveDay[0]}s`,
        confidence: 0.7,
        evidence: [`${mostActiveDay[1]} notes created on ${mostActiveDay[0]}s`],
        discovered_at: new Date().toISOString(),
        status: 'observed',
        actionable_insight: `Consider scheduling important work or reflection on ${mostActiveDay[0]}s`,
      });
    }

    // Find peak hours
    const peakHour = Object.entries(hourOfDayCount)
      .sort(([, a], [, b]) => b - a)[0];

    if (peakHour && peakHour[1] >= 3) {
      patterns.push({
        id: `temporal_hour_${Date.now()}`,
        type: 'time_based',
        category: 'daily',
        description: `Peak activity around ${peakHour[0]}:00`,
        confidence: 0.65,
        evidence: [`${peakHour[1]} notes created around ${peakHour[0]}:00`],
        discovered_at: new Date().toISOString(),
        status: 'observed',
        actionable_insight: `Your mind is active around ${peakHour[0]}:00 - good time for creative work`,
      });
    }

    return patterns;
  }

  /**
   * Analyze note content for behavioral patterns
   */
  public analyzeBehavioralPatterns(): Pattern[] {
    logger.info('PATTERN', 'Analyzing behavioral patterns');

    const analyzer = getNoteAnalyzer();
    const insights = analyzer.extractInsights();

    const patterns: Pattern[] = [];

    // Group by type
    const byType: Record<string, typeof insights> = {};
    for (const insight of insights) {
      if (!byType[insight.type]) {
        byType[insight.type] = [];
      }
      byType[insight.type].push(insight);
    }

    // Analyze goals
    if (byType.goal && byType.goal.length >= 3) {
      const goalThemes = this.findCommonThemes(byType.goal.map(g => g.content));
      if (goalThemes.length > 0) {
        patterns.push({
          id: `behavioral_goals_${Date.now()}`,
          type: 'behavioral',
          category: 'goals',
          description: `Recurring goal themes: ${goalThemes.join(', ')}`,
          confidence: 0.75,
          evidence: byType.goal.map(g => g.content).slice(0, 5),
          discovered_at: new Date().toISOString(),
          status: 'observed',
        });
      }
    }

    // Analyze challenges
    if (byType.challenge && byType.challenge.length >= 2) {
      patterns.push({
        id: `behavioral_challenges_${Date.now()}`,
        type: 'behavioral',
        category: 'challenges',
        description: `${byType.challenge.length} recurring challenges identified`,
        confidence: 0.7,
        evidence: byType.challenge.map(c => c.content).slice(0, 3),
        discovered_at: new Date().toISOString(),
        status: 'observed',
        actionable_insight: 'These challenges might benefit from systematic approach or coaching',
      });
    }

    return patterns;
  }

  /**
   * Find common themes in text array
   */
  private findCommonThemes(texts: string[]): string[] {
    const wordFreq = new Map<string, number>();

    for (const text of texts) {
      const words = text.toLowerCase().split(/\W+/);
      for (const word of words) {
        if (word.length > 4) { // Only meaningful words
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
      }
    }

    return Array.from(wordFreq.entries())
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Run full pattern analysis
   */
  public runFullAnalysis(): {
    patterns: Pattern[];
    insights: string[];
    recommendations: string[];
  } {
    logger.info('PATTERN', 'Running full pattern analysis');

    const patterns: Pattern[] = [];

    // Run all analysis
    patterns.push(...this.analyzeTemporalPatterns());
    patterns.push(...this.analyzeBehavioralPatterns());

    // Generate insights
    const insights: string[] = [];
    const recommendations: string[] = [];

    for (const pattern of patterns) {
      insights.push(pattern.description);
      if (pattern.actionable_insight) {
        recommendations.push(pattern.actionable_insight);
      }
    }

    // Save patterns
    const patternData = this.loadPatterns();
    for (const pattern of patterns) {
      const categoryKey = this.getCategoryKey(pattern.category);
      if (!patternData.patterns[categoryKey]) {
        patternData.patterns[categoryKey] = [];
      }
      patternData.patterns[categoryKey].push(pattern);
    }

    patternData.insights.observations = insights;
    patternData.recommendations.based_on_patterns = recommendations;
    this.savePatterns(patternData);

    return { patterns, insights, recommendations };
  }

  /**
   * Get all confirmed patterns
   */
  public getConfirmedPatterns(): Pattern[] {
    const data = this.loadPatterns();
    const confirmed: Pattern[] = [];

    for (const categoryKey in data.patterns) {
      const categoryPatterns = data.patterns[categoryKey];
      if (Array.isArray(categoryPatterns)) {
        confirmed.push(...categoryPatterns.filter((p: Pattern) => p.status === 'confirmed'));
      }
    }

    return confirmed;
  }

  /**
   * Get pattern summary
   */
  public getPatternSummary(): string {
    const data = this.loadPatterns();
    const lines: string[] = [];

    lines.push('=== Pattern Summary ===\n');

    let totalPatterns = 0;
    for (const categoryKey in data.patterns) {
      const patterns = data.patterns[categoryKey];
      if (Array.isArray(patterns) && patterns.length > 0) {
        lines.push(`${categoryKey}: ${patterns.length} patterns`);
        totalPatterns += patterns.length;
      }
    }

    if (totalPatterns === 0) {
      lines.push('No patterns discovered yet. Run analysis to find patterns.');
    } else {
      lines.push(`\nTotal: ${totalPatterns} patterns identified`);
    }

    if (data.insights.observations && data.insights.observations.length > 0) {
      lines.push('\n=== Key Insights ===');
      data.insights.observations.slice(0, 5).forEach((insight: string, i: number) => {
        lines.push(`${i + 1}. ${insight}`);
      });
    }

    if (data.recommendations.based_on_patterns && data.recommendations.based_on_patterns.length > 0) {
      lines.push('\n=== Recommendations ===');
      data.recommendations.based_on_patterns.slice(0, 3).forEach((rec: string, i: number) => {
        lines.push(`${i + 1}. ${rec}`);
      });
    }

    if (data.last_analysis) {
      lines.push(`\nLast analyzed: ${data.last_analysis}`);
    }

    return lines.join('\n');
  }
}

// Singleton instance
let detectorInstance: PatternDetector | null = null;

export function getPatternDetector(): PatternDetector {
  if (!detectorInstance) {
    detectorInstance = new PatternDetector();
  }
  return detectorInstance;
}

export default getPatternDetector();
