import { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Descriptions, Tag, Table, Empty, Spin, message } from 'antd';
import { UserOutlined, CarOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { getVehicles, getMonthlyRentals, getRecords, getBillingRecords } from '../../api';
import dayjs from 'dayjs';

export default function MyPage() {
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [parkHistory, setParkHistory] = useState([]);
  const [payHistory, setPayHistory] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [vehicleData, monthlyData, recordsData, billingData] = await Promise.all([
        getVehicles(),
        getMonthlyRentals(),
        getRecords(),
        getBillingRecords(),
      ]);
      const vehicles = Array.isArray(vehicleData) ? vehicleData : vehicleData?.data || vehicleData?.vehicles || [];
      setVehicle(vehicles.length > 0 ? vehicles[0] : null);

      const rentals = Array.isArray(monthlyData) ? monthlyData : monthlyData?.data || monthlyData?.rentals || [];
      setMonthly(rentals.length > 0 ? rentals[0] : null);

      const records = Array.isArray(recordsData) ? recordsData : recordsData?.data || recordsData?.records || [];
      setParkHistory(records);

      const billing = Array.isArray(billingData) ? billingData : billingData?.data || billingData?.records || [];
      setPayHistory(billing);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const parkColumns = [
    { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber' },
    { title: '入场时间', dataIndex: 'entryTime', key: 'entryTime', render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    { title: '出场时间', dataIndex: 'exitTime', key: 'exitTime', render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    { title: '车位', dataIndex: 'spotNumber', key: 'spotNumber' },
  ];

  const payColumns = [
    { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => v != null ? `¥${v.toFixed(2)}` : '-' },
    { title: '时间', dataIndex: 'payTime', key: 'payTime', render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v) => v === 'PAID' ? <Tag color="green">已支付</Tag> : <Tag color="orange">未支付</Tag> },
  ];

  const tabItems = [
    {
      key: 'vehicle',
      label: '我的车辆',
      icon: <CarOutlined />,
      children: vehicle ? (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="车牌号">{vehicle.plateNumber}</Descriptions.Item>
          <Descriptions.Item label="品牌">{vehicle.brand || '-'}</Descriptions.Item>
          <Descriptions.Item label="颜色">{vehicle.color || '-'}</Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag color={vehicle.type === 'MONTHLY' ? 'green' : 'blue'}>
              {vehicle.type === 'MONTHLY' ? '月租' : '临时'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty description="暂无车辆信息" />
      ),
    },
    {
      key: 'monthly',
      label: '月租状态',
      icon: <CalendarOutlined />,
      children: monthly ? (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="车牌号">{monthly.plateNumber}</Descriptions.Item>
          <Descriptions.Item label="车位编号">{monthly.spotNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="开始日期">{monthly.startDate ? dayjs(monthly.startDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
          <Descriptions.Item label="到期日期">
            <span style={{ color: monthly.status === 'EXPIRED' ? '#ff4d4f' : undefined }}>
              {monthly.endDate ? dayjs(monthly.endDate).format('YYYY-MM-DD') : '-'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={monthly.status === 'ACTIVE' ? 'green' : monthly.status === 'EXPIRED' ? 'red' : 'orange'}>
              {monthly.status === 'ACTIVE' ? '生效中' : monthly.status === 'EXPIRED' ? '已过期' : '待生效'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty description="暂无月租信息" />
      ),
    },
    {
      key: 'history',
      label: '停车记录',
      icon: <UserOutlined />,
      children: (
        <Table
          rowKey={(r) => r.id || r.plateNumber + r.entryTime}
          columns={parkColumns}
          dataSource={parkHistory}
          size="small"
          pagination={{ pageSize: 5 }}
        />
      ),
    },
    {
      key: 'payment',
      label: '缴费记录',
      icon: <DollarOutlined />,
      children: (
        <Table
          rowKey={(r) => r.id || r.plateNumber + r.paidAt}
          columns={payColumns}
          dataSource={payHistory}
          size="small"
          pagination={{ pageSize: 5 }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#1677ff',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            margin: '0 auto 12px',
          }}
        >
          <UserOutlined />
        </div>
        <h3 style={{ margin: '0 0 4px' }}>{vehicle?.plateNumber || '未绑定车牌'}</h3>
        <p style={{ color: '#999', margin: 0 }}>
          {vehicle ? (vehicle.type === 'MONTHLY' ? '月租用户' : '临时用户') : '请先绑定车辆'}
        </p>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
