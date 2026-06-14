import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Button,
  Checkbox,
  Space,
  Typography,
  Table,
  Statistic,
  message,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import TrendChart from '../components/TrendChart';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const dimensionOptions = [
  { label: '观看人数', value: 'viewer_count' },
  { label: '点赞数', value: 'like_count' },
  { label: '评论数', value: 'comment_count' },
  { label: '分享数', value: 'share_count' },
  { label: '礼物价值', value: 'gift_value' },
  { label: '商品点击', value: 'product_click_count' },
  { label: '订单数', value: 'order_count' },
  { label: '转化率', value: 'conversion_rate' },
];

const metricMap: Record<string, string> = {
  viewer_count: 'avg_viewer_count',
  like_count: 'total_likes',
  comment_count: 'total_comments',
  share_count: 'total_shares',
  gift_value: 'total_gift_value',
  product_click_count: 'total_product_clicks',
  order_count: 'total_orders',
  conversion_rate: 'avg_conversion_rate',
};

export default function ReportPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<any>([
    dayjs().subtract(24, 'hour'),
    dayjs(),
  ]);
  const [dimensions, setDimensions] = useState<string[]>(['viewer_count', 'like_count', 'product_click_count']);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const loadRooms = async () => {
    try {
      const res = await api.getRooms();
      if (res.success) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleGenerate = async () => {
    if (selectedRooms.length === 0) {
      message.warning('请至少选择一个直播间');
      return;
    }
    if (dimensions.length === 0) {
      message.warning('请至少选择一个维度');
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

      const roomData = results.map((res, index) => {
        const roomInfo = rooms.find((r) => r.id === selectedRooms[index]);
        const metrics = res.data || [];
        const summary = calculateSummary(metrics);
        return {
          roomId: selectedRooms[index],
          roomInfo,
          metrics,
          summary,
        };
      });

      const overall = calculateOverall(roomData);

      setReportData({
        rooms: roomData,
        overall,
        dimensions,
        timeRange: {
          start: timeRange[0].format('YYYY-MM-DD HH:mm'),
          end: timeRange[1].format('YYYY-MM-DD HH:mm'),
        },
        generateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      });
      setGenerated(true);
      message.success('报表生成成功');
    } catch (err) {
      message.error('报表生成失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (metrics: any[]) => {
    let totalViewers = 0;
    let maxViewers = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalGiftValue = 0;
    let totalClicks = 0;
    let totalOrders = 0;
    let totalGMV = 0;
    let totalConversion = 0;

    metrics.forEach((m) => {
      totalViewers += m.avg_viewer_count || 0;
      maxViewers = Math.max(maxViewers, m.max_viewer_count || 0);
      totalLikes += m.total_likes || 0;
      totalComments += m.total_comments || 0;
      totalShares += m.total_shares || 0;
      totalGiftValue += m.total_gift_value || 0;
      totalClicks += m.total_product_clicks || 0;
      totalOrders += m.total_orders || 0;
      totalGMV += m.total_order_amount || 0;
      totalConversion += m.avg_conversion_rate || 0;
    });

    return {
      avgViewers: metrics.length > 0 ? Math.floor(totalViewers / metrics.length) : 0,
      maxViewers,
      totalLikes,
      totalComments,
      totalShares,
      totalGiftValue: Math.round(totalGiftValue * 100) / 100,
      totalClicks,
      totalOrders,
      totalGMV: Math.round(totalGMV * 100) / 100,
      avgConversion: metrics.length > 0 ? Math.round((totalConversion / metrics.length) * 100) / 100 : 0,
    };
  };

  const calculateOverall = (roomData: any[]) => {
    let totalViewers = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalGiftValue = 0;
    let totalClicks = 0;
    let totalOrders = 0;
    let totalGMV = 0;

    roomData.forEach((room) => {
      totalViewers += room.summary.avgViewers;
      totalLikes += room.summary.totalLikes;
      totalComments += room.summary.totalComments;
      totalGiftValue += room.summary.totalGiftValue;
      totalClicks += room.summary.totalClicks;
      totalOrders += room.summary.totalOrders;
      totalGMV += room.summary.totalGMV;
    });

    return {
      avgViewers: Math.floor(totalViewers / roomData.length),
      totalLikes,
      totalComments,
      totalGiftValue: Math.round(totalGiftValue * 100) / 100,
      totalClicks,
      totalOrders,
      totalGMV: Math.round(totalGMV * 100) / 100,
      conversionRate: totalClicks > 0 ? Math.round((totalOrders / totalClicks) * 10000) / 100 : 0,
    };
  };

  const handleExport = () => {
    if (!reportData) return;

    try {
      const csvContent = generateCSV(reportData);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `直播数据报表_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('报表导出成功');
    } catch (err) {
      console.error('Export error:', err);
      message.error('报表导出失败');
    }
  };

  const generateCSV = (data: any) => {
    const lines: string[] = [];
    const escapeCSV = (value: string | number) => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    lines.push('直播数据监控报表');
    lines.push('');
    lines.push(`生成时间,${escapeCSV(data.generateTime)}`);
    lines.push(`时间范围,${escapeCSV(data.timeRange.start + ' 至 ' + data.timeRange.end)}`);
    lines.push(`直播间数量,${data.rooms.length} 个`);
    lines.push(`数据维度,${escapeCSV(data.dimensions.map((d: string) => {
      const opt = dimensionOptions.find((o) => o.value === d);
      return opt?.label || d;
    }).join('、'))}`);
    lines.push('');

    lines.push('【汇总数据】');
    lines.push('指标,数值');
    lines.push(`总平均观看人数,${data.overall.avgViewers}`);
    lines.push(`总点赞数,${data.overall.totalLikes}`);
    lines.push(`总评论数,${data.overall.totalComments}`);
    lines.push(`总礼物价值(元),${data.overall.totalGiftValue}`);
    lines.push(`总商品点击量,${data.overall.totalClicks}`);
    lines.push(`总订单数,${data.overall.totalOrders}`);
    lines.push(`总GMV(元),${data.overall.totalGMV}`);
    lines.push(`总转化率,${data.overall.conversionRate}%`);
    lines.push('');

    lines.push('【各直播间数据明细】');
    const headerCols = ['直播间', '平台', '主播'];
    if (data.dimensions.includes('viewer_count')) {
      headerCols.push('平均观看人数', '峰值观看人数');
    }
    if (data.dimensions.includes('like_count')) {
      headerCols.push('总点赞数');
    }
    if (data.dimensions.includes('comment_count')) {
      headerCols.push('总评论数');
    }
    if (data.dimensions.includes('share_count')) {
      headerCols.push('总分享数');
    }
    if (data.dimensions.includes('gift_value')) {
      headerCols.push('礼物价值(元)');
    }
    if (data.dimensions.includes('product_click_count')) {
      headerCols.push('商品点击量');
    }
    if (data.dimensions.includes('order_count')) {
      headerCols.push('订单数');
    }
    if (data.dimensions.includes('conversion_rate')) {
      headerCols.push('转化率(%)');
    }
    lines.push(headerCols.join(','));

    data.rooms.forEach((room: any) => {
      const row = [
        escapeCSV(room.roomInfo?.title || ''),
        escapeCSV(room.roomInfo?.platform_display_name || ''),
        escapeCSV(room.roomInfo?.streamer_name || ''),
      ];
      if (data.dimensions.includes('viewer_count')) {
        row.push(String(room.summary.avgViewers));
        row.push(String(room.summary.maxViewers));
      }
      if (data.dimensions.includes('like_count')) {
        row.push(String(room.summary.totalLikes));
      }
      if (data.dimensions.includes('comment_count')) {
        row.push(String(room.summary.totalComments));
      }
      if (data.dimensions.includes('share_count')) {
        row.push(String(room.summary.totalShares));
      }
      if (data.dimensions.includes('gift_value')) {
        row.push(String(room.summary.totalGiftValue));
      }
      if (data.dimensions.includes('product_click_count')) {
        row.push(String(room.summary.totalClicks));
      }
      if (data.dimensions.includes('order_count')) {
        row.push(String(room.summary.totalOrders));
      }
      if (data.dimensions.includes('conversion_rate')) {
        row.push(String(room.summary.avgConversion));
      }
      lines.push(row.join(','));
    });
    lines.push('');

    lines.push('【时间序列数据】');
    data.rooms.forEach((room: any, roomIndex: number) => {
      lines.push(`直播间${roomIndex + 1}: ${escapeCSV(room.roomInfo?.title || '')}`);
      
      const timeHeader = ['时间'];
      if (data.dimensions.includes('viewer_count')) {
        timeHeader.push('平均观看人数', '峰值观看人数');
      }
      if (data.dimensions.includes('like_count')) {
        timeHeader.push('点赞数');
      }
      if (data.dimensions.includes('comment_count')) {
        timeHeader.push('评论数');
      }
      if (data.dimensions.includes('share_count')) {
        timeHeader.push('分享数');
      }
      if (data.dimensions.includes('gift_value')) {
        timeHeader.push('礼物价值(元)');
      }
      if (data.dimensions.includes('product_click_count')) {
        timeHeader.push('商品点击量');
      }
      if (data.dimensions.includes('order_count')) {
        timeHeader.push('订单数');
      }
      if (data.dimensions.includes('conversion_rate')) {
        timeHeader.push('转化率(%)');
      }
      lines.push(timeHeader.join(','));

      room.metrics.forEach((metric: any) => {
        const row = [escapeCSV(metric.time_bucket || metric.timestamp || '')];
        if (data.dimensions.includes('viewer_count')) {
          row.push(String(metric.avg_viewer_count || 0));
          row.push(String(metric.max_viewer_count || 0));
        }
        if (data.dimensions.includes('like_count')) {
          row.push(String(metric.total_likes || 0));
        }
        if (data.dimensions.includes('comment_count')) {
          row.push(String(metric.total_comments || 0));
        }
        if (data.dimensions.includes('share_count')) {
          row.push(String(metric.total_shares || 0));
        }
        if (data.dimensions.includes('gift_value')) {
          row.push(String(metric.total_gift_value || 0));
        }
        if (data.dimensions.includes('product_click_count')) {
          row.push(String(metric.total_product_clicks || 0));
        }
        if (data.dimensions.includes('order_count')) {
          row.push(String(metric.total_orders || 0));
        }
        if (data.dimensions.includes('conversion_rate')) {
          row.push(String(metric.avg_conversion_rate || 0));
        }
        lines.push(row.join(','));
      });
      lines.push('');
    });

    return lines.join('\n');
  };

  const columns = [
    {
      title: '直播间',
      dataIndex: 'room',
      key: 'room',
      render: (_: any, record: any) => record.roomInfo?.title || '-',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (_: any, record: any) => record.roomInfo?.platform_display_name || '-',
    },
    {
      title: '主播',
      dataIndex: 'streamer',
      key: 'streamer',
      render: (_: any, record: any) => record.roomInfo?.streamer_name || '-',
    },
    ...(dimensions.includes('viewer_count') ? [
      {
        title: '平均观看',
        dataIndex: 'avgViewers',
        key: 'avgViewers',
        render: (_: any, record: any) => record.summary.avgViewers?.toLocaleString(),
      },
      {
        title: '峰值观看',
        dataIndex: 'maxViewers',
        key: 'maxViewers',
        render: (_: any, record: any) => record.summary.maxViewers?.toLocaleString(),
      },
    ] : []),
    ...(dimensions.includes('like_count') ? [
      {
        title: '总点赞',
        dataIndex: 'totalLikes',
        key: 'totalLikes',
        render: (_: any, record: any) => record.summary.totalLikes?.toLocaleString(),
      },
    ] : []),
    ...(dimensions.includes('comment_count') ? [
      {
        title: '总评论',
        dataIndex: 'totalComments',
        key: 'totalComments',
        render: (_: any, record: any) => record.summary.totalComments?.toLocaleString(),
      },
    ] : []),
    ...(dimensions.includes('gift_value') ? [
      {
        title: '礼物价值',
        dataIndex: 'totalGiftValue',
        key: 'totalGiftValue',
        render: (_: any, record: any) => `¥${record.summary.totalGiftValue?.toLocaleString()}`,
      },
    ] : []),
    ...(dimensions.includes('product_click_count') ? [
      {
        title: '商品点击',
        dataIndex: 'totalClicks',
        key: 'totalClicks',
        render: (_: any, record: any) => record.summary.totalClicks?.toLocaleString(),
      },
    ] : []),
    ...(dimensions.includes('order_count') ? [
      {
        title: '订单数',
        dataIndex: 'totalOrders',
        key: 'totalOrders',
        render: (_: any, record: any) => record.summary.totalOrders?.toLocaleString(),
      },
    ] : []),
    ...(dimensions.includes('conversion_rate') ? [
      {
        title: '转化率',
        dataIndex: 'avgConversion',
        key: 'avgConversion',
        render: (_: any, record: any) => `${record.summary.avgConversion}%`,
      },
    ] : []),
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: '0 0 8px 0' }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          自定义报表
        </Title>
        <p style={{ color: '#666', margin: 0 }}>
          选择直播间、时间范围和数据维度，生成个性化报表
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="报表配置" style={{ position: 'sticky', top: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>选择直播间</div>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="请选择直播间"
                  value={selectedRooms}
                  onChange={setSelectedRooms}
                  maxTagCount={3}
                  showSearch
                  optionFilterProp="children"
                >
                  {rooms.map((room) => (
                    <Option key={room.id} value={room.id}>
                      {room.title}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>时间范围</div>
                <RangePicker
                  showTime
                  style={{ width: '100%' }}
                  value={timeRange}
                  onChange={setTimeRange}
                />
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>数据维度</div>
                <Checkbox.Group
                  style={{ width: '100%' }}
                  value={dimensions}
                  onChange={(vals) => setDimensions(vals as string[])}
                >
                  <Space direction="vertical">
                    {dimensionOptions.map((opt) => (
                      <Checkbox key={opt.value} value={opt.value}>
                        {opt.label}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              </div>

              <Divider />

              <Space>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={handleGenerate}
                  loading={loading}
                  size="large"
                >
                  生成报表
                </Button>
                {generated && (
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    size="large"
                  >
                    导出报表
                  </Button>
                )}
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          {generated && reportData ? (
            <Card
              title="报表预览"
              extra={<span style={{ color: '#999', fontSize: 12 }}>
                生成时间：{reportData.generateTime}
              </span>}
            >
              <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <div style={{ marginBottom: 8, color: '#666' }}>
                  时间范围：{reportData.timeRange.start} ~ {reportData.timeRange.end}
                </div>
                <div style={{ color: '#666' }}>
                  统计直播间：{reportData.rooms.length} 个
                </div>
              </div>

              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Statistic title="总平均观看" value={reportData.overall.avgViewers} />
                </Col>
                <Col span={6}>
                  <Statistic title="总点赞数" value={reportData.overall.totalLikes} />
                </Col>
                <Col span={6}>
                  <Statistic title="总GMV" prefix="¥" value={reportData.overall.totalGMV} precision={2} />
                </Col>
                <Col span={6}>
                  <Statistic title="总转化率" value={reportData.overall.conversionRate} suffix="%" precision={2} />
                </Col>
              </Row>

              <div style={{ marginBottom: 24 }}>
                <TrendChart
                  data={reportData.rooms[0]?.metrics || []}
                  metrics={dimensions.slice(0, 3).map((d) => metricMap[d]).filter(Boolean)}
                  height={300}
                />
              </div>

              <div>
                <h4 style={{ marginBottom: 16 }}>详细数据</h4>
                <Table
                  columns={columns}
                  dataSource={reportData.rooms}
                  rowKey="roomId"
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              </div>
            </Card>
          ) : (
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <div style={{ textAlign: 'center', color: '#999' }}>
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>请在左侧配置报表参数，点击"生成报表"查看结果</p>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </MainLayout>
  );
}
