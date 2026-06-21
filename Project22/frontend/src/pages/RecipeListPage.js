import React, { useState, useEffect } from 'react';
import { Row, Col, Input, Select, Slider, Space, Button, Pagination, Typography } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { recipeApi } from '../services/api';
import RecipeCard from '../components/RecipeCard';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const cuisineOptions = [
  { value: 'sichuan', label: '川菜' },
  { value: 'cantonese', label: '粤菜' },
  { value: 'shandong', label: '鲁菜' },
  { value: 'jiangsu', label: '苏菜' },
  { value: 'chinese_home', label: '家常菜' },
  { value: 'western', label: '西餐' },
  { value: 'japanese', label: '日料' },
  { value: 'korean', label: '韩餐' },
];

const difficultyOptions = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

function RecipeListPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [cookTimeMax, setCookTimeMax] = useState(120);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, [page]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        ...(searchText && { title: searchText }),
        ...(selectedCuisine && { cuisine: selectedCuisine }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty }),
        ...(ingredientSearch && { ingredient: ingredientSearch }),
        cook_time_max: cookTimeMax,
      };
      const response = await recipeApi.getRecipes(params);
      setRecipes(response.data.results || response.data);
      setTotal(response.data.count || response.data.length);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setPage(1);
    loadRecipes();
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedCuisine(null);
    setSelectedDifficulty(null);
    setIngredientSearch('');
    setCookTimeMax(120);
    setPage(1);
    setTimeout(loadRecipes, 0);
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>菜谱大全</Title>

      {/* Search Bar */}
      <Space direction="vertical" size="large" style={{ width: '100%', marginBottom: 24 }}>
        <Search
          placeholder="搜索菜谱名称..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Select
              placeholder="选择菜系"
              allowClear
              style={{ width: 150 }}
              value={selectedCuisine}
              onChange={(value) => setSelectedCuisine(value)}
            >
              {cuisineOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>

            <Select
              placeholder="选择难度"
              allowClear
              style={{ width: 120 }}
              value={selectedDifficulty}
              onChange={(value) => setSelectedDifficulty(value)}
            >
              {difficultyOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>

            <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
              更多筛选
            </Button>
          </Space>

          <Text type="secondary">共 {total} 道菜谱</Text>
        </div>

        {showFilters && (
          <div
            style={{
              padding: 16,
              background: '#fafafa',
              borderRadius: 8,
            }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Title level={5} style={{ marginBottom: 8 }}>食材搜索</Title>
                <Input
                  placeholder="输入食材名称，如：牛肉、鸡蛋"
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  onPressEnter={handleSearch}
                />
              </Col>
              <Col xs={24} md={12}>
                <Title level={5} style={{ marginBottom: 8 }}>烹饪时间（最长 {cookTimeMax} 分钟）</Title>
                <Slider
                  min={5}
                  max={180}
                  step={5}
                  value={cookTimeMax}
                  onChange={setCookTimeMax}
                  marks={{ 30: '30分', 60: '1小时', 120: '2小时' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleReset}>重置</Button>
                <Button type="primary" onClick={handleSearch}>应用筛选</Button>
              </Space>
            </div>
          </div>
        )}
      </Space>

      {/* Recipe Grid */}
      <Row gutter={[16, 16]}>
        {recipes.map((recipe) => (
          <Col xs={24} sm={12} md={8} lg={6} key={recipe.id}>
            <RecipeCard recipe={recipe} />
          </Col>
        ))}
      </Row>

      {recipes.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p>暂无匹配的菜谱</p>
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Pagination
            current={page}
            total={total}
            pageSize={12}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}

export default RecipeListPage;
