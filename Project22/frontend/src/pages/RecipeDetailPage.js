import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Typography, Tag, Button, Card, Descriptions,
  Progress, List, Avatar, Space, Divider, message, Popconfirm
} from 'antd';
import {
  ClockCircleOutlined, UserOutlined, EyeOutlined,
  LikeOutlined, HeartOutlined, HeartFilled,
  ShoppingCartOutlined, CalendarOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { recipeApi, favoriteApi, mealPlanApi } from '../services/api';

const { Title, Text, Paragraph } = Typography;

function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    setLoading(true);
    try {
      const response = await recipeApi.getRecipe(id);
      setRecipe(response.data);
      setIsFavorited(response.data.is_favorited);
    } catch (error) {
      console.error('Failed to load recipe:', error);
    }
    setLoading(false);
  };

  const handleLike = async () => {
    try {
      await recipeApi.likeRecipe(id);
      setRecipe((prev) => ({ ...prev, like_count: prev.like_count + 1 }));
      message.success('点赞成功！');
    } catch (error) {
      message.error('点赞失败');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const response = await favoriteApi.toggleFavorite(id);
      setIsFavorited(response.data.favorited);
      message.success(response.data.favorited ? '已添加到收藏' : '已取消收藏');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddToMealPlan = () => {
    const today = new Date().toISOString().split('T')[0];
    mealPlanApi.addMealPlan({
      date: today,
      meal_type: 'dinner',
      recipe_id: id,
      servings: 2,
    }).then(() => {
      message.success('已添加到今日晚餐计划');
    }).catch(() => {
      message.error('添加失败');
    });
  };

  const cuisineColors = {
    sichuan: 'red', cantonese: 'orange', shandong: 'gold',
    jiangsu: 'green', fujian: 'cyan', zhejiang: 'blue',
    hunan: 'purple', anhui: 'magenta', chinese_home: 'geekblue',
    western: 'volcano', japanese: 'lime', korean: 'pink', other: 'default',
  };

  const difficultyColors = { easy: 'green', medium: 'orange', hard: 'red' };

  const getRandomColor = () => {
    const colors = ['#ff6b35', '#f7c59f', '#2ec4b6', '#e71d36', '#ff9f1c', '#6a4c93'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (!recipe) {
    return <div style={{ padding: '48px 0', textAlign: 'center' }}>加载中...</div>;
  }

  const nutrition = recipe?.total_nutrition || {};

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card
            cover={
              recipe.image ? (
                <img
                  alt={recipe.title}
                  src={recipe.image}
                  style={{ width: '100%', height: 300, objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    background: `linear-gradient(135deg, ${getRandomColor()} 0%, ${getRandomColor()} 100%)`,
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 80,
                    color: '#fff',
                  }}
                >
                  🍽️
                </div>
              )
            }
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ padding: '16px 24px' }}>
              <Space wrap>
                <Tag color={cuisineColors[recipe?.cuisine]}>{recipe?.cuisine_name}</Tag>
                <Tag color={difficultyColors[recipe?.difficulty]}>{recipe?.difficulty_name}</Tag>
                <Tag color="blue">{recipe?.servings}人份</Tag>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Title level={2} style={{ marginBottom: 8 }}>{recipe?.title}</Title>
          
          <Space size="large" style={{ marginBottom: 16 }}>
            <span><ClockCircleOutlined /> {recipe?.cook_time} 分钟</span>
            <span><EyeOutlined /> {recipe?.view_count} 次浏览</span>
            <span><LikeOutlined /> {recipe?.like_count} 个赞</span>
            <span>
              <UserOutlined /> {recipe?.author?.username || '未知作者'}
            </span>
          </Space>

          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            {recipe?.description || '暂无简介'}
          </Paragraph>

          <Space wrap style={{ marginBottom: 24 }}>
            <Button
              type="primary"
              icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleToggleFavorite}
            >
              {isFavorited ? '已收藏' : '收藏菜谱'}
            </Button>
            <Button icon={<LikeOutlined />} onClick={handleLike}>点赞</Button>
            <Button icon={<CalendarOutlined />} onClick={handleAddToMealPlan}>
              加入饮食计划
            </Button>
            <Button icon={<ShoppingCartOutlined />} onClick={() => navigate('/shopping')}>
              生成购物清单
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={14}>
          <Card title="烹饪步骤">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              {recipe?.steps?.split('\n').filter(s => s.trim()).map((step, index) => (
                <li key={index} style={{ marginBottom: 8 }}>{step.replace(/^\d+\.\s*/, '')}</li>
              ))}
            </ol>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="食材列表" style={{ marginBottom: 24 }}>
            <List
              dataSource={recipe?.recipe_ingredients || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: getRandomColor() }}>{item.ingredient.name[0]}</Avatar>}
                    title={item.ingredient.name}
                    description={`${item.quantity} ${item.unit}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="营养成分分析">
        <Row gutter={[24, 24]}>
          <Col xs={12} sm={8} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#ff6b35', marginBottom: 4 }}>
                {nutrition.calories?.toFixed(1) || 0}
              </Title>
              <Text type="secondary">热量 (kcal)</Text>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#52c41a', marginBottom: 4 }}>
                {nutrition.protein?.toFixed(1) || 0}g
              </Title>
              <Text type="secondary">蛋白质</Text>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#faad14', marginBottom: 4 }}>
                {nutrition.fat?.toFixed(1) || 0}g
              </Title>
              <Text type="secondary">脂肪</Text>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ color: '#1890ff', marginBottom: 4 }}>
                {nutrition.carbs?.toFixed(1) || 0}g
              </Title>
              <Text type="secondary">碳水化合物</Text>
            </div>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={12} sm={8} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>{nutrition.fiber?.toFixed(1) || 0}g</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>膳食纤维</Text>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>{nutrition.vitamin_c?.toFixed(1) || 0}mg</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>维生素C</Text>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>{nutrition.calcium?.toFixed(1) || 0}mg</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>钙</Text>
            </div>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>{nutrition.iron?.toFixed(1) || 0}mg</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>铁</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default RecipeDetailPage;
