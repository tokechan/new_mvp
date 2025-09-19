# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8] [cursor=pointer]
  - alert [ref=e12]
  - generic [ref=e14]:
    - generic [ref=e15]:
      - heading "アカウントにサインイン" [level=2] [ref=e16]
      - paragraph [ref=e17]:
        - text: または
        - link "新しいアカウントを作成" [ref=e18] [cursor=pointer]:
          - /url: /auth/signup
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: メールアドレス
          - textbox "メールアドレス" [ref=e23]
        - generic [ref=e24]:
          - generic [ref=e25]: パスワード
          - textbox "パスワード" [ref=e26]
      - button "サインイン" [ref=e28] [cursor=pointer]
      - generic [ref=e33]: または
      - button "Googleでサインイン" [ref=e35] [cursor=pointer]:
        - img [ref=e36] [cursor=pointer]
        - text: Googleでサインイン
```