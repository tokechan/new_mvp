# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8] [cursor=pointer]
  - alert [ref=e11]
  - generic [ref=e13]:
    - generic [ref=e14]:
      - heading "アカウントにサインイン" [level=2] [ref=e15]
      - paragraph [ref=e16]:
        - text: または
        - link "新しいアカウントを作成" [ref=e17] [cursor=pointer]:
          - /url: /auth/signup
    - generic [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: メールアドレス
          - textbox "メールアドレス" [ref=e22]
        - generic [ref=e23]:
          - generic [ref=e24]: パスワード
          - textbox "パスワード" [ref=e25]
      - button "サインイン" [ref=e27] [cursor=pointer]
      - generic [ref=e32]: または
      - button "Googleでサインイン" [ref=e34] [cursor=pointer]:
        - img [ref=e35] [cursor=pointer]
        - text: Googleでサインイン
```