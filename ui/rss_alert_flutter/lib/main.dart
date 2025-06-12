import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:xml/xml.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  List<AlertItem> alerts = [];
  Timer? timer;
  String lastAlertId = '';

  @override
  void initState() {
    super.initState();
    _initNotifications();
    _fetchAndNotify();
    timer = Timer.periodic(const Duration(minutes: 1), (_) => _fetchAndNotify());
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  Future<void> _initNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
    await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  }

  Future<void> _fetchAndNotify() async {
    final newAlerts = await fetchAlerts();
    if (newAlerts.isNotEmpty && newAlerts.first.id != lastAlertId) {
      // 新警報，推播通知
      _showNotification(newAlerts.first);
      lastAlertId = newAlerts.first.id;
    }
    setState(() {
      alerts = newAlerts;
    });
  }

  Future<void> _showNotification(AlertItem alert) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'alert_channel', '警報通知',
      channelDescription: '國家級警報自動推播',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
    );
    const NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
    await flutterLocalNotificationsPlugin.show(
      0,
      alert.title,
      alert.summary,
      platformChannelSpecifics,
      payload: alert.link,
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '國家級警報推播',
      theme: ThemeData.dark(),
      home: Scaffold(
        appBar: AppBar(title: const Text('國家級警報（自動推播）')),
        body: ListView.builder(
          itemCount: alerts.length,
          itemBuilder: (context, index) {
            final alert = alerts[index];
            return Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: ListTile(
                title: Text(alert.title),
                subtitle: Text('${alert.time}\n${alert.summary}'),
                isThreeLine: true,
                onTap: () => _openAlertLink(alert.link),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openAlertLink(String url) {
    // 可用 url_launcher 套件開啟連結，這裡先省略
  }
}

class AlertItem {
  final String id;
  final String title;
  final String time;
  final String summary;
  final String link;
  AlertItem({required this.id, required this.title, required this.time, required this.summary, required this.link});
}

Future<List<AlertItem>> fetchAlerts() async {
  const url = 'https://cbs.tw/files/rssatomfeed.xml';
  try {
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final document = XmlDocument.parse(response.body);
      final entries = document.findAllElements('entry');
      final alerts = entries.map((entry) {
        final id = entry.findElements('id').first.text;
        final title = entry.findElements('title').first.text;
        final time = entry.findElements('published').first.text;
        final summary = entry.findElements('content').first.text;
        final link = entry.findElements('link').isNotEmpty ? entry.findElements('link').first.getAttribute('href') ?? '' : '';
        return AlertItem(
          id: id,
          title: title,
          time: time,
          summary: summary,
          link: link,
        );
      }).toList();
      alerts.sort((a, b) => b.time.compareTo(a.time));
      return alerts.take(5).toList();
    }
  } catch (e) {
    // ignore
  }
  return [];
} 