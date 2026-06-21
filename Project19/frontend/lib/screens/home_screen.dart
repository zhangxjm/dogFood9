import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import 'voice_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadAllData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('智能家居'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<AppProvider>().loadAllData(),
          ),
        ],
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          return RefreshIndicator(
            onRefresh: () => provider.loadAllData(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildWeatherCard(provider.weather),
                const SizedBox(height: 16),
                _buildQuickActions(context),
                const SizedBox(height: 16),
                _buildSceneSection(context, provider.scenes),
                const SizedBox(height: 16),
                _buildDeviceSummary(context, provider.devices),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildWeatherCard(Weather? weather) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [Colors.blue.shade400, Colors.blue.shade600],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '北京',
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                ),
                Icon(weather?.icon ?? Icons.wb_cloudy, color: Colors.white, size: 48),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${weather?.temperatureCurrent ?? 25}°C',
              style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.w300),
            ),
            const SizedBox(height: 8),
            Text(
              weather?.type ?? '多云',
              style: const TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _weatherInfo('最高', '${weather?.temperatureHigh ?? 28}°'),
                _weatherInfo('最低', '${weather?.temperatureLow ?? 18}°'),
                _weatherInfo('湿度', '${weather?.humidity ?? 60}%'),
                _weatherInfo('空气', weather?.aqiLevel ?? '良'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _weatherInfo(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '快捷操作',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _quickActionButton(
                context,
                icon: Icons.mic,
                label: '语音控制',
                color: Colors.blue,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const VoiceScreenPlaceholder())),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _quickActionButton(
                context,
                icon: Icons.lightbulb,
                label: '全部开灯',
                color: Colors.amber,
                onTap: () => context.read<AppProvider>().controlDevicesByType(type: 'light', action: 'turn_on'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _quickActionButton(
                context,
                icon: Icons.lightbulb_outline,
                label: '全部关灯',
                color: Colors.grey,
                onTap: () => context.read<AppProvider>().controlDevicesByType(type: 'light', action: 'turn_off'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _quickActionButton(BuildContext context, {required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildSceneSection(BuildContext context, List<Scene> scenes) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('场景模式', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            TextButton(
              onPressed: () {},
              child: const Text('全部'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: scenes.length,
            itemBuilder: (context, index) {
              final scene = scenes[index];
              return GestureDetector(
                onTap: () => context.read<AppProvider>().activateScene(scene),
                child: Container(
                  width: 120,
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade100),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(scene.iconData, color: Colors.blue, size: 36),
                      const SizedBox(height: 8),
                      Text(scene.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDeviceSummary(BuildContext context, List<Device> devices) {
    final onDevices = devices.where((d) => d.isOn).length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('设备概览', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Text('${devices.length}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.blue)),
                      const Text('总设备', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
                Container(width: 1, height: 50, color: Colors.grey.shade200),
                Expanded(
                  child: Column(
                    children: [
                      Text('$onDevices', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.green.shade600)),
                      const Text('运行中', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
                Container(width: 1, height: 50, color: Colors.grey.shade200),
                Expanded(
                  child: Column(
                    children: [
                      Text('${devices.length - onDevices}', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                      const Text('已关闭', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class VoiceScreenPlaceholder extends StatelessWidget {
  const VoiceScreenPlaceholder({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('请切换到底部语音标签页')));
}

extension DeviceControl on AppProvider {
  Future<void> controlDevicesByType({String? type, String? room, required String action}) async {
    try {
      await ApiService.controlDevicesByType(type: type, room: room, action: action);
      await loadDevices();
    } catch (e) {
      debugPrint('Control devices error: $e');
    }
  }
}
