# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "アカウントにサインイン" [level=2] [ref=e5]
      - paragraph [ref=e6]:
        - text: または
        - link "新しいアカウントを作成" [ref=e7]:
          - /url: /auth/signup
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]:
            - text: メールアドレス
            - generic [ref=e12]: "*"
          - textbox "メールアドレス*" [ref=e13]
        - generic [ref=e14]:
          - generic [ref=e15]:
            - text: パスワード
            - generic [ref=e16]: "*"
          - textbox "パスワード*" [ref=e17]
      - button "サインイン" [ref=e19] [cursor=pointer]
      - generic [ref=e24]: または
      - button "Googleでサインイン" [ref=e26] [cursor=pointer]:
        - generic [ref=e27] [cursor=pointer]:
          - img
          - generic [ref=e28] [cursor=pointer]: Googleでサインイン
  - button "Open Next.js Dev Tools" [ref=e34] [cursor=pointer]:
    - img [ref=e35] [cursor=pointer]
  - alert [ref=e40]
```