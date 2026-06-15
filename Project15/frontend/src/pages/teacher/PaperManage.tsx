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
  InputNumber,
  Slider,
  message,
  Popconfirm,
  Typography,
  Spin,
  Row,
  Col,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  paperApi,
  userApi,
  knowledgeApi,
} from '../../api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const questionTypeList = [
  { type: 1, label: '单选题', defaultCount: 10, defaultScore: 2 },
  { type: 2, label: '多选题', defaultCount: 5, defaultScore: 4 },
  { type: 3, label: '判断题', defaultCount: 10, defaultScore: 2 },
  { type: 4, label: '填空题', defaultCount: 5, defaultScore: 4 },
  { type: 5, label: '主观题', defaultCount: 3, defaultScore: 10 },
];

const difficultyMarks = {
  1: '简单',
  2: '较易',
  3: '中等',
  4: '较难',
  5: '困难',
};

const PaperManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [keyword, setKeyword] = useState('');
  const [filterSubject, setFilterSubject] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<number | undefined>();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [knowledgeTree, setKnowledgeTree] = useState<any[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailQuestions, setDetailQuestions] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchList();
  }, [pageNum, pageSize]);

  const fetchMeta = async () => {
    try {
      const [subjectsRes, knowledgeRes] = await Promise.all([
        userApi.subjects(),
        knowledgeApi.tree(),
      ]);
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
        subject: filterSubject,
        status: filterStatus,
      };
      const res = await paperApi.list(params);
      const list = res?.data?.list || res?.data || [];
      setData(Array.isArray(list) ? list : []);
      setTotal(res?.data?.total || list.length || 0);
    } catch (error) {
      console.error('获取试卷列表失败:', error);
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
    setFilterSubject(undefined);
    setFilterStatus(undefined);
    setPageNum(1);
    setTimeout(fetchList, 0);
  };

  const handleDetail = async (record: any) => {
    try {
      const detailRes = await paperApi.detail(record.id);
      const questionsRes = await paperApi.questions(record.id);
      setDetailData(detailRes?.data || record);
      setDetailQuestions(questionsRes?.data?.list || questionsRes?.data || []);
      setDetailOpen(true);
    } catch (error) {
      console.error('获取试卷详情失败:', error);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await paperApi.publish(id);
      message.success('发布成功');
      fetchList();
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await paperApi.delete(id);
      message.success('删除成功');
      fetchList();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      difficulty: 3,
      duration: 120,
      typeConfig: questionTypeList.map((t) => ({
        type: t.type,
        label: t.label,
        count: t.defaultCount,
        score: t.defaultScore,
      })),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      const questionConfig: any[] = [];
      values.typeConfig.forEach((tc: any) => {
        if (tc.count > 0) {
          questionConfig.push({
            type: tc.type,
            count: tc.count,
            score: tc.score,
          });
        }
      });

      const payload = {
        title: values.title,
        subject: values.subject,
        duration: values.duration,
        description: values.description,
        difficulty: values.difficulty,
        knowledgeIds: values.knowledgeIds || [],
        questionConfig,
      };

      await paperApi.create(payload);
      message.success('智能组卷成功');
      setModalOpen(false);
      fetchList();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('提交失败:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      title: '试卷标题',
      dataIndex: 'title',
      render: (t: string, r: any) => (
        <a onClick={() => handleDetail(r)} style={{ color: '#1677ff' }}>
          {t || r.name || '-'}
        </a>
      ),
    },
    {
      title: '科目',
      dataIndex: 'subject',
      width: 100,
      render: (s: string) => s || '-',
    },
    {
      title: '总题数',
      dataIndex: 'totalQuestions',
      width: 90,
      render: (n: number, r: any) => n ?? r.total_questions ?? 0,
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      width: 80,
      render: (n: number, r: any) => (n ?? r.total_score ?? 0) + '分',
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      width: 110,
      render: (n: number) => (n || 0) + '分钟',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: number) => (
        <Tag color={s === 1 ? 'green' : 'default'}>
          {s === 1 ? '已发布' : '草稿'}
        </Tag>
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
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleDetail(record)}
          >
            详情
          </Button>
          {record.status !== 1 && (
            <Button
              type="link"
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => handlePublish(record.id)}
            >
              发布
            </Button>
          )}
          <Popconfirm title="确定删除该试卷吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const typeColorMap: Record<number, string> = {
    1: 'blue',
    2: 'purple',
    3: 'green',
    4: 'orange',
    5: 'magenta',
  };
  const typeLabelMap: Record<number, string> = {
    1: '单选题',
    2: '多选题',
    3: '判断题',
    4: '填空题',
    5: '主观题',
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, marginTop: 0 }}>
        试卷管理
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
              placeholder="搜索试卷标题"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
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
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="状态"
              allowClear
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
              style={{ width: '100%' }}
            >
              <Option value={0}>草稿</Option>
              <Option value={1}>已发布</Option>
            </Select>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          智能组卷
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
        title="智能组卷"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={modalLoading}
        width={760}
        destroyOnClose
        okText="生成试卷"
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="试卷标题"
                name="title"
                rules={[{ required: true, message: '请输入试卷标题' }]}
              >
                <Input placeholder="请输入试卷标题" />
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
                label="考试时长(分钟)"
                name="duration"
                rules={[{ required: true, message: '请输入时长' }]}
              >
                <InputNumber min={10} max={600} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="描述" name="description">
                <TextArea rows={2} placeholder="请输入试卷描述（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            <Form.Item
              label="难度系数"
              name="difficulty"
              style={{ marginBottom: 8 }}
              rules={[{ required: true, message: '请选择难度' }]}
            >
              <Slider min={1} max={5} marks={difficultyMarks} step={1} />
            </Form.Item>

            <Form.Item label="知识点范围" name="knowledgeIds" style={{ marginBottom: 8 }}>
              <Select
                mode="multiple"
                placeholder="请选择知识点（不选则不限制）"
                options={knowledgeList}
                showSearch
                optionFilterProp="label"
                allowClear
              />
            </Form.Item>
          </div>

          <div
            style={{
              background: '#f0f7ff',
              padding: 12,
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#1677ff' }}>
              题型配置
            </div>
            <Form.List name="typeConfig">
              {(fields) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Form.Item
                      key={key}
                      {...restField}
                      label={questionTypeList[index]?.label}
                      style={{ marginBottom: 8 }}
                    >
                      <Row gutter={8} align="middle">
                        <Col span={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            hidden
                            initialValue={questionTypeList[index]?.type}
                          >
                            <Input />
                          </Form.Item>
                          <span style={{ color: '#666' }}>数量：</span>
                          <Form.Item
                            {...restField}
                            name={[name, 'count']}
                            initialValue={questionTypeList[index]?.defaultCount}
                            noStyle
                          >
                            <InputNumber min={0} max={100} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <span style={{ color: '#666', marginLeft: 8 }}>每题分数：</span>
                          <Form.Item
                            {...restField}
                            name={[name, 'score']}
                            initialValue={questionTypeList[index]?.defaultScore}
                            noStyle
                          >
                            <InputNumber min={0} max={100} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form.Item>
                  ))}
                </>
              )}
            </Form.List>
          </div>
        </Form>
      </Modal>

      <Modal
        title="试卷详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {detailData && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="试卷标题" span={2}>
                {detailData.title || detailData.name}
              </Descriptions.Item>
              <Descriptions.Item label="科目">
                {detailData.subject || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={detailData.status === 1 ? 'green' : 'default'}>
                  {detailData.status === 1 ? '已发布' : '草稿'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总题数">
                {detailData.totalQuestions ?? detailData.total_questions ?? detailQuestions.length ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="总分">
                {detailData.totalScore ?? detailData.total_score ?? 0}分
              </Descriptions.Item>
              <Descriptions.Item label="时长">
                {detailData.duration || 0}分钟
              </Descriptions.Item>
              <Descriptions.Item label="难度">
                {difficultyMarks[detailData.difficulty as keyof typeof difficultyMarks] || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {detailData.createTime || detailData.created_at || '-'}
              </Descriptions.Item>
              {detailData.description && (
                <Descriptions.Item label="描述" span={2}>
                  {detailData.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ fontWeight: 600, marginBottom: 8 }}>题目列表：</div>
            {detailQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无题目</div>
            ) : (
              <div>
                {detailQuestions.map((q: any, idx: number) => (
                  <div
                    key={q.id || idx}
                    style={{
                      padding: 12,
                      border: '1px solid #f0f0f0',
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ marginBottom: 6 }}>
                      <Tag color={typeColorMap[q.type] || 'default'}>
                        {typeLabelMap[q.type] || `题型${q.type}`}
                      </Tag>
                      <Tag
                        color={difficultyColors[(q.difficulty || 1) - 1] || 'default'}
                        style={{ border: 0 }}
                      >
                        {difficultyLabels[(q.difficulty || 1) - 1] || `难度${q.difficulty}`}
                      </Tag>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        第{idx + 1}题 · {q.score || 0}分
                      </span>
                    </div>
                    <div style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{q.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const difficultyColors = ['#52c41a', '#73d13d', '#faad14', '#fa8c16', '#f5222d'];
const difficultyLabels = ['简单', '较易', '中等', '较难', '困难'];

export default PaperManage;
