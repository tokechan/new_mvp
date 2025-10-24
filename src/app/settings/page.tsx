'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import Navigation from '@/components/Navigation'

export default function SettingsPage() {
  const [timezone, setTimezone] = useState('Asia/Tokyo')
  const [language, setLanguage] = useState('ja')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="mt-1 text-sm text-gray-600">後で詳細を拡充予定のプレースホルダー画面です。</p>

        <div className="mt-6 grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>基本設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timezone" className="block text-sm text-gray-600 mb-1">タイムゾーン</Label>
                <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="language" className="block text-sm text-gray-600 mb-1">言語</Label>
                <Input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />
              </div>
              <div>
                <Button className="mt-2">保存</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}