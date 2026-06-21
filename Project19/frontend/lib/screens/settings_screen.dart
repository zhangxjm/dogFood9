import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('设置'),
        centerTitle: true,
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          final settings = provider.settings;
          return ListView(
            children: [
              _buildUserHeader(),
              const Divider(height: 1),
              _buildSectionTitle('个性化设置'),
              _buildSettingItem(
                icon: Icons.record_voice_over,
                title: '语音偏好',
                subtitle: settings['voice_preference']?['value'] == 'female' ? '女声' : '男声',
                onTap: () => _showVoicePreferenceDialog(context, provider),
              ),
              _buildSettingItem(
                icon: Icons.notifications_active,
                title: '唤醒词',
                subtitle: settings['wake_word']?['value'] ?? '小助手',
                onTap: () => _showWakeWordDialog(context, provider),
              ),
              _buildSettingItem(
                icon: Icons.palette,
                title: '主题颜色',
                subtitle: settings['theme_color']?['value'] ?? '#2196F3',
                onTap: () => _showThemeColorDialog(context, provider),
              ),
              const Divider(height: 1),
              _buildSectionTitle('系统设置'),
              _buildSwitchSettingItem(
                icon: Icons.volume_up,
                title: '自动语音回复',
                value: settings['auto_respond']?['value'] == 'true',
                onChanged: (value) async {
                  await provider.updateUserSetting('auto_respond', value.toString());
                },
              ),
              _buildSwitchSettingItem(
                icon: Icons.notifications,
                title: '通知声音',
                value: settings['notification_sound']?['value'] == 'true',
                onChanged: (value) async {
                  await provider.updateUserSetting('notification_sound', value.toString());
                },
              ),
              _buildSettingItem(
                icon: Icons.location_on,
                title: '默认房间',
                subtitle: settings['default_room']?['value'] ?? '客厅',
                onTap: () => _showDefaultRoomDialog(context, provider),
              ),
              const Divider(height: 1),
              _buildSectionTitle('关于'),
              _buildSettingItem(
                icon: Icons.info_outline,
                title: '版本信息',
                subtitle: '1.0.0',
              ),
              _buildSettingItem(
                icon: Icons.help_outline,
                title: '帮助与反馈',
              ),
              const SizedBox(height: 32),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => _showShortcutsDialog(context),
                    icon: const Icon(Icons.short_text),
                    label: const Text('语音指令示例'),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          );
        },
      ),
    );
  }

  Widget _buildUserHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 32,
            backgroundColor: Colors.blue,
            child: Icon(Icons.person, color: Colors.white, size: 36),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('管理员', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                SizedBox(height: 4),
                Text('欢迎使用智能家居语音控制', style: TextStyle(color: Colors.grey)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit, color: Colors.grey),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildSettingItem({required IconData icon, required String title, String? subtitle, VoidCallback? onTap}) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle, style: const TextStyle(color: Colors.grey)) : null,
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
    );
  }

  Widget _buildSwitchSettingItem({required IconData icon, required String title, required bool value, required ValueChanged<bool> onChanged}) {
    return SwitchListTile(
      secondary: Icon(icon, color: Colors.blue),
      title: Text(title),
      value: value,
      onChanged: onChanged,
      activeColor: Colors.blue,
    );
  }

  void _showVoicePreferenceDialog(BuildContext context, AppProvider provider) {
    showDialog(
      context: context,
      builder: (context) {
        return SimpleDialog(
          title: const Text('选择语音'),
          children: [
            SimpleDialogOption(
              onPressed: () {
                provider.updateUserSetting('voice_preference', 'female');
                Navigator.pop(context);
              },
              child: const Text('女声'),
            ),
            SimpleDialogOption(
              onPressed: () {
                provider.updateUserSetting('voice_preference', 'male');
                Navigator.pop(context);
              },
              child: const Text('男声'),
            ),
          ],
        );
      },
    );
  }

  void _showWakeWordDialog(BuildContext context, AppProvider provider) {
    final controller = TextEditingController(text: provider.settings['wake_word']?['value'] ?? '小助手');
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('设置唤醒词'),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(hintText: '请输入唤醒词'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('取消')),
            ElevatedButton(
              onPressed: () {
                provider.updateUserSetting('wake_word', controller.text);
                Navigator.pop(context);
              },
              child: const Text('确定'),
            ),
          ],
        );
      },
    );
  }

  void _showThemeColorDialog(BuildContext context, AppProvider provider) {
    final colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];
    showDialog(
      context: context,
      builder: (context) {
        return SimpleDialog(
          title: const Text('选择主题颜色'),
          children: colors.map((color) {
            return SimpleDialogOption(
              onPressed: () {
                provider.updateUserSetting('theme_color', color);
                Navigator.pop(context);
              },
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Color(int.parse(color.replaceAll('#', 'FF'), radix: 16)),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(color),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }

  void _showDefaultRoomDialog(BuildContext context, AppProvider provider) {
    final rooms = ['客厅', '卧室', '书房', '厨房', '餐厅'];
    showDialog(
      context: context,
      builder: (context) {
        return SimpleDialog(
          title: const Text('选择默认房间'),
          children: rooms.map((room) {
            return SimpleDialogOption(
              onPressed: () {
                provider.updateUserSetting('default_room', room);
                Navigator.pop(context);
              },
              child: Text(room),
            );
          }).toList(),
        );
      },
    );
  }

  void _showShortcutsDialog(BuildContext context) {
    final shortcuts = [
      {'cmd': '打开客厅的灯', 'desc': '控制设备'},
      {'cmd': '今天天气怎么样', 'desc': '查询天气'},
      {'cmd': '设置明天早上8点的闹钟', 'desc': '设置提醒'},
      {'cmd': '播放周杰伦的音乐', 'desc': '播放音乐'},
      {'cmd': '开启回家模式', 'desc': '场景联动'},
      {'cmd': '关掉卧室的空调', 'desc': '关闭设备'},
      {'cmd': '现在几点了', 'desc': '查询时间'},
      {'cmd': '音量调到50', 'desc': '调节音量'},
    ];

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('语音指令示例'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: shortcuts.length,
              itemBuilder: (context, index) {
                final item = shortcuts[index];
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.mic_none, color: Colors.blue),
                  title: Text(item['cmd']!, style: const TextStyle(fontSize: 14)),
                  subtitle: Text(item['desc']!, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('关闭'),
            ),
          ],
        );
      },
    );
  }
}
