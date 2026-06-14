import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Typography,
  Tag,
  Select,
  DatePicker,
  Input,
  Space,
  Statistic,
} from 'antd';
import {
  ShoppingOutlined,
  SearchOutlined,
  RiseOutlined,
  MoneyCollectOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { api } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [sortField, setSortField] = useState('order_amount');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getTopProducts(50);
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter((p) => {
      if (searchText && !p.name?.includes(searchText)) return false;
      if (platformFilter && !p.room_title?.includes(platformFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortField) {
        case 'order_amount':
          return b.order_amount - a.order_amount;
        case 'click_count':
          return b.click_count - a.click_count;
        case 'order_count':
          return b.order_count - a.order_count;
        case 'conversion':
          const convA = a.click_count > 0 ? a.order_count / a.click_count : 0;
          const convB = b.click_count > 0 ? b.order_count / b.click_count : 0;
          return convB - convA;
        default:
          return 0;
      }
    });

  const totalGMV = products.reduce((sum, p) => sum + (p.order_amount || 0), 0);
  const totalClicks = products.reduce((sum, p) => sum + (p.click_count || 0), 0);
  const totalOrders = products.reduce((sum, p) => sum + (p.order_count || 0), 0);
  const avgPrice = products.length > 0
    ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
    : 0;

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => {
        const rank = index + 1;
        let color = '';
        if (rank === 1) color = '#ffd700';
        else if (rank === 2) color = '#c0c0c0';
        else if (rank === 3) color = '#cd7f32';
        
        return (
          <span style={{
            display: 'inline-block',
            width: 24,
            height: 24,
            lineHeight: '24px',
            textAlign: 'center',
            borderRadius: '50%',
            background: color || '#f0f0f0',
            color: rank <= 3 ? '#fff' : '#666',
            fontWeight: rank <= 3 ? 600 : 400,
            fontSize: 12,
          }}>
            {rank}
          </span>
        );
      },
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            来自：{record.room_title}
          </div>
        </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => (
        <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{price}</span>
      ),
      sorter: (a: any, b: any) => a.price - b.price,
    },
    {
      title: '点击量',
      dataIndex: 'click_count',
      key: 'click_count',
      width: 100,
      render: (val: number) => val?.toLocaleString(),
      sorter: (a: any, b: any) => a.click_count - b.click_count,
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 100,
      render: (val: number) => val?.toLocaleString(),
      sorter: (a: any, b: any) => a.order_count - b.order_count,
    },
    {
      title: '销售额',
      dataIndex: 'order_amount',
      key: 'order_amount',
      width: 120,
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: '#fa8c16' }}>
          ¥{val?.toLocaleString()}
        </span>
      ),
      sorter: (a: any, b: any) => a.order_amount - b.order_amount,
      defaultSortOrder: 'descend',
    },
    {
      title: '转化率',
      key: 'conversion',
      width: 100,
      render: (_: any, record: any) => {
        const rate = record.click_count > 0
          ? ((record.order_count / record.click_count) * 100)
          : 0;
        return (
          <Tag color={rate > 3 ? 'green' : rate > 1 ? 'orange' : 'red'}>
            {rate.toFixed(2)}%
          </Tag>
        );
      },
      sorter: (a: any, b: any) => {
        const rateA = a.click_count > 0 ? a.order_count / a.click_count : 0;
        const rateB = b.click_count > 0 ? b.order_count / b.click_count : 0;
        return rateA - rateB;
      },
    },
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: '0 0 8px 0' }}>
          <ShoppingOutlined style={{ marginRight: 8 }} />
          商品分析
        </Title>
        <p style={{ color: '#666', margin: 0 }}>
          全平台商品销售数据排行与分析
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={<span><MoneyCollectOutlined style={{ color: '#fa8c16', marginRight: 6 }} />总销售额</span>}
              value={totalGMV}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16', fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={<span><BarChartOutlined style={{ color: '#1890ff', marginRight: 6 }} />总点击量</span>}
              value={totalClicks}
              valueStyle={{ color: '#1890ff', fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={<span><ShoppingOutlined style={{ color: '#52c41a', marginRight: 6 }} />总订单数</span>}
              value={totalOrders}
              valueStyle={{ color: '#52c41a', fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={<span><RiseOutlined style={{ color: '#722ed1', marginRight: 6 }} />平均转化率</span>}
              value={totalClicks > 0 ? ((totalOrders / totalClicks) * 100) : 0}
              precision={2}
              suffix="%"
              valueStyle={{ color: '#722ed1', fontSize: 22 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="商品排行榜"
        extra={
          <Space>
            <Input
              placeholder="搜索商品名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="排序方式"
              value={sortField}
              onChange={setSortField}
              style={{ width: 140 }}
            >
              <Option value="order_amount">按销售额</Option>
              <Option value="click_count">按点击量</Option>
              <Option value="order_count">按订单数</Option>
              <Option value="conversion">按转化率</Option>
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </Card>
    </MainLayout>
  );
}
