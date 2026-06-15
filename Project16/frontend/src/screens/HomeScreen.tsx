import React, { useState, useEffect, useCallback } from 'react';
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
import { deviceApi, roomApi, Device } from '../services/api';
import wsService from '../services/websocket';

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [roomStatus, setRoomStatus] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    loadData();
    setupWebSocket();
    
    const unsubscribe = wsService.on('device_state_changed', (data) => {
      if (data.data) {
        updateDevice(data.data);
      }
    });

    const statusUnsubscribe = wsService.on('room_status_changed', (data) => {
      if (data.data) {
        setRoomStatus(data.data);
      }
    });

    return () => {
      unsubscribe();
      statusUnsubscribe();
    };
  }, []);

  const setupWebSocket = async () => {
    try {
      await wsService.connect();
      setWsConnected(wsService.isConnected());
    } catch (error) {
      console.log('WebSocket connection error:', error);
    }
  };

  const updateDevice = (updatedDevice: Device) => {
    setDevices(prev =>
      prev.map(d => (d.id === updatedDevice.id ? { ...d, ...updatedDevice } : d))
    );
    if (roomStatus?.devices) {
      setRoomStatus(prev => ({
        ...prev,
        devices: prev.devices.map((d: Device) =>
          d.id === updatedDevice.id ? { ...d, ...updatedDevice } : d
        ),
        deviceCount: {
          ...prev.deviceCount,
          on: updatedDevice.status === 'on'
            ? prev.deviceCount.on + 1
            : prev.deviceCount.on - 1,
          off: updatedDevice.status === 'off'
            ? prev.deviceCount.off + 1
            : prev.deviceCount.off - 1,
        },
      }));
    }
  };

  const loadData = async () => {
    try {
      if (user?.roomId) {
        const [devicesRes, statusRes] = await Promise.all([
          roomApi.getRoomDevices(user.roomId),
          roomApi.getRoomStatus(user.roomId),
        ]);
        setDevices(devicesRes.data.data);
        setRoomStatus(statusRes.data.data);
      } else {
        const devicesRes = await deviceApi.getDevices();
        setDevices(devicesRes.data.data);
      }
    } catch (error: any) {
      Alert.alert('加载失败', error.message);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const toggleDevice = async (device: Device) => {
    try {
      if (wsService.isConnected()) {
        const result = await wsService.toggleDevice(device.id);
        if (result?.data?.device) {
          updateDevice(result.data.device);
        }
      } else {
        const result = await deviceApi.toggle(device.id);
        updateDevice(result.data.data);
      }
    } catch (error: any) {
      Alert.alert('操作失败', error.message);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light':
        return 'bulb';
      case 'ac':
        return 'snow';
      case 'curtain':
        return 'easel';
      case 'tv':
        return 'tv';
      default:
        return 'help-circle';
    }
  };

  const getDeviceColor = (type: string, isOn: boolean) => {
    if (!isOn) return '#718096';
    switch (type) {
      case 'light':
        return '#f6e05e';
      case 'ac':
        return '#4299e1';
      case 'curtain':
        return '#48bb78';
      case 'tv':
        return '#ed8936';
      default:
        return '#667eea';
    }
  };

  const renderDeviceCard = (device: Device) => {
    const isOn = device.status === 'on';
    const icon = getDeviceIcon(device.type);
    const color = getDeviceColor(device.type, isOn);

    return (
      <TouchableOpacity
        key={device.id}
        style={[styles.deviceCard, isOn && styles.deviceCardActive]}
        onPress={() => toggleDevice(device)}
        activeOpacity={0.8}
      >
        <View style={[styles.deviceIconContainer, { backgroundColor: isOn ? color + '20' : '#e2e8f0' }]}>
          <Ionicons name={icon as any} size={36} color={color} />
        </View>
        <Text style={[styles.deviceName, isOn && styles.deviceNameActive]}>{device.name}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isOn ? color : '#cbd5e0' }]} />
          <Text style={[styles.statusText, { color: isOn ? color : '#a0aec0' }]}>
            {isOn ? '已开启' : '已关闭'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a365d', '#2c5282']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>欢迎回来</Text>
            <Text style={styles.userName}>{user?.name || '用户'}</Text>
            {user?.roomNumber && (
              <Text style={styles.roomNumber}>
                <Ionicons name="location" size={14} color="#fff" /> {user.roomNumber} 房
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.connectionBadge, wsConnected && styles.connectedBadge]}>
              <View style={[styles.connectionDot, wsConnected && styles.connectedDot]} />
              <Text style={styles.connectionText}>
                {wsConnected ? '已连接' : '离线'}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {roomStatus && (
          <View style={styles.powerCard}>
            <View style={styles.powerInfo}>
              <Ionicons name="flash" size={28} color="#f6e05e" />
              <View>
                <Text style={styles.powerTitle}>当前功率</Text>
                <Text style={styles.powerValue}>
                  {roomStatus.currentPowerUsage || 0} <Text style={styles.powerUnit}>W</Text>
                </Text>
              </View>
            </View>
            <View style={styles.powerDivider} />
            <View style={styles.powerInfo}>
              <Ionicons name="hardware-chip" size={28} color="#48bb78" />
              <View>
                <Text style={styles.powerTitle}>运行设备</Text>
                <Text style={styles.powerValue}>
                  {roomStatus.deviceCount?.on || 0}
                  <Text style={styles.powerUnit}>/{roomStatus.deviceCount?.total || 0}</Text>
                </Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>设备控制</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#718096" />
          </TouchableOpacity>
        </View>

        <View style={styles.devicesGrid}>
          {devices.map(device => renderDeviceCard(device))}
        </View>

        {!user?.roomId && (
          <View style={styles.adminTip}>
            <Ionicons name="information-circle" size={20} color="#4299e1" />
            <Text style={styles.adminTipText}>
              管理员模式 - 可查看所有设备状态
            </Text>
          </View>
        )}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  roomNumber: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 15,
  },
  connectedBadge: {
    backgroundColor: 'rgba(72, 187, 120, 0.3)',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fc8181',
    marginRight: 5,
  },
  connectedDot: {
    backgroundColor: '#48bb78',
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
  },
  logoutButton: {
    padding: 5,
  },
  powerCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
  },
  powerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  powerDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 15,
  },
  powerTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 10,
  },
  powerValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  powerUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  devicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deviceCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  deviceCardActive: {
    backgroundColor: '#fff',
    shadowOpacity: 0.15,
  },
  deviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  deviceNameActive: {
    color: '#2c5282',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  adminTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebf8ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  adminTipText: {
    color: '#2b6cb0',
    marginLeft: 10,
    fontSize: 14,
  },
});

export default HomeScreen;
