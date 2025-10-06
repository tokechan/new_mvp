# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "ありがとうメッセージ" [level=1] [ref=e4]
    - generic [ref=e5]:
      - heading "ありがとうメッセージを送る" [level=3] [ref=e6]
      - generic [ref=e7]:
        - group "定型メッセージから選択" [ref=e8]:
          - generic [ref=e9]: 定型メッセージから選択
          - generic [ref=e10]:
            - 'button "定型メッセージを選択: ありがとう！助かりました 😊" [ref=e11] [cursor=pointer]': ありがとう！助かりました 😊
            - 'button "定型メッセージを選択: お疲れさまでした！" [ref=e12] [cursor=pointer]': お疲れさまでした！
            - 'button "定型メッセージを選択: いつもありがとう ❤️" [ref=e13] [cursor=pointer]': いつもありがとう ❤️
            - 'button "定型メッセージを選択: とても助かります！" [ref=e14] [cursor=pointer]': とても助かります！
            - 'button "定型メッセージを選択: ありがとう！愛してる 💕" [ref=e15] [cursor=pointer]': ありがとう！愛してる 💕
            - 'button "定型メッセージを選択: お疲れさま！感謝してます" [ref=e16] [cursor=pointer]': お疲れさま！感謝してます
            - 'button "定型メッセージを選択: ありがとう！嬉しいです" [ref=e17] [cursor=pointer]': ありがとう！嬉しいです
            - 'button "定型メッセージを選択: いつも本当にありがとう" [ref=e18] [cursor=pointer]': いつも本当にありがとう
            - 'button "定型メッセージを選択: お疲れさま！大好き" [ref=e19] [cursor=pointer]': お疲れさま！大好き
            - 'button "定型メッセージを選択: ありがとう！頼りになります" [ref=e20] [cursor=pointer]': ありがとう！頼りになります
        - generic [ref=e21]:
          - generic [ref=e22]: メッセージ
          - textbox "メッセージ" [ref=e23]
        - button "送信する" [disabled] [ref=e25]
  - alert [ref=e26]
```