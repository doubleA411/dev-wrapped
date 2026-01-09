import simpleGit, { SimpleGit, LogResult } from 'simple-git';
import { format, startOfYear, endOfYear, eachDayOfInterval, parseISO, addDays } from 'date-fns';

export interface GitStats {
  year: number;
  repoName: string;
  totalCommits: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  netLines: number;
  commitsByMonth: { month: string; count: number }[];
  commitsByDay: { date: string; count: number }[];
  longestStreak: number;
  currentStreak: number;
  mostActiveDay: string;
  mostActiveHour: number;
  topLanguages: { language: string; files: number; lines: number }[];
  firstCommit: string;
  lastCommit: string;
  averageCommitsPerDay: number;
  busiestWeek: { week: string; commits: number };
  authorName: string;
  authorEmail: string;
}

export async function getGitStats(repoPath: string = '.', authorEmail?: string, year?: number): Promise<GitStats> {
  const git: SimpleGit = simpleGit(repoPath);
  
  // Get repository name from the remote URL or folder name
  let repoName = '';
  try {
    const remotes = await git.getRemotes(true);
    if (remotes.length > 0 && remotes[0].refs.fetch) {
      // Extract repo name from git URL (e.g., https://github.com/user/repo.git -> repo)
      const url = remotes[0].refs.fetch;
      const match = url.match(/\/([^\/]+?)(\.git)?$/);
      repoName = match ? match[1] : '';
    }
  } catch (e) {
    // Fallback to folder name
  }
  
  // If no remote or failed, use folder name
  if (!repoName) {
    const path = require('path');
    repoName = path.basename(process.cwd());
  }
  
  // Get current git user info
  let authorName = '';
  let authorEmailAddress = authorEmail || '';
  
  try {
    if (!authorEmailAddress) {
      authorEmailAddress = await git.getConfig('user.email').then(result => result.value || '');
    }
    authorName = await git.getConfig('user.name').then(result => result.value || '');
  } catch (e) {
    // If can't get config, try to get from commits
  }
  
  // Use provided year or default to current year
  const currentYear = year || new Date().getFullYear();
  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 0, 1));
  
  // Format dates for git (YYYY-MM-DD format)
  const sinceDate = format(yearStart, 'yyyy-MM-dd');
  const untilDate = format(addDays(yearEnd, 1), 'yyyy-MM-dd'); // Add 1 day to include the last day
  
  // Get all commits for the year using raw git command for better control
  interface CommitInfo {
    hash: string;
    date: string;
    message: string;
  }
  
  let commits: CommitInfo[] = [];
  let totalCommits = 0;
  
  try {
    // Use raw git log command to avoid simple-git date parsing issues
    // Filter by author if email is provided
    const gitArgs = [
      'log',
      `--since=${sinceDate}`,
      `--until=${untilDate}`,
    ];
    
    if (authorEmailAddress) {
      gitArgs.push(`--author=${authorEmailAddress}`);
    }
    
    gitArgs.push('--format=%H|%ai|%an|%ae|%s', '--');
    
    const logOutput = await git.raw(gitArgs);
    
    if (logOutput && logOutput.trim()) {
      const lines = logOutput.trim().split('\n');
      commits = lines.map(line => {
        const parts = line.split('|');
        const hash = parts[0] || '';
        const date = parts[1] || new Date().toISOString();
        const author = parts[2] || '';
        const email = parts[3] || '';
        const message = parts.slice(4).join('|') || '';
        
        // Update author info from first commit if not set
        if (!authorName && author) {
          authorName = author;
        }
        if (!authorEmailAddress && email) {
          authorEmailAddress = email;
        }
        
        return {
          hash,
          date,
          message,
        };
      });
      totalCommits = commits.length;
    }
  } catch (error: any) {
    // Fallback to simple-git log method
    try {
      const log: LogResult = await git.log({
        since: sinceDate,
        until: untilDate,
      });
      // Convert simple-git commit format to our format
      commits = log.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
      }));
      totalCommits = commits.length;
    } catch (fallbackError: any) {
      throw new Error(`Failed to get git log: ${error.message || fallbackError.message}`);
    }
  }
  
  // Calculate lines added/deleted using git log --shortstat (more efficient)
  let totalLinesAdded = 0;
  let totalLinesDeleted = 0;
  
  const commitsByMonth: { [key: string]: number } = {};
  const commitsByDay: { [key: string]: number } = {};
  const commitsByHour: { [key: number]: number } = {};
  const commitDates: Date[] = [];
  
  // Get stats using git log with numstat (most accurate, matches standard git stats)
  try {
    const gitArgs = [
      'log',
      '--no-merges', // Exclude merge commits for accurate stats
      `--since=${sinceDate}`,
      `--until=${untilDate}`,
    ];
    
    if (authorEmailAddress) {
      gitArgs.push(`--author=${authorEmailAddress}`);
    }
    
    gitArgs.push('--pretty=tformat:', '--numstat', '--');
    
    const logWithStats = await git.raw(gitArgs);
    
    // Parse numstat output: <added> <deleted> <filename>
    // Empty lines and lines starting with - (binary files) should be skipped
    const lines = logWithStats.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Skip binary files (lines starting with -)
      if (line.startsWith('-')) {
        continue;
      }
      
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const added = parseInt(parts[0] || '0', 10);
        const deleted = parseInt(parts[1] || '0', 10);
        
        if (!isNaN(added)) totalLinesAdded += added;
        if (!isNaN(deleted)) totalLinesDeleted += deleted;
      }
    }
  } catch (e) {
    // Fallback: calculate from individual commits
    console.warn('Could not get aggregate stats, calculating from individual commits...');
    for (const commit of commits.slice(0, 100)) { // Limit to first 100 for performance
      try {
        const diff = await git.show([commit.hash, '--stat', '--format=']);
        const lines = diff.match(/(\d+)\s+files? changed(?:,\s+(\d+)\s+insertions?)?(?:,\s+(\d+)\s+deletions?)?/);
        if (lines) {
          totalLinesAdded += parseInt(lines[2] || '0', 10);
          totalLinesDeleted += parseInt(lines[3] || '0', 10);
        }
      } catch (err) {
        // Skip if can't get diff
      }
    }
  }
  
  // Process commits for other statistics
  for (const commit of commits) {
    // Parse date - handle both ISO format and git date format
    let date: Date;
    if (commit.date.includes('T') || commit.date.includes('+') || commit.date.includes('-')) {
      date = new Date(commit.date);
    } else {
      // Git date format: 2024-01-01 12:00:00 +0000
      date = new Date(commit.date.replace(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2'));
    }
    
    if (isNaN(date.getTime())) {
      // Skip invalid dates
      continue;
    }
    
    commitDates.push(date);
    
    const monthKey = format(date, 'MMMM');
    const dayKey = format(date, 'yyyy-MM-dd');
    const hour = date.getHours();
    
    commitsByMonth[monthKey] = (commitsByMonth[monthKey] || 0) + 1;
    commitsByDay[dayKey] = (commitsByDay[dayKey] || 0) + 1;
    commitsByHour[hour] = (commitsByHour[hour] || 0) + 1;
  }
  
  // Calculate streaks
  const sortedDates = commitDates.sort((a, b) => a.getTime() - b.getTime());
  const uniqueDays = Array.from(new Set(sortedDates.map(d => format(d, 'yyyy-MM-dd'))));
  
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 1;
  
  const daySet = new Set(uniqueDays);
  
  // Calculate longest streak
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = parseISO(uniqueDays[i - 1]);
    const curr = parseISO(uniqueDays[i]);
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // Calculate current streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let checkDate = new Date(today);
  
  while (daySet.has(format(checkDate, 'yyyy-MM-dd'))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  // Most active day
  const mostActiveDay = Object.entries(commitsByDay)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  
  // Most active hour
  const mostActiveHour = Object.entries(commitsByHour)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '12';
  
  // Busiest week
  const commitsByWeek: { [key: string]: number } = {};
  uniqueDays.forEach(day => {
    const date = parseISO(day);
    const weekStart = format(date, 'yyyy-MM-dd');
    commitsByWeek[weekStart] = (commitsByWeek[weekStart] || 0) + commitsByDay[day];
  });
  
  const busiestWeek = Object.entries(commitsByWeek)
    .sort((a, b) => b[1] - a[1])[0] || ['', 0];
  
  // Get file statistics for languages
  const topLanguages: { [key: string]: { files: number; lines: number } } = {};
  try {
    const files = await git.raw(['ls-tree', '-r', '--name-only', 'HEAD']);
    const fileList = files.split('\n').filter(Boolean);
    
    for (const file of fileList) {
      const ext = file.split('.').pop()?.toLowerCase();
      if (ext) {
        const lang = getLanguageFromExtension(ext);
        if (lang) {
          if (!topLanguages[lang]) {
            topLanguages[lang] = { files: 0, lines: 0 };
          }
          topLanguages[lang].files++;
        }
      }
    }
  } catch (e) {
    // Skip if can't get file list
  }
  
  const firstCommit = commits[commits.length - 1]?.date || '';
  const lastCommit = commits[0]?.date || '';
  
  const daysInYear = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const averageCommitsPerDay = totalCommits / daysInYear;
  
  return {
    year: currentYear,
    repoName,
    totalCommits,
    totalLinesAdded,
    totalLinesDeleted,
    netLines: totalLinesAdded - totalLinesDeleted,
    commitsByMonth: Object.entries(commitsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      }),
    commitsByDay: Object.entries(commitsByDay).map(([date, count]) => ({ date, count })),
    longestStreak,
    currentStreak,
    mostActiveDay,
    mostActiveHour: parseInt(mostActiveHour, 10),
    topLanguages: Object.entries(topLanguages)
      .map(([language, stats]) => ({ language, ...stats }))
      .sort((a, b) => b.files - a.files)
      .slice(0, 5),
    firstCommit,
    lastCommit,
    averageCommitsPerDay: Math.round(averageCommitsPerDay * 100) / 100,
    busiestWeek: { week: busiestWeek[0], commits: busiestWeek[1] },
    authorName: authorName || 'Unknown',
    authorEmail: authorEmailAddress || '',
  };
}

function getLanguageFromExtension(ext: string): string | null {
  const languageMap: { [key: string]: string } = {
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'jsx': 'React',
    'tsx': 'React',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'go': 'Go',
    'rs': 'Rust',
    'rb': 'Ruby',
    'php': 'PHP',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'scala': 'Scala',
    'r': 'R',
    'm': 'Objective-C',
    'mm': 'Objective-C++',
    'vue': 'Vue',
    'svelte': 'Svelte',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'SASS',
    'sh': 'Shell',
    'bash': 'Bash',
    'sql': 'SQL',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'xml': 'XML',
    'md': 'Markdown',
  };
  
  return languageMap[ext] || null;
}

