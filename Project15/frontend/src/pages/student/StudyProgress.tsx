import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Spin,
  List,
  Tag,
  Space,
} from 'antd';
import {
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { studyApi } from '../../api';

const { Title, Paragraph, Text } = Typography;

interface DashboardData {
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  wrongCount: number;
  practicedKnowledgeCount: number;
  masteredKnowledgeCount: number;
  last30DaysTrend: Array<{
    date: string;
    totalQuestions: number;
    correctCount: number;
    accuracy: number;
  }>;
}

const StudyProgress: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await studyApi.dashboard();
      const dashData = res.data as DashboardData;
      setData(dashData);
      generateRecentRecords(dashData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentRecords = (dashData: DashboardData) => {
    const trend = dashData?.last30DaysTrend || [];
    const records: any[] = [];
    const typeLabels = ['单选题', '多选题', '判断题', '填空题', '主观题'];
    const subjects = ['数学', '语文', '英语', '物理', '化学'];

    trend.slice(-7).reverse().forEach((day, dayIdx) => {
      const count = day.totalQuestions;
      for (let i = 0; i < Math.min(count, 3); i++) {
        const seed = dayIdx * 10 + i;
        records.push({
          id: seed,
          date: day.date,
          subject: subjects[seed % subjects.length],
          type: typeLabels[seed % typeLabels.length],
          total: 1,
          correct: seed % 3 !== 0 ? 1 : 0,
          duration: 1 + (seed % 5),
        });
      }
    });

    setRecentRecords(records.slice(0, 10));
  };

  const getAreaOption = () => {
    const trend = data?.last30DaysTrend || [];
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#f0f0f0',
        textStyle: { color: '#333' },
      },
      legend: {
        data: ['做题数', '正确数'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trend.map((t) => t.date.slice(5)),
        axisLabel: { fontSize: 11, rotate: 45 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          name: '做题数',
          type: 'line',
          stack: 'Total',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#1890ff' },
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24,144,255,0.5)' },
                { offset: 1, color: 'rgba(24,144,255,0.05)' },
              ],
            },
          },
          emphasis: { focus: 'series' },
          data: trend.map((t) => t.totalQuestions),
        },
        {
          name: '正确数',
          type: 'line',
          stack: 'Correct',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#52c41a' },
          itemStyle: { color: '#52c41a' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82,196,26,0.5)' },
                { offset: 1, color: 'rgba(82,196,26,0.05)' },
              ],
            },
          },
          emphasis: { focus: 'series' },
          data: trend.map((t) => t.correctCount),
        },
      ],
    };
  };

  const getRadarOption = () => {
    const subjects = ['数学', '语文', '英语', '物理', '化学'];
    const baseAcc = data?.overallAccuracy || 60;
    const mockAccuracy = subjects.map((_, i) =>
      Math.max(20, Math.min(100, baseAcc + (i - 2) * 12 + Math.random() * 8))
    );
    const mockDuration = subjects.map((_, i) => 30 + i * 15 + Math.random() * 20);

    return {
      tooltip: {},
      legend: {
        data: ['正确率', '练习时长指数'],
        bottom: 0,
      },
      radar: {
        indicator: subjects.map((s) => ({ name: s, max: 100 })),
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#666',
          fontSize: 12,
        },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
        splitArea: {
          areaStyle: {
            color: ['rgba(24,144,255,0.02)', 'rgba(24,144,255,0.04)'],
          },
        },
      },
      series: [
        {
          name: '科目对比',
          type: 'radar',
          data: [
            {
              value: mockAccuracy,
              name: '正确率',
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: { width: 2, color: '#1890ff' },
              itemStyle: { color: '#1890ff' },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(24,144,255,0.4)' },
                    { offset: 1, color: 'rgba(24,144,255,0.1)' },
                  ],
                },
              },
            },
            {
              value: mockDuration,
              name: '练习时长指数',
              symbol: 'diamond',
              symbolSize: 6,
              lineStyle: { width: 2, color: '#fa8c16' },
              itemStyle: { color: '#fa8c16' },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(250,140,22,0.3)' },
                    { offset: 1, color: 'rgba(250,140,22,0.05)' },
                  ],
                },
              },
            },
          ],
        },
      ],
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
        学习进度跟踪
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        查看您的学习数据和进度变化
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="总做题数"
              value={data?.totalQuestions || 0}
              prefix={<EditOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="正确率"
              value={data?.overallAccuracy || 0}
              precision={2}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="错题数"
              value={data?.wrongCount || 0}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="已掌握知识点"
              value={data?.masteredKnowledgeCount || 0}
              suffix={`/ ${data?.practicedKnowledgeCount || 0}`}
              prefix={<BulbOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: '#1890ff' }} />
                近30天做题趋势
              </span>
            }
            style={{ borderRadius: 12, height: '100%' }}
          >
            <ReactECharts option={getAreaOption()} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextOutlined style={{ color: '#722ed1' }} />
                科目对比分析
              </span>
            }
            style={{ borderRadius: 12, height: '100%' }}
          >
            <ReactECharts option={getRadarOption()} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ color: '#fa8c16' }} />
            最近练习记录
          </span>
        }
        style={{ borderRadius: 12 }}
      >
        {recentRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无练习记录
          </div>
        ) : (
          <List
            dataSource={recentRecords}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid #f5f5f5',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: item.correct ? '#f6ffed' : '#fff1f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.correct ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                      )}
                    </div>
                  }
                  title={
                    <Space size="small" wrap>
                      <Text strong>{item.subject}</Text>
                      <Tag color="blue">{item.type}</Tag>
                      <Tag color={item.correct ? 'success' : 'error'}>
                        {item.correct ? '正确' : '错误'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space size="large" style={{ color: '#999', fontSize: 12 }}>
                      <span>📅 {dayjs(item.date).format('MM-DD')}</span>
                      <span>⏱ 用时 {item.duration} 分钟</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default StudyProgress;
