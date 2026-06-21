import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Space, Button, Card } from 'antd';
import { PlusOutlined, FireOutlined, ThunderboltOutlined, HeartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { recipeApi } from '../services/api';
import RecipeCard from '../components/RecipeCard';

const { Title, Text } = Typography;

function HomePage() {
  const navigate = useNavigate();
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [recommendRecipes, setRecommendRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [popularRes, recommendRes] = await Promise.all([
        recipeApi.getPopularRecipes(),
        recipeApi.getRecommendRecipes(),
      ]);
      setPopularRecipes(popularRes.data);
      setRecommendRecipes(recommendRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const features = [
    { icon: '📖', title: '海量菜谱', desc: '丰富的菜谱库，涵盖各大菜系' },
    { icon: '🛒', title: '智能采购', desc: '一键生成食材采购清单' },
    { icon: '📊', title: '营养分析', desc: '详细的营养成分数据' },
    { icon: '📅', title: '饮食计划', desc: '科学制定每日饮食计划' },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
          borderRadius: 12,
          padding: '48px 32px',
          marginBottom: 32,
          color: '#fff',
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={14}>
            <Title level={1} style={{ color: '#fff', marginBottom: 16 }}>
              发现美食的无限可能
            </Title>
            <Text style={{ fontSize: 18, color: '#fff', opacity: 0.9, display: 'block', marginBottom: 24 }}>
              上传、分享、收藏您喜爱的菜谱，智能生成采购清单，科学规划每日饮食
            </Text>
            <Space size="large">
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/recipes')}>
                浏览菜谱
              </Button>
              <Button size="large" ghost onClick={() => navigate('/meal-plan')}>
                制定计划
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'center', fontSize: 120 }}>
            🍳🥗🍜
          </Col>
        </Row>
      </div>

      {/* Features */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {features.map((feature, index) => (
          <Col xs={12} md={6} key={index}>
            <Card style={{ textAlign: 'center', height: '100%' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{feature.icon}</div>
              <Title level={4} style={{ marginBottom: 8 }}>{feature.title}</Title>
              <Text type="secondary">{feature.desc}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Popular Recipes */}
      <div style={{ marginBottom: 32 }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <FireOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
          <Title level={3} style={{ margin: 0 }}>热门菜谱</Title>
        </Space>
        <Row gutter={[16, 16]}>
          {popularRecipes.slice(0, 4).map((recipe) => (
            <Col xs={24} sm={12} md={6} key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </Col>
          ))}
        </Row>
      </div>

      {/* Recommended Recipes */}
      <div style={{ marginBottom: 32 }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <ThunderboltOutlined style={{ fontSize: 24, color: '#faad14' }} />
          <Title level={3} style={{ margin: 0 }}>为您推荐</Title>
        </Space>
        <Row gutter={[16, 16]}>
          {recommendRecipes.map((recipe) => (
            <Col xs={24} sm={12} md={6} key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default HomePage;
