import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:8080';

  static Future<Map<String, dynamic>> _get(String path) async {
    final response = await http.get(Uri.parse('$baseUrl$path'));
    return json.decode(response.body);
  }

  static Future<Map<String, dynamic>> _post(String path, {Map<String, dynamic>? body}) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
      body: body != null ? json.encode(body) : null,
    );
    return json.decode(response.body);
  }

  static Future<Map<String, dynamic>> _put(String path, {Map<String, dynamic>? body}) async {
    final response = await http.put(
      Uri.parse('$baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
      body: body != null ? json.encode(body) : null,
    );
    return json.decode(response.body);
  }

  static Future<Map<String, dynamic>> _delete(String path) async {
    final response = await http.delete(Uri.parse('$baseUrl$path'));
    return json.decode(response.body);
  }

  static Future<List<Device>> getDevices() async {
    final result = await _get('/api/devices/');
    final List<dynamic> list = result['devices'] ?? [];
    return list.map((e) => Device.fromJson(e)).toList();
  }

  static Future<Map<String, dynamic>> controlDevice(int id, String action, {Map<String, dynamic>? params}) async {
    final body = {'action': action, ...?params};
    return _post('/api/devices/$id/control', body: body);
  }

  static Future<Map<String, dynamic>> controlDevicesByType({String? type, String? room, required String action}) async {
    final body = {
      if (type != null) 'device_type': type,
      if (room != null) 'room': room,
      'action': action,
    };
    return _post('/api/devices/control', body: body);
  }

  static Future<List<Scene>> getScenes() async {
    final result = await _get('/api/scenes/');
    final List<dynamic> list = result['scenes'] ?? [];
    return list.map((e) => Scene.fromJson(e)).toList();
  }

  static Future<Map<String, dynamic>> activateScene(int id) async {
    return _post('/api/scenes/$id/activate');
  }

  static Future<Map<String, dynamic>> activateSceneByName(String name) async {
    return _post('/api/scenes/activate', body: {'name': name});
  }

  static Future<Weather> getWeather({String city = '北京', String? date}) async {
    String path = '/api/weather/?city=$city';
    if (date != null) path += '&date=$date';
    final result = await _get(path);
    return Weather.fromJson(result['weather'] ?? {});
  }

  static Future<List<Music>> getMusics() async {
    final result = await _get('/api/music/');
    final List<dynamic> list = result['musics'] ?? [];
    return list.map((e) => Music.fromJson(e)).toList();
  }

  static Future<Map<String, dynamic>> playMusic({int? id, String? artist, String? song}) async {
    final body = {
      if (id != null) 'music_id': id,
      if (artist != null) 'artist': artist,
      if (song != null) 'song': song,
    };
    return _post('/api/music/play', body: body);
  }

  static Future<Map<String, dynamic>> pauseMusic() async {
    return _post('/api/music/pause');
  }

  static Future<Map<String, dynamic>> nextMusic() async {
    return _post('/api/music/next');
  }

  static Future<Map<String, dynamic>> prevMusic() async {
    return _post('/api/music/prev');
  }

  static Future<Map<String, dynamic>> setMusicVolume(int value) async {
    return _post('/api/music/volume', body: {'value': value});
  }

  static Future<Map<String, dynamic>> getMusicStatus() async {
    return _get('/api/music/status');
  }

  static Future<List<Reminder>> getReminders() async {
    final result = await _get('/api/reminders/');
    final List<dynamic> list = result['reminders'] ?? [];
    return list.map((e) => Reminder.fromJson(e)).toList();
  }

  static Future<Map<String, dynamic>> createReminder(String title, String remindTime, {String content = '', String repeatType = 'none'}) async {
    return _post('/api/reminders/', body: {
      'title': title,
      'remind_time': remindTime,
      'content': content,
      'repeat_type': repeatType,
    });
  }

  static Future<Map<String, dynamic>> deleteReminder(int id) async {
    return _delete('/api/reminders/$id');
  }

  static Future<Map<String, dynamic>> chatText(String text, {String? sessionId}) async {
    return _post('/api/chat/text', body: {
      'text': text,
      'user_id': 1,
      if (sessionId != null) 'session_id': sessionId,
    });
  }

  static Future<List<ChatMessage>> getChatHistory() async {
    final result = await _get('/api/chat/history?user_id=1');
    final List<dynamic> list = result['history'] ?? [];
    final List<ChatMessage> messages = [];
    for (var item in list) {
      messages.add(ChatMessage.fromJson(item, isUser: true));
      messages.add(ChatMessage.fromJson(item, isUser: false));
    }
    return messages;
  }

  static Future<Map<String, dynamic>> getUserSettings() async {
    return _get('/api/users/1/settings');
  }

  static Future<Map<String, dynamic>> updateSetting(String key, String value) async {
    return _put('/api/users/1/settings', body: {'key': key, 'value': value});
  }

  static Future<Map<String, dynamic>> checkHealth() async {
    return _get('/api/health');
  }
}
