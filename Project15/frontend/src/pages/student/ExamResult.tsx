import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Spin,
  Divider,
  Collapse,
  Button,
  Space,
  Progress,
  Tooltip,
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { examApi } from '../../api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const QUESTION_TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '单选题', color: 'blue' },
  2: { label: '多选题', color: 'purple' },
  3: { label: '判断题', color: 'cyan' },
  4: { label: '填空题', color: 'orange' },
  5: { label: '主观题', color: 'magenta' },
};

interface QuestionOption {
  id: number;
  questionId: number;
  optionLabel: string;
  optionContent: string;
  isCorrect?: number;
}

interface QuestionDetail {
  question: {
    id: number;
    type: number;
    content: string;
    analysis?: string;
    score?: number;
  };
  options: QuestionOption[];
  questionScore: number;
  questionOrder: number;
  userAnswer?: string;
  isCorrect?: number;
  score?: number;
  autoScore?: number;
  manualScore?: number;
}

const ExamResult: React.FC = () => {
  const { examStudentId } = useParams<{ examStudentId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [examStudent, setExamStudent] = useState<any>(null);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetail[]>([]);
  const [paperInfo, setPaperInfo] = useState<any>(null);

  useEffect(() => {
    loadResult();
  }, [examStudentId]);

  const loadResult = async () => {
    if (!examStudentId) return;
    setLoading(true);
    try {
      const res = await examApi.result(parseInt(examStudentId, 10));
      const data = res.data as any;
      setExamInfo(data.exam);
      setExamStudent(data.examStudent);
      setPaperInfo(data.paper);
      setQuestionDetails(data.questionDetails || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalScore = examStudent?.totalScore ?? 0;
  const fullScore = questionDetails.reduce((sum, q) => sum + (q.questionScore || 0), 0);
  const correctCount = questionDetails.filter((q) => q.isCorrect === 1).length;
  const accuracy = questionDetails.length > 0
    ? Math.round((correctCount / questionDetails.length) * 100)
    : 0;

  const calculateTimeUsed = () => {
    if (!examStudent?.startTime || !examStudent?.submitTime) return '0分钟';
    const start = dayjs(examStudent.startTime);
    const end = dayjs(examStudent.submitTime);
    const mins = end.diff(start, 'minute');
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hours > 0) return `${hours}小时${remainMins}分钟`;
    return `${remainMins}分钟`;
  };

  const getCorrectAnswer = (q: QuestionDetail): string => {
    const options = q.options || [];
    if (options.length > 0) {
      const correctOpts = options
        .filter((o) => o.isCorrect === 1)
        .map((o) => o.optionLabel)
        .sort();
      return correctOpts.join(',');
    }
    return '';
  };

  const isCorrectAnswer = (q: QuestionDetail, opt: QuestionOption) => {
    return opt.isCorrect === 1;
  };

  const isUserWrongSelected = (q: QuestionDetail, opt: QuestionOption) => {
    const userAns = (q.userAnswer || '').split(',').map((s) => s.trim()).filter(Boolean);
    const isSelected = userAns.includes(opt.optionLabel);
    return isSelected && opt.isCorrect !== 1;
  };

  const isUserCorrectSelected = (q: QuestionDetail, opt: QuestionOption) => {
    const userAns = (q.userAnswer || '').split(',').map((s) => s.trim()).filter(Boolean);
    const isSelected = userAns.includes(opt.optionLabel);
    return isSelected && opt.isCorrect === 1;
  };

  const renderOptions = (q: QuestionDetail) => {
    const options = q.options || [];
    if (options.length === 0) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {options.map((opt) => {
            const isCorrect = isCorrectAnswer(q, opt);
            const isWrongSel = isUserWrongSelected(q, opt);
            const isCorrectSel = isUserCorrectSelected(q, opt);

            let bgColor = '#fff';
            let borderColor = '#f0f0f0';
            let textColor = '#333';

            if (isCorrect) {
              bgColor = '#f6ffed';
              borderColor = '#b7eb8f';
              textColor = '#389e0d';
            }
            if (isWrongSel) {
              bgColor = '#fff1f0';
              borderColor = '#ffa39e';
              textColor = '#cf1322';
            }
            if (isCorrectSel) {
              bgColor = '#f6ffed';
              borderColor = '#52c41a';
              textColor = '#389e0d';
            }

            return (
              <div
                key={opt.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <Text strong>{opt.optionLabel}.</Text>
                <span style={{ flex: 1 }}>{opt.optionContent}</span>
                {isCorrect && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                {isWrongSel && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              </div>
            );
          })}
        </Space>
      </div>
    );
  };

  const renderJudgmentAnswer = (q: QuestionDetail) => {
    const userAns = q.userAnswer;
    const correctAns = getCorrectAnswer(q);

    return (
      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        {['T', 'F'].map((val) => {
          const isCorrect = correctAns === val;
          const isUser = userAns === val;
          let bg = '#fff', border = '#f0f0f0', color = '#333';
          if (isCorrect) { bg = '#f6ffed'; border = '#b7eb8f'; color = '#389e0d'; }
          if (isUser && q.isCorrect !== 1) { bg = '#fff1f0'; border = '#ffa39e'; color = '#cf1322'; }
          if (isUser && q.isCorrect === 1) { bg = '#f6ffed'; border = '#52c41a'; color = '#389e0d'; }
          return (
            <div key={val} style={{ padding: '10px 24px', borderRadius: 8, background: bg, border: `1px solid ${border}`, color }}>
              <Text strong>{val === 'T' ? '✓ 正确' : '✗ 错误'}</Text>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAnswerDisplay = (q: QuestionDetail) => {
    const userAns = q.userAnswer || '（未作答）';
    const correctAns = getCorrectAnswer(q);

    switch (q.question.type) {
      case 1:
      case 2:
        return renderOptions(q);
      case 3:
        return renderJudgmentAnswer(q);
      case 4:
      case 5:
        return (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <div style={{ padding: 12, borderRadius: 8, background: q.isCorrect === 1 ? '#f6ffed' : '#fff1f0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>你的答案</Text>
                  <div style={{ marginTop: 4, wordBreak: 'break-all' }}>
                    <Text strong style={{ color: q.isCorrect === 1 ? '#389e0d' : '#cf1322' }}>
                      {userAns}
                    </Text>
                  </div>
                </div>
              </Col>
              {correctAns && (
                <Col xs={24} md={12}>
                  <div style={{ padding: 12, borderRadius: 8, background: '#f6ffed' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>正确答案</Text>
                    <div style={{ marginTop: 4, wordBreak: 'break-all' }}>
                      <Text strong style={{ color: '#389e0d' }}>{correctAns}</Text>
                    </div>
                  </div>
                </Col>
              )}
            </Row>
            {q.question.type === 5 && (
              <Row gutter={[16, 12]} style={{ marginTop: 12 }}>
                <Col xs={24} md={12}>
                  <div style={{ padding: 12, borderRadius: 8, background: '#e6f7ff' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>系统评分</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {(q.autoScore ?? 0).toFixed(1)} / {q.questionScore.toFixed(1)} 分
                      </Text>
                    </div>
                    {typeof q.score === 'number' && q.score > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Progress
                          percent={Math.round((q.score / q.questionScore) * 100)}
                          size="small"
                          strokeColor="#52c41a"
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          相似度 {Math.round((q.score / q.questionScore) * 100)}%
                        </Text>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Spin size="large" tip="正在加载成绩..." />
      </div>
    );
  }

  const scorePercent = fullScore > 0 ? Math.round((totalScore / fullScore) * 100) : 0;
  const isPassed = scorePercent >= 60;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/student/exams')}
        style={{ marginBottom: 16 }}
      >
        返回考试列表
      </Button>

      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          background: isPassed
            ? 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
            : 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
        }}
        bodyStyle={{ padding: 32 }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col flex="auto">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: isPassed ? '#52c41a' : '#ff4d4f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                }}
              >
                {isPassed ? <TrophyOutlined style={{ color: '#fff' }} /> : <CloseCircleOutlined style={{ color: '#fff' }} />}
              </div>
              <div>
                <Title level={3} style={{ margin: 0 }}>{examInfo?.title || '考试成绩'}</Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  提交时间：{examStudent?.submitTime ? dayjs(examStudent.submitTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={isPassed ? 'success' : 'error'} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {isPassed ? '🎉 考试通过' : '😢 未通过'}
                  </Tag>
                </div>
              </div>
            </div>
          </Col>
          <Col>
            <div style={{ textAlign: 'center', minWidth: 200 }}>
              <div style={{ fontSize: 64, fontWeight: 700, color: isPassed ? '#389e0d' : '#cf1322', lineHeight: 1 }}>
                {totalScore.toFixed(1)}
                <span style={{ fontSize: 24, color: '#999', fontWeight: 400 }}> / {fullScore.toFixed(0)}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <Progress
                  percent={scorePercent}
                  strokeColor={isPassed ? '#52c41a' : '#ff4d4f'}
                  showInfo={false}
                />
              </div>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '24px 0' }} />

        <Row gutter={[24, 16]}>
          <Col xs={12} md={6}>
            <Statistic
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  正确率
                </span>
              }
              value={accuracy}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileTextOutlined style={{ color: '#1890ff' }} />
                  答对题数
                </span>
              }
              value={correctCount}
              suffix={`/ ${questionDetails.length}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  用时
                </span>
              }
              value={calculateTimeUsed()}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BarChartOutlined style={{ color: '#722ed1' }} />
                  排名
                </span>
              }
              value={'--'}
              suffix={'/ --'}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      <Title level={4} style={{ marginBottom: 16 }}>详细答题情况</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {questionDetails.map((q) => {
          const typeInfo = QUESTION_TYPE_MAP[q.question.type] || { label: '未知', color: 'default' };
          const isCorrect = q.isCorrect === 1;
          const scoreGot = q.score ?? q.autoScore ?? 0;

          return (
            <Card
              key={q.question.id}
              style={{ borderRadius: 12 }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Tag color="#1890ff" style={{ fontSize: 14, padding: '4px 12px' }}>
                    第 {q.questionOrder} 题
                  </Tag>
                  <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                  <Tag color="gold">{q.questionScore.toFixed(1)} 分</Tag>
                  <Tag color={isCorrect ? 'success' : 'error'} style={{ fontWeight: 600 }}>
                    {isCorrect ? (
                      <span><CheckCircleOutlined /> 正确</span>
                    ) : (
                      <span><CloseCircleOutlined /> 错误</span>
                    )}
                  </Tag>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: isCorrect ? '#52c41a' : '#ff4d4f' }}>
                    {scoreGot.toFixed(1)}
                    <span style={{ fontSize: 14, color: '#999', fontWeight: 400 }}>
                      /{q.questionScore.toFixed(1)}分
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  padding: '16px 20px',
                  background: '#fafafa',
                  borderRadius: 8,
                  borderLeft: '3px solid #1890ff',
                  marginBottom: 8,
                }}
                dangerouslySetInnerHTML={{ __html: q.question.content }}
              />

              {renderAnswerDisplay(q)}

              {q.question.analysis && (
                <Collapse
                  style={{ marginTop: 16, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}
                  ghost
                >
                  <Panel
                    header={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BulbOutlined style={{ color: '#faad14' }} />
                        <Text strong style={{ color: '#d48806' }}>查看题目解析</Text>
                      </span>
                    }
                    key="analysis"
                  >
                    <Paragraph
                      style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#614700', lineHeight: 1.8 }}
                      dangerouslySetInnerHTML={{ __html: q.question.analysis }}
                    />
                  </Panel>
                </Collapse>
              )}
            </Card>
          );
        })}
      </Space>
    </div>
  );
};

export default ExamResult;
