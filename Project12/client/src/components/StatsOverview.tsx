import React from 'react';
import { Card, Statistic, Row, Col, Typography } from 'antd';
import {
  UserOutlined,
  LikeOutlined,
  MessageOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface StatsOverviewProps {
  data: {
    totalViewers: number;
    totalLikes: number;
    totalComments: number;
    totalGifts: number;
    totalClicks: number;
    conversionRate: number;
  };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ data }) => {
  const stats = [
    {
      title: '总观看人数',
      value: data.totalViewers || 0,
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
    },
    {
      title: '总点赞数',
      value: data.totalLikes || 0,
      icon: <LikeOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '总评论数',
      value: data.totalComments || 0,
      icon: <MessageOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '礼物总价值',
      value: (data.totalGifts || 0).toFixed(2),
      prefix: '¥',
      icon: <GiftOutlined style={{ color: '#eb2f96' }} />,
      color: '#eb2f96',
    },
    {
      title: '商品点击量',
      value: data.totalClicks || 0,
      icon: <ShoppingCartOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1',
    },
    {
      title: '转化率',
      value: (data.conversionRate || 0).toFixed(2),
      suffix: '%',
      icon: <RiseOutlined style={{ color: '#13c2c2' }} />,
      color: '#13c2c2',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {stats.map((stat, index) => (
        <Col xs={12} sm={8} md={4} key={index}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${stat.color}15`,
                  fontSize: 24,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {stat.title}
                </Text>
                <Statistic
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  style={{ marginBottom: 0 }}
                  valueStyle={{ fontSize: 20, fontWeight: 600 }}
                />
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatsOverview;
