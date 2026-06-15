import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Spin,
  Radio,
  Checkbox,
  Input,
  Progress,
  Modal,
  Tag,
  message,
  Space,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SendOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { examApi } from '../../api';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

interface QuestionData {
  id: number;
  type: number;
  content: string;
  image?: string;
  analysis?: string;
  difficulty?: number;
  score?: number;
  subject?: string;
  options?: QuestionOption[];
}

interface ExamInfo {
  id: number;
  title: string;
  description?: string;
  duration: number;
  startTime: string;
  endTime: string;
}

const ExamDetail: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [examStudentId, setExamStudentId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId]);

  const loadExam = async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await examApi.start(parseInt(examId, 10));
      const data = res.data as any;
      setExamInfo(data.exam);
      setQuestions(data.questions || []);
      setExamStudentId(data.examStudentId);

      if (data.examStudentId) {
        localStorage.setItem(`exam_student_${examId}`, String(data.examStudentId));
      }

      const duration = data.exam?.duration || 60;
      setTimeLeft(duration * 60);
      startTimeRef.current = Date.now();
      startTimer();
    } catch (e: any) {
      message.error(e?.message || '加载考试失败');
      setTimeout(() => navigate('/student/exams'), 1500);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleAutoSubmit = () => {
    message.warning('考试时间已到，自动提交');
    handleSubmit(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== '' &&
    (!Array.isArray(answers[k]) || answers[k].length > 0)
  ).length;

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];

  const handleSingleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: value }));
  };

  const handleMultipleAnswer = (values: string[]) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: values }));
  };

  const handleFillBlank = (index: number, value: string) => {
    setAnswers((prev) => {
      const arr = prev[currentQuestion!.id] || [];
      const newArr = [...arr];
      newArr[index] = value;
      return { ...prev, [currentQuestion!.id]: newArr };
    });
  };

  const handleSubjectiveAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: value }));
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;
    const q = currentQuestion;

    switch (q.type) {
      case 1:
        return (
          <Radio.Group
            value={currentAnswer}
            onChange={(e) => handleSingleAnswer(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {(q.options || []).map((opt) => (
                <Radio
                  key={opt.id}
                  value={opt.optionLabel}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    width: '100%',
                    marginRight: 0,
                  }}
                >
                  <Text strong style={{ marginRight: 8 }}>{opt.optionLabel}.</Text>
                  {opt.optionContent}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case 2:
        return (
          <Checkbox.Group
            value={currentAnswer || []}
            onChange={handleMultipleAnswer}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {(q.options || []).map((opt) => (
                <Checkbox
                  key={opt.id}
                  value={opt.optionLabel}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    width: '100%',
                    marginRight: 0,
                  }}
                >
                  <Text strong style={{ marginRight: 8 }}>{opt.optionLabel}.</Text>
                  {opt.optionContent}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case 3:
        return (
          <Radio.Group value={currentAnswer} onChange={(e) => handleSingleAnswer(e.target.value)}>
            <Space size="large">
              <Radio value="T" style={{ padding: '12px 32px', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Text strong style={{ fontSize: 16 }}>✓ 正确</Text>
              </Radio>
              <Radio value="F" style={{ padding: '12px 32px', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Text strong style={{ fontSize: 16 }}>✗ 错误</Text>
              </Radio>
            </Space>
          </Radio.Group>
        );

      case 4:
        const blankCount = Math.max(1, (q.content?.match(/_{2,}/g) || []).length || 1);
        const fillAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            {Array.from({ length: blankCount }).map((_, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Tag color="orange">第{idx + 1}空</Tag>
                <Input
                  style={{ flex: 1, maxWidth: 400 }}
                  placeholder={`请输入第${idx + 1}空的答案`}
                  value={fillAnswers[idx] || ''}
                  onChange={(e) => handleFillBlank(idx, e.target.value)}
                />
              </div>
            ))}
          </Space>
        );

      case 5:
        return (
          <TextArea
            rows={8}
            placeholder="请输入您的答案..."
            value={currentAnswer || ''}
            onChange={(e) => handleSubjectiveAnswer(e.target.value)}
            style={{ borderRadius: 8 }}
            showCount
            maxLength={5000}
          />
        );

      default:
        return <Text type="warning">未知题型</Text>;
    }
  };

  const handleSubmit = (auto = false) => {
    Modal.confirm({
      title: auto ? '考试时间已到' : '确认提交试卷？',
      content: (
        <div>
          <p>已答题目：<Text strong type="success">{answeredCount}</Text> / {questions.length}</p>
          {answeredCount < questions.length && (
            <p style={{ color: '#faad14' }}>
              还有 {questions.length - answeredCount} 道题目未作答，确定要提交吗？
            </p>
          )}
        </div>
      ),
      okText: '确认提交',
      cancelText: '继续答题',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSubmitting(true);
        try {
          const answerList = questions.map((q) => {
            const ans = answers[q.id];
            let userAnswer = '';
            if (Array.isArray(ans)) {
              userAnswer = ans.filter((a) => a !== undefined && a !== null && a !== '').join(',');
            } else if (ans !== undefined && ans !== null) {
              userAnswer = String(ans);
            }
            return {
              questionId: q.id,
              userAnswer,
            };
          });

          const res = await examApi.submit({
            examStudentId,
            answers: answerList,
          });

          message.success('提交成功');
          const resultId = (res.data as any).examStudentId || examStudentId;
          navigate(`/student/result/${resultId}`, { replace: true });
        } catch (e: any) {
          message.error(e?.message || '提交失败');
          setSubmitting(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Spin size="large" tip="正在加载试卷..." />
      </div>
    );
  }

  const timeColor = timeLeft < 300 ? '#ff4d4f' : timeLeft < 600 ? '#faad14' : '#52c41a';

  return (
    <div>
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 12,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Title level={4} style={{ margin: 0 }}>{examInfo?.title || '考试'}</Title>
            </div>
          </Col>
          <Col>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: `${timeColor}15`,
                borderRadius: 8,
                border: `1px solid ${timeColor}30`,
              }}
            >
              <ClockCircleOutlined style={{ color: timeColor, fontSize: 18 }} />
              <Text strong style={{ color: timeColor, fontSize: 20, fontFamily: 'monospace' }}>
                {formatTime(timeLeft)}
              </Text>
            </div>
          </Col>
          <Col>
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>答题进度</Text>
                <Text strong style={{ fontSize: 12 }}>
                  {answeredCount} / {questions.length}
                </Text>
              </div>
              <Progress
                percent={questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}
                showInfo={false}
                size="small"
                strokeColor="#1890ff"
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} align="stretch">
        <Col xs={24} lg={6}>
          <Card
            title="题目导航"
            style={{ borderRadius: 12, position: 'sticky', top: 100 }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {questions.map((q, idx) => {
                const isAnswered = (() => {
                  const ans = answers[q.id];
                  if (ans === undefined || ans === null || ans === '') return false;
                  if (Array.isArray(ans)) return ans.filter((a) => a).length > 0;
                  return true;
                })();
                const isCurrent = idx === currentIndex;
                return (
                  <Button
                    key={q.id}
                    size="middle"
                    shape="circle"
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      width: 36,
                      height: 36,
                      borderColor: isCurrent ? '#1890ff' : isAnswered ? '#52c41a' : '#d9d9d9',
                      background: isCurrent ? '#1890ff' : isAnswered ? '#f6ffed' : '#fff',
                      color: isCurrent ? '#fff' : isAnswered ? '#52c41a' : '#666',
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    {idx + 1}
                  </Button>
                );
              })}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#1890ff' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>当前题目</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#f6ffed', border: '1px solid #52c41a' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>已作答</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', border: '1px solid #d9d9d9' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>未作答</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card style={{ borderRadius: 12, minHeight: 500 }} bodyStyle={{ padding: 32 }}>
            {currentQuestion && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <Tag color="#1890ff" style={{ fontSize: 14, padding: '4px 12px' }}>
                    第 {currentIndex + 1} 题
                  </Tag>
                  {QUESTION_TYPE_MAP[currentQuestion.type] && (
                    <Tag color={QUESTION_TYPE_MAP[currentQuestion.type].color}>
                      {QUESTION_TYPE_MAP[currentQuestion.type].label}
                    </Tag>
                  )}
                  <Tag color="gold">
                    {currentQuestion.score || 5} 分
                  </Tag>
                </div>

                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.8,
                    marginBottom: 32,
                    padding: '16px 20px',
                    background: '#fafafa',
                    borderRadius: 8,
                    borderLeft: '3px solid #1890ff',
                  }}
                  dangerouslySetInnerHTML={{ __html: currentQuestion.content }}
                />

                {renderQuestionContent()}
              </div>
            )}
          </Card>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              上一题
            </Button>

            <Space>
              {currentIndex === questions.length - 1 ? (
                <Button
                  type="primary"
                  danger
                  size="large"
                  icon={<SendOutlined />}
                  loading={submitting}
                  onClick={() => handleSubmit(false)}
                >
                  提交试卷
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                >
                  下一题
                </Button>
              )}
              <Button
                type="default"
                size="large"
                danger
                ghost
                loading={submitting}
                onClick={() => handleSubmit(false)}
              >
                交卷
              </Button>
            </Space>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ExamDetail;
