import React, { useState, useEffect } from 'react';
import {
  Row, Col, Typography, Card, Button, List, Tag, Space,
  Modal, Select, message, Empty, Checkbox, Divider, Popconfirm, InputNumber
} from 'antd';
import {
  PlusOutlined, ShoppingCartOutlined, SendOutlined,
  DeleteOutlined, ShopOutlined
} from '@ant-design/icons';
import { shoppingListApi, supermarketApi, ingredientApi } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

function ShoppingListPage() {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [supermarkets, setSupermarkets] = useState([]);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedSupermarket, setSelectedSupermarket] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState(100);

  useEffect(() => {
    loadLists();
    loadSupermarkets();
    loadIngredients();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    try {
      const response = await shoppingListApi.getShoppingLists();
      const data = response.data.results || response.data;
      setLists(data);
      if (data.length > 0 && !selectedList) {
        setSelectedList(data[0]);
      }
    } catch (error) {
      console.error('Failed to load shopping lists:', error);
    }
    setLoading(false);
  };

  const loadSupermarkets = async () => {
    try {
      const response = await supermarketApi.getSupermarkets();
      setSupermarkets(response.data);
    } catch (error) {
      console.error('Failed to load supermarkets:', error);
    }
  };

  const loadIngredients = async () => {
    try {
      const response = await ingredientApi.getIngredients({ page_size: 100 });
      setIngredients(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  };

  const handleToggleItem = async (itemId, checked) => {
    console.log('Toggle item:', itemId, checked);
    loadLists();
  };

  const handleSendToSupermarket = async () => {
    if (!selectedList || !selectedSupermarket) {
      message.warning('请选择超市');
      return;
    }
    try {
      await shoppingListApi.sendToSupermarket(selectedList.id, selectedSupermarket);
      message.success('购物清单已发送到超市！');
      setIsSendModalOpen(false);
      loadLists();
    } catch (error) {
      message.error('发送失败');
    }
  };

  const handleAddItem = async () => {
    if (!selectedList || !selectedIngredient) {
      message.warning('请选择食材');
      return;
    }
    try {
      await shoppingListApi.addItem(selectedList.id, {
        ingredient_id: selectedIngredient,
        quantity,
        unit: '克',
      });
      message.success('添加成功');
      setIsAddModalOpen(false);
      setSelectedIngredient(null);
      setQuantity(100);
      loadLists();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleCreateList = async () => {
    try {
      const response = await shoppingListApi.createShoppingList({
        name: `购物清单 ${new Date().toLocaleDateString()}`,
      });
      message.success('创建成功');
      setSelectedList(response.data);
      loadLists();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const totalItems = selectedList?.items?.length || 0;
  const purchasedItems = selectedList?.items?.filter((i) => i.is_purchased)?.length || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>采购清单</Title>
        <Space>
          <Button icon={<PlusOutlined />} onClick={handleCreateList}>
            新建清单
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            disabled={!selectedList}
            onClick={() => setIsSendModalOpen(true)}
          >
            发送到超市
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card title="我的清单" style={{ marginBottom: 16 }}>
            <List
              dataSource={lists}
              locale={{ emptyText: '暂无购物清单' }}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedList?.id === item.id ? '#e6f7ff' : 'transparent',
                    borderRadius: 4,
                    padding: '8px 12px',
                    marginBottom: 4,
                  }}
                  onClick={() => setSelectedList(item)}
                >
                  <List.Item.Meta
                    avatar={<ShoppingCartOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                    title={item.name}
                    description={
                      <Space>
                        <Tag color={item.is_sent ? 'green' : 'default'}>
                          {item.is_sent ? '已发送' : '待发送'}
                        </Tag>
                        <Text type="secondary">{item.items?.length || 0} 项</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="附近超市">
            <List
              dataSource={supermarkets.slice(0, 5)}
              size="small"
              locale={{ emptyText: '暂无超市' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ShopOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
                    title={item.name}
                    description={item.address}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title={selectedList?.name || '请选择购物清单'}
            extra={
              <Button
                icon={<PlusOutlined />}
                size="small"
                disabled={!selectedList}
                onClick={() => setIsAddModalOpen(true)}
              >
                添加食材
              </Button>
            }
          >
            {selectedList ? (
              <div>
                <Space style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    共 {totalItems} 项，已购买 {purchasedItems} 项
                  </Text>
                  <Text strong style={{ color: '#ff6b35' }}>
                    预计 ¥{selectedList.total_price?.toFixed(2) || '0.00'}
                  </Text>
                </Space>

                <Divider style={{ margin: '12px 0' }} />

                <List
                  dataSource={selectedList.items || []}
                  locale={{ emptyText: '清单为空，点击右上角添加食材' }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          title="确定删除？"
                          onConfirm={() => console.log('delete', item.id)}
                        >
                          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Checkbox
                            checked={item.is_purchased}
                            onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                          />
                        }
                        title={
                          <span style={{
                            textDecoration: item.is_purchased ? 'line-through' : 'none',
                            color: item.is_purchased ? '#999' : 'inherit',
                          }}>
                            {item.ingredient?.name}
                          </span>
                        }
                        description={
                          <Space>
                            <Tag>{item.quantity} {item.unit}</Tag>
                            <Text type="secondary">
                              约 ¥{((item.ingredient?.price_per_unit || 0) * item.quantity / 100).toFixed(2)}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <Empty description="请选择或创建购物清单" style={{ padding: '48px 0' }} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="发送到超市"
        open={isSendModalOpen}
        onCancel={() => setIsSendModalOpen(false)}
        onOk={handleSendToSupermarket}
        okText="发送"
      >
        <p style={{ marginBottom: 16 }}>请选择要发送的超市：</p>
        <Select
          placeholder="选择超市"
          style={{ width: '100%' }}
          value={selectedSupermarket}
          onChange={setSelectedSupermarket}
        >
          {supermarkets.map((s) => (
            <Option key={s.id} value={s.id}>
              {s.name} - {s.address}
            </Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="添加食材"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={handleAddItem}
        okText="添加"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>选择食材</Text>
            <Select
              placeholder="搜索并选择食材"
              style={{ width: '100%' }}
              showSearch
              value={selectedIngredient}
              onChange={setSelectedIngredient}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {ingredients.map((ing) => (
                <Option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.category_name})
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>数量（克）</Text>
            <InputNumber
              min={1}
              max={10000}
              value={quantity}
              onChange={setQuantity}
              style={{ width: '100%' }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}

export default ShoppingListPage;
