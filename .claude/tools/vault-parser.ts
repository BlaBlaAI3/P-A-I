/**
 * BUDDY Vault Parser
 * Tools for reading and understanding Obsidian vault structure
 */

import * as fs from 'fs';
import * as path from 'path';
import { getLogger } from './logger';

const logger = getLogger();

export interface Frontmatter {
  [key: string]: any;
}

export interface Note {
  path: string;
  name: string;
  content: string;
  frontmatter: Frontmatter | null;
  tags: string[];
  links: string[];
  created?: Date;
  modified?: Date;
}

export interface VaultInfo {
  path: string;
  name: string;
  noteCount: number;
  folders: string[];
  plugins: string[];
}

export class VaultParser {
  private vaultPath: string;

  constructor(vaultPath?: string) {
    this.vaultPath = vaultPath || this.detectVaultPath();
    logger.info('VAULT', `Initialized vault parser at: ${this.vaultPath}`);
  }

  /**
   * Detect Obsidian vault location
   * Looks for .obsidian directory to confirm vault
   */
  private detectVaultPath(): string {
    const cwd = process.cwd();
    const obsidianDir = path.join(cwd, '.obsidian');

    if (fs.existsSync(obsidianDir)) {
      logger.info('VAULT', `Detected vault at: ${cwd}`);
      return cwd;
    }

    // Search parent directories
    let currentPath = cwd;
    for (let i = 0; i < 5; i++) {
      const parentPath = path.dirname(currentPath);
      const obsidianCheck = path.join(parentPath, '.obsidian');

      if (fs.existsSync(obsidianCheck)) {
        logger.info('VAULT', `Detected vault at: ${parentPath}`);
        return parentPath;
      }

      if (parentPath === currentPath) break; // Reached root
      currentPath = parentPath;
    }

    logger.warn('VAULT', 'No Obsidian vault detected, using current directory');
    return cwd;
  }

  /**
   * Get vault information
   */
  public getVaultInfo(): VaultInfo {
    const vaultName = path.basename(this.vaultPath);
    const notes = this.getAllNotes();
    const folders = this.getAllFolders();
    const plugins = this.getInstalledPlugins();

    return {
      path: this.vaultPath,
      name: vaultName,
      noteCount: notes.length,
      folders,
      plugins,
    };
  }

  /**
   * Get all markdown files in vault
   */
  public getAllNotes(relativePath: string = ''): string[] {
    const fullPath = path.join(this.vaultPath, relativePath);
    const notes: string[] = [];

    try {
      const items = fs.readdirSync(fullPath);

      for (const item of items) {
        const itemPath = path.join(fullPath, item);
        const relPath = path.join(relativePath, item);

        // Skip .obsidian and .claude directories
        if (item === '.obsidian' || item === '.claude' || item === '.git') {
          continue;
        }

        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          notes.push(...this.getAllNotes(relPath));
        } else if (item.endsWith('.md')) {
          notes.push(relPath);
        }
      }
    } catch (error) {
      logger.error('VAULT', `Error reading directory: ${fullPath}`, {
        error: String(error),
      });
    }

    return notes;
  }

  /**
   * Get all folders in vault
   */
  public getAllFolders(relativePath: string = ''): string[] {
    const fullPath = path.join(this.vaultPath, relativePath);
    const folders: string[] = [];

    try {
      const items = fs.readdirSync(fullPath);

      for (const item of items) {
        const itemPath = path.join(fullPath, item);
        const relPath = path.join(relativePath, item);

        // Skip special directories
        if (item === '.obsidian' || item === '.claude' || item === '.git') {
          continue;
        }

        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          folders.push(relPath);
          folders.push(...this.getAllFolders(relPath));
        }
      }
    } catch (error) {
      logger.error('VAULT', `Error reading folders: ${fullPath}`, {
        error: String(error),
      });
    }

    return folders;
  }

  /**
   * Get installed Obsidian plugins
   */
  public getInstalledPlugins(): string[] {
    const pluginsPath = path.join(this.vaultPath, '.obsidian', 'plugins');

    try {
      if (fs.existsSync(pluginsPath)) {
        return fs.readdirSync(pluginsPath).filter(item => {
          const itemPath = path.join(pluginsPath, item);
          return fs.statSync(itemPath).isDirectory();
        });
      }
    } catch (error) {
      logger.error('VAULT', 'Error reading plugins', { error: String(error) });
    }

    return [];
  }

  /**
   * Parse frontmatter from note content
   */
  public parseFrontmatter(content: string): {
    frontmatter: Frontmatter | null;
    contentWithoutFrontmatter: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { frontmatter: null, contentWithoutFrontmatter: content };
    }

    const frontmatterText = match[1];
    const contentWithoutFrontmatter = content.slice(match[0].length);
    const frontmatter: Frontmatter = {};

    // Simple YAML parsing (basic key: value pairs)
    const lines = frontmatterText.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value: any = line.slice(colonIndex + 1).trim();

        // Try to parse as JSON
        if (value.startsWith('[') || value.startsWith('{')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string
          }
        } else if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        } else if (!isNaN(Number(value)) && value !== '') {
          value = Number(value);
        }

        frontmatter[key] = value;
      }
    }

    return { frontmatter, contentWithoutFrontmatter };
  }

  /**
   * Extract tags from note content
   */
  public extractTags(content: string): string[] {
    const tagRegex = /#[\w\-\/]+/g;
    const matches = content.match(tagRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Extract wiki links from note content
   */
  public extractLinks(content: string): string[] {
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const matches = content.matchAll(linkRegex);
    const links: string[] = [];

    for (const match of matches) {
      links.push(match[1].split('|')[0]); // Handle aliased links
    }

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Read and parse a note
   */
  public readNote(notePath: string): Note | null {
    const fullPath = path.join(this.vaultPath, notePath);

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const stats = fs.statSync(fullPath);
      const { frontmatter, contentWithoutFrontmatter } = this.parseFrontmatter(content);
      const tags = this.extractTags(content);
      const links = this.extractLinks(content);

      return {
        path: notePath,
        name: path.basename(notePath, '.md'),
        content: contentWithoutFrontmatter,
        frontmatter,
        tags,
        links,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error('VAULT', `Error reading note: ${notePath}`, {
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Search notes by tag
   */
  public findNotesByTag(tag: string): Note[] {
    const allNotes = this.getAllNotes();
    const matchingNotes: Note[] = [];

    for (const notePath of allNotes) {
      const note = this.readNote(notePath);
      if (note && note.tags.includes(tag)) {
        matchingNotes.push(note);
      }
    }

    return matchingNotes;
  }

  /**
   * Search notes by frontmatter field
   */
  public findNotesByFrontmatter(
    field: string,
    value?: any
  ): Note[] {
    const allNotes = this.getAllNotes();
    const matchingNotes: Note[] = [];

    for (const notePath of allNotes) {
      const note = this.readNote(notePath);
      if (!note || !note.frontmatter) continue;

      if (value === undefined) {
        // Just check if field exists
        if (field in note.frontmatter) {
          matchingNotes.push(note);
        }
      } else {
        // Check if field matches value
        if (note.frontmatter[field] === value) {
          matchingNotes.push(note);
        }
      }
    }

    return matchingNotes;
  }

  /**
   * Get recently modified notes
   */
  public getRecentNotes(limit: number = 10): Note[] {
    const allNotes = this.getAllNotes();
    const notes: Note[] = [];

    for (const notePath of allNotes) {
      const note = this.readNote(notePath);
      if (note) notes.push(note);
    }

    // Sort by modification date
    notes.sort((a, b) => {
      const timeA = a.modified?.getTime() || 0;
      const timeB = b.modified?.getTime() || 0;
      return timeB - timeA;
    });

    return notes.slice(0, limit);
  }

  /**
   * Create a new note
   */
  public createNote(
    notePath: string,
    content: string,
    frontmatter?: Frontmatter
  ): boolean {
    const fullPath = path.join(this.vaultPath, notePath);

    try {
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let finalContent = content;

      // Add frontmatter if provided
      if (frontmatter) {
        const frontmatterLines = ['---'];
        for (const [key, value] of Object.entries(frontmatter)) {
          if (typeof value === 'object') {
            frontmatterLines.push(`${key}: ${JSON.stringify(value)}`);
          } else {
            frontmatterLines.push(`${key}: ${value}`);
          }
        }
        frontmatterLines.push('---', '');
        finalContent = frontmatterLines.join('\n') + content;
      }

      fs.writeFileSync(fullPath, finalContent, 'utf8');
      logger.info('VAULT', `Created note: ${notePath}`);
      return true;
    } catch (error) {
      logger.error('VAULT', `Error creating note: ${notePath}`, {
        error: String(error),
      });
      return false;
    }
  }

  /**
   * Update an existing note
   */
  public updateNote(notePath: string, content: string): boolean {
    const fullPath = path.join(this.vaultPath, notePath);

    try {
      fs.writeFileSync(fullPath, content, 'utf8');
      logger.info('VAULT', `Updated note: ${notePath}`);
      return true;
    } catch (error) {
      logger.error('VAULT', `Error updating note: ${notePath}`, {
        error: String(error),
      });
      return false;
    }
  }
}

// Singleton instance
let parserInstance: VaultParser | null = null;

export function getVaultParser(): VaultParser {
  if (!parserInstance) {
    parserInstance = new VaultParser();
  }
  return parserInstance;
}

export default getVaultParser();
