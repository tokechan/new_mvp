#!/usr/bin/env node

/**
 * テストカバレッジ監視スクリプト
 * ローカル開発環境でのリアルタイムカバレッジ監視
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

// 設定
const COVERAGE_THRESHOLD = 70;
const WATCH_PATTERNS = [
  'src/**/*.{ts,tsx,js,jsx}',
  '!src/**/__tests__/**',
  '!src/**/*.test.*',
  '!src/**/*.spec.*'
];

class CoverageMonitor {
  constructor() {
    this.isRunning = false;
    this.lastCoverage = null;
    this.watchMode = false;
  }

  /**
   * カバレッジを実行して結果を取得
   */
  async runCoverage() {
    if (this.isRunning) {
      console.log('⏳ テスト実行中です...');
      return;
    }

    this.isRunning = true;
    console.log('🧪 テストカバレッジを実行中...');

    try {
      // テストカバレッジを実行
      execSync('npm run test:coverage -- --silent', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });

      // カバレッジ結果を読み込み
      const coverageData = this.readCoverageData();
      if (coverageData) {
        this.displayCoverageReport(coverageData);
        this.checkThresholds(coverageData);
        this.lastCoverage = coverageData;
      }

    } catch (error) {
      console.error('❌ テスト実行に失敗しました:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * カバレッジデータを読み込み
   */
  readCoverageData() {
    try {
      const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(summaryPath)) {
        return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      }
    } catch (error) {
      console.error('カバレッジデータの読み込みに失敗:', error.message);
    }
    return null;
  }

  /**
   * カバレッジレポートを表示
   */
  displayCoverageReport(coverageData) {
    const total = coverageData.total;
    const timestamp = new Date().toLocaleTimeString('ja-JP');

    console.log('\n📊 テストカバレッジレポート');
    console.log('='.repeat(50));
    console.log(`⏰ 実行時刻: ${timestamp}`);
    console.log('');

    const metrics = [
      { name: 'Lines', key: 'lines' },
      { name: 'Functions', key: 'functions' },
      { name: 'Branches', key: 'branches' },
      { name: 'Statements', key: 'statements' }
    ];

    metrics.forEach(metric => {
      const pct = total[metric.key].pct;
      const status = pct >= COVERAGE_THRESHOLD ? '✅' : '❌';
      const change = this.getCoverageChange(metric.key, pct);
      
      console.log(`${status} ${metric.name.padEnd(12)}: ${pct.toFixed(1)}%${change}`);
    });

    console.log('');
    console.log(`📁 カバレッジレポート: file://${path.join(process.cwd(), 'coverage', 'lcov-report', 'index.html')}`);
    console.log('='.repeat(50));
  }

  /**
   * カバレッジの変化を取得
   */
  getCoverageChange(metric, currentPct) {
    if (!this.lastCoverage) return '';
    
    const lastPct = this.lastCoverage.total[metric].pct;
    const diff = currentPct - lastPct;
    
    if (Math.abs(diff) < 0.1) return '';
    
    const arrow = diff > 0 ? '↗️' : '↘️';
    const sign = diff > 0 ? '+' : '';
    return ` ${arrow} ${sign}${diff.toFixed(1)}%`;
  }

  /**
   * 閾値チェック
   */
  checkThresholds(coverageData) {
    const total = coverageData.total;
    const failedMetrics = [];

    ['lines', 'functions', 'branches', 'statements'].forEach(metric => {
      if (total[metric].pct < COVERAGE_THRESHOLD) {
        failedMetrics.push({
          name: metric,
          current: total[metric].pct,
          threshold: COVERAGE_THRESHOLD
        });
      }
    });

    if (failedMetrics.length > 0) {
      console.log('\n⚠️  カバレッジ閾値を下回っています:');
      failedMetrics.forEach(metric => {
        console.log(`   ${metric.name}: ${metric.current}% < ${metric.threshold}%`);
      });
      console.log('');
    } else {
      console.log('\n🎉 全てのカバレッジ閾値をクリアしています！\n');
    }
  }

  /**
   * ウォッチモードを開始
   */
  startWatchMode() {
    console.log('👀 ファイル変更監視を開始します...');
    console.log('監視対象:', WATCH_PATTERNS.join(', '));
    console.log('Ctrl+C で終了\n');

    this.watchMode = true;

    // 初回実行
    this.runCoverage();

    // ファイル変更監視
    const watcher = chokidar.watch(WATCH_PATTERNS, {
      ignored: /(^|[\/\\])\../, // 隠しファイルを無視
      persistent: true,
      ignoreInitial: true
    });

    let timeout;
    watcher.on('change', (filePath) => {
      console.log(`📝 ファイル変更検出: ${path.relative(process.cwd(), filePath)}`);
      
      // デバウンス処理（1秒間の変更をまとめる）
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.runCoverage();
      }, 1000);
    });

    // 終了処理
    process.on('SIGINT', () => {
      console.log('\n👋 監視を終了します...');
      watcher.close();
      process.exit(0);
    });
  }

  /**
   * 未テストファイルの分析
   */
  analyzeUntestedFiles() {
    console.log('🔍 未テストファイルを分析中...');
    
    try {
      execSync('npm run test:analyze', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ 分析に失敗しました:', error.message);
    }
  }
}

// CLI実行
if (require.main === module) {
  const monitor = new CoverageMonitor();
  const args = process.argv.slice(2);

  if (args.includes('--watch') || args.includes('-w')) {
    monitor.startWatchMode();
  } else if (args.includes('--analyze') || args.includes('-a')) {
    monitor.analyzeUntestedFiles();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
テストカバレッジ監視ツール

使用方法:
  node scripts/coverage-monitor.js [オプション]

オプション:
  --watch, -w     ファイル変更を監視してリアルタイムでカバレッジを更新
  --analyze, -a   未テストファイルの分析を実行
  --help, -h      このヘルプを表示

例:
  node scripts/coverage-monitor.js --watch
  node scripts/coverage-monitor.js --analyze
    `);
  } else {
    monitor.runCoverage();
  }
}

module.exports = CoverageMonitor;