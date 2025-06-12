# rss_alert_flutter

這是一個 Flutter 原生 Android App，主要功能如下：

- 定時（每分鐘）自動抓取 ATOM feed（https://cbs.tw/files/rssatomfeed.xml）
- 偵測到有新警報時，發送本地推播通知
- 支援 Android 原生安裝

## 主要技術
- Flutter 3.x
- flutter_local_notifications 套件（本地推播）
- http 套件（抓取 XML）

## 使用方式
1. 進入 `rss_alert_flutter` 資料夾
2. 執行 `flutter pub get`
3. 使用 Android Studio 或命令列 `flutter run` 安裝到 Android 裝置

## 注意事項
- 本地推播需 App 在背景執行才有效
- 若需雲端推播（如 FCM），需額外伺服器支援 