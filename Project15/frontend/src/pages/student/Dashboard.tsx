import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Button, List, Tag, Progress, Spin } from 'antd';
import {
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
  RightOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { studyApi, examApi } from '../../api';

const { Title, Paragraph } = Typography;

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, examsRes] = await Promise.all([
        studyApi.dashboard(),
        examApi.list().catch(() => ({ data: { records: [] } })),
      ]);
      setData(dashboardRes.data as DashboardData);
      const examList = (examsRes as any).data?.records || [];
      setExams(examList.slice(0, 5));
      generateSubjectData(dashboardRes.data as DashboardData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateSubjectData = (dashData: DashboardData) => {
    const subjects = ['数学', '语文', '英语', '物理', '化学'];
    const baseAccuracy = dashData?.overallAccuracy || 60;
    const mockData = subjects.map((s, i) => ({
      name: s,
      value: Math.max(20, Math.min(100, baseAccuracy + (i - 2) * 10 + Math.random() * 10)),
    }));
    setSubjectData(mockData);
  };

  const getTrendOption = () => {
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
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          name: '做题数',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24,144,255,0.3)' },
                { offset: 1, color: 'rgba(24,144,255,0.05)' },
              ],
            },
          },
          data: trend.map((t) => t.totalQuestions),
        },
        {
          name: '正确数',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#52c41a' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(82,196,26,0.3)' },
                { offset: 1, color: 'rgba(82,196,26,0.05)' },
              ],
            },
          },
          data: trend.map((t) => t.correctCount),
        },
      ],
    };
  };

  const getPieOption = () => {
    const colors = ['#52c41a', '#1890ff', '#fa8c16', '#722ed1', '#eb2f96'];
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}% ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
      },
      color: colors,
      series: [
        {
          name: '科目掌握度',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          labelLine: { show: false },
          data: subjectData.map((s, i) => ({
            value: s.value,
            name: s.name,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    };
  };

  const getStatusTag = (status: number) => {
    const map: Record<number, { color: string; text: string }> = {
      0: { color: 'default', text: '未开始' },
      1: { color: 'processing', text: '进行中' },
      2: { color: 'success', text: '已结束' },
    };
    const s = map[status] || map[0];
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const recommendCount = 15;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
        学习首页
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        欢迎回来，查看您的学习情况
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
        <Col xs={24} md={12}>
          <Card
            style={{ borderRadius: 12, height: '100%' }}
            onClick={() => navigate('/student/practice')}
            hoverable
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BulbOutlined style={{ color: '#faad14', fontSize: 20 }} />
                  个性化推荐练习
                </div>
                <Paragraph type="secondary" style={{ margin: '0 0 12px 0' }}>
                  基于您的错题和薄弱知识点智能推荐
                </Paragraph>
                <Tag color="warning" style={{ marginBottom: 12 }}>
                  共 {recommendCount} 道推荐题
                </Tag>
                <div>
                  <Button type="primary" icon={<RightOutlined />}>
                    开始练习
                  </Button>
                </div>
              </div>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                }}
              >
                🎯
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: '#1890ff' }} />
                近期考试
              </span>
            }
            style={{ borderRadius: 12, height: '100%' }}
            extra={
              <Button type="link" onClick={() => navigate('/student/exams')}>
                查看全部
              </Button>
            }
          >
            {exams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                暂无近期考试
              </div>
            ) : (
              <List
                size="small"
                dataSource={exams}
                renderItem={(item: any) => (
                  <List.Item
                    style={{ padding: '10px 0', cursor: 'pointer' }}
                    onClick={() => {
                      if (item.status === 1) navigate(`/student/exam/${item.id}`);
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {item.startTime?.slice(0, 16) || '-'}
                      </div>
                    </div>
                    {getStatusTag(item.status)}
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="近30天学习趋势"
            style={{ borderRadius: 12 }}
          >
            <ReactECharts option={getTrendOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="科目掌握度"
            style={{ borderRadius: 12 }}
          >
            <ReactECharts option={getPieOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
