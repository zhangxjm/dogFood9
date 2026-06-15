import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { energyApi, EnergyData } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

type Period = 'day' | 'week' | 'month';

const EnergyScreen: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [currentPower, setCurrentPower] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (user?.roomId) {
        const [energyRes, powerRes] = await Promise.all([
          energyApi.getRoomConsumption(user.roomId, period),
          energyApi.getCurrentPower(user.roomId),
        ]);
        setEnergyData(energyRes.data.data);
        setCurrentPower(powerRes.data.data);
      } else {
        const energyRes = await energyApi.getHotelConsumption(period);
        setEnergyData(energyRes.data.data);
      }
    } catch (error: any) {
      Alert.alert('加载失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getChartData = () => {
    if (!energyData?.dailyData || energyData.dailyData.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }
    return {
      labels: energyData.dailyData.map(d => formatDate(d.day)),
      datasets: [{
        data: energyData.dailyData.map(d => Math.round(d.consumption * 100) / 100),
      }],
    };
  };

  const getPieChartData = () => {
    if (!energyData?.byDevice || energyData.byDevice.length === 0) {
      return [];
    }
    const colors = ['#4299e1', '#f6e05e', '#48bb78', '#ed8936'];
    const typeNames: Record<string, string> = {
      light: '灯光',
      ac: '空调',
      curtain: '窗帘',
      tv: '电视',
    };
    
    const byType: Record<string, number> = {};
    energyData.byDevice.forEach(d => {
      const type = d.deviceType;
      byType[type] = (byType[type] || 0) + d.estimatedConsumption;
    });

    return Object.entries(byType).map(([type, consumption], index) => ({
      name: typeNames[type] || type,
      population: Math.round(consumption * 100) / 100,
      color: colors[index % colors.length],
      legendFontColor: '#718096',
      legendFontSize: 12,
    }));
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(49, 130, 206, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(113, 128, 150, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#3182ce',
    },
  };

  const renderPeriodButton = (p: Period, label: string) => (
    <TouchableOpacity
      key={p}
      style={[styles.periodButton, period === p && styles.periodButtonActive]}
      onPress={() => setPeriod(p)}
    >
      <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a365d', '#2c5282']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>能耗统计</Text>
        <Text style={styles.headerSubtitle}>绿色节能，智慧生活</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flash" size={24} color="#f6e05e" />
            <Text style={styles.statValue}>
              {energyData?.totalConsumption?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>kWh</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color="#48bb78" />
            <Text style={styles.statValue}>
              ¥{energyData?.totalCost?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>费用</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.periodSelector}>
          {renderPeriodButton('day', '今日')}
          {renderPeriodButton('week', '本周')}
          {renderPeriodButton('month', '本月')}
        </View>

        {currentPower && (
          <View style={styles.currentPowerCard}>
            <View style={styles.currentPowerHeader}>
              <Ionicons name="pulse" size={24} color="#3182ce" />
              <Text style={styles.currentPowerTitle}>实时功率</Text>
            </View>
            <View style={styles.currentPowerContent}>
              <Text style={styles.currentPowerValue}>
                {currentPower.totalPower || 0}
                <Text style={styles.currentPowerUnit}> W</Text>
              </Text>
              <View style={styles.powerDevices}>
                <Text style={styles.powerDevicesText}>
                  {currentPower.activeDeviceCount || 0} 台设备运行中
                </Text>
              </View>
            </View>
            {currentPower.activeDevices && currentPower.activeDevices.length > 0 && (
              <View style={styles.activeDevicesList}>
                {currentPower.activeDevices.slice(0, 4).map((device: any, index: number) => (
                  <View key={index} style={styles.activeDeviceItem}>
                    <Ionicons
                      name={device.type === 'light' ? 'bulb' : device.type === 'ac' ? 'snow' : 'easel'}
                      size={14}
                      color="#48bb78"
                    />
                    <Text style={styles.activeDeviceName}>{device.name}</Text>
                    <Text style={styles.activeDevicePower}>{device.powerRating}W</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>用电量趋势</Text>
          {!loading && energyData?.dailyData && energyData.dailyData.length > 0 ? (
            <LineChart
              data={getChartData()}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>暂无数据</Text>
            </View>
          )}
        </View>

        {energyData?.byDevice && energyData.byDevice.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>设备能耗分布</Text>
            <PieChart
              data={getPieChartData()}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {energyData?.byDevice && energyData.byDevice.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>设备明细</Text>
            <View style={styles.deviceList}>
              {energyData.byDevice.map((device, index) => (
                <View key={device.deviceId} style={styles.deviceItem}>
                  <View style={styles.deviceRank}>
                    <Text style={styles.deviceRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.deviceName}</Text>
                    <Text style={styles.deviceType}>
                      {device.deviceType === 'light' ? '灯光' : 
                       device.deviceType === 'ac' ? '空调' :
                       device.deviceType === 'curtain' ? '窗帘' : '电视'}
                    </Text>
                  </View>
                  <View style={styles.deviceConsumption}>
                    <Text style={styles.deviceConsumptionValue}>
                      {device.estimatedConsumption.toFixed(2)} kWh
                    </Text>
                    <Text style={styles.deviceCost}>
                      ¥{device.estimatedCost.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.tipCard}>
          <Ionicons name="leaf" size={24} color="#48bb78" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>节能小贴士</Text>
            <Text style={styles.tipText}>
              1. 离开房间时请随手关灯{'\n'}
              2. 空调温度设置在26°C最节能{'\n'}
              3. 不使用电器时请拔掉电源
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
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  periodButtonActive: {
    backgroundColor: '#3182ce',
  },
  periodButtonText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  currentPowerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  currentPowerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentPowerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 10,
  },
  currentPowerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentPowerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c5282',
  },
  currentPowerUnit: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#718096',
  },
  powerDevices: {
    backgroundColor: '#f0fff4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  powerDevicesText: {
    color: '#38a169',
    fontSize: 12,
  },
  activeDevicesList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  activeDeviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  activeDeviceName: {
    flex: 1,
    marginLeft: 8,
    color: '#4a5568',
    fontSize: 14,
  },
  activeDevicePower: {
    color: '#718096',
    fontSize: 12,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyChart: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#a0aec0',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  deviceList: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#edf2f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceRankText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
  },
  deviceType: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 2,
  },
  deviceConsumption: {
    alignItems: 'flex-end',
  },
  deviceConsumptionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5282',
  },
  deviceCost: {
    fontSize: 12,
    color: '#48bb78',
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fff4',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f855a',
    marginBottom: 8,
  },
  tipText: {
    color: '#276749',
    fontSize: 14,
    lineHeight: 22,
  },
});

export default EnergyScreen;
