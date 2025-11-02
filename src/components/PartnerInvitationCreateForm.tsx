'use client'

interface PartnerInvitationCreateFormProps {
  inviteeEmail: string
  onInviteeEmailChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function PartnerInvitationCreateForm({
  inviteeEmail,
  onInviteeEmailChange,
  onSubmit,
  isLoading,
}: PartnerInvitationCreateFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="invitee-email"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          パートナーのメールアドレス（任意）
        </label>
        <input
          id="invitee-email"
          type="email"
          value={inviteeEmail}
          onChange={(event) => onInviteeEmailChange(event.target.value)}
          placeholder="partner@example.com"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">メールアドレスは記録用です。招待リンクは誰でも使用できます。</p>
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {isLoading ? '招待リンクを生成中...' : '招待リンクを生成'}
      </button>
    </div>
  )
}
