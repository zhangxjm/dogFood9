import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Empty, message } from 'antd';
import { favoriteApi } from '../services/api';
import RecipeCard from '../components/RecipeCard';

const { Title } = Typography;

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await favoriteApi.getFavorites();
      setFavorites(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      message.error('加载收藏失败');
    }
    setLoading(false);
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>我的收藏</Title>

      {favorites.length === 0 ? (
        <Empty
          description="还没有收藏任何菜谱"
          style={{ padding: '48px 0' }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {favorites.map((fav) => (
            <Col xs={24} sm={12} md={8} lg={6} key={fav.id}>
              <RecipeCard recipe={fav.recipe} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default FavoritesPage;
