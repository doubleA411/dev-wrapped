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

  const spinner = ora('Analyzing your git history...').start();

  try {
    const stats = await getGitStats(repoPath);
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

