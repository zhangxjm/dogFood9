import 'package:flutter/material.dart';

class Device {
  final int id;
  final String name;
  final String deviceType;
  final String room;
  String status;
  int brightness;
  double temperature;
  int volume;

  Device({
    required this.id,
    required this.name,
    required this.deviceType,
    required this.room,
    required this.status,
    this.brightness = 100,
    this.temperature = 25.0,
    this.volume = 50,
  });

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      deviceType: json['device_type'] ?? '',
      room: json['room'] ?? '',
      status: json['status'] ?? 'off',
      brightness: json['brightness'] ?? 100,
      temperature: (json['temperature'] ?? 25.0).toDouble(),
      volume: json['volume'] ?? 50,
    );
  }

  bool get isOn => status == 'on' || status == 'open';

  IconData get icon {
    switch (deviceType) {
      case 'light':
        return Icons.lightbulb_outline;
      case 'ac':
        return Icons.ac_unit;
      case 'tv':
        return Icons.tv;
      case 'speaker':
        return Icons.speaker;
      case 'curtain':
        return Icons.blinds;
      case 'robot':
        return Icons.robot;
      default:
        return Icons.devices;
    }
  }
}

class Scene {
  final int id;
  final String name;
  final String description;
  final String icon;
  final bool isDefault;
  final List<dynamic> devices;

  Scene({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.isDefault,
    this.devices = const [],
  });

  factory Scene.fromJson(Map<String, dynamic> json) {
    return Scene(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      icon: json['icon'] ?? 'home',
      isDefault: json['is_default'] ?? false,
      devices: json['devices'] ?? [],
    );
  }

  IconData get iconData {
    switch (icon) {
      case 'home':
        return Icons.home;
      case 'exit_to_app':
        return Icons.exit_to_app;
      case 'bedtime':
        return Icons.bedtime;
      case 'movie':
        return Icons.movie;
      case 'menu_book':
        return Icons.menu_book;
      default:
        return Icons.view_day;
    }
  }
}

class Music {
  final int id;
  final String title;
  final String artist;
  final String album;
  final int duration;
  final String url;
  final bool isFavorite;

  Music({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.duration,
    required this.url,
    required this.isFavorite,
  });

  factory Music.fromJson(Map<String, dynamic> json) {
    return Music(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      artist: json['artist'] ?? '',
      album: json['album'] ?? '',
      duration: json['duration'] ?? 0,
      url: json['url'] ?? '',
      isFavorite: json['is_favorite'] ?? false,
    );
  }
}

class Reminder {
  final int id;
  final String title;
  final String content;
  final String remindTime;
  final String repeatType;
  final bool isActive;

  Reminder({
    required this.id,
    required this.title,
    required this.content,
    required this.remindTime,
    required this.repeatType,
    required this.isActive,
  });

  factory Reminder.fromJson(Map<String, dynamic> json) {
    return Reminder(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      remindTime: json['remind_time'] ?? '',
      repeatType: json['repeat_type'] ?? 'none',
      isActive: json['is_active'] ?? true,
    );
  }
}

class ChatMessage {
  final String content;
  final bool isUser;
  final String timestamp;
  final String? intent;

  ChatMessage({
    required this.content,
    required this.isUser,
    required this.timestamp,
    this.intent,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json, {bool isUser = true}) {
    return ChatMessage(
      content: isUser ? (json['user_input'] ?? '') : (json['bot_response'] ?? ''),
      isUser: isUser,
      timestamp: json['created_at'] ?? '',
      intent: json['intent'],
    );
  }
}

class Weather {
  final String type;
  final int temperatureHigh;
  final int temperatureLow;
  final int temperatureCurrent;
  final int humidity;
  final int windSpeed;
  final String windDirection;
  final int aqi;
  final String aqiLevel;

  Weather({
    required this.type,
    required this.temperatureHigh,
    required this.temperatureLow,
    required this.temperatureCurrent,
    required this.humidity,
    required this.windSpeed,
    required this.windDirection,
    required this.aqi,
    required this.aqiLevel,
  });

  factory Weather.fromJson(Map<String, dynamic> json) {
    return Weather(
      type: json['type'] ?? '',
      temperatureHigh: json['temperature_high'] ?? 0,
      temperatureLow: json['temperature_low'] ?? 0,
      temperatureCurrent: json['temperature_current'] ?? 0,
      humidity: json['humidity'] ?? 0,
      windSpeed: json['wind_speed'] ?? 0,
      windDirection: json['wind_direction'] ?? '',
      aqi: json['aqi'] ?? 0,
      aqiLevel: json['aqi_level'] ?? '',
    );
  }

  IconData get icon {
    if (type.contains('晴')) return Icons.wb_sunny;
    if (type.contains('云')) return Icons.wb_cloudy;
    if (type.contains('雨')) return Icons.grain;
    if (type.contains('雪')) return Icons.ac_unit;
    if (type.contains('雷')) return Icons.flash_on;
    return Icons.wb_cloudy;
  }
}
