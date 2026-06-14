import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Statistic, Spin, message } from 'antd';
import {
  CarOutlined,
  DashboardOutlined,
  DollarOutlined,
  AlertOutlined,
  LoginOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardOverview, getDashboardToday, getSpots, createParkingWebSocket } from '../../api';

const COLORS = ['#52c41a', '#ff4d4f', '#faad14', '#d9d9d9'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({});
  const [today, setToday] = useState({});
  const [chartData, setChartData] = useState([]);
  const wsRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [overviewData, todayData, spotsData] = await Promise.all([
        getDashboardOverview(),
        getDashboardToday(),
        getSpots(),
      ]);
      setOverview(overviewData || {});
      setToday(todayData || {});

      const spots = Array.isArray(spotsData) ? spotsData : spotsData?.data || [];
      const floorMap = {};
      spots.forEach((s) => {
        const floor = s.floor || '未知';
        if (!floorMap[floor]) floorMap[floor] = { floor, occupied: 0, free: 0 };
        if (s.status === 'OCCUPIED') {
          floorMap[floor].occupied += 1;
        } else if (s.status === 'FREE') {
          floorMap[floor].free += 1;
        }
      });
      const chartList = Object.values(floorMap).sort((a, b) => a.floor.localeCompare(b.floor));
      setChartData(chartList);
    } catch (e) {
      message.error('加载仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);

    wsRef.current = createParkingWebSocket((msg) => {
      if (msg.type === 'SPOT_UPDATE' || msg.type === 'VEHICLE_ENTRY' || msg.type === 'VEHICLE_EXIT') {
        fetchData();
      }
    });

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchData]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const totalSpots = overview.totalSpots || 0;
  const occupiedSpots = overview.occupied || 0;
  const freeSpots = overview.free || 0;

  const pieData = [
    { name: '已占用', value: occupiedSpots },
    { name: '空闲', value: freeSpots },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic title="总车位" value={totalSpots} prefix={<DashboardOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic title="已占用" value={occupiedSpots} prefix={<CarOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic title="空闲" value={freeSpots} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic title="今日收入" value={overview.todayRevenue || 0} prefix={<DollarOutlined />} suffix="元" valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic title="今日入场" value={overview.todayEntries || 0} prefix={<LoginOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic title="待处理告警" value={overview.pendingAlerts || 0} prefix={<AlertOutlined />} valueStyle={{ color: '#eb2f96' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="车位占用比例">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="各楼层车位分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="floor" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupied" name="已占用" fill="#ff4d4f" />
                <Bar dataKey="free" name="空闲" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
