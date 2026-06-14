import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Modal, Form, Select, Tag, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { getVehicles, registerVehicle, vehicleEntry, vehicleExit } from '../../api';

const typeMap = {
  TEMPORARY: { color: 'blue', label: '临时' },
  MONTHLY: { color: 'green', label: '月租' },
};

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPlate, setSearchPlate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [entryForm] = Form.useForm();
  const [exitForm] = Form.useForm();

  const fetchVehicles = useCallback(async () => {
    try {
      const params = searchPlate ? { plateNumber: searchPlate } : {};
      const data = await getVehicles(params);
      setVehicles(Array.isArray(data) ? data : data?.data || data?.vehicles || []);
    } catch (e) {
      message.error('加载车辆数据失败');
    } finally {
      setLoading(false);
    }
  }, [searchPlate]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleAddVehicle = async (values) => {
    try {
      await registerVehicle(values);
      message.success('车辆登记成功');
      setModalOpen(false);
      form.resetFields();
      fetchVehicles();
    } catch (e) {
      message.error('车辆登记失败');
    }
  };

  const handleEntry = async (values) => {
    try {
      await vehicleEntry(values.plateNumber);
      message.success('车辆入场成功');
      setEntryModalOpen(false);
      entryForm.resetFields();
      fetchVehicles();
    } catch (e) {
      message.error('车辆入场失败');
    }
  };

  const handleExit = async (values) => {
    try {
      await vehicleExit(values.plateNumber);
      message.success('车辆出场成功');
      setExitModalOpen(false);
      exitForm.resetFields();
      fetchVehicles();
    } catch (e) {
      message.error('车辆出场失败');
    }
  };

  const columns = [
    { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber' },
    { title: '车辆类型', dataIndex: 'type', key: 'type', render: (v) => <Tag color={typeMap[v]?.color}>{typeMap[v]?.label || v}</Tag> },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '颜色', dataIndex: 'color', key: 'color' },
    { title: '车主姓名', dataIndex: 'ownerName', key: 'ownerName' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => { exitForm.setFieldsValue({ plateNumber: record.plateNumber }); setExitModalOpen(true); }}>出场</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="车辆管理"
        extra={
          <Space>
            <Input
              placeholder="搜索车牌号"
              prefix={<SearchOutlined />}
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              style={{ width: 200 }}
              onPressEnter={fetchVehicles}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEntryModalOpen(true)}>车辆入场</Button>
            <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>登记车辆</Button>
          </Space>
        }
      >
        <Table
          rowKey="plateNumber"
          columns={columns}
          dataSource={vehicles}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal title="登记车辆" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAddVehicle}>
          <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item name="type" label="车辆类型" rules={[{ required: true, message: '请选择车辆类型' }]}>
            <Select options={[{ label: '临时', value: 'TEMPORARY' }, { label: '月租', value: 'MONTHLY' }]} placeholder="请选择" />
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            <Input placeholder="请输入品牌" />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <Input placeholder="请输入颜色" />
          </Form.Item>
          <Form.Item name="ownerName" label="车主姓名">
            <Input placeholder="请输入车主姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="车辆入场" open={entryModalOpen} onCancel={() => setEntryModalOpen(false)} onOk={() => entryForm.submit()}>
        <Form form={entryForm} layout="vertical" onFinish={handleEntry}>
          <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入车牌号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="车辆出场" open={exitModalOpen} onCancel={() => setExitModalOpen(false)} onOk={() => exitForm.submit()}>
        <Form form={exitForm} layout="vertical" onFinish={handleExit}>
          <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入车牌号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
