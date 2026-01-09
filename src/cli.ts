#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import simpleGit from 'simple-git';
import chalk from 'chalk';
import { getGitStats, GitStats } from './lib/git-stats';
import { renderStats } from './lib/renderer';
import { generateImage } from './lib/image-generator';
import ora from 'ora';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let year: number | undefined;
  
  // Look for --year flag
  const yearIndex = args.findIndex((arg: string) => arg === '--year' || arg === '-y');
  if (yearIndex !== -1 && args[yearIndex + 1]) {
    const yearArg = parseInt(args[yearIndex + 1], 10);
    if (Number.isNaN(yearArg) || yearArg < 1900 || yearArg > new Date().getFullYear() + 1) {
      console.error('❌ Error: Invalid year. Please provide a valid year (e.g., --year 2024)');
      process.exit(1);
    }
    year = yearArg;
  }
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.bold('\n📊 Wrap It - Git Stats Wrapped\n'));
    console.log('Usage: wrap-it [options]\n');
    console.log('Options:');
    console.log('  --year, -y <year>  Generate stats for a specific year (default: current year)');
    console.log('  --help, -h         Show this help message\n');
    console.log('Examples:');
    console.log('  wrap-it              # Generate stats for current year');
    console.log('  wrap-it --year 2023  # Generate stats for 2023');
    console.log('  wrap-it -y 2024      # Generate stats for 2024\n');
    process.exit(0);
  }
  
  // Get the current working directory
  const repoPath = process.cwd();
  
  // Check if it's a git repository
  const gitPath = path.join(repoPath, '.git');
  if (!fs.existsSync(gitPath)) {
    console.error('❌ Error: Not a git repository. Please run this command in a directory with a .git folder.');
    process.exit(1);
  }

  // Verify it's actually a git repo
  const git = simpleGit(repoPath);
  try {
    await git.status();
  } catch (e) {
    console.error('❌ Error: Not a valid git repository.');
    process.exit(1);
  }

  const displayYear = year || new Date().getFullYear();
  const spinner = ora(`Analyzing your git history for ${displayYear}...`).start();

  try {
    const stats = await getGitStats(repoPath, undefined, year);
    spinner.succeed('Analysis complete!');

    // Render stats in terminal
    console.log('\n');
    renderStats(stats);

    // Generate and save image (optional)
    try {
      spinner.start('Generating image...');
      const imagePath = await generateImage(stats, repoPath);
      spinner.succeed(`Image saved to: ${imagePath}`);
    } catch (error: any) {
      spinner.warn('Could not generate image: ' + error.message);
      console.log(chalk.yellow('💡 Tip: Install canvas dependencies for image generation'));
    }

  } catch (error: any) {
    spinner.fail('Failed to generate wrapped');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

