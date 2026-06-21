import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';

class DeviceScreen extends StatefulWidget {
  const DeviceScreen({super.key});

  @override
  State<DeviceScreen> createState() => _DeviceScreenState();
}

class _DeviceScreenState extends State<DeviceScreen> {
  String _selectedRoom = '全部';

  final List<String> rooms = ['全部', '客厅', '卧室', '书房', '厨房', '全屋'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('设备控制'),
        centerTitle: true,
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          List<Device> filteredDevices = provider.devices;
          if (_selectedRoom != '全部') {
            filteredDevices = provider.devices.where((d) => d.room == _selectedRoom).toList();
          }

          return Column(
            children: [
              SizedBox(
                height: 50,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: rooms.length,
                  itemBuilder: (context, index) {
                    final room = rooms[index];
                    final isSelected = _selectedRoom == room;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(room),
                        selected: isSelected,
                        onSelected: (_) => setState(() => _selectedRoom = room),
                        selectedColor: Colors.blue.shade100,
                        checkmarkColor: Colors.blue,
                        labelStyle: TextStyle(color: isSelected ? Colors.blue : Colors.grey.shade700),
                      ),
                    );
                  },
                ),
              ),
              Expanded(
                child: filteredDevices.isEmpty
                    ? const Center(child: Text('暂无设备'))
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 1.1,
                        ),
                        itemCount: filteredDevices.length,
                        itemBuilder: (context, index) {
                          return _buildDeviceCard(context, filteredDevices[index]);
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDeviceCard(BuildContext context, Device device) {
    final isOn = device.isOn;
    return GestureDetector(
      onTap: () => _showDeviceDetail(context, device),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        decoration: BoxDecoration(
          color: isOn ? Colors.blue.shade50 : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isOn ? Colors.blue.shade200 : Colors.grey.shade200,
            width: isOn ? 2 : 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(
                    device.icon,
                    color: isOn ? Colors.blue : Colors.grey,
                    size: 36,
                  ),
                  Transform.scale(
                    scale: 0.8,
                    child: Switch(
                      value: isOn,
                      onChanged: (_) {
                        context.read<AppProvider>().controlDevice(device, isOn ? 'turn_off' : 'turn_on');
                      },
                      activeColor: Colors.blue,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                device.name,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isOn ? Colors.blue.shade800 : Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                device.room,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
              ),
              const SizedBox(height: 4),
              Text(
                isOn ? '运行中' : '已关闭',
                style: TextStyle(
                  color: isOn ? Colors.green : Colors.grey,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeviceDetail(BuildContext context, Device device) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(device.icon, size: 40, color: Colors.blue),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(device.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                            Text(device.room, style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        ),
                      ),
                      Switch(
                        value: device.isOn,
                        onChanged: (_) {
                          context.read<AppProvider>().controlDevice(device, device.isOn ? 'turn_off' : 'turn_on');
                          Navigator.pop(context);
                        },
                        activeColor: Colors.blue,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  if (device.deviceType == 'light') ...[
                    const Text('亮度调节', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Slider(
                      value: device.brightness.toDouble(),
                      min: 0,
                      max: 100,
                      divisions: 20,
                      label: '${device.brightness}%',
                      onChanged: (value) {},
                      activeColor: Colors.blue,
                    ),
                  ],
                  if (device.deviceType == 'ac') ...[
                    const Text('温度调节', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Slider(
                      value: device.temperature,
                      min: 16,
                      max: 35,
                      divisions: 19,
                      label: '${device.temperature.toStringAsFixed(0)}°C',
                      onChanged: (value) {},
                      activeColor: Colors.blue,
                    ),
                  ],
                  if (device.deviceType == 'speaker' || device.deviceType == 'tv') ...[
                    const Text('音量调节', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Slider(
                      value: device.volume.toDouble(),
                      min: 0,
                      max: 100,
                      divisions: 20,
                      label: '${device.volume}',
                      onChanged: (value) {},
                      activeColor: Colors.blue,
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            context.read<AppProvider>().controlDevice(device, 'turn_off');
                            Navigator.pop(context);
                          },
                          icon: const Icon(Icons.power_off),
                          label: const Text('关闭'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            context.read<AppProvider>().controlDevice(device, 'turn_on');
                            Navigator.pop(context);
                          },
                          icon: const Icon(Icons.power),
                          label: const Text('开启'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
