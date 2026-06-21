import React from 'react';
import { Card, Tag, Space } from 'antd';
import { ClockCircleOutlined, FireOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Meta } = Card;

function RecipeCard({ recipe }) {
  const navigate = useNavigate();

  const cuisineColors = {
    sichuan: 'red',
    cantonese: 'orange',
    shandong: 'gold',
    jiangsu: 'green',
    fujian: 'cyan',
    zhejiang: 'blue',
    hunan: 'purple',
    anhui: 'magenta',
    chinese_home: 'geekblue',
    western: 'volcano',
    japanese: 'lime',
    korean: 'pink',
    other: 'default',
  };

  const difficultyColors = {
    easy: 'green',
    medium: 'orange',
    hard: 'red',
  };

  const getRandomColor = () => {
    const colors = ['#ff6b35', '#f7c59f', '#2ec4b6', '#e71d36', '#ff9f1c', '#6a4c93'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const placeholderStyle = {
    background: `linear-gradient(135deg, ${getRandomColor()} 0%, ${getRandomColor()} 100%)`,
    height: 160,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    color: '#fff',
  };

  return (
    <Card
      hoverable
      style={{ width: '100%', marginBottom: 16 }}
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      cover={
        recipe.image ? (
          <img alt={recipe.title} src={recipe.image} style={{ height: 160, objectFit: 'cover' }} />
        ) : (
          <div style={placeholderStyle}>🍽️</div>
        )
      }
      actions={[
        <span key="time"><ClockCircleOutlined /> {recipe.cook_time}分钟</span>,
        <span key="calories"><FireOutlined /> {recipe.total_calories || 0}kcal</span>,
        <span key="views"><EyeOutlined /> {recipe.view_count}</span>,
      ]}
    >
      <Meta
        title={
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>{recipe.title}</span>
            <Space wrap>
              <Tag color={cuisineColors[recipe.cuisine] || 'default'}>
                {recipe.cuisine_name}
              </Tag>
              <Tag color={difficultyColors[recipe.difficulty] || 'default'}>
                {recipe.difficulty_name}
              </Tag>
              <Tag color="blue">{recipe.servings}人份</Tag>
            </Space>
          </Space>
        }
        description={
          <span style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: 13,
            color: '#666',
          }}>
            {recipe.description || '暂无简介'}
          </span>
        }
      />
    </Card>
  );
}

export default RecipeCard;
