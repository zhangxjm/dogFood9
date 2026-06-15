import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { sceneApi, Scene } from '../services/api';
import wsService from '../services/websocket';

const SceneScreen: React.FC = () => {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activatingScene, setActivatingScene] = useState<string | null>(null);

  useEffect(() => {
    loadScenes();
  }, []);

  const loadScenes = async () => {
    try {
      const res = await sceneApi.getScenes(user?.roomId || undefined);
      setScenes(res.data.data);
    } catch (error: any) {
      Alert.alert('加载失败', error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScenes();
    setRefreshing(false);
  };

  const activateScene = async (scene: Scene) => {
    if (activatingScene) return;
    
    setActivatingScene(scene.id);
    try {
      if (wsService.isConnected() && user?.roomId) {
        await wsService.activateScene(scene.id, user.roomId);
      } else {
        if (user?.roomId) {
          await sceneApi.activateSceneForRoom(scene.id, user.roomId);
        } else {
          await sceneApi.activateScene(scene.id);
        }
      }
      Alert.alert('成功', `已切换到${scene.name}`);
    } catch (error: any) {
      Alert.alert('操作失败', error.message);
    } finally {
      setActivatingScene(null);
    }
  };

  const getSceneIcon = (iconName: string | null) => {
    const iconMap: Record<string, string> = {
      moon: 'moon',
      book: 'book',
      video: 'videocam',
      logout: 'log-out',
      home: 'home',
      heart: 'heart',
      leaf: 'leaf',
    };
    return iconMap[iconName || ''] || 'list';
  };

  const getSceneGradient = (iconName: string | null): [string, string] => {
    const gradients: Record<string, [string, string]> = {
      moon: ['#4a5568', '#2d3748'],
      book: ['#d69e2e', '#b7791f'],
      video: ['#805ad5', '#6b46c1'],
      logout: ['#e53e3e', '#c53030'],
      home: ['#48bb78', '#38a169'],
      heart: ['#ed64a6', '#d53f8c'],
      leaf: ['#68d391', '#48bb78'],
    };
    return gradients[iconName || ''] || ['#4299e1', '#3182ce'];
  };

  const renderSceneCard = (scene: Scene) => {
    const icon = getSceneIcon(scene.icon);
    const gradient = getSceneGradient(scene.icon);
    const isActivating = activatingScene === scene.id;

    return (
      <TouchableOpacity
        key={scene.id}
        style={styles.sceneCard}
        onPress={() => activateScene(scene)}
        activeOpacity={0.8}
        disabled={isActivating}
      >
        <LinearGradient
          colors={gradient}
          style={[styles.sceneGradient, isActivating && styles.sceneActivating]}
        >
          <View style={styles.sceneContent}>
            <Ionicons name={icon as any} size={40} color="#fff" />
            <View style={styles.sceneInfo}>
              <Text style={styles.sceneName}>{scene.name}</Text>
              <Text style={styles.sceneDescription} numberOfLines={2}>
                {scene.description}
              </Text>
            </View>
            {isActivating ? (
              <Ionicons name="hourglass" size={24} color="#fff" />
            ) : (
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a365d', '#2c5282']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>场景模式</Text>
        <Text style={styles.headerSubtitle}>一键切换，智能体验</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.tipContainer}>
          <Ionicons name="information-circle" size={20} color="#4299e1" />
          <Text style={styles.tipText}>
            点击场景卡片即可一键切换所有设备状态
          </Text>
        </View>

        <View style={styles.scenesList}>
          {scenes.map(scene => renderSceneCard(scene))}
        </View>

        <View style={styles.sceneDetailContainer}>
          <Text style={styles.sectionTitle}>场景说明</Text>
          
          <View style={styles.sceneDetailCard}>
            <View style={styles.sceneDetailHeader}>
              <Ionicons name="moon" size={24} color="#4a5568" />
              <Text style={styles.sceneDetailTitle}>睡眠模式</Text>
            </View>
            <Text style={styles.sceneDetailText}>
              关闭所有灯光，空调调至睡眠模式26°C，拉上窗帘，关闭电视，为您营造舒适的睡眠环境。
            </Text>
          </View>

          <View style={styles.sceneDetailCard}>
            <View style={styles.sceneDetailHeader}>
              <Ionicons name="book" size={24} color="#d69e2e" />
              <Text style={styles.sceneDetailTitle}>阅读模式</Text>
            </View>
            <Text style={styles.sceneDetailText}>
              开启床头灯，亮度调至60%，暖光色温，空调保持24°C，窗帘半开，让您享受安静的阅读时光。
            </Text>
          </View>

          <View style={styles.sceneDetailCard}>
            <View style={styles.sceneDetailHeader}>
              <Ionicons name="videocam" size={24} color="#805ad5" />
              <Text style={styles.sceneDetailTitle}>观影模式</Text>
            </View>
            <Text style={styles.sceneDetailText}>
              灯光调至20%亮度，开启电视，拉上窗帘，空调保持舒适温度，打造私人影院体验。
            </Text>
          </View>

          <View style={styles.sceneDetailCard}>
            <View style={styles.sceneDetailHeader}>
              <Ionicons name="log-out" size={24} color="#e53e3e" />
              <Text style={styles.sceneDetailTitle}>离开模式</Text>
            </View>
            <Text style={styles.sceneDetailText}>
              关闭所有电器设备，拉开窗帘，节约能源，为酒店环保贡献一份力量。
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebf8ff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipText: {
    color: '#2b6cb0',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  scenesList: {
    marginBottom: 20,
  },
  sceneCard: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  sceneGradient: {
    borderRadius: 20,
  },
  sceneActivating: {
    opacity: 0.7,
  },
  sceneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  sceneInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  sceneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  sceneDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  sceneDetailContainer: {
    marginTop: 10,
  },
  sceneDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sceneDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sceneDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 10,
  },
  sceneDetailText: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 22,
  },
});

export default SceneScreen;
