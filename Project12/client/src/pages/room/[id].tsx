import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Avatar,
  Statistic,
  Descriptions,
  Table,
  Space,
} from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import MainLayout from '../../components/MainLayout';
import TrendChart from '../../components/TrendChart';
import { useWebSocket } from '../../hooks/useWebSocket';
import { api } from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function RoomDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [latestMetric, setLatestMetric] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { lastMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'metrics_update' && id) {
        const roomMetric = data.data.find((m: any) => m.room_id === Number(id));
        if (roomMetric) {
          setLatestMetric(roomMetric);
        }
      }
    },
  });

  useEffect(() => {
    if (id) {
      loadRoomData();
    }
  }, [id]);

  const loadRoomData = async () => {
    setLoading(true);
    try {
      const [roomRes, metricsRes, productsRes] = await Promise.all([
        api.getRoom(Number(id)),
        api.getRoomMetrics(Number(id), {
          start: dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          granularity: 'hour',
        }),
        api.getRoomProducts(Number(id)),
      ]);

      if (roomRes.success) {
        setRoomInfo(roomRes.data);
      }
      if (metricsRes.success) {
        setMetrics(metricsRes.data);
        if (metricsRes.data.length > 0) {
          setLatestMetric(metricsRes.data[metricsRes.data.length - 1]);
        }
      }
      if (productsRes.success) {
        setProducts(productsRes.data);
      }
    } catch (err) {
      console.error('Failed to load room data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !roomInfo) {
    return <MainLayout><div>加载中...</div></MainLayout>;
  }

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span style={{ color: '#f5222d' }}>¥{price}</span>,
    },
    {
      title: '点击量',
      dataIndex: 'click_count',
      key: 'click_count',
      render: (val: number) => val?.toLocaleString(),
      sorter: (a: any, b: any) => a.click_count - b.click_count,
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      render: (val: number) => val?.toLocaleString(),
      sorter: (a: any, b: any) => a.order_count - b.order_count,
    },
    {
      title: '销售额',
      dataIndex: 'order_amount',
      key: 'order_amount',
      render: (val: number) => <span style={{ fontWeight: 500 }}>¥{val?.toLocaleString()}</span>,
      sorter: (a: any, b: any) => a.order_amount - b.order_amount,
    },
    {
      title: '转化率',
      key: 'conversion',
      render: (_: any, record: any) => {
        const rate = record.click_count > 0
          ? ((record.order_count / record.click_count) * 100)
          : 0;
        return <Tag color={rate > 3 ? 'green' : rate > 1 ? 'orange' : 'red'}>
          {rate.toFixed(2)}%
        </Tag>;
      },
    },
  ];

  return (
    <MainLayout>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', fontSize: 28 }}>
            {roomInfo.streamer_name?.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: '0 0 8px 0' }}>
              {roomInfo.title}
            </Title>
            <Space size="large">
              <span style={{ color: '#666' }}>主播：{roomInfo.streamer_name}</span>
              <Tag color="blue">{roomInfo.platform_display_name}</Tag>
              <Tag color="green">直播中</Tag>
            </Space>
          </div>
          <Tag color="green" style={{ fontSize: 14, padding: '6px 16px' }}>
            <span style={{
              width: 8,
              height: 8,
              background: '#52c41a',
              borderRadius: '50%',
              display: 'inline-block',
              marginRight: 8,
              animation: 'pulse 2s infinite',
            }}></span>
            实时更新中
          </Tag>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <EyeOutlined style={{ color: '#1890ff' }} />
                观看人数
              </span>}
              value={latestMetric?.viewer_count || 0}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LikeOutlined style={{ color: '#52c41a' }} />
                点赞数
              </span>}
              value={latestMetric?.like_count || 0}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageOutlined style={{ color: '#faad14' }} />
                评论数
              </span>}
              value={latestMetric?.comment_count || 0}
              valueStyle={{ color: '#faad14', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GiftOutlined style={{ color: '#eb2f96' }} />
                礼物价值
              </span>}
              prefix="¥"
              value={latestMetric?.gift_value || 0}
              precision={2}
              valueStyle={{ color: '#eb2f96', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingCartOutlined style={{ color: '#722ed1' }} />
                商品点击
              </span>}
              value={latestMetric?.product_click_count || 0}
              valueStyle={{ color: '#722ed1', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiseOutlined style={{ color: '#13c2c2' }} />
                转化率
              </span>}
              value={latestMetric?.conversion_rate || 0}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#13c2c2', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="数据趋势">
            <TrendChart
              data={metrics}
              metrics={['avg_viewer_count', 'total_product_clicks', 'avg_conversion_rate']}
              height={350}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="互动数据">
            <TrendChart
              data={metrics}
              metrics={['total_likes', 'total_comments']}
              height={350}
            />
          </Card>
        </Col>
      </Row>

      <Card title="商品列表" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </MainLayout>
  );
}
