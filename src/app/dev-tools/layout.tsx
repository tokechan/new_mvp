/**
 * DevTools 専用レイアウト
 * Navigation と Footer を非表示にして、開発用ツールを提供
 */
export default function DevToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

