import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Table,
  Tag,
  message,
} from 'antd';
import { BarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import TrendChart from '../components/TrendChart';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ComparePage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<any>([
    dayjs().subtract(24, 'hour'),
    dayjs(),
  ]);
  const [compareData, setCompareData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const res = await api.getRooms();
      if (res.success) {
        setRooms(res.data);
        if (res.data.length >= 2) {
          setSelectedRooms([res.data[0].id, res.data[1].id]);
        }
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  const handleCompare = async () => {
    if (selectedRooms.length < 2) {
      message.warning('请至少选择两个直播间进行对比');
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(
        selectedRooms.map((roomId) =>
          api.getRoomMetrics(roomId, {
            start: timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
            end: timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
            granularity: 'hour',
          })
        )
      );

      const roomData = results.map((res, index) => ({
        roomId: selectedRooms[index],
        roomInfo: rooms.find((r) => r.id === selectedRooms[index]),
        metrics: res.data || [],
        summary: calculateSummary(res.data || []),
      }));

      setCompareData(roomData);
    } catch (err) {
      message.error('对比数据加载失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (metrics: any[]) => {
    let totalViewers = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalGiftValue = 0;
    let totalClicks = 0;
    let totalOrders = 0;
    let totalGMV = 0;
    let peakViewers = 0;
    let avgConversion = 0;

    metrics.forEach((m) => {
      totalLikes += m.total_likes || 0;
      totalComments += m.total_comments || 0;
      totalGiftValue += m.total_gift_value || 0;
      totalClicks += m.total_product_clicks || 0;
      totalOrders += m.total_orders || 0;
      totalGMV += m.total_order_amount || 0;
      peakViewers = Math.max(peakViewers, m.max_viewer_count || 0);
      totalViewers += m.avg_viewer_count || 0;
      avgConversion += m.avg_conversion_rate || 0;
    });

    return {
      avgViewers: metrics.length > 0 ? Math.floor(totalViewers / metrics.length) : 0,
      peakViewers,
      totalLikes,
      totalComments,
      totalGiftValue: Math.round(totalGiftValue * 100) / 100,
      totalClicks,
      totalOrders,
      totalGMV: Math.round(totalGMV * 100) / 100,
      avgConversion: metrics.length > 0 ? Math.round((avgConversion / metrics.length) * 100) / 100 : 0,
    };
  };

  useEffect(() => {
    if (selectedRooms.length >= 2) {
      handleCompare();
    }
  }, [selectedRooms.length]);

  const columns = [
    {
      title: '指标',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    ...compareData.map((item, index) => ({
      title: item.roomInfo?.title || `直播间 ${index + 1}`,
      dataIndex: `room${index}`,
      key: `room${index}`,
      render: (_: any, record: any) => {
        const values = compareData.map((d) => d.summary[record.key]);
        const maxVal = Math.max(...values);
        const isMax = item.summary[record.key] === maxVal && maxVal > 0;
        
        let value = item.summary[record.key];
        if (record.key === 'totalGiftValue' || record.key === 'totalGMV') {
          value = `¥${value?.toLocaleString()}`;
        } else if (record.key === 'avgConversion') {
          value = `${value}%`;
        } else {
          value = value?.toLocaleString();
        }

        return (
          <span style={{ color: isMax ? '#52c41a' : '#333', fontWeight: isMax ? 600 : 400 }}>
            {value}
            {isMax && <Tag color="green" style={{ marginLeft: 4 }}>最高</Tag>}
          </span>
        );
      },
    })),
  ];

  const tableData = [
    { key: 'avgViewers', name: '平均观看人数' },
    { key: 'peakViewers', name: '峰值观看人数' },
    { key: 'totalLikes', name: '总点赞数' },
    { key: 'totalComments', name: '总评论数' },
    { key: 'totalGiftValue', name: '礼物总价值' },
    { key: 'totalClicks', name: '商品点击量' },
    { key: 'totalOrders', name: '订单总数' },
    { key: 'totalGMV', name: 'GMV总额' },
    { key: 'avgConversion', name: '平均转化率' },
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: '0 0 8px 0' }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          多维度数据对比
        </Title>
        <p style={{ color: '#666', margin: 0 }}>
          选择多个直播间进行数据对比分析
        </p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <div>
            <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>选择直播间</div>
            <Select
              mode="multiple"
              style={{ minWidth: 400 }}
              placeholder="请选择要对比的直播间"
              value={selectedRooms}
              onChange={setSelectedRooms}
              maxTagCount={3}
            >
              {rooms.map((room) => (
                <Option key={room.id} value={room.id}>
                  {room.title} - {room.platform_display_name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>时间范围</div>
            <RangePicker
              showTime
              value={timeRange}
              onChange={setTimeRange}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleCompare} loading={loading}>
              开始对比
            </Button>
          </div>
        </Space>
      </Card>

      {compareData.length > 0 && (
        <>
          <Card title="数据对比表" style={{ marginBottom: 24 }}>
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="观看人数对比">
                {compareData.map((item, index) => (
                  <div key={index} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{item.roomInfo?.title}</span>
                    </div>
                    <TrendChart
                      data={item.metrics}
                      metrics={['avg_viewer_count']}
                      height={200}
                    />
                  </div>
                ))}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="转化数据对比">
                {compareData.map((item, index) => (
                  <div key={index} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{item.roomInfo?.title}</span>
                    </div>
                    <TrendChart
                      data={item.metrics}
                      metrics={['total_product_clicks', 'total_orders']}
                      height={200}
                    />
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </MainLayout>
  );
}
