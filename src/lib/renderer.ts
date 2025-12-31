import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { GitStats } from './git-stats';
import { format, parseISO } from 'date-fns';

export function renderStats(stats: GitStats) {
  // Header with ASCII art
  const header = gradient.rainbow.multiline(
    figlet.textSync(`${stats.year} WRAPPED`, { font: 'Small', horizontalLayout: 'fitted' })
  );
  console.log(header);
  console.log('\n');

  // Helper function to create horizontal boxes
  const createHorizontalBoxes = (boxes: string[]): void => {
    const allLines = boxes.map(box => box.split('\n'));
    const maxLines = Math.max(...allLines.map(lines => lines.length));
    
    for (let i = 0; i < maxLines; i++) {
      const line = allLines.map(lines => lines[i] || '').join('');
      console.log(line);
    }
  };

  // Main stats - horizontal layout (4 boxes side by side)
  const statsRow1 = boxen(
    [
      chalk.bold.cyan(`📊 TOTAL COMMITS`),
      chalk.white.bold(`   ${stats.totalCommits.toLocaleString()}`),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 0, left: 1, right: 0.5 },
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  );
  
  const statsRow2 = boxen(
    [
      chalk.bold.green(`➕ LINES ADDED`),
      chalk.white.bold(`   ${stats.totalLinesAdded.toLocaleString()}`),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 0, left: 0.5, right: 0.5 },
      borderStyle: 'round',
      borderColor: 'green',
    }
  );
  
  const statsRow3 = boxen(
    [
      chalk.bold.red(`➖ LINES DELETED`),
      chalk.white.bold(`   ${stats.totalLinesDeleted.toLocaleString()}`),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 0, left: 0.5, right: 0.5 },
      borderStyle: 'round',
      borderColor: 'red',
    }
  );
  
  const statsRow4 = boxen(
    [
      chalk.bold.blue(`📈 NET CHANGE`),
      chalk.white.bold(`   ${stats.netLines > 0 ? '+' : ''}${stats.netLines.toLocaleString()}`),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0.5, right: 1 },
      borderStyle: 'round',
      borderColor: 'blue',
    }
  );
  
  createHorizontalBoxes([statsRow1, statsRow2, statsRow3, statsRow4]);

  // Streaks and Busiest Week - horizontal layout (2 boxes side by side)
  const longestStreakBox = boxen(
    [
      chalk.bold.yellow(`🔥 LONGEST STREAK`),
      chalk.white.bold(`   ${stats.longestStreak} days`),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 1, right: 0.5 },
      borderStyle: 'round',
      borderColor: 'yellow',
    }
  );
  
  const busiestWeekBox = boxen(
    [
      chalk.bold.red(`🚀 BUSIEST WEEK`),
      chalk.white(
        stats.busiestWeek.week 
          ? `${format(parseISO(stats.busiestWeek.week), 'MMM d, yyyy')} • ${stats.busiestWeek.commits} commits`
          : 'N/A'
      ),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0.5, right: 1 },
      borderStyle: 'round',
      borderColor: 'red',
    }
  );
  
  createHorizontalBoxes([longestStreakBox, busiestWeekBox]);

  // Commits by month and Top languages - side by side
  console.log(chalk.bold.cyan('\n📅 COMMITS BY MONTH'));
  
  // Create months box
  const monthsContent: string[] = [];
  const maxCommits = Math.max(...stats.commitsByMonth.map(m => m.count));
  stats.commitsByMonth.forEach(({ month, count }) => {
    const barLength = Math.floor((count / maxCommits) * 20);
    const bar = '█'.repeat(barLength);
    const monthShort = month.substring(0, 3);
    monthsContent.push(
      chalk.gray(`${monthShort.padEnd(8)}`) +
      chalk.cyan(bar) +
      chalk.white(` ${count}`)
    );
  });
  
  const monthsBox = boxen(
    monthsContent.join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 1, right: 0.5 },
      borderStyle: 'round',
      borderColor: 'cyan',
    }
  );
  
  // Create languages box
  if (stats.topLanguages.length > 0) {
    const languagesContent: string[] = [];
    stats.topLanguages.forEach((lang, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
      languagesContent.push(
        chalk.yellow(`${medal} ${lang.language.padEnd(12)}`) +
        chalk.gray(`${lang.files} files`)
      );
    });
    
    const languagesBox = boxen(
      [
        chalk.bold.cyan('💻 TOP LANGUAGES'),
        '',
        ...languagesContent,
      ].join('\n'),
      {
        padding: 1,
        margin: { top: 0, bottom: 1, left: 0.5, right: 1 },
        borderStyle: 'round',
        borderColor: 'cyan',
      }
    );
    
    createHorizontalBoxes([monthsBox, languagesBox]);
  } else {
    console.log(monthsBox);
  }

  // Most active day and hour - horizontal layout (3 boxes side by side)
  const activeDayBox = boxen(
    [
      chalk.bold.green(`📆 MOST ACTIVE DAY`),
      chalk.white(
        format(parseISO(stats.mostActiveDay), 'EEE, MMM d, yyyy')
      ),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 1, right: 0.5 },
      borderStyle: 'round',
      borderColor: 'green',
    }
  );
  
  const activeHourBox = boxen(
    [
      chalk.bold.blue(`🕐 MOST ACTIVE HOUR`),
      chalk.white(`${stats.mostActiveHour}:00`),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0.5, right: 0.5 },
      borderStyle: 'round',
      borderColor: 'blue',
    }
  );
  
  const avgCommitsBox = boxen(
    [
      chalk.bold.magenta(`📊 AVG COMMITS/DAY`),
      chalk.white(`${stats.averageCommitsPerDay}`),
    ].join('\n'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0.5, right: 1 },
      borderStyle: 'round',
      borderColor: 'magenta',
    }
  );
  
  createHorizontalBoxes([activeDayBox, activeHourBox, avgCommitsBox]);

  // Footer
  console.log(
    boxen(
      chalk.gray('Generated with ❤️  using your git history'),
      {
        padding: 1,
        margin: { top: 0, bottom: 1, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'gray',
      }
    )
  );
}

