import React from 'react';
import { Layout, Menu } from 'antd';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  AppstoreOutlined,
  HeartOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  ShopOutlined,
} from '@ant-design/icons';

import HomePage from './pages/HomePage';
import RecipeListPage from './pages/RecipeListPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import MealPlanPage from './pages/MealPlanPage';
import ShoppingListPage from './pages/ShoppingListPage';
import NutritionPage from './pages/NutritionPage';
import SupermarketPage from './pages/SupermarketPage';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
  { key: '/recipes', icon: <AppstoreOutlined />, label: <Link to="/recipes">菜谱大全</Link> },
  { key: '/favorites', icon: <HeartOutlined />, label: <Link to="/favorites">我的收藏</Link> },
  { key: '/meal-plan', icon: <CalendarOutlined />, label: <Link to="/meal-plan">饮食计划</Link> },
  { key: '/shopping', icon: <ShoppingCartOutlined />, label: <Link to="/shopping">采购清单</Link> },
  { key: '/nutrition', icon: <LineChartOutlined />, label: <Link to="/nutrition">营养分析</Link> },
  { key: '/supermarkets', icon: <ShopOutlined />, label: <Link to="/supermarkets">附近超市</Link> },
];

function App() {
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/recipes')) return '/recipes';
    if (path.startsWith('/favorites')) return '/favorites';
    if (path.startsWith('/meal-plan')) return '/meal-plan';
    if (path.startsWith('/shopping')) return '/shopping';
    if (path.startsWith('/nutrition')) return '/nutrition';
    if (path.startsWith('/supermarkets')) return '/supermarkets';
    return '/';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff6b35', marginRight: '48px' }}>
          🍳 智能菜谱系统
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: '8px',
            }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/recipes" element={<RecipeListPage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/meal-plan" element={<MealPlanPage />} />
              <Route path="/shopping" element={<ShoppingListPage />} />
              <Route path="/nutrition" element={<NutritionPage />} />
              <Route path="/supermarkets" element={<SupermarketPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
