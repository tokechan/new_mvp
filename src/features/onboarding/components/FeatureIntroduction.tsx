'use client'

import { FileText, Share2, HeartHandshake, ArrowRight, SkipForward } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

interface FeatureIntroductionProps {
  onNext: () => void
  onSkip: () => void
}

const features = [
  {
    icon: FileText,
    title: '家事を追加しよう',
    description: '料理、洗濯、掃除... やるべき家事をリストに追加します。未完了10件まで追加できます。',
  },
  {
    icon: Share2,
    title: 'パートナーと共有',
    description: 'パートナーを招待して、同じ家事リストをリアルタイムで共有。進捗を一緒に確認できます。',
  },
  {
    icon: HeartHandshake,
    title: '感謝を伝えよう',
    description: 'パートナーが完了した家事にはハートボタンが表示されます。感謝の気持ちを伝えます。',
  },
] as const

/**
 * ステップ1: 機能紹介コンポーネント
 * YOUDO の3つの主要機能を視覚的に紹介
 */
export default function FeatureIntroduction({ onNext, onSkip }: FeatureIntroductionProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 slide-in-from-bottom-4">
      {/* ヘッダー */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">YOUDO へようこそ</h2>
        <p className="text-muted-foreground">
          パートナーと一緒に家事を管理し、感謝を伝える3つのステップ
        </p>
      </div>

      {/* 機能カード */}
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="transition-shadow hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-accent/20 dark:bg-accent/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          次へ
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="lg"
          className="text-muted-foreground hover:text-foreground"
        >
          <SkipForward className="w-4 h-4 mr-2" aria-hidden="true" />
          スキップ
        </Button>
      </div>
    </div>
  )
}

