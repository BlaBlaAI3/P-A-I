/**
 * BUDDY Correlation Engine
 * Find connections and patterns across life systems
 */

import { getMetricsTracker, Correlation } from './metrics-tracker';
import { getLogger } from './logger';

const logger = getLogger();

export interface SystemCorrelation {
  systems: string[];
  pattern: string;
  strength: number;
  direction: 'positive' | 'negative' | 'complex';
  evidence: string[];
}

export class CorrelationEngine {
  private tracker = getMetricsTracker();

  /**
   * Analyze correlations across all systems
   */
  public analyzeCorrelations(days: number = 14): SystemCorrelation[] {
    logger.info('CORRELATION', `Analyzing correlations over ${days} days`);

    const correlations: SystemCorrelation[] = [];

    // Get data for all systems
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const healthEntries = this.tracker.getEntries('health', { startDate: startDateStr });
    const energyEntries = this.tracker.getEntries('energy', { startDate: startDateStr });
    const moodEntries = this.tracker.getEntries('mood', { startDate: startDateStr });
    const learningEntries = this.tracker.getEntries('learning', { startDate: startDateStr });

    // Analyze Sleep → Energy correlation
    if (healthEntries.length >= 3 && energyEntries.length >= 3) {
      const sleepEnergyCorr = this.analyzeSleepEnergy(healthEntries as any, energyEntries as any);
      if (sleepEnergyCorr) correlations.push(sleepEnergyCorr);
    }

    // Analyze Energy → Mood correlation
    if (energyEntries.length >= 3 && moodEntries.length >= 3) {
      const energyMoodCorr = this.analyzeEnergyMood(energyEntries as any, moodEntries as any);
      if (energyMoodCorr) correlations.push(energyMoodCorr);
    }

    // Analyze Exercise → Mood correlation
    if (healthEntries.length >= 3 && moodEntries.length >= 3) {
      const exerciseMoodCorr = this.analyzeExerciseMood(healthEntries as any, moodEntries as any);
      if (exerciseMoodCorr) correlations.push(exerciseMoodCorr);
    }

    // Analyze Learning → Mood correlation
    if (learningEntries.length >= 3 && moodEntries.length >= 3) {
      const learningMoodCorr = this.analyzeLearningMood(learningEntries as any, moodEntries as any);
      if (learningMoodCorr) correlations.push(learningMoodCorr);
    }

    // Analyze Sleep → Mood correlation
    if (healthEntries.length >= 3 && moodEntries.length >= 3) {
      const sleepMoodCorr = this.analyzeSleepMood(healthEntries as any, moodEntries as any);
      if (sleepMoodCorr) correlations.push(sleepMoodCorr);
    }

    // Save correlations
    for (const corr of correlations) {
      this.tracker.addCorrelation({
        systems: corr.systems,
        pattern: corr.pattern,
        strength: corr.strength,
        direction: corr.direction,
        evidence: corr.evidence,
        status: corr.strength > 0.7 ? 'observed' : 'hypothesis',
      });
    }

    return correlations;
  }

  /**
   * Analyze Sleep → Energy correlation
   */
  private analyzeSleepEnergy(healthEntries: any[], energyEntries: any[]): SystemCorrelation | null {
    // Group by date
    const sleepByDate = new Map<string, number>();
    for (const entry of healthEntries) {
      if (entry.sleep_hours) {
        sleepByDate.set(entry.date, entry.sleep_hours);
      }
    }

    const energyByDate = new Map<string, number[]>();
    for (const entry of energyEntries) {
      if (!energyByDate.has(entry.date)) {
        energyByDate.set(entry.date, []);
      }
      energyByDate.get(entry.date)!.push(entry.level);
    }

    // Find common dates
    const commonDates = Array.from(sleepByDate.keys()).filter(date => energyByDate.has(date));

    if (commonDates.length < 3) return null;

    // Calculate correlation
    const pairs: Array<[number, number]> = [];
    for (const date of commonDates) {
      const sleep = sleepByDate.get(date)!;
      const energyLevels = energyByDate.get(date)!;
      const avgEnergy = energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length;
      pairs.push([sleep, avgEnergy]);
    }

    const correlation = this.calculateCorrelation(pairs);

    if (Math.abs(correlation) < 0.4) return null;

    return {
      systems: ['health', 'energy'],
      pattern: correlation > 0
        ? 'Better sleep leads to higher energy levels'
        : 'Longer sleep correlates with lower energy (might indicate oversleeping)',
      strength: Math.abs(correlation),
      direction: correlation > 0 ? 'positive' : 'negative',
      evidence: pairs.map(([s, e]) => `${s}hrs sleep → ${e.toFixed(1)}/5 energy`),
    };
  }

  /**
   * Analyze Energy → Mood correlation
   */
  private analyzeEnergyMood(energyEntries: any[], moodEntries: any[]): SystemCorrelation | null {
    const energyByDate = new Map<string, number[]>();
    for (const entry of energyEntries) {
      if (!energyByDate.has(entry.date)) {
        energyByDate.set(entry.date, []);
      }
      energyByDate.get(entry.date)!.push(entry.level);
    }

    const moodByDate = new Map<string, number>();
    for (const entry of moodEntries) {
      if (entry.valence) {
        moodByDate.set(entry.date, entry.valence);
      }
    }

    const commonDates = Array.from(energyByDate.keys()).filter(date => moodByDate.has(date));

    if (commonDates.length < 3) return null;

    const pairs: Array<[number, number]> = [];
    for (const date of commonDates) {
      const energyLevels = energyByDate.get(date)!;
      const avgEnergy = energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length;
      const mood = moodByDate.get(date)!;
      pairs.push([avgEnergy, mood]);
    }

    const correlation = this.calculateCorrelation(pairs);

    if (Math.abs(correlation) < 0.4) return null;

    return {
      systems: ['energy', 'mood'],
      pattern: correlation > 0
        ? 'Higher energy levels correlate with better mood'
        : 'Higher energy correlates with lower mood (might indicate anxiety)',
      strength: Math.abs(correlation),
      direction: correlation > 0 ? 'positive' : 'negative',
      evidence: pairs.map(([e, m]) => `${e.toFixed(1)}/5 energy → ${m}/5 mood`),
    };
  }

  /**
   * Analyze Exercise → Mood correlation
   */
  private analyzeExerciseMood(healthEntries: any[], moodEntries: any[]): SystemCorrelation | null {
    const exerciseByDate = new Map<string, boolean>();
    for (const entry of healthEntries) {
      if (entry.exercise) {
        exerciseByDate.set(entry.date, true);
      }
    }

    const moodByDate = new Map<string, number>();
    for (const entry of moodEntries) {
      if (entry.valence) {
        moodByDate.set(entry.date, entry.valence);
      }
    }

    const daysWithExercise: number[] = [];
    const daysWithoutExercise: number[] = [];

    for (const [date, mood] of moodByDate.entries()) {
      if (exerciseByDate.has(date)) {
        daysWithExercise.push(mood);
      } else {
        daysWithoutExercise.push(mood);
      }
    }

    if (daysWithExercise.length < 2 || daysWithoutExercise.length < 2) return null;

    const avgWithExercise = daysWithExercise.reduce((a, b) => a + b, 0) / daysWithExercise.length;
    const avgWithoutExercise = daysWithoutExercise.reduce((a, b) => a + b, 0) / daysWithoutExercise.length;

    const difference = avgWithExercise - avgWithoutExercise;

    if (Math.abs(difference) < 0.5) return null;

    return {
      systems: ['health', 'mood'],
      pattern: difference > 0
        ? 'Exercise days show better mood'
        : 'Non-exercise days show better mood (rest might be needed)',
      strength: Math.min(Math.abs(difference) / 2, 1),
      direction: difference > 0 ? 'positive' : 'negative',
      evidence: [
        `Avg mood with exercise: ${avgWithExercise.toFixed(1)}/5`,
        `Avg mood without exercise: ${avgWithoutExercise.toFixed(1)}/5`,
        `Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(1)}`,
      ],
    };
  }

  /**
   * Analyze Learning → Mood correlation
   */
  private analyzeLearningMood(learningEntries: any[], moodEntries: any[]): SystemCorrelation | null {
    const learningByDate = new Map<string, number>();
    for (const entry of learningEntries) {
      learningByDate.set(entry.date, (learningByDate.get(entry.date) || 0) + 1);
    }

    const moodByDate = new Map<string, number>();
    for (const entry of moodEntries) {
      if (entry.valence) {
        moodByDate.set(entry.date, entry.valence);
      }
    }

    const daysWithLearning: number[] = [];
    const daysWithoutLearning: number[] = [];

    for (const [date, mood] of moodByDate.entries()) {
      if (learningByDate.has(date)) {
        daysWithLearning.push(mood);
      } else {
        daysWithoutLearning.push(mood);
      }
    }

    if (daysWithLearning.length < 2) return null;

    const avgWithLearning = daysWithLearning.reduce((a, b) => a + b, 0) / daysWithLearning.length;
    const avgWithoutLearning = daysWithoutLearning.length > 0
      ? daysWithoutLearning.reduce((a, b) => a + b, 0) / daysWithoutLearning.length
      : null;

    if (avgWithoutLearning === null) {
      return {
        systems: ['learning', 'mood'],
        pattern: 'Learning sessions consistently present on logged days',
        strength: 0.6,
        direction: 'positive',
        evidence: [`Learning present on all ${daysWithLearning.length} tracked days`],
      };
    }

    const difference = avgWithLearning - avgWithoutLearning;

    if (Math.abs(difference) < 0.3) return null;

    return {
      systems: ['learning', 'mood'],
      pattern: difference > 0
        ? 'Learning days correlate with better mood'
        : 'Non-learning days show better mood (might need balance)',
      strength: Math.min(Math.abs(difference) / 2, 1),
      direction: difference > 0 ? 'positive' : 'negative',
      evidence: [
        `Avg mood with learning: ${avgWithLearning.toFixed(1)}/5`,
        `Avg mood without learning: ${avgWithoutLearning.toFixed(1)}/5`,
      ],
    };
  }

  /**
   * Analyze Sleep → Mood correlation
   */
  private analyzeSleepMood(healthEntries: any[], moodEntries: any[]): SystemCorrelation | null {
    const sleepByDate = new Map<string, number>();
    for (const entry of healthEntries) {
      if (entry.sleep_hours) {
        sleepByDate.set(entry.date, entry.sleep_hours);
      }
    }

    const moodByDate = new Map<string, number>();
    for (const entry of moodEntries) {
      if (entry.valence) {
        moodByDate.set(entry.date, entry.valence);
      }
    }

    const commonDates = Array.from(sleepByDate.keys()).filter(date => moodByDate.has(date));

    if (commonDates.length < 3) return null;

    const pairs: Array<[number, number]> = [];
    for (const date of commonDates) {
      const sleep = sleepByDate.get(date)!;
      const mood = moodByDate.get(date)!;
      pairs.push([sleep, mood]);
    }

    const correlation = this.calculateCorrelation(pairs);

    if (Math.abs(correlation) < 0.4) return null;

    return {
      systems: ['health', 'mood'],
      pattern: correlation > 0
        ? 'Better sleep correlates with better mood'
        : 'More sleep correlates with worse mood (might indicate depression or oversleeping)',
      strength: Math.abs(correlation),
      direction: correlation > 0 ? 'positive' : 'negative',
      evidence: pairs.map(([s, m]) => `${s}hrs sleep → ${m}/5 mood`),
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(pairs: Array<[number, number]>): number {
    const n = pairs.length;
    if (n < 2) return 0;

    const xMean = pairs.reduce((sum, [x]) => sum + x, 0) / n;
    const yMean = pairs.reduce((sum, [, y]) => sum + y, 0) / n;

    let numerator = 0;
    let xVariance = 0;
    let yVariance = 0;

    for (const [x, y] of pairs) {
      const xDiff = x - xMean;
      const yDiff = y - yMean;
      numerator += xDiff * yDiff;
      xVariance += xDiff * xDiff;
      yVariance += yDiff * yDiff;
    }

    const denominator = Math.sqrt(xVariance * yVariance);

    if (denominator === 0) return 0;

    return numerator / denominator;
  }
}

// Singleton instance
let engineInstance: CorrelationEngine | null = null;

export function getCorrelationEngine(): CorrelationEngine {
  if (!engineInstance) {
    engineInstance = new CorrelationEngine();
  }
  return engineInstance;
}

export default getCorrelationEngine();
