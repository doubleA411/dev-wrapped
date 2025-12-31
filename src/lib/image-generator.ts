import { GitStats } from './git-stats';
import { format, parseISO, startOfYear, addDays, getDayOfYear } from 'date-fns';
import path from 'path';
import fs from 'fs';

export async function generateImage(stats: GitStats, repoPath: string): Promise<string> {
  let createCanvas: any;
  let registerFont: any;
  try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    registerFont = canvas.registerFont;
  } catch (e) {
    throw new Error('Canvas library not available. Please install system dependencies for node-canvas.');
  }
  
  // Register bundled fonts
  let fontFamily = 'Arial, Helvetica, sans-serif';
  let monoFont = '"Courier New", Courier, monospace';
  
  // Register bundled DM Sans for text
  try {
    const dmSansPath = path.join(__dirname, '..', '..', 'fonts', 'DMSans-Regular.woff');
    const dmSansBoldPath = path.join(__dirname, '..', '..', 'fonts', 'DMSans-Bold.woff');
    if (fs.existsSync(dmSansPath)) {
      registerFont(dmSansPath, { family: 'DM Sans', weight: 'normal' });
      if (fs.existsSync(dmSansBoldPath)) {
        registerFont(dmSansBoldPath, { family: 'DM Sans', weight: 'bold' });
      }
      fontFamily = 'DM Sans';
    }
  } catch (e) {
    // Use fallback system font
    console.log('DM Sans not found, using system font');
  }
  
  // Register bundled DM Mono for numbers
  try {
    const dmMonoPath = path.join(__dirname, '..', '..', 'fonts', 'DMMono-Regular.ttf');
    if (fs.existsSync(dmMonoPath)) {
      registerFont(dmMonoPath, { family: 'DM Mono' });
      monoFont = 'DM Mono';
    }
  } catch (e) {
    // Use fallback monospace font
    console.log('DM Mono not found, using system monospace font');
  }
  
  const width = 1200;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  const leftPanelWidth = 450;
  const padding = 50;
  let yPos = padding + 20;

  // Font family - Inter or system fonts for text, DM Mono for numbers
  const mainFont = fontFamily;
  const numberFont = monoFont;
  
  const greenColor = '#00ff88'; // Green for Lines Added and Languages

  // Left Panel - Stats
  ctx.textAlign = 'left';
  
  // Repository name at top
  ctx.fillStyle = '#707070';
  ctx.font = `18px ${mainFont}`;
  ctx.fillText(stats.repoName, padding, yPos);
  yPos += 50;
  
  // Top Languages section - with green color
  ctx.fillStyle = '#707070';
  ctx.font = `bold 32px ${mainFont}`;
  ctx.fillText('Languages', padding, yPos);
  yPos += 60;

  stats.topLanguages.slice(0, 3).forEach((lang, idx) => {
    ctx.fillStyle = '#ffffff';
    ctx.font = `28px ${mainFont}`;
    ctx.fillText(`${idx + 1}  ${lang.language}`, padding, yPos);
    yPos += 50;
  });

  yPos += 50;

  // Stats grid (2x2) - with color-coded stats
  const statsData = [
    { label: 'Commits', value: stats.totalCommits.toLocaleString(), color: '#ffffff' },
    { label: 'Lines Added', value: (stats.totalLinesAdded / 1000).toFixed(0) + 'K', color: greenColor },
    { label: 'Lines Deleted', value: (stats.totalLinesDeleted / 1000).toFixed(0) + 'K', color: '#ff4444' },
    { label: 'Longest Streak', value: stats.longestStreak + 'd', color: '#ffffff' },
  ];

  const statColWidth = 200;
  const statRowHeight = 110;
  
  statsData.forEach((stat, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = padding + col * statColWidth;
    const y = yPos + row * statRowHeight;
    
    ctx.fillStyle = '#707070';
    ctx.font = `20px ${mainFont}`;
    ctx.fillText(stat.label, x, y);
    
    ctx.fillStyle = stat.color;
    ctx.font = `bold 48px ${numberFont}`;
    ctx.fillText(stat.value, x, y + 52);
  });

  yPos += statRowHeight * 2 + 60;

  // Footer
  ctx.fillStyle = '#707070';
  ctx.font = `18px ${mainFont}`;
  ctx.fillText('wrap-it', padding, height - 40);

  // Right Panel - Horizontal Bar Chart for Monthly Commits
  const chartX = leftPanelWidth + 60;
  const chartY = 80;
  const chartWidth = width - chartX - 60;
  const chartHeight = height - chartY - 80;
  
  // Draw horizontal bar chart
  const maxCommits = Math.max(...stats.commitsByMonth.map(m => m.count), 1);
  const barHeight = 35;
  const barSpacing = 15;
  const totalBarsHeight = stats.commitsByMonth.length * (barHeight + barSpacing);
  const startY = chartY + (chartHeight - totalBarsHeight) / 2;
  
  stats.commitsByMonth.forEach((monthData, idx) => {
    const y = startY + idx * (barHeight + barSpacing);
    const barWidth = (monthData.count / maxCommits) * (chartWidth - 100);
    
    // Month label
    ctx.fillStyle = '#707070';
    ctx.font = `18px ${mainFont}`;
    ctx.textAlign = 'right';
    ctx.fillText(monthData.month.substring(0, 3), chartX - 15, y + barHeight / 2 + 6);
    
    // Bar color - gray gradient based on intensity
    const intensity = monthData.count / maxCommits;
    let barColor;
    if (intensity < 0.2) {
      barColor = '#3a3a3a';
    } else if (intensity < 0.4) {
      barColor = '#4a4a4a';
    } else if (intensity < 0.6) {
      barColor = '#6a6a6a';
    } else if (intensity < 0.8) {
      barColor = '#8a8a8a';
    } else {
      barColor = '#aaaaaa';
    }
    
    // Draw bar with rounded corners
    ctx.fillStyle = barColor;
    ctx.beginPath();
    const radius = 4;
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + barWidth - radius, y);
    ctx.quadraticCurveTo(chartX + barWidth, y, chartX + barWidth, y + radius);
    ctx.lineTo(chartX + barWidth, y + barHeight - radius);
    ctx.quadraticCurveTo(chartX + barWidth, y + barHeight, chartX + barWidth - radius, y + barHeight);
    ctx.lineTo(chartX, y + barHeight);
    ctx.closePath();
    ctx.fill();
    
    // Commit count on the right of bar
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 18px ${numberFont}`;
    ctx.textAlign = 'left';
    ctx.fillText(monthData.count.toString(), chartX + barWidth + 10, y + barHeight / 2 + 6);
  });

  // Save image
  const outputPath = path.join(repoPath, `developer-wrapped-${stats.year}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}
