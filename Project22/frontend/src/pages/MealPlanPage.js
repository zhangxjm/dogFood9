import React, { useState, useEffect } from 'react';
import {
  Row, Col, Typography, Card, Button, List, Tag, Space,
  DatePicker, Select, Modal, Form, Input, InputNumber, message, Empty
} from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { mealPlanApi, recipeApi, shoppingListApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const mealTypes = [
  { value: 'breakfast', label: '早餐', color: 'gold' },
  { value: 'lunch', label: '午餐', color: 'blue' },
  { value: 'dinner', label: '晚餐', color: 'purple' },
  { value: 'snack', label: '加餐', color: 'green' },
];

function MealPlanPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [nutritionSummary, setNutritionSummary] = useState({});
  const [form] = Form.useForm();

  useEffect(() => {
    loadPlans();
    loadRecipes();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadNutritionSummary();
    }
  }, [selectedDate, plans]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await mealPlanApi.getMealPlans();
      setPlans(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load meal plans:', error);
    }
    setLoading(false);
  };

  const loadRecipes = async () => {
    try {
      const response = await recipeApi.getRecipes({ page_size: 50 });
      setRecipes(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  };

  const loadNutritionSummary = async () => {
    if (!selectedDate) return;
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const response = await mealPlanApi.getNutritionSummary(dateStr);
      setNutritionSummary(response.data);
    } catch (error) {
      console.error('Failed to load nutrition summary:', error);
    }
  };

  const handleAddPlan = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      await mealPlanApi.addMealPlan({
        date: values.date.format('YYYY-MM-DD'),
        meal_type: values.meal_type,
        recipe_id: values.recipe_id,
        servings: values.servings,
        notes: values.notes,
      });
      message.success('添加成功');
      setIsModalOpen(false);
      form.resetFields();
      loadPlans();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await mealPlanApi.deleteMealPlan(id);
      message.success('删除成功');
      loadPlans();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleGenerateShoppingList = async () => {
    try {
      const response = await shoppingListApi.generateFromMealPlan({
        name: `${new Date().toLocaleDateString()} 采购清单`,
      });
      message.success('购物清单已生成');
      navigate('/shopping');
    } catch (error) {
      message.error('生成失败');
    }
  };

  const getPlansByDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return plans.filter((p) => p.date === dateStr);
  };

  const getMealTypeColor = (type) => {
    const found = mealTypes.find((m) => m.value === type);
    return found ? found.color : 'default';
  };

  const getMealTypeLabel = (type) => {
    const found = mealTypes.find((m) => m.value === type);
    return found ? found.label : type;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>饮食计划</Title>
        <Space>
          <Button icon={<ShoppingCartOutlined />} onClick={handleGenerateShoppingList}>
            生成购物清单
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlan}>
            添加计划
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card title="选择日期">
            <DatePicker
              style={{ width: '100%', marginBottom: 16 }}
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="选择日期查看计划"
            />

            {selectedDate ? (
              <div>
                <List
                  dataSource={getPlansByDate(selectedDate)}
                  locale={{ emptyText: '当日暂无饮食计划' }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(item.id)}
                        >
                          删除
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Tag color={getMealTypeColor(item.meal_type)} style={{ padding: '4px 12px' }}>
                            {getMealTypeLabel(item.meal_type)}
                          </Tag>
                        }
                        title={
                          <Space>
                            <span>{item.recipe?.title}</span>
                            <Tag color="blue">{item.servings} 份</Tag>
                          </Space>
                        }
                        description={
                          item.notes || `约 ${item.recipe?.total_calories || 0} kcal`
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <Empty description="请选择日期" style={{ padding: '32px 0' }} />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="当日营养汇总">
            {selectedDate ? (
              <div>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>热量</Text>
                      <Text strong>{nutritionSummary.calories?.toFixed(1) || 0} kcal</Text>
                    </div>
                    <div style={{ background: '#eee', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min((nutritionSummary.calories || 0) / 20, 100)}%`,
                          height: '100%',
                          background: '#ff6b35',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>蛋白质</Text>
                      <Text strong>{nutritionSummary.protein?.toFixed(1) || 0}g</Text>
                    </div>
                    <div style={{ background: '#eee', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min((nutritionSummary.protein || 0) / 0.6, 100)}%`,
                          height: '100%',
                          background: '#52c41a',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>脂肪</Text>
                      <Text strong>{nutritionSummary.fat?.toFixed(1) || 0}g</Text>
                    </div>
                    <div style={{ background: '#eee', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min((nutritionSummary.fat || 0) / 0.65, 100)}%`,
                          height: '100%',
                          background: '#faad14',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>碳水化合物</Text>
                      <Text strong>{nutritionSummary.carbs?.toFixed(1) || 0}g</Text>
                    </div>
                    <div style={{ background: '#eee', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min((nutritionSummary.carbs || 0) / 3, 100)}%`,
                          height: '100%',
                          background: '#1890ff',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                </Space>
              </div>
            ) : (
              <Empty description="请选择日期" image={null} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="添加饮食计划"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="meal_type"
            label="餐次"
            rules={[{ required: true, message: '请选择餐次' }]}
          >
            <Select placeholder="请选择餐次">
              {mealTypes.map((mt) => (
                <Option key={mt.value} value={mt.value}>{mt.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="recipe_id"
            label="菜谱"
            rules={[{ required: true, message: '请选择菜谱' }]}
          >
            <Select
              placeholder="请选择菜谱"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {recipes.map((r) => (
                <Option key={r.id} value={r.id}>{r.title}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="servings"
            label="份量"
            initialValue={2}
            rules={[{ required: true, message: '请输入份量' }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} addonAfter="人份" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="添加备注..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MealPlanPage;
