import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  TreeSelect,
  message,
  Popconfirm,
  Typography,
  Spin,
  Row,
  Col,
  Tabs,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import {
  knowledgeApi,
  userApi,
} from '../../api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface KnowledgeNode {
  id: number;
  name: string;
  subject?: string;
  parentId?: number;
  description?: string;
  children?: KnowledgeNode[];
}

const KnowledgeManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [treeData, setTreeData] = useState<KnowledgeNode[]>([]);
  const [flatData, setFlatData] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    if (subjects.length) {
      setCurrentSubject(subjects[0] || '');
    }
  }, [subjects]);

  useEffect(() => {
    fetchList();
  }, [currentSubject]);

  const fetchMeta = async () => {
    try {
      const res = await userApi.subjects();
      setSubjects(res?.data || []);
    } catch (error) {
      console.error('获取科目失败:', error);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (currentSubject) params.subject = currentSubject;
      const [treeRes, listRes] = await Promise.all([
        knowledgeApi.tree(currentSubject || undefined),
        knowledgeApi.list(currentSubject || undefined),
      ]);
      const tree = treeRes?.data || [];
      const list = listRes?.data?.list || listRes?.data || [];
      setTreeData(tree);
      setFlatData(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('获取知识点列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const flattenTree = (nodes: KnowledgeNode[], result: any[] = []): any[] => {
    nodes.forEach((n) => {
      result.push(n);
      if (n.children?.length) flattenTree(n.children, result);
    });
    return result;
  };

  const handleAdd = (record?: KnowledgeNode) => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      subject: currentSubject || undefined,
      parentId: record?.id,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: KnowledgeNode) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      subject: record.subject,
      parentId: record.parentId || null,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await knowledgeApi.delete(id);
      message.success('删除成功');
      fetchList();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      const payload = {
        name: values.name,
        subject: values.subject,
        parentId: values.parentId || null,
        description: values.description,
      };
      if (editingId) {
        await knowledgeApi.update(editingId, payload);
        message.success('更新成功');
      } else {
        await knowledgeApi.create(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchList();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('提交失败:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const transformTreeSelectData = (nodes: KnowledgeNode[], excludeId: number | null = null): any[] => {
    return nodes.map((n) => ({
      value: n.id,
      title: n.name,
      disabled: excludeId !== null && n.id === excludeId,
      children: n.children?.length ? transformTreeSelectData(n.children, excludeId) : undefined,
    }));
  };

  const filterData = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
    if (!searchKeyword) return nodes;
    const keyword = searchKeyword.toLowerCase();
    const result: KnowledgeNode[] = [];
    const filter = (items: KnowledgeNode[], parent: KnowledgeNode | null = null, dest: KnowledgeNode[] = result) => {
      items.forEach((item) => {
        const children = item.children?.length ? filterData(item.children) : [];
        const match =
          item.name.toLowerCase().includes(keyword) ||
          (item.description && item.description.toLowerCase().includes(keyword));
        if (match || children.length) {
          dest.push({
            ...item,
            children: children.length ? children : undefined,
          });
        }
      });
    };
    filter(nodes);
    return result;
  };

  const renderSubjectTabs = () => {
    if (!subjects.length) {
      return (
        <TabPane tab="全部科目" key="">
          <></>
        </TabPane>
      );
    }
    return subjects.map((s) => (
      <TabPane tab={s} key={s}>
        <></>
      </TabPane>
    ));
  };

  const columns = [
    {
      title: '知识点名称',
      dataIndex: 'name',
      render: (t: string) => (
        <span>
          <BulbOutlined style={{ color: '#faad14', marginRight: 6 }} />
          {t}
        </span>
      ),
    },
    {
      title: '科目',
      dataIndex: 'subject',
      width: 120,
      render: (s: string) => (
        s ? <Tag color="blue">{s}</Tag> : '-'
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (d: string) => d || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: KnowledgeNode) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAdd(record)}
          >
            新增子节点
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该知识点吗？"
            description="删除会同时删除所有子节点"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, marginTop: 0 }}>
        知识点管理
      </Title>

      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 16,
        }}
      >
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索知识点名称/描述"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择科目"
              value={currentSubject || undefined}
              onChange={(v) => setCurrentSubject(v || '')}
              style={{ width: '100%' }}
              allowClear
            >
              {subjects.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={undefined} style={{ flex: 1, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
              新增知识点
            </Button>
          </Col>
        </Row>

        <Tabs
          activeKey={currentSubject}
          onChange={(key) => setCurrentSubject(key)}
          style={{ marginBottom: 16 }}
        >
          <TabPane tab="全部" key="">
            <></>
          </TabPane>
          {subjects.map((s) => (
            <TabPane tab={s} key={s}>
              <></>
            </TabPane>
          ))}
        </Tabs>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filterData(treeData)}
            rowKey="id"
            pagination={false}
            scroll={{ x: 900 }}
            expandedRowKeys={[]}
            defaultExpandAllRows
          />
        </Spin>
      </div>

      <Modal
        title={editingId ? '编辑知识点' : '新增知识点'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={modalLoading}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入知识点名称' }]}
          >
            <Input placeholder="请输入知识点名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="科目"
                name="subject"
                rules={[{ required: true, message: '请选择科目' }]}
              >
                <Select placeholder="选择科目" allowClear>
                  {subjects.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="父级节点" name="parentId">
                <TreeSelect
                  placeholder="根节点（不选）"
                  allowClear
                  treeDefaultExpandAll
                  treeData={transformTreeSelectData(treeData, editingId)}
                  filterTreeNode={(inputValue, treeNode: any) =>
                    (treeNode?.title as string)?.toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="请输入描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeManage;
