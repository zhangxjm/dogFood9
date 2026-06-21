import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';

class WeatherScreen extends StatefulWidget {
  const WeatherScreen({super.key});

  @override
  State<WeatherScreen> createState() => _WeatherScreenState();
}

class _WeatherScreenState extends State<WeatherScreen> {
  final List<String> cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉'];
  String selectedCity = '北京';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: selectedCity,
            dropdownColor: Colors.white,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
            items: cities.map((city) {
              return DropdownMenuItem(value: city, child: Text(city));
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() => selectedCity = value);
                context.read<AppProvider>().loadWeather(city: value);
              }
            },
          ),
        ),
        centerTitle: true,
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          final weather = provider.weather;
          if (weather == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(24, 40, 24, 40),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.blue.shade500, Colors.blue.shade300],
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(weather.icon, color: Colors.yellow, size: 80),
                      const SizedBox(height: 16),
                      Text(
                        '${weather.temperatureCurrent}°',
                        style: const TextStyle(color: Colors.white, fontSize: 72, fontWeight: FontWeight.w200),
                      ),
                      Text(
                        weather.type,
                        style: const TextStyle(color: Colors.white, fontSize: 20),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '最高 ${weather.temperatureHigh}° / 最低 ${weather.temperatureLow}°',
                        style: TextStyle(color: Colors.white.withOpacity(0.9)),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _weatherInfoItem(Icons.water_drop, '湿度', '${weather.humidity}%'),
                              _weatherInfoItem(Icons.air, '风力', '${weather.windSpeed}级'),
                              _weatherInfoItem(Icons.navigation, '风向', weather.windDirection),
                              _weatherInfoItem(Icons.gps_fixed, '空气', weather.aqiLevel),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('空气质量', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Text(
                                    '${weather.aqi}',
                                    style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w300),
                                  ),
                                  const SizedBox(width: 16),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: _getAqiColor(weather.aqi).shade50,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          weather.aqiLevel,
                                          style: TextStyle(color: _getAqiColor(weather.aqi)),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      const Text('建议减少户外活动', style: TextStyle(color: Colors.grey)),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('生活建议', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 12),
                              _suggestionItem(Icons.wb_sunny, '紫外线', weather.type.contains('晴') ? '较强' : '弱',
                                  weather.type.contains('晴') ? '建议涂抹防晒霜' : '无需特别防护'),
                              const Divider(height: 24),
                              _suggestionItem(Icons.directions_run, '运动', '适宜', '适合户外运动'),
                              const Divider(height: 24),
                              _suggestionItem(Icons.checkroom, '穿衣', '舒适', '建议穿薄外套或衬衫'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _weatherInfoItem(IconData icon, String label, String value) {
    return Column(
      children: [
        Icon(icon, color: Colors.blue, size: 28),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
      ],
    );
  }

  Widget _suggestionItem(IconData icon, String label, String level, String desc) {
    return Row(
      children: [
        Icon(icon, color: Colors.blue, size: 28),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Text(desc, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(level, style: const TextStyle(color: Colors.green, fontSize: 12)),
        ),
      ],
    );
  }

  MaterialColor _getAqiColor(int aqi) {
    if (aqi <= 50) return Colors.green;
    if (aqi <= 100) return Colors.yellow;
    if (aqi <= 150) return Colors.orange;
    return Colors.red;
  }
}
