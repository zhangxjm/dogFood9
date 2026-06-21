import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class ReminderScreen extends StatefulWidget {
  const ReminderScreen({super.key});

  @override
  State<ReminderScreen> createState() => _ReminderScreenState();
}

class _ReminderScreenState extends State<ReminderScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('我的提醒'),
        centerTitle: true,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddReminderDialog(context),
        child: const Icon(Icons.add),
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          final reminders = provider.reminders;
          if (reminders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.alarm_off, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text('暂无提醒', style: TextStyle(color: Colors.grey.shade600)),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: reminders.length,
            itemBuilder: (context, index) {
              return _buildReminderCard(context, reminders[index]);
            },
          );
        },
      ),
    );
  }

  Widget _buildReminderCard(BuildContext context, Reminder reminder) {
    DateTime dateTime;
    try {
      dateTime = DateTime.parse(reminder.remindTime);
    } catch (_) {
      dateTime = DateTime.now();
    }
    final formatted = DateFormat('MM月dd日 HH:mm').format(dateTime);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: reminder.isActive ? Colors.orange.shade50 : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            reminder.isActive ? Icons.alarm : Icons.alarm_off,
            color: reminder.isActive ? Colors.orange : Colors.grey,
          ),
        ),
        title: Text(
          reminder.title,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            decoration: reminder.isActive ? null : TextDecoration.lineThrough,
            color: reminder.isActive ? null : Colors.grey,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(formatted),
            if (reminder.content.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(reminder.content, style: TextStyle(color: Colors.grey.shade600)),
            ],
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.red),
          onPressed: () async {
            await ApiService.deleteReminder(reminder.id);
            if (!mounted) return;
            await context.read<AppProvider>().loadReminders();
          },
        ),
      ),
    );
  }

  void _showAddReminderDialog(BuildContext context) {
    final titleController = TextEditingController();
    final contentController = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(hours: 1));
    TimeOfDay selectedTime = TimeOfDay.fromDateTime(selectedDate);

    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('新建提醒'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: titleController,
                      decoration: const InputDecoration(
                        labelText: '提醒标题',
                        hintText: '例如：开会、吃药',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: contentController,
                      decoration: const InputDecoration(
                        labelText: '详细内容（选填）',
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('提醒时间', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: selectedDate,
                                firstDate: DateTime.now(),
                                lastDate: DateTime.now().add(const Duration(days: 365)),
                              );
                              if (picked != null) {
                                setDialogState(() {
                                  selectedDate = DateTime(
                                    picked.year, picked.month, picked.day,
                                    selectedTime.hour, selectedTime.minute,
                                  );
                                });
                              }
                            },
                            icon: const Icon(Icons.calendar_today),
                            label: Text(DateFormat('yyyy-MM-dd').format(selectedDate)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              final picked = await showTimePicker(
                                context: context,
                                initialTime: selectedTime,
                              );
                              if (picked != null) {
                                setDialogState(() {
                                  selectedTime = picked;
                                  selectedDate = DateTime(
                                    selectedDate.year, selectedDate.month, selectedDate.day,
                                    picked.hour, picked.minute,
                                  );
                                });
                              }
                            },
                            icon: const Icon(Icons.access_time),
                            label: Text(selectedTime.format(context)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('取消'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (titleController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('请输入提醒标题')),
                      );
                      return;
                    }
                    Navigator.pop(context);
                    await ApiService.createReminder(
                      titleController.text,
                      selectedDate.toIso8601String(),
                      content: contentController.text,
                    );
                    if (!mounted) return;
                    await context.read<AppProvider>().loadReminders();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('提醒创建成功')),
                    );
                  },
                  child: const Text('创建'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
