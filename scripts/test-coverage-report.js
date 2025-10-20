#!/usr/bin/env node

/**
 * テストカバレッジレポート生成スクリプト
 * 未テストファイルの特定と優先度付けを行う
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定
const SRC_DIR = 'src';
const EXCLUDE_PATTERNS = [
  '__tests__',
  '*.test.*',
  '*.spec.*',
  '*.stories.*',
  '*.config.*',
  'ui/', // UIコンポーネントライブラリ
  'app/', // Next.js App Router
  'lib/types' // 型定義
];

// 優先度設定
const PRIORITY_CONFIG = {
  high: {
    patterns: ['*Service.ts', 'Navigation.tsx', 'ChoreItem.tsx', 'ChoreList.tsx'],
    description: 'ビジネスロジック・主要UI'
  },
  medium: {
    patterns: ['*Modal.tsx', 'use*.ts', '*Form.tsx'],
    description: 'ユーザー体験・フック'
  },
  low: {
    patterns: ['*Panel.tsx', '*Debug*.tsx', '*Test*.tsx'],
    description: 'デバッグ・補助機能'
  }
};

/**
 * ファイルが除外対象かチェック
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('/')) {
      return filePath.includes(pattern);
    }
    return path.basename(filePath).includes(pattern.replace('*', ''));
  });
}

/**
 * ファイルの優先度を判定
 */
function getPriority(filePath) {
  const fileName = path.basename(filePath);
  
  for (const [priority, config] of Object.entries(PRIORITY_CONFIG)) {
    if (config.patterns.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(fileName);
    })) {
      return priority;
    }
  }
  
  return 'low';
}

/**
 * 対象ファイルを再帰的に取得
 */
function getTargetFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        const relativePath = path.relative(process.cwd(), fullPath);
        if (!shouldExclude(relativePath)) {
          files.push(relativePath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * テスト済みファイルを取得
 */
function getTestedFiles() {
  const testedFiles = new Set();
  
  function findTestFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findTestFiles(fullPath);
      } else if (item.includes('.test.') || item.includes('.spec.')) {
        // テストファイル名から対象ファイルを推測
        const baseName = item.replace(/\.(test|spec)\.(ts|tsx)$/, '');
        const possiblePaths = [
          `src/components/${baseName}.tsx`,
          `src/hooks/${baseName}.ts`,
          `src/services/${baseName}.ts`,
          `src/utils/${baseName}.ts`
        ];
        
        possiblePaths.forEach(p => {
          if (fs.existsSync(p)) {
            testedFiles.add(p);
          }
        });
      }
    }
  }
  
  findTestFiles(SRC_DIR);
  return testedFiles;
}

/**
 * メインレポート生成
 */
function generateReport() {
  console.log('🔍 テストカバレッジ分析を開始...\n');
  
  const allFiles = getTargetFiles(SRC_DIR);
  const testedFiles = getTestedFiles();
  const untestedFiles = allFiles.filter(file => !testedFiles.has(file));
  
  // 優先度別に分類
  const priorityGroups = {
    high: [],
    medium: [],
    low: []
  };
  
  untestedFiles.forEach(file => {
    const priority = getPriority(file);
    priorityGroups[priority].push(file);
  });
  
  // レポート出力
  console.log('📊 テストカバレッジサマリー');
  console.log('================================');
  console.log(`総ファイル数: ${allFiles.length}`);
  console.log(`テスト済み: ${testedFiles.size} (${Math.round(testedFiles.size / allFiles.length * 100)}%)`);
  console.log(`未テスト: ${untestedFiles.length} (${Math.round(untestedFiles.length / allFiles.length * 100)}%)\n`);
  
  // 優先度別未テストファイル
  Object.entries(priorityGroups).forEach(([priority, files]) => {
    if (files.length > 0) {
      const config = PRIORITY_CONFIG[priority];
      console.log(`🔥 ${priority.toUpperCase()}優先度 (${config.description})`);
      console.log('----------------------------------------');
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });
      console.log('');
    }
  });
  
  // 推奨アクション
  console.log('💡 推奨アクション');
  console.log('================');
  console.log('1. HIGH優先度のファイルから順次テストを追加');
  console.log('2. 各ファイルに対して以下のテストパターンを実装:');
  console.log('   - 正常系のテスト');
  console.log('   - 異常系・エラーケースのテスト');
  console.log('   - 境界値のテスト');
  console.log('   - ユーザーインタラクションのテスト');
  console.log('3. テスト実行: npm run test:coverage');
  console.log('4. カバレッジ目標: 70%以上\n');
  
  // 次のステップ提案
  if (priorityGroups.high.length > 0) {
    console.log('🎯 次に取り組むべきファイル:');
    console.log(`   ${priorityGroups.high[0]}`);
  }
}

// スクリプト実行
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, getTargetFiles, getTestedFiles, getPriority };