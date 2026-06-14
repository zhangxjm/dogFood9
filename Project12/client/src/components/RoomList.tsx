import React from 'react';
import { Table, Tag, Typography, Avatar } from 'antd';
import { UserOutlined, EyeOutlined, LikeOutlined, ShoppingOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Text } = Typography;

interface RoomItem {
  room_id: number;
  title: string;
  streamer_name: string;
  platform: string;
  platform_name: string;
  viewer_count: number;
  like_count: number;
  comment_count: number;
  gift_value: number;
  product_click_count: number;
  order_count: number;
  conversion_rate: number;
  timestamp: string;
}

interface RoomListProps {
  data: RoomItem[];
  loading?: boolean;
}

const platformColors: Record<string, string> = {
  douyin: 'red',
  taobao: 'orange',
  kuaishou: 'gold',
  xiaohongshu: 'magenta',
  bilibili: 'geekblue',
};

const RoomList: React.FC<RoomListProps> = ({ data, loading }) => {
  const columns = [
    {
      title: '直播间',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (text: string, record: RoomItem) => (
        <Link href={`/room/${record.room_id}`} style={{ color: '#1890ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
              {record.streamer_name?.charAt(0)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 500, color: '#333' }}>{text}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.streamer_name}
              </Text>
            </div>
          </div>
        </Link>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform_name',
      key: 'platform',
      width: 100,
      render: (text: string, record: RoomItem) => (
        <Tag color={platformColors[record.platform] || 'default'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '观看人数',
      dataIndex: 'viewer_count',
      key: 'viewer_count',
      width: 120,
      sorter: (a: RoomItem, b: RoomItem) => a.viewer_count - b.viewer_count,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <EyeOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{value?.toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: '点赞数',
      dataIndex: 'like_count',
      key: 'like_count',
      width: 100,
      sorter: (a: RoomItem, b: RoomItem) => a.like_count - b.like_count,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LikeOutlined style={{ color: '#52c41a' }} />
          <span>{value?.toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: '商品点击',
      dataIndex: 'product_click_count',
      key: 'product_click_count',
      width: 100,
      sorter: (a: RoomItem, b: RoomItem) => a.product_click_count - b.product_click_count,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ShoppingOutlined style={{ color: '#722ed1' }} />
          <span>{value?.toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: '转化率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      width: 100,
      sorter: (a: RoomItem, b: RoomItem) => a.conversion_rate - b.conversion_rate,
      render: (value: number) => (
        <Tag color={value > 3 ? 'green' : value > 1 ? 'orange' : 'red'}>
          {value?.toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: '礼物价值',
      dataIndex: 'gift_value',
      key: 'gift_value',
      width: 120,
      sorter: (a: RoomItem, b: RoomItem) => a.gift_value - b.gift_value,
      render: (value: number) => (
        <span style={{ fontWeight: 500, color: '#eb2f96' }}>
          ¥{value?.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="room_id"
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      scroll={{ x: 900 }}
    />
  );
};

export default RoomList;
