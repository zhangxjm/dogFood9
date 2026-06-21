import React, { useState, useEffect } from 'react';
import {
  Row, Col, Typography, Card, Progress, Space, Statistic,
  Table, Tag, Empty, Divider
} from 'antd';
import {
  FireOutlined, ExperimentOutlined,
  ThunderboltOutlined, SafetyOutlined
} from '@ant-design/icons';
import { nutritionGoalApi, mealPlanApi, ingredientApi } from '../services/api';

const { Title, Text } = Typography;

function NutritionPage() {
  const [progress, setProgress] = useState({});
  const [goal, setGoal] = useState({});
  const [topIngredients, setTopIngredients] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  useEffect(() => {
    loadProgress();
    loadGoal();
    loadTopIngredients();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await nutritionGoalApi.getProgress();
      setProgress(response.data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const loadGoal = async () => {
    try {
      const response = await nutritionGoalApi.getGoal();
      setGoal(response.data);
    } catch (error) {
      console.error('Failed to load goal:', error);
    }
  };

  const loadTopIngredients = async () => {
    try {
      const response = await ingredientApi.getIngredients({ page_size: 8 });
      const data = response.data.results || response.data;
      setTopIngredients(data.slice(0, 6));
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  };

  const nutritionItems = [
    { key: 'calories', label: '热量', unit: 'kcal', icon: <FireOutlined />, color: '#ff6b35' },
    { key: 'protein', label: '蛋白质', unit: 'g', icon: <ExperimentOutlined />, color: '#52c41a' },
    { key: 'fat', label: '脂肪', unit: 'g', icon: <ThunderboltOutlined />, color: '#faad14' },
    { key: 'carbs', label: '碳水化合物', unit: 'g', icon: <SafetyOutlined />, color: '#1890ff' },
  ];

  const getStatus = (percentage) => {
    if (percentage < 50) return '低';
    if (percentage > 120) return '超';
    return '正常';
  };

  const getStatusColor = (percentage) => {
    if (percentage < 50) return 'orange';
    if (percentage > 120) return 'red';
    return 'green';
  };

  const columns = [
    {
      title: '食材',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category',
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: '热量(kcal/100g)',
      dataIndex: 'calories',
      key: 'calories',
      sorter: (a, b) => a.calories - b.calories,
    },
    {
      title: '蛋白质(g)',
      dataIndex: 'protein',
      key: 'protein',
      sorter: (a, b) => a.protein - b.protein,
    },
    {
      title: '脂肪(g)',
      dataIndex: 'fat',
      key: 'fat',
      sorter: (a, b) => a.fat - b.fat,
    },
    {
      title: '碳水(g)',
      dataIndex: 'carbs',
      key: 'carbs',
      sorter: (a, b) => a.carbs - b.carbs,
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>营养分析</Title>

      {/* Daily Progress */}
      <Card title="今日营养摄入进度" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          {nutritionItems.map((item) => {
            const data = progress[item.key] || { current: 0, goal: 0, percentage: 0 };
            return (
              <Col xs={12} md={6} key={item.key}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="dashboard"
                    percent={Math.min(data.percentage, 100)}
                    strokeColor={item.color}
                    size={120}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>{item.label}</Text>
                    <div>
                      <Text style={{ color: item.color, fontSize: 18, fontWeight: 'bold' }}>
                        {data.current}
                      </Text>
                      <Text type="secondary"> / {data.goal} {item.unit}</Text>
                    </div>
                    <Tag color={getStatusColor(data.percentage)} style={{ marginTop: 4 }}>
                      {getStatus(data.percentage)}
                    </Tag>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Nutrition Goal */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="每日营养目标">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="热量目标"
                  value={goal.daily_calories || 2000}
                  suffix="kcal"
                  valueStyle={{ color: '#ff6b35' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="蛋白质目标"
                  value={goal.daily_protein || 60}
                  suffix="g"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="脂肪目标"
                  value={goal.daily_fat || 65}
                  suffix="g"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="碳水目标"
                  value={goal.daily_carbs || 300}
                  suffix="g"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="营养小贴士">
            <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>每日建议摄入 2000kcal 左右的热量</li>
              <li>蛋白质应占总热量的 10-35%</li>
              <li>脂肪应占总热量的 20-35%</li>
              <li>碳水化合物应占总热量的 45-65%</li>
              <li>每天至少摄入 25g 膳食纤维</li>
              <li>多喝水，每天 8 杯水约 2000ml</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Ingredient Nutrition Table */}
      <Card title="常见食材营养成分表">
        <Table
          dataSource={topIngredients}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
        <Divider />
        <Text type="secondary" style={{ fontSize: 12 }}>
          * 营养数据仅供参考，实际含量可能因品种、产地、烹饪方式等因素有所差异
        </Text>
      </Card>
    </div>
  );
}

export default NutritionPage;
