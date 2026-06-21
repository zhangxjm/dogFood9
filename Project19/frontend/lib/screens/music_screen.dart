import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';

class MusicScreen extends StatefulWidget {
  const MusicScreen({super.key});

  @override
  State<MusicScreen> createState() => _MusicScreenState();
}

class _MusicScreenState extends State<MusicScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('音乐播放'),
        centerTitle: true,
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          final status = provider.musicStatus;
          final currentMusic = status['current'];
          final isPlaying = status['is_playing'] ?? false;

          return Column(
            children: [
              if (currentMusic != null)
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.purple.shade400, Colors.blue.shade500],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.music_note, color: Colors.white, size: 60),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        currentMusic['title'] ?? '未知歌曲',
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        currentMusic['artist'] ?? '未知歌手',
                        style: TextStyle(color: Colors.white.withOpacity(0.8)),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            onPressed: () => _prevSong(context),
                            icon: const Icon(Icons.skip_previous, color: Colors.white, size: 32),
                          ),
                          const SizedBox(width: 24),
                          FloatingActionButton(
                            backgroundColor: Colors.white,
                            foregroundColor: Colors.purple,
                            onPressed: () => isPlaying ? _pauseMusic(context) : _resumeMusic(context),
                            child: Icon(isPlaying ? Icons.pause : Icons.play_arrow, size: 32),
                          ),
                          const SizedBox(width: 24),
                          IconButton(
                            onPressed: () => _nextSong(context),
                            icon: const Icon(Icons.skip_next, color: Colors.white, size: 32),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Icon(Icons.volume_down, color: Colors.grey),
                    Expanded(
                      child: Slider(
                        value: (status['volume'] ?? 50).toDouble(),
                        min: 0,
                        max: 100,
                        onChanged: (value) {},
                      ),
                    ),
                    Text('${status['volume'] ?? 50}'),
                  ],
                ),
              ),
              const Padding(
                padding: EdgeInsets.all(16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text('音乐列表', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: provider.musics.length,
                  itemBuilder: (context, index) {
                    final music = provider.musics[index];
                    return _buildMusicItem(context, music, isPlaying);
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMusicItem(BuildContext context, Music music, bool isPlaying) {
    return ListTile(
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.music_note, color: Colors.blue),
      ),
      title: Text(music.title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text('${music.artist} · ${music.album}'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: Icon(
              music.isFavorite ? Icons.favorite : Icons.favorite_border,
              color: music.isFavorite ? Colors.red : Colors.grey,
            ),
            onPressed: () {},
          ),
        ],
      ),
      onTap: () => _playMusic(context, music.id),
    );
  }

  Future<void> _playMusic(BuildContext context, int id) async {
    await context.read<AppProvider>()._playMusic(id);
  }

  Future<void> _pauseMusic(BuildContext context) async {
    final provider = context.read<AppProvider>();
    await provider._pauseMusic();
  }

  Future<void> _resumeMusic(BuildContext context) async {
    final provider = context.read<AppProvider>();
    await provider._resumeMusic();
  }

  Future<void> _nextSong(BuildContext context) async {
    final provider = context.read<AppProvider>();
    await provider._nextMusic();
  }

  Future<void> _prevSong(BuildContext context) async {
    final provider = context.read<AppProvider>();
    await provider._prevMusic();
  }
}

extension MusicActions on AppProvider {
  Future<void> _playMusic(int id) async {
    try {
      await ApiService.playMusic(id: id);
      await loadMusicStatus();
    } catch (e) {
      debugPrint('Play music error: $e');
    }
  }

  Future<void> _pauseMusic() async {
    try {
      await ApiService.pauseMusic();
      await loadMusicStatus();
    } catch (e) {
      debugPrint('Pause music error: $e');
    }
  }

  Future<void> _resumeMusic() async {
    try {
      await ApiService.playMusic();
      await loadMusicStatus();
    } catch (e) {
      debugPrint('Resume music error: $e');
    }
  }

  Future<void> _nextMusic() async {
    try {
      await ApiService.nextMusic();
      await loadMusicStatus();
    } catch (e) {
      debugPrint('Next music error: $e');
    }
  }

  Future<void> _prevMusic() async {
    try {
      await ApiService.prevMusic();
      await loadMusicStatus();
    } catch (e) {
      debugPrint('Prev music error: $e');
    }
  }
}
