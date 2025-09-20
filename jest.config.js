const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Next.jsアプリのパスを指定
  dir: './'
})

// Jestのカスタム設定
const config = {
  // テスト環境の設定
  testEnvironment: 'jsdom',
  
  // セットアップファイルの指定
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // テストファイルのパターン
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // カバレッジの設定
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**', // App Routerのファイルは除外
    '!src/lib/types/**'
  ],
  
  // モジュールパスのマッピング
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 変換の設定
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // 無視するパターン
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/' // E2Eテストは除外
  ]
}

// Next.jsの設定を適用してエクスポート
module.exports = createJestConfig(config)