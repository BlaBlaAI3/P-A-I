/**
 * BUDDY Note Analyzer
 * Extracts insights, themes, and patterns from Obsidian notes
 */

import { getVaultParser, Note } from './vault-parser';
import { getLogger } from './logger';

const logger = getLogger();
const vault = getVaultParser();

export interface Theme {
  name: string;
  frequency: number;
  notes: string[];
  keywords: string[];
}

export interface ExtractedInsight {
  type: 'habit' | 'goal' | 'challenge' | 'value' | 'pattern' | 'learning';
  content: string;
  source_note: string;
  confidence: number;
  context?: string;
}

export class NoteAnalyzer {
  /**
   * Extract recurring themes from all notes
   */
  public extractThemes(limit: number = 10): Theme[] {
    logger.info('ANALYZER', 'Extracting themes from vault');

    const allNotes = vault.getAllNotes();
    const tagFrequency = new Map<string, { count: number; notes: Set<string> }>();

    // Analyze tags
    for (const notePath of allNotes) {
      const note = vault.readNote(notePath);
      if (!note) continue;

      for (const tag of note.tags) {
        if (!tagFrequency.has(tag)) {
          tagFrequency.set(tag, { count: 0, notes: new Set() });
        }
        const data = tagFrequency.get(tag)!;
        data.count++;
        data.notes.add(notePath);
      }
    }

    // Convert to themes
    const themes: Theme[] = [];
    for (const [tag, data] of tagFrequency.entries()) {
      themes.push({
        name: tag,
        frequency: data.count,
        notes: Array.from(data.notes),
        keywords: [tag],
      });
    }

    // Sort by frequency and limit
    themes.sort((a, b) => b.frequency - a.frequency);
    return themes.slice(0, limit);
  }

  /**
   * Extract insights from notes based on patterns
   */
  public extractInsights(notePaths?: string[]): ExtractedInsight[] {
    logger.info('ANALYZER', 'Extracting insights from notes');

    const paths = notePaths || vault.getAllNotes();
    const insights: ExtractedInsight[] = [];

    for (const notePath of paths) {
      const note = vault.readNote(notePath);
      if (!note) continue;

      // Look for goal indicators
      insights.push(...this.extractGoals(note));

      // Look for habit mentions
      insights.push(...this.extractHabits(note));

      // Look for challenges
      insights.push(...this.extractChallenges(note));

      // Look for values
      insights.push(...this.extractValues(note));

      // Look for learnings
      insights.push(...this.extractLearnings(note));
    }

    return insights;
  }

  /**
   * Extract potential goals from a note
   */
  private extractGoals(note: Note): ExtractedInsight[] {
    const insights: ExtractedInsight[] = [];
    const content = note.content.toLowerCase();

    const goalPatterns = [
      /\bgoal[s]?:\s*(.+)/gi,
      /\bi want to\s+(.+)/gi,
      /\bi will\s+(.+)/gi,
      /\bi'm going to\s+(.+)/gi,
      /\bplan to\s+(.+)/gi,
      /\baim[ing]? to\s+(.+)/gi,
    ];

    for (const pattern of goalPatterns) {
      const matches = note.content.matchAll(pattern);
      for (const match of matches) {
        const goalText = match[1].trim().split(/[.!?\n]/)[0]; // Get first sentence
        if (goalText.length > 5 && goalText.length < 200) {
          insights.push({
            type: 'goal',
            content: goalText,
            source_note: note.path,
            confidence: 0.7,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Extract habits from a note
   */
  private extractHabits(note: Note): ExtractedInsight[] {
    const insights: ExtractedInsight[] = [];

    const habitPatterns = [
      /\bhabit[s]?:\s*(.+)/gi,
      /\bdaily\s+(.+)/gi,
      /\bevery\s+(day|morning|evening|night)\s+(.+)/gi,
      /\broutine[s]?:\s*(.+)/gi,
    ];

    for (const pattern of habitPatterns) {
      const matches = note.content.matchAll(pattern);
      for (const match of matches) {
        const habitText = (match[2] || match[1]).trim().split(/[.!?\n]/)[0];
        if (habitText.length > 5 && habitText.length < 150) {
          insights.push({
            type: 'habit',
            content: habitText,
            source_note: note.path,
            confidence: 0.6,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Extract challenges from a note
   */
  private extractChallenges(note: Note): ExtractedInsight[] {
    const insights: ExtractedInsight[] = [];

    const challengePatterns = [
      /\bchallenge[s]?:\s*(.+)/gi,
      /\bstruggl(?:e|ing) with\s+(.+)/gi,
      /\bdifficult[y]?\s+(.+)/gi,
      /\bproblem:\s*(.+)/gi,
      /\bissue:\s*(.+)/gi,
    ];

    for (const pattern of challengePatterns) {
      const matches = note.content.matchAll(pattern);
      for (const match of matches) {
        const challengeText = match[1].trim().split(/[.!?\n]/)[0];
        if (challengeText.length > 5 && challengeText.length < 200) {
          insights.push({
            type: 'challenge',
            content: challengeText,
            source_note: note.path,
            confidence: 0.65,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Extract values from a note
   */
  private extractValues(note: Note): ExtractedInsight[] {
    const insights: ExtractedInsight[] = [];

    const valuePatterns = [
      /\bvalue[s]?:\s*(.+)/gi,
      /\bi believe in\s+(.+)/gi,
      /\bimportant to me:\s*(.+)/gi,
      /\bprinciple[s]?:\s*(.+)/gi,
    ];

    for (const pattern of valuePatterns) {
      const matches = note.content.matchAll(pattern);
      for (const match of matches) {
        const valueText = match[1].trim().split(/[.!?\n]/)[0];
        if (valueText.length > 3 && valueText.length < 100) {
          insights.push({
            type: 'value',
            content: valueText,
            source_note: note.path,
            confidence: 0.75,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Extract learnings from a note
   */
  private extractLearnings(note: Note): ExtractedInsight[] {
    const insights: ExtractedInsight[] = [];

    const learningPatterns = [
      /\blearned:\s*(.+)/gi,
      /\blearning:\s*(.+)/gi,
      /\blesson:\s*(.+)/gi,
      /\btakeaway:\s*(.+)/gi,
      /\binsight:\s*(.+)/gi,
      /\brealized that\s+(.+)/gi,
    ];

    for (const pattern of learningPatterns) {
      const matches = note.content.matchAll(pattern);
      for (const match of matches) {
        const learningText = match[1].trim().split(/[.!?\n]/)[0];
        if (learningText.length > 10 && learningText.length < 250) {
          insights.push({
            type: 'learning',
            content: learningText,
            source_note: note.path,
            confidence: 0.8,
          });
        }
      }
    }

    return insights;
  }

  /**
   * Analyze recent notes for patterns
   */
  public analyzeRecentActivity(days: number = 7): {
    note_count: number;
    themes: string[];
    activity_level: 'low' | 'medium' | 'high';
    focus_areas: string[];
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentNotes = vault.getRecentNotes(100).filter(note => {
      return note.modified && note.modified >= cutoffDate;
    });

    const tags = new Set<string>();
    for (const note of recentNotes) {
      note.tags.forEach(tag => tags.add(tag));
    }

    let activityLevel: 'low' | 'medium' | 'high' = 'low';
    if (recentNotes.length > 20) activityLevel = 'high';
    else if (recentNotes.length > 7) activityLevel = 'medium';

    return {
      note_count: recentNotes.length,
      themes: Array.from(tags).slice(0, 10),
      activity_level: activityLevel,
      focus_areas: Array.from(tags).slice(0, 5),
    };
  }

  /**
   * Find notes related to a topic
   */
  public findRelatedNotes(topic: string, limit: number = 10): Note[] {
    const allNotes = vault.getAllNotes();
    const scored: { note: Note; score: number }[] = [];

    const searchTerms = topic.toLowerCase().split(/\s+/);

    for (const notePath of allNotes) {
      const note = vault.readNote(notePath);
      if (!note) continue;

      let score = 0;
      const content = note.content.toLowerCase();
      const name = note.name.toLowerCase();

      // Score based on matches
      for (const term of searchTerms) {
        // Title matches worth more
        if (name.includes(term)) score += 10;

        // Tag matches
        for (const tag of note.tags) {
          if (tag.toLowerCase().includes(term)) score += 5;
        }

        // Content matches
        const matches = (content.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      }

      if (score > 0) {
        scored.push({ note, score });
      }
    }

    // Sort by score and return top results
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(item => item.note);
  }

  /**
   * Build knowledge graph from vault
   */
  public buildKnowledgeGraph(): {
    nodes: { id: string; label: string; type: string }[];
    edges: { from: string; to: string; weight: number }[];
  } {
    logger.info('ANALYZER', 'Building knowledge graph from vault');

    const nodes: { id: string; label: string; type: string }[] = [];
    const edges: Map<string, { from: string; to: string; weight: number }> = new Map();

    const allNotes = vault.getAllNotes();

    // Create nodes for each note
    for (const notePath of allNotes) {
      const note = vault.readNote(notePath);
      if (!note) continue;

      nodes.push({
        id: notePath,
        label: note.name,
        type: 'note',
      });

      // Create edges for links
      for (const link of note.links) {
        const edgeKey = `${notePath}->${link}`;
        if (!edges.has(edgeKey)) {
          edges.set(edgeKey, {
            from: notePath,
            to: link,
            weight: 1,
          });
        } else {
          edges.get(edgeKey)!.weight++;
        }
      }
    }

    return {
      nodes,
      edges: Array.from(edges.values()),
    };
  }
}

// Singleton instance
let analyzerInstance: NoteAnalyzer | null = null;

export function getNoteAnalyzer(): NoteAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new NoteAnalyzer();
  }
  return analyzerInstance;
}

export default getNoteAnalyzer();
