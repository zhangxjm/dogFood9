import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  Rate,
  Radio,
  Checkbox,
  InputNumber,
  Cascader,
  message,
  Popconfirm,
  Typography,
  Spin,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  questionApi,
  userApi,
  knowledgeApi,
} from '../../api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const typeMap: Record<number, { label: string; color: string }> = {
  1: { label: '单选题', color: 'blue' },
  2: { label: '多选题', color: 'purple' },
  3: { label: '判断题', color: 'green' },
  4: { label: '填空题', color: 'orange' },
  5: { label: '主观题', color: 'magenta' },
};

const difficultyColors = ['#52c41a', '#73d13d', '#faad14', '#fa8c16', '#f5222d'];
const difficultyLabels = ['简单', '较易', '中等', '较难', '困难'];

const QuestionManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState<number | undefined>();
  const [filterSubject, setFilterSubject] = useState<string | undefined>();
  const [filterDifficulty, setFilterDifficulty] = useState<number | undefined>();
  const [filterKnowledge, setFilterKnowledge] = useState<number[]>([]);

  const [types, setTypes] = useState<{ value: number; label: string }[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [knowledgeTree, setKnowledgeTree] = useState<any[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchList();
  }, [pageNum, pageSize]);

  const fetchMeta = async () => {
    try {
      const [typesRes, subjectsRes, knowledgeRes] = await Promise.all([
        questionApi.types(),
        userApi.subjects(),
        knowledgeApi.tree(),
      ]);
      const typeList = typesRes?.data || [];
      setTypes(
        typeList.length
          ? typeList
          : [
              { value: 1, label: '单选题' },
              { value: 2, label: '多选题' },
              { value: 3, label: '判断题' },
              { value: 4, label: '填空题' },
              { value: 5, label: '主观题' },
            ]
      );
      setSubjects(subjectsRes?.data || []);
      setKnowledgeTree(knowledgeRes?.data || []);

      const flatKnowledge: any[] = [];
      const flatten = (nodes: any[]) => {
        nodes.forEach((n) => {
          flatKnowledge.push({ value: n.id, label: n.name });
          if (n.children?.length) flatten(n.children);
        });
      };
      flatten(knowledgeRes?.data || []);
      setKnowledgeList(flatKnowledge);
    } catch (error) {
      console.error('获取元数据失败:', error);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const params: any = {
        pageNum,
        pageSize,
        keyword,
        type: filterType,
        subject: filterSubject,
        difficulty: filterDifficulty,
        knowledgeIds: filterKnowledge?.length ? filterKnowledge : undefined,
      };
      const res = await questionApi.list(params);
      const list = res?.data?.list || res?.data || [];
      setData(Array.isArray(list) ? list : []);
      setTotal(res?.data?.total || list.length || 0);
    } catch (error) {
      console.error('获取题目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPageNum(1);
    fetchList();
  };

  const handleReset = () => {
    setKeyword('');
    setFilterType(undefined);
    setFilterSubject(undefined);
    setFilterDifficulty(undefined);
    setFilterKnowledge([]);
    setPageNum(1);
    setTimeout(fetchList, 0);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      type: 1,
      difficulty: 3,
      score: 5,
      options: [{ label: 'A', content: '' }, { label: 'B', content: '' }, { label: 'C', content: '' }, { label: 'D', content: '' }],
    });
    setModalOpen(true);
  };

  const handleEdit = async (record: any) => {
    setEditingId(record.id);
    try {
      const detailRes = await questionApi.detail(record.id);
      const detail = detailRes?.data || record;
      const formValues: any = {
        type: detail.type,
        subject: detail.subject,
        difficulty: detail.difficulty || 3,
        score: detail.score,
        content: detail.content,
        analysis: detail.analysis,
        knowledgeIds: detail.knowledgeIds || detail.knowledge_ids || [],
      };
      if (detail.type === 1 || detail.type === 2 || detail.type === 3) {
        formValues.options = detail.options || [
          { label: 'A', content: '' },
          { label: 'B', content: '' },
          { label: 'C', content: '' },
          { label: 'D', content: '' },
        ];
        if (detail.type === 3 && formValues.options.length < 2) {
          formValues.options = [
            { label: 'T', content: '正确' },
            { label: 'F', content: '错误' },
          ];
        }
        formValues.answer = detail.answer;
      } else if (detail.type === 4) {
        formValues.answer = detail.answer;
      } else if (detail.type === 5) {
        formValues.referenceAnswer = detail.referenceAnswer || detail.reference_answer;
      }
      form.setFieldsValue(formValues);
      setModalOpen(true);
    } catch (error) {
      console.error('获取题目详情失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await questionApi.delete(id);
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
      const payload: any = {
        type: values.type,
        subject: values.subject,
        difficulty: values.difficulty,
        score: values.score,
        content: values.content,
        analysis: values.analysis,
        knowledgeIds: values.knowledgeIds || [],
      };
      if (values.type === 1 || values.type === 2 || values.type === 3) {
        payload.options = values.options;
        payload.answer = values.answer;
      } else if (values.type === 4) {
        payload.answer = values.answer;
      } else if (values.type === 5) {
        payload.referenceAnswer = values.referenceAnswer;
      }
      if (editingId) {
        await questionApi.update(editingId, payload);
        message.success('更新成功');
      } else {
        await questionApi.create(payload);
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

  const transformKnowledgeTree = (nodes: any[]): any[] => {
    return nodes.map((n) => ({
      value: n.id,
      label: n.name,
      children: n.children?.length ? transformKnowledgeTree(n.children) : undefined,
    }));
  };

  const currentType = Form.useWatch('type', form);

  useEffect(() => {
    if (!modalOpen) return;
    if (currentType === 3) {
      form.setFieldsValue({
        options: [
          { label: 'T', content: '正确' },
          { label: 'F', content: '错误' },
        ],
      });
    } else if (currentType === 1 || currentType === 2) {
      form.setFieldsValue({
        options: [
          { label: 'A', content: '' },
          { label: 'B', content: '' },
          { label: 'C', content: '' },
          { label: 'D', content: '' },
        ],
      });
    }
  }, [currentType, modalOpen]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: '题型',
      dataIndex: 'type',
      width: 90,
      render: (t: number) => {
        const info = typeMap[t] || { label: `题型${t}`, color: 'default' };
        return <Tag color={info.color as any}>{info.label}</Tag>;
      },
    },
    {
      title: '科目',
      dataIndex: 'subject',
      width: 100,
      render: (s: string) => s || '-',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 90,
      render: (d: number) => {
        const idx = (d || 1) - 1;
        return (
          <Tag color={difficultyColors[idx]} style={{ border: 0 }}>
            {difficultyLabels[idx] || `难度${d}`}
          </Tag>
        );
      },
    },
    {
      title: '分数',
      dataIndex: 'score',
      width: 70,
      render: (s: number) => `${s || 0}分`,
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (c: string) => (
        <span style={{ maxWidth: 300, display: 'inline-block' }}>{c || '-'}</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
      render: (t: string, r: any) => t || r.created_at || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该题目吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderOptionFields = () => {
    const type = currentType;
    if (type === 1 || type === 2) {
      return (
        <>
          <Form.List name="options">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row key={key} gutter={8} style={{ marginBottom: 8 }} align="middle">
                    <Col span={2}>
                      <Form.Item
                        {...restField}
                        name={[name, 'label']}
                        initialValue={['A', 'B', 'C', 'D'][index]}
                        rules={[{ required: true, message: '必填' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={20}>
                      <Form.Item
                        {...restField}
                        name={[name, 'content']}
                        rules={[{ required: true, message: '请输入选项内容' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder={`选项 ${['A', 'B', 'C', 'D'][index]} 内容`} />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>
          <Form.Item
            label="正确答案"
            name="answer"
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            {type === 1 ? (
              <Radio.Group>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
                <Radio value="C">C</Radio>
                <Radio value="D">D</Radio>
              </Radio.Group>
            ) : (
              <Checkbox.Group options={['A', 'B', 'C', 'D']} />
            )}
          </Form.Item>
        </>
      );
    }
    if (type === 3) {
      return (
        <>
          <Form.List name="options">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row key={key} gutter={8} style={{ marginBottom: 8 }} align="middle">
                    <Col span={2}>
                      <Form.Item
                        {...restField}
                        name={[name, 'label']}
                        initialValue={['T', 'F'][index]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={20}>
                      <Form.Item
                        {...restField}
                        name={[name, 'content']}
                        initialValue={['正确', '错误'][index]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
              </>
            )}
          </Form.List>
          <Form.Item
            label="正确答案"
            name="answer"
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            <Radio.Group>
              <Radio value="T">正确 (T)</Radio>
              <Radio value="F">错误 (F)</Radio>
            </Radio.Group>
          </Form.Item>
        </>
      );
    }
    if (type === 4) {
      return (
        <Form.Item
          label="正确答案"
          name="answer"
          extra="多个空用 | 分隔"
          rules={[{ required: true, message: '请填写正确答案' }]}
        >
          <Input placeholder="多个空用 | 分隔，如：答案1|答案2" />
        </Form.Item>
      );
    }
    if (type === 5) {
      return (
        <Form.Item
          label="参考答案"
          name="referenceAnswer"
          rules={[{ required: true, message: '请填写参考答案' }]}
        >
          <TextArea rows={4} placeholder="请输入参考答案" />
        </Form.Item>
      );
    }
    return null;
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, marginTop: 0 }}>
        题目管理
      </Title>

      <div
        style={{
          padding: 16,
          background: '#fff',
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索题目内容"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="题型"
              allowClear
              value={filterType}
              onChange={(v) => setFilterType(v)}
              style={{ width: '100%' }}
            >
              {types.map((t) => (
                <Option key={t.value} value={t.value}>
                  {t.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="科目"
              allowClear
              value={filterSubject}
              onChange={(v) => setFilterSubject(v)}
              style={{ width: '100%' }}
            >
              {subjects.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="难度"
              allowClear
              value={filterDifficulty}
              onChange={(v) => setFilterDifficulty(v)}
              style={{ width: '100%' }}
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <Option key={d} value={d}>
                  {difficultyLabels[d - 1]}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Cascader
              placeholder="知识点"
              allowClear
              multiple
              value={filterKnowledge?.length ? [filterKnowledge] : []}
              onChange={(v: any) => {
                if (v?.length) {
                  const ids: number[] = [];
                  v.forEach((path: any[]) => {
                    if (path?.length) ids.push(path[path.length - 1]);
                  });
                  setFilterKnowledge(ids);
                } else {
                  setFilterKnowledge([]);
                }
              }}
              options={transformKnowledgeTree(knowledgeTree)}
              style={{ width: '100%' }}
              showSearch
            />
          </Col>
          <Col xs={24} sm={24} md={undefined} style={{ flex: 1, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增题目
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPageNum(p);
              setPageSize(ps);
            },
          }}
        />
      </Spin>

      <Modal
        title={editingId ? '编辑题目' : '新增题目'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={modalLoading}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="题型"
                name="type"
                rules={[{ required: true, message: '请选择题型' }]}
              >
                <Select>
                  <Option value={1}>单选题</Option>
                  <Option value={2}>多选题</Option>
                  <Option value={3}>判断题</Option>
                  <Option value={4}>填空题</Option>
                  <Option value={5}>主观题</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="科目"
                name="subject"
                rules={[{ required: true, message: '请选择科目' }]}
              >
                <Select placeholder="选择科目" showSearch allowClear>
                  {subjects.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="难度"
                name="difficulty"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="分数"
                name="score"
                rules={[{ required: true, message: '请输入分数' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="题目内容"
            name="content"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea rows={3} placeholder="请输入题目内容" />
          </Form.Item>
          {renderOptionFields()}
          <Form.Item label="解析" name="analysis">
            <TextArea rows={2} placeholder="请输入解析（可选）" />
          </Form.Item>
          <Form.Item label="知识点" name="knowledgeIds">
            <Select
              mode="multiple"
              placeholder="请选择知识点"
              options={knowledgeList}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionManage;
