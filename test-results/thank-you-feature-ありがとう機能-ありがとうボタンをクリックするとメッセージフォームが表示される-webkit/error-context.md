# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8] [cursor=pointer]
  - alert [ref=e13]
  - generic [ref=e15]:
    - generic [ref=e16]:
      - heading "アカウントにサインイン" [level=2] [ref=e17]
      - paragraph [ref=e18]:
        - text: または
        - link "新しいアカウントを作成" [ref=e19]:
          - /url: /auth/signup
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: メールアドレス
          - textbox "メールアドレス" [ref=e24]
        - generic [ref=e25]:
          - generic [ref=e26]: パスワード
          - textbox "パスワード" [ref=e27]
      - button "サインイン" [ref=e29] [cursor=pointer]
      - generic [ref=e34]: または
      - button "Googleでサインイン" [ref=e36] [cursor=pointer]:
        - img [ref=e37] [cursor=pointer]
        - text: Googleでサインイン
```