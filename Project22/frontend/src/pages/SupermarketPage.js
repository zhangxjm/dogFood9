import React, { useState, useEffect } from 'react';
import {
  Row, Col, Typography, Card, Button, List, Tag, Space,
  Empty, Avatar
} from 'antd';
import {
  EnvironmentOutlined, PhoneOutlined,
  ShoppingOutlined, ClockCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { supermarketApi } from '../services/api';

const { Title, Text } = Typography;

function SupermarketPage() {
  const [supermarkets, setSupermarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadSupermarkets();
    getUserLocation();
  }, []);

  const loadSupermarkets = async () => {
    setLoading(true);
    try {
      const response = await supermarketApi.getSupermarkets();
      setSupermarkets(response.data);
    } catch (error) {
      console.error('Failed to load supermarkets:', error);
    }
    setLoading(false);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation not available:', error);
        }
      );
    }
  };

  const getRandomColor = () => {
    const colors = ['#ff6b35', '#52c41a', '#1890ff', '#722ed1', '#eb2f96'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getSupermarketIcon = (name) => {
    if (name.includes('永辉')) return '🏪';
    if (name.includes('沃尔玛')) return '🛒';
    if (name.includes('盒马')) return '🦛';
    if (name.includes('物美')) return '🏬';
    if (name.includes('家乐福')) return '🛍️';
    return '🏪';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>附近超市</Title>
        <Button icon={<EnvironmentOutlined />}>
          {userLocation ? '已获取位置' : '获取位置'}
        </Button>
      </div>

      {supermarkets.length === 0 ? (
        <Empty description="暂无超市信息" />
      ) : (
        <Row gutter={[24, 24]}>
          {supermarkets.map((supermarket) => (
            <Col xs={24} md={12} lg={8} key={supermarket.id}>
              <Card hoverable>
                <Card.Meta
                  avatar={
                    <Avatar
                      size={64}
                      style={{ backgroundColor: getRandomColor(), fontSize: 28 }}
                    >
                      {getSupermarketIcon(supermarket.name)}
                    </Avatar>
                  }
                  title={
                    <Space>
                      <span style={{ fontSize: 18, fontWeight: 500 }}>{supermarket.name}</span>
                      <Tag color={supermarket.is_active ? 'green' : 'red'}>
                        {supermarket.is_active ? '营业中' : '已打烊'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 12 }}>
                      <div>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#999' }} />
                        <Text type="secondary">{supermarket.address}</Text>
                      </div>
                      {supermarket.phone && (
                        <div>
                          <PhoneOutlined style={{ marginRight: 8, color: '#999' }} />
                          <Text type="secondary">{supermarket.phone}</Text>
                        </div>
                      )}
                      <div>
                        <ClockCircleOutlined style={{ marginRight: 8, color: '#999' }} />
                        <Text type="secondary">配送范围：{supermarket.delivery_radius} 公里</Text>
                      </div>
                    </Space>
                  }
                />
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    disabled={!supermarket.is_active}
                  >
                    发送购物清单
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>温馨提示</Title>
        <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#666' }}>
          <li>购物清单发送后，超市会尽快为您准备好食材</li>
          <li>您可以选择到店自提或配送到家服务</li>
          <li>配送范围外的地址可能无法配送，敬请谅解</li>
          <li>如需退换货，请联系超市客服</li>
        </ul>
      </Card>
    </div>
  );
}

export default SupermarketPage;
