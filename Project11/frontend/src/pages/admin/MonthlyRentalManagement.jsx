import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { getMonthlyRentals, createMonthlyRental, renewMonthlyRental, getExpiringRentals } from '../../api';
import dayjs from 'dayjs';

export default function MonthlyRentalManagement() {
  const [rentals, setRentals] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [currentRental, setCurrentRental] = useState(null);
  const [form] = Form.useForm();
  const [renewForm] = Form.useForm();

  const fetchRentals = useCallback(async () => {
    try {
      const [data, expData] = await Promise.all([getMonthlyRentals(), getExpiringRentals()]);
      setRentals(Array.isArray(data) ? data : data?.data || data?.rentals || []);
      setExpiring(Array.isArray(expData) ? expData : expData?.data || []);
    } catch (e) {
      message.error('加载月租数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  const handleCreate = async (values) => {
    try {
      await createMonthlyRental(values);
      message.success('月租创建成功');
      setCreateOpen(false);
      form.resetFields();
      fetchRentals();
    } catch (e) {
      message.error('创建月租失败');
    }
  };

  const handleRenew = async (values) => {
    if (!currentRental) return;
    try {
      await renewMonthlyRental(currentRental.id, values);
      message.success('月租续期成功');
      setRenewOpen(false);
      renewForm.resetFields();
      setCurrentRental(null);
      fetchRentals();
    } catch (e) {
      message.error('月租续期失败');
    }
  };

  const isExpiring = (endDate) => {
    if (!endDate) return false;
    const end = dayjs(endDate);
    const diff = end.diff(dayjs(), 'day');
    return diff >= 0 && diff <= 7;
  };

  const columns = [
    { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber' },
    { title: '车主姓名', dataIndex: 'ownerName', key: 'ownerName' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '车位编号', dataIndex: 'spotNumber', key: 'spotNumber' },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '到期日期',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (v) => {
        const expiringFlag = isExpiring(v);
        return (
          <span style={{ color: expiringFlag ? '#ff4d4f' : undefined, fontWeight: expiringFlag ? 'bold' : undefined }}>
            {v ? dayjs(v).format('YYYY-MM-DD') : '-'}
            {expiringFlag && <Tag color="red" style={{ marginLeft: 4 }}>即将到期</Tag>}
          </span>
        );
      },
    },
    { title: '月租费用', dataIndex: 'amount', key: 'amount', render: (v) => (v != null ? `¥${v}` : '-') },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const colorMap = { ACTIVE: 'green', EXPIRED: 'red', PENDING: 'orange' };
        const labelMap = { ACTIVE: '生效中', EXPIRED: '已过期', PENDING: '待生效' };
        return <Tag color={colorMap[v] || 'default'}>{labelMap[v] || v}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            setCurrentRental(record);
            setRenewOpen(true);
          }}
        >
          续期
        </Button>
      ),
    },
  ];

  return (
    <div>
      {expiring.length > 0 && (
        <Card style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          <Space>
            <Tag color="red">告警</Tag>
            <span>有 <strong>{expiring.length}</strong> 个月租即将在7天内到期，请及时续费！</span>
            <Button size="small" type="link">查看详情</Button>
          </Space>
        </Card>
      )}

      <Card
        title="月租管理"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchRentals}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新增月租</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rentals}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal title="新增月租" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item name="ownerName" label="车主姓名" rules={[{ required: true, message: '请输入车主姓名' }]}>
            <Input placeholder="请输入车主姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="spotNumber" label="车位编号">
            <Input placeholder="请输入车位编号" />
          </Form.Item>
          <Form.Item name="months" label="月租期限(月)" rules={[{ required: true, message: '请输入月租期限' }]}>
            <InputNumber min={1} max={36} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="月租续期" open={renewOpen} onCancel={() => { setRenewOpen(false); setCurrentRental(null); }} onOk={() => renewForm.submit()}>
        {currentRental && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>车牌号：</strong>{currentRental.plateNumber}</p>
            <p><strong>到期日期：</strong>{currentRental.endDate ? dayjs(currentRental.endDate).format('YYYY-MM-DD') : '-'}</p>
          </div>
        )}
        <Form form={renewForm} layout="vertical" onFinish={handleRenew}>
          <Form.Item name="months" label="续期月数" rules={[{ required: true, message: '请输入续期月数' }]}>
            <InputNumber min={1} max={36} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
