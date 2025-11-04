# Storybook 導入手順

最終更新: 2025-11-03

本ドキュメントは本リポジトリ（feature-first 構成 / Vite ビルダー想定）に Storybook を導入する手順をまとめたものです。CI 組み込みや将来のデザインシステム拡張を見据え、共通 Provider やパスエイリアスを考慮した構成にしています。

---

## 1. 初期セットアップ

1. CLI を実行（Vite ビルダー指定）:
   ```bash
   npx storybook@latest init --builder @storybook/builder-vite
   ```
   - 選択肢が出たら「React」「TypeScript」「Vite」を選択。
   - `package.json` に `storybook`, `build-storybook` スクリプトが追加される。

2. 依存パッケージをインストール:
   ```bash
   npm install
   ```
   （ネットワーク制限がある場合は CLI が提案した依存を手動で追加）

---

## 2. 設定ファイル

### `.storybook/main.ts`
```ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    '../src/features/**/*.stories.@(js|jsx|ts|tsx)',
    '../src/shared/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
}

export default config
```

### `.storybook/tsconfig.json`
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["@storybook/react"],
    "baseUrl": "..",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["../src", "./preview.ts"]
}
```

### `.storybook/preview.ts`
```tsx
import type { Preview } from '@storybook/react'
import '../src/app/globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

const preview: Preview = {
  decorators: [
    (Story) => (
      <AuthProvider>
        <NotificationProvider>
          <Story />
        </NotificationProvider>
      </AuthProvider>
    ),
  ],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: { expanded: true },
    viewport: {
      viewports: {
        iphone14: {
          name: 'iPhone 14',
          styles: { width: '390px', height: '844px' },
        },
        ipad: {
          name: 'iPad',
          styles: { width: '810px', height: '1080px' },
        },
      },
    },
  },
}

export default preview
```

> **メモ:** Provider が重く Storybook 上で扱いにくい場合は、`preview.ts` 内でテスト用の軽量モック Provider を用意する。

---

## 3. ストーリー配置と命名

- Feature-first 構成に合わせ、各機能配下に `*.stories.tsx` を作成。
  - 例: `src/features/chores/components/ChoreItem.stories.tsx`
  - 再利用可能な UI は `src/shared/ui/Button/Button.stories.tsx` のように階層化。
- Story 名は `Features/Chores/ChoreItem` のように `category / feature / component` で揃える。

### サンプル
```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ChoreItem } from './ChoreItem'
import type { Chore } from '@/features/chores/types/chore'

const meta: Meta<typeof ChoreItem> = {
  title: 'Features/Chores/ChoreItem',
  component: ChoreItem,
  args: {
    chore: {
      id: '1',
      title: '皿洗い',
      done: false,
      owner_id: 'user-1',
    } as Chore,
    partnerName: 'パートナーA',
    isOwnChore: true,
    onToggle: async () => {},
    onDelete: async () => {},
    onShowThankYou: () => {},
    onHideThankYou: () => {},
    showThankYou: false,
    partnerInfo: null,
  },
}

export default meta
type Story = StoryObj<typeof ChoreItem>

export const Default: Story = {}
```

---

## 4. API / Supabase 依存コンポーネントのモック

- `msw`（Mock Service Worker）を利用する場合は `@storybook/addon-interactions` と併用し、`preview.ts` の `parameters.msw` にハンドラを登録。
- 簡易的には Story ファイル内で `jest.mock` 風にモジュールを置き換える。
- Supabase クライアントは `supabase` import をモック or Fake クライアントを注入。

---

## 5. 起動・ビルド

- 開発用 Storybook:
  ```bash
  npm run storybook
  ```
  → `http://localhost:6006`

- 静的ビルド（配布用）:
  ```bash
  npm run build-storybook
  ```
  → `storybook-static/` に出力。Cloudflare Pages 等でホスティング可能。

---

## 6. CI / 運用のヒント

- PR 時に `npm run build-storybook` を実行して破損を検出。
- Chromatic や VRT（Visual Regression Test）を導入するなら `storybook-static` をアップロードするステップを追加。
- バージョンアップ: `npx sb@latest upgrade` で主要パッケージを一括更新。

---

## 7. よくある Tips

- **Next.js App Router + Vite Builder**: `@storybook/nextjs` ではなく `@storybook/react-vite` を使う（本番ビルドが速く、15 系でも動作が安定）。
- **グローバル CSS**: `preview.ts` で `../src/app/globals.css` を読み込むと Tailwind などのスタイルが Storybook 上でも反映される。
- **Env への依存**: Storybook 実行時は `.env.local` が読み込まれないため、必要な環境変数は `storybook` コマンド前に注入するか、Story 側で fallback を持たせておく。
- **パスエイリアス**: `@/*` のほか `@/features/*` など追加エイリアスを使う場合は `.storybook/tsconfig.json` も随時更新。

---

以上の手順で Storybook を導入すれば、feature-first 構成に沿って各 UI コンポーネントを可視化・テストできます。実装時は `shared/ui` から着手すると再利用系の Story の整備が進めやすくなります。
