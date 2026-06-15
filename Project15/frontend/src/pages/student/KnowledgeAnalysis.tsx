import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Table,
  Spin,
  Empty,
} from 'antd';
import {
  BulbOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  LikeOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { studyApi } from '../../api';

const { Title, Paragraph, Text } = Typography;

const MASTER_LEVEL_STYLES: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  未掌握: {
    color: '#ff4d4f',
    bgColor: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
    icon: <ExclamationCircleOutlined />,
  },
  一般: {
    color: '#faad14',
    bgColor: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)',
    icon: <WarningOutlined />,
  },
  良好: {
    color: '#1890ff',
    bgColor: 'linear-gradient(135deg, #e6f7ff 0%, #91d5ff 100%)',
    icon: <LikeOutlined />,
  },
  优秀: {
    color: '#52c41a',
    bgColor: 'linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%)',
    icon: <TrophyOutlined />,
  },
};

interface KnowledgeItem {
  knowledgeId: number;
  knowledgeName: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  masterLevel: string;
}

const KnowledgeAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await studyApi.knowledgeAnalysis();
      const list = (res.data || []) as KnowledgeItem[];
      setKnowledgeList(list.sort((a, b) => b.accuracy - a.accuracy));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const counts = {
    total: knowledgeList.length,
    未掌握: knowledgeList.filter((k) => k.masterLevel === '未掌握').length,
    一般: knowledgeList.filter((k) => k.masterLevel === '一般').length,
    良好: knowledgeList.filter((k) => k.masterLevel === '良好').length,
    优秀: knowledgeList.filter((k) => k.masterLevel === '优秀').length,
  };

  const overallAccuracy =
    knowledgeList.length > 0
      ? knowledgeList.reduce((sum, k) => sum + (k.accuracy || 0), 0) / knowledgeList.length
      : 0;

  const getMasterTagColor = (level: string) => {
    switch (level) {
      case '未掌握': return 'error';
      case '一般': return 'warning';
      case '良好': return 'blue';
      case '优秀': return 'success';
      default: return 'default';
    }
  };

  const getProgressColor = (accuracy: number) => {
    if (accuracy < 40) return '#ff4d4f';
    if (accuracy < 70) return '#faad14';
    if (accuracy < 90) return '#1890ff';
    return '#52c41a';
  };

  const getRadarOption = () => {
    const top8 = knowledgeList.slice(0, 8);
    if (top8.length < 3) {
      const defaults = ['函数', '方程', '几何', '代数', '概率', '统计', '三角', '数列'];
      return {
        tooltip: {},
        radar: {
          indicator: defaults.map((name) => ({ name, max: 100 })),
          shape: 'polygon',
          splitNumber: 5,
          axisName: { color: '#666', fontSize: 12 },
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: defaults.map(() => 50 + Math.random() * 40),
                name: '掌握度',
                areaStyle: { color: 'rgba(24,144,255,0.3)' },
                lineStyle: { color: '#1890ff', width: 2 },
                itemStyle: { color: '#1890ff' },
              },
            ],
          },
        ],
      };
    }

    return {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: ['正确率'],
        bottom: 0,
      },
      radar: {
        indicator: top8.map((k) => ({
          name: k.knowledgeName.length > 8 ? k.knowledgeName.slice(0, 7) + '…' : k.knowledgeName,
          max: 100,
        })),
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#333',
          fontSize: 12,
          fontWeight: 500,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0,0,0,0.08)',
          },
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(82,196,26,0.02)', 'rgba(24,144,255,0.03)'],
          },
        },
      },
      series: [
        {
          name: '知识点掌握度',
          type: 'radar',
          symbol: 'circle',
          symbolSize: 6,
          data: [
            {
              value: top8.map((k) => k.accuracy),
              name: '正确率',
              lineStyle: {
                width: 2,
                color: '#1890ff',
              },
              itemStyle: {
                color: '#1890ff',
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(24,144,255,0.5)' },
                    { offset: 1, color: 'rgba(24,144,255,0.1)' },
                  ],
                },
              },
            },
          ],
        },
      ],
    };
  };

  const columns = [
    {
      title: '知识点名称',
      dataIndex: 'knowledgeName',
      key: 'knowledgeName',
      render: (text: string, record: KnowledgeItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: getProgressColor(record.accuracy),
          }} />
          <Text strong>{text}</Text>
        </div>
      ),
    },
    {
      title: '总练习次数',
      dataIndex: 'totalQuestions',
      key: 'totalQuestions',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '正确次数',
      dataIndex: 'correctCount',
      key: 'correctCount',
      width: 100,
      align: 'center' as const,
      render: (val: number, record: KnowledgeItem) => (
        <Text style={{ color: getProgressColor(record.accuracy) }}>{val}</Text>
      ),
    },
    {
      title: '正确率',
      key: 'accuracy',
      width: 220,
      render: (_: any, record: KnowledgeItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Progress
            percent={record.accuracy}
            size="small"
            strokeColor={getProgressColor(record.accuracy)}
            showInfo={false}
            style={{ flex: 1, minWidth: 120 }}
          />
          <Text strong style={{ color: getProgressColor(record.accuracy), minWidth: 52 }}>
            {record.accuracy.toFixed(1)}%
          </Text>
        </div>
      ),
    },
    {
      title: '掌握等级',
      dataIndex: 'masterLevel',
      key: 'masterLevel',
      width: 120,
      align: 'center' as const,
      render: (level: string) => {
        const style = MASTER_LEVEL_STYLES[level] || MASTER_LEVEL_STYLES.一般;
        return (
          <Tag color={getMasterTagColor(level)} icon={style.icon} style={{ padding: '4px 12px', fontWeight: 600 }}>
            {level}
          </Tag>
        );
      },
    },
  ];

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
        知识点掌握度分析
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        查看您对各知识点的掌握情况，针对性加强薄弱环节
      </Paragraph>

      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)',
        }}
        bodyStyle={{ padding: 28 }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={8}>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>总体掌握度</Text>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: 52, fontWeight: 700, color: '#1890ff', lineHeight: 1 }}>
                  {overallAccuracy.toFixed(1)}
                  <span style={{ fontSize: 24, color: '#999', fontWeight: 400 }}>%</span>
                </div>
              </div>
              <div style={{ marginTop: 12, maxWidth: 300 }}>
                <Progress
                  percent={overallAccuracy}
                  strokeColor={{
                    '0%': '#1890ff',
                    '100%': '#52c41a',
                  }}
                  size={[300, 14]}
                  showInfo={false}
                />
              </div>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Row gutter={[16, 12]}>
              {(['未掌握', '一般', '良好', '优秀'] as const).map((level) => {
                const style = MASTER_LEVEL_STYLES[level];
                return (
                  <Col xs={12} sm={6} key={level}>
                    <Card
                      style={{
                        borderRadius: 10,
                        background: style.bgColor,
                        border: 'none',
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <Statistic
                        title={
                          <span style={{ color: style.color, fontWeight: 500 }}>
                            {style.icon} {level}
                          </span>
                        }
                        value={counts[level]}
                        suffix={`/ ${counts.total}`}
                        valueStyle={{ color: style.color, fontSize: 24 }}
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BulbOutlined style={{ color: '#fa8c16' }} />
                知识点掌握明细
              </span>
            }
            style={{ borderRadius: 12 }}
          >
            {knowledgeList.length === 0 ? (
              <Empty
                description="暂无知识点数据，完成练习题后会显示"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Table
                rowKey="knowledgeId"
                columns={columns}
                dataSource={knowledgeList}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (t) => `共 ${t} 个知识点`,
                }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined style={{ color: '#722ed1' }} />
                Top 8 知识点雷达图
              </span>
            }
            style={{ borderRadius: 12, height: '100%' }}
          >
            <ReactECharts option={getRadarOption()} style={{ height: 380 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="掌握等级说明"
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 20 }}
      >
        <Row gutter={[16, 12]}>
          {([
            { level: '未掌握', range: '< 40%', desc: '需要重点学习，建议回顾基础概念，针对性加强练习' },
            { level: '一般', range: '40% ~ 70%', desc: '基础了解但不够熟练，建议多做练习巩固知识点' },
            { level: '良好', range: '70% ~ 90%', desc: '掌握较好，可以挑战更高难度的题目' },
            { level: '优秀', range: '> 90%', desc: '完全掌握，继续保持！可以帮助其他同学' },
          ] as const).map(({ level, range, desc }) => {
            const style = MASTER_LEVEL_STYLES[level];
            return (
              <Col xs={24} sm={12} md={6} key={level}>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: style.bgColor,
                    height: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: style.color, fontSize: 20 }}>{style.icon}</span>
                    <Text strong style={{ color: style.color, fontSize: 16 }}>{level}</Text>
                    <Tag color={getMasterTagColor(level)} style={{ marginLeft: 'auto' }}>
                      正确率 {range}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
                    {desc}
                  </Text>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
};

export default KnowledgeAnalysis;
