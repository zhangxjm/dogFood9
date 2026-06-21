import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AppProvider extends ChangeNotifier {
  List<Device> _devices = [];
  List<Scene> _scenes = [];
  List<Music> _musics = [];
  List<Reminder> _reminders = [];
  List<ChatMessage> _messages = [];
  Weather? _weather;
  Map<String, dynamic> _musicStatus = {};
  Map<String, dynamic> _settings = {};
  bool _isLoading = false;
  String? _sessionId;

  List<Device> get devices => _devices;
  List<Scene> get scenes => _scenes;
  List<Music> get musics => _musics;
  List<Reminder> get reminders => _reminders;
  List<ChatMessage> get messages => _messages;
  Weather? get weather => _weather;
  Map<String, dynamic> get musicStatus => _musicStatus;
  Map<String, dynamic> get settings => _settings;
  bool get isLoading => _isLoading;
  String? get sessionId => _sessionId;

  Future<void> loadAllData() async {
    _isLoading = true;
    notifyListeners();
    try {
      await Future.wait([
        loadDevices(),
        loadScenes(),
        loadWeather(),
        loadMusics(),
        loadReminders(),
        loadChatHistory(),
        loadSettings(),
        loadMusicStatus(),
      ]);
    } catch (e) {
      debugPrint('Load data error: $e');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadDevices() async {
    try {
      _devices = await ApiService.getDevices();
      notifyListeners();
    } catch (e) {
      debugPrint('Load devices error: $e');
    }
  }

  Future<void> loadScenes() async {
    try {
      _scenes = await ApiService.getScenes();
      notifyListeners();
    } catch (e) {
      debugPrint('Load scenes error: $e');
    }
  }

  Future<void> loadWeather({String city = '北京'}) async {
    try {
      _weather = await ApiService.getWeather(city: city);
      notifyListeners();
    } catch (e) {
      debugPrint('Load weather error: $e');
    }
  }

  Future<void> loadMusics() async {
    try {
      _musics = await ApiService.getMusics();
      notifyListeners();
    } catch (e) {
      debugPrint('Load musics error: $e');
    }
  }

  Future<void> loadReminders() async {
    try {
      _reminders = await ApiService.getReminders();
      notifyListeners();
    } catch (e) {
      debugPrint('Load reminders error: $e');
    }
  }

  Future<void> loadChatHistory() async {
    try {
      _messages = await ApiService.getChatHistory();
      notifyListeners();
    } catch (e) {
      debugPrint('Load chat history error: $e');
    }
  }

  Future<void> loadSettings() async {
    try {
      final result = await ApiService.getUserSettings();
      _settings = result['settings'] ?? {};
      notifyListeners();
    } catch (e) {
      debugPrint('Load settings error: $e');
    }
  }

  Future<void> loadMusicStatus() async {
    try {
      final result = await ApiService.getMusicStatus();
      _musicStatus = result['status'] ?? {};
      notifyListeners();
    } catch (e) {
      debugPrint('Load music status error: $e');
    }
  }

  Future<void> controlDevice(Device device, String action) async {
    try {
      await ApiService.controlDevice(device.id, action);
      await loadDevices();
    } catch (e) {
      debugPrint('Control device error: $e');
    }
  }

  Future<void> activateScene(Scene scene) async {
    try {
      await ApiService.activateScene(scene.id);
      await loadDevices();
    } catch (e) {
      debugPrint('Activate scene error: $e');
    }
  }

  Future<Map<String, dynamic>> sendMessage(String text) async {
    try {
      final userMsg = ChatMessage(
        content: text,
        isUser: true,
        timestamp: DateTime.now().toIso8601String(),
      );
      _messages.add(userMsg);
      notifyListeners();

      final result = await ApiService.chatText(text, sessionId: _sessionId);
      _sessionId = result['session_id'];

      final botMsg = ChatMessage(
        content: result['reply'] ?? '',
        isUser: false,
        timestamp: DateTime.now().toIso8601String(),
        intent: result['intent'],
      );
      _messages.add(botMsg);
      notifyListeners();

      if (result['intent'] == 'device_control' || result['intent'] == 'scene_control') {
        await loadDevices();
      }
      if (result['intent'] == 'music_play' || result['intent'] == 'music_control') {
        await loadMusicStatus();
      }
      if (result['intent'] == 'reminder_set') {
        await loadReminders();
      }

      return result;
    } catch (e) {
      debugPrint('Send message error: $e');
      return {'success': false, 'reply': '抱歉，服务暂时不可用。'};
    }
  }

  Future<void> updateUserSetting(String key, String value) async {
    try {
      await ApiService.updateSetting(key, value);
      await loadSettings();
    } catch (e) {
      debugPrint('Update setting error: $e');
    }
  }
}
