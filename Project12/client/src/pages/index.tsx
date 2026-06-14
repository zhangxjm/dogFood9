import { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Tag, Tabs, Space } from 'antd';
import MainLayout from '../components/MainLayout';
import StatsOverview from '../components/StatsOverview';
import RoomList from '../components/RoomList';
import TrendChart from '../components/TrendChart';
import { useWebSocket } from '../hooks/useWebSocket';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function Dashboard() {
  const [latestMetrics, setLatestMetrics] = useState<any[]>([]);
  const [roomHistory, setRoomHistory] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');

  const { lastMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'metrics_update') {
        setLatestMetrics(data.data);
        updateOverviewData(data.data);
      }
    },
  });

  const updateOverviewData = (metrics: any[]) => {
    const platformMap = {};
    metrics.forEach((m) => {
      if (!platformMap[m.platform]) {
        platformMap[m.platform] = {
          name: m.platform_name,
          key: m.platform,
          totalViewers: 0,
          totalLikes: 0,
          totalComments: 0,
          totalGifts: 0,
          totalClicks: 0,
          totalOrders: 0,
          roomCount: 0,
        };
      }
      platformMap[m.platform].totalViewers += m.viewer_count || 0;
      platformMap[m.platform].totalLikes += m.like_count || 0;
      platformMap[m.platform].totalComments += m.comment_count || 0;
      platformMap[m.platform].totalGifts += m.gift_value || 0;
      platformMap[m.platform].totalClicks += m.product_click_count || 0;
      platformMap[m.platform].totalOrders += m.order_count || 0;
      platformMap[m.platform].roomCount += 1;
    });
    setPlatformData(Object.values(platformMap));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [metricsRes] = await Promise.all([
        api.getLatestMetrics(),
      ]);
      
      if (metricsRes.success) {
        setLatestMetrics(metricsRes.data);
        updateOverviewData(metricsRes.data);
      }

      if (metricsRes.data?.length > 0) {
        const topRoomId = metricsRes.data[0].room_id;
        const historyRes = await api.getRoomMetrics(topRoomId, {
          start: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          end: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          granularity: 'hour',
        });
        if (historyRes.success) {
          setRoomHistory(historyRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const overviewData = {
    totalViewers: latestMetrics.reduce((sum, m) => sum + (m.viewer_count || 0), 0),
    totalLikes: latestMetrics.reduce((sum, m) => sum + (m.like_count || 0), 0),
    totalComments: latestMetrics.reduce((sum, m) => sum + (m.comment_count || 0), 0),
    totalGifts: latestMetrics.reduce((sum, m) => sum + (m.gift_value || 0), 0),
    totalClicks: latestMetrics.reduce((sum, m) => sum + (m.product_click_count || 0), 0),
    conversionRate: latestMetrics.length > 0
      ? (latestMetrics.reduce((sum, m) => sum + (m.conversion_rate || 0), 0) / latestMetrics.length)
      : 0,
  };

  const filteredMetrics = selectedTab === 'all'
    ? latestMetrics
    : latestMetrics.filter((m) => m.platform === selectedTab);

  const tabItems = [
    { key: 'all', label: '全部平台' },
    ...platformData.map((p: any) => ({ key: p.key, label: p.name })),
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          实时数据监控
        </Title>
        <Tag color="green">
          {isConnected ? '实时连接中' : '连接断开'}
        </Tag>
      </Space>
      <p style={{ color: '#666', marginBottom: 0 }}>
        监控各平台直播数据，实时更新
      </p>
    </div>

      <StatsOverview data={overviewData} />

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="观看人数趋势" extra={
            <Tag color="blue">{latestMetrics[0]?.title || '热门直播间'}</Tag>
          }>
            <TrendChart
              data={roomHistory}
              metrics={['avg_viewer_count', 'total_likes']}
              height={300}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="平台分布">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {platformData.map((p: any) => (
                <div key={p.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span style={{ color: '#1890ff' }}>
                      {p.totalViewers?.toLocaleString()} 人
                    </span>
                  </div>
                  <div style={{
                    height: 8,
                    borderRadius: 4,
                    background: '#f0f0f0',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.min(100, (p.totalViewers / overviewData.totalViewers) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #1890ff, #69c0ff)',
                      borderRadius: 4,
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    {p.roomCount} 个直播间
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 24 }}
        title="直播间列表"
        tabList={tabItems}
        activeTabKey={selectedTab}
        onTabChange={setSelectedTab}
      >
        <RoomList data={filteredMetrics} loading={loading} />
      </Card>
    </MainLayout>
  );
}
