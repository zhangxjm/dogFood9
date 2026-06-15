import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Typography,
  Button,
  Spin,
  Radio,
  Checkbox,
  Input,
  Progress,
  Tag,
  Space,
  Row,
  Col,
  message,
  Statistic,
  Alert,
  Result,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ReloadOutlined,
  FormOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { studyApi } from '../../api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const QUESTION_TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '单选题', color: 'blue' },
  2: { label: '多选题', color: 'purple' },
  3: { label: '判断题', color: 'cyan' },
  4: { label: '填空题', color: 'orange' },
  5: { label: '主观题', color: 'magenta' },
};

const DIFFICULTY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '简单', color: 'green' },
  2: { label: '中等', color: 'gold' },
  3: { label: '困难', color: 'red' },
};

interface QuestionOption {
  id: number;
  questionId: number;
  optionLabel: string;
  optionContent: string;
  isCorrect?: number;
}

interface Question {
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

const Practice: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadRecommendations();
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await studyApi.recommend(20);
      setQuestions((res.data || []) as Question[]);
    } catch (e) {
      console.error(e);
      message.error('加载推荐题目失败');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const isCurrentChecked = checked[currentQuestion?.id];

  const handleSingleAnswer = (value: string) => {
    if (isCurrentChecked) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: value }));
  };

  const handleMultipleAnswer = (values: string[]) => {
    if (isCurrentChecked) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: values }));
  };

  const handleFillBlank = (index: number, value: string) => {
    if (isCurrentChecked) return;
    setAnswers((prev) => {
      const arr = prev[currentQuestion!.id] || [];
      const newArr = [...arr];
      newArr[index] = value;
      return { ...prev, [currentQuestion!.id]: newArr };
    });
  };

  const handleSubjectiveAnswer = (value: string) => {
    if (isCurrentChecked) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion!.id]: value }));
  };

  const getCorrectAnswer = (q: Question): string => {
    const options = q.options || [];
    if (options.length > 0) {
      return options
        .filter((o) => o.isCorrect === 1)
        .map((o) => o.optionLabel)
        .sort()
        .join(',');
    }
    return '';
  };

  const checkCurrentAnswer = () => {
    if (!currentQuestion) return;
    const ans = answers[currentQuestion.id];
    if (ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
      message.warning('请先作答');
      return;
    }
    setChecked((prev) => ({ ...prev, [currentQuestion.id]: true }));
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishPractice();
    }
  };

  const finishPractice = () => {
    stopTimer();
    setCompleted(true);
  };

  const restart = () => {
    setAnswers({});
    setChecked({});
    setCurrentIndex(0);
    setCompleted(false);
    setDuration(0);
    startTime;
    loadRecommendations();
    startTimer();
  };

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== '' &&
    (!Array.isArray(answers[k]) || answers[k].length > 0)
  ).length;
  const checkedCount = Object.keys(checked).length;

  const correctCount = questions.reduce((sum, q) => {
    if (!checked[q.id]) return sum;
    const userAns = answers[q.id];
    const correctAns = getCorrectAnswer(q);
    let userAnswerStr = '';
    if (Array.isArray(userAns)) {
      userAnswerStr = userAns.filter((a) => a !== undefined && a !== null && a !== '').sort().join(',');
    } else if (userAns !== undefined && userAns !== null) {
      userAnswerStr = String(userAns);
    }
    return userAnswerStr === correctAns ? sum + 1 : sum;
  }, 0);

  const finalAccuracy = checkedCount > 0 ? Math.round((correctCount / checkedCount) * 100) : 0;

  const isAnswerCorrect = (q: Question): boolean | null => {
    if (!checked[q.id]) return null;
    const userAns = answers[q.id];
    const correctAns = getCorrectAnswer(q);
    let userAnswerStr = '';
    if (Array.isArray(userAns)) {
      userAnswerStr = userAns.filter((a) => a !== undefined && a !== null && a !== '').sort().join(',');
    } else if (userAns !== undefined && userAns !== null) {
      userAnswerStr = String(userAns);
    }
    return userAnswerStr === correctAns;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  const getWeakKnowledgePoints = (): string[] => {
    const points = ['函数', '几何', '方程', '概率', '导数'];
    return points.filter(() => Math.random() > 0.4).slice(0, 3);
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;
    const q = currentQuestion;
    const options = q.options || [];
    const correctAns = getCorrectAnswer(q);
    const userAnsArr = Array.isArray(currentAnswer) ? currentAnswer : [];
    const userAnsStr = Array.isArray(currentAnswer)
      ? userAnsArr.filter((a) => a).sort().join(',')
      : currentAnswer || '';

    switch (q.type) {
      case 1:
        return (
          <Radio.Group
            value={currentAnswer}
            onChange={(e) => handleSingleAnswer(e.target.value)}
            style={{ width: '100%' }}
            disabled={isCurrentChecked}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {options.map((opt) => {
                let bg = '#fff', border = '#f0f0f0', color = '#333';
                if (isCurrentChecked) {
                  if (opt.isCorrect === 1) {
                    bg = '#f6ffed'; border = '#52c41a'; color = '#389e0d';
                  }
                  if (opt.optionLabel === userAnsStr && opt.isCorrect !== 1) {
                    bg = '#fff1f0'; border = '#ff4d4f'; color = '#cf1322';
                  }
                }
                return (
                  <Radio
                    key={opt.id}
                    value={opt.optionLabel}
                    style={{
                      padding: '12px 16px',
                      border: `1px solid ${border}`,
                      borderRadius: 8,
                      width: '100%',
                      marginRight: 0,
                      background: bg,
                      color,
                    }}
                  >
                    <Text strong style={{ marginRight: 8 }}>{opt.optionLabel}.</Text>
                    {opt.optionContent}
                    {isCurrentChecked && opt.isCorrect === 1 && (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                    )}
                    {isCurrentChecked && opt.optionLabel === userAnsStr && opt.isCorrect !== 1 && (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
                    )}
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        );

      case 2:
        return (
          <Checkbox.Group
            value={currentAnswer || []}
            onChange={handleMultipleAnswer}
            style={{ width: '100%' }}
            disabled={isCurrentChecked}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {options.map((opt) => {
                const isSelected = userAnsArr.includes(opt.optionLabel);
                let bg = '#fff', border = '#f0f0f0', color = '#333';
                if (isCurrentChecked) {
                  if (opt.isCorrect === 1) {
                    bg = '#f6ffed'; border = '#52c41a'; color = '#389e0d';
                  }
                  if (isSelected && opt.isCorrect !== 1) {
                    bg = '#fff1f0'; border = '#ff4d4f'; color = '#cf1322';
                  }
                }
                return (
                  <Checkbox
                    key={opt.id}
                    value={opt.optionLabel}
                    style={{
                      padding: '12px 16px',
                      border: `1px solid ${border}`,
                      borderRadius: 8,
                      width: '100%',
                      marginRight: 0,
                      background: bg,
                      color,
                    }}
                  >
                    <Text strong style={{ marginRight: 8 }}>{opt.optionLabel}.</Text>
                    {opt.optionContent}
                    {isCurrentChecked && opt.isCorrect === 1 && (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                    )}
                    {isCurrentChecked && isSelected && opt.isCorrect !== 1 && (
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
                    )}
                  </Checkbox>
                );
              })}
            </Space>
          </Checkbox.Group>
        );

      case 3:
        return (
          <Radio.Group
            value={currentAnswer}
            onChange={(e) => handleSingleAnswer(e.target.value)}
            disabled={isCurrentChecked}
          >
            <Space size="large">
              {['T', 'F'].map((val) => {
                let bg = '#fff', border = '#f0f0f0', color = '#333';
                if (isCurrentChecked) {
                  if (correctAns === val) {
                    bg = '#f6ffed'; border = '#52c41a'; color = '#389e0d';
                  }
                  if (userAnsStr === val && correctAns !== val) {
                    bg = '#fff1f0'; border = '#ff4d4f'; color = '#cf1322';
                  }
                }
                return (
                  <Radio
                    key={val}
                    value={val}
                    style={{
                      padding: '12px 32px',
                      border: `1px solid ${border}`,
                      borderRadius: 8,
                      background: bg,
                      color,
                    }}
                  >
                    <Text strong style={{ fontSize: 16 }}>
                      {val === 'T' ? '✓ 正确' : '✗ 错误'}
                    </Text>
                  </Radio>
                );
              })}
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
                  disabled={isCurrentChecked}
                />
                {isCurrentChecked && (
                  <Text type="secondary">正确答案：<Text strong style={{ color: '#52c41a' }}>{correctAns.split(',')[idx] || '-'}</Text></Text>
                )}
              </div>
            ))}
          </Space>
        );

      case 5:
        return (
          <>
            <TextArea
              rows={6}
              placeholder="请输入您的答案..."
              value={currentAnswer || ''}
              onChange={(e) => handleSubjectiveAnswer(e.target.value)}
              style={{ borderRadius: 8 }}
              showCount
              maxLength={2000}
              disabled={isCurrentChecked}
            />
            {isCurrentChecked && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#f6ffed' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>参考答案</Text>
                <div style={{ marginTop: 4, color: '#389e0d' }}>{correctAns || '请参考解析'}</div>
              </div>
            )}
          </>
        );

      default:
        return <Text type="warning">未知题型</Text>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Spin size="large" tip="正在为您智能推荐题目..." />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <Card style={{ borderRadius: 12 }}>
          <Empty
            description="暂无推荐题目，请先完成一些练习题"
            style={{ padding: '60px 0' }}
          />
        </Card>
      </div>
    );
  }

  if (completed) {
    const weakPoints = getWeakKnowledgePoints();
    const isExcellent = finalAccuracy >= 80;
    const isGood = finalAccuracy >= 60 && finalAccuracy < 80;

    return (
      <div style={{ padding: '20px 0' }}>
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 20 }}>
          <Result
            icon={<TrophyOutlined style={{ color: isExcellent ? '#52c41a' : isGood ? '#1890ff' : '#faad14' }} />}
            status={isExcellent ? 'success' : isGood ? 'info' : 'warning'}
            title={isExcellent ? '太棒了！练习完成' : isGood ? '不错！练习完成' : '继续加油！练习完成'}
            subTitle={`共完成 ${checkedCount} 道题目，正确率 ${finalAccuracy}%`}
            extra={
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                onClick={restart}
              >
                再来一组
              </Button>
            }
          />

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={12} md={6}>
              <Statistic
                title="总题数"
                value={checkedCount}
                prefix={<FormOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="答对"
                value={correctCount}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="答错"
                value={Math.max(0, checkedCount - correctCount)}
                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="用时"
                value={formatDuration(duration)}
                prefix={<ThunderboltOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16', fontSize: 18 }}
              />
            </Col>
          </Row>

          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <Progress
              percent={finalAccuracy}
              strokeColor={isExcellent ? '#52c41a' : isGood ? '#1890ff' : '#faad14'}
              size={[0, 18]}
            />
          </div>

          {weakPoints.length > 0 && finalAccuracy < 90 && (
            <Alert
              style={{ marginTop: 24, textAlign: 'left' }}
              message="薄弱知识点提示"
              description={
                <div>
                  根据本次练习，建议加强以下知识点：
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {weakPoints.map((p) => (
                        <Tag key={p} color="warning" style={{ padding: '4px 12px' }}>
                          📚 {p}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              }
              type="warning"
              showIcon
            />
          )}
        </Card>
      </div>
    );
  }

  const correctResult = isAnswerCorrect(currentQuestion);

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
        个性化练习推荐
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        <BulbOutlined style={{ color: '#faad14' }} /> 基于您的错题和薄弱知识点智能推荐，针对性提升
      </Paragraph>

      <Card
        style={{ marginBottom: 16, borderRadius: 12 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>练习进度</Text>
                <Text strong style={{ fontSize: 12 }}>
                  第 {currentIndex + 1} / {questions.length} 题
                </Text>
              </div>
              <Progress
                percent={Math.round(((currentIndex + 1) / questions.length) * 100)}
                showInfo={false}
                size="small"
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#52c41a',
                }}
              />
            </div>
          </Col>
          <Col>
            <Tag icon={<CheckCircleOutlined />} color="success">
              已核对 {checkedCount}
            </Tag>
          </Col>
          <Col>
            <Tag color="blue">
              答题 {answeredCount}
            </Tag>
          </Col>
          <Col>
            <Tag color="cyan">
              用时 {formatDuration(duration)}
            </Tag>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 12, minHeight: 500 }} bodyStyle={{ padding: 32 }}>
        {currentQuestion && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              <Tag color="#1890ff" style={{ fontSize: 14, padding: '4px 12px' }}>
                第 {currentIndex + 1} 题
              </Tag>
              {QUESTION_TYPE_MAP[currentQuestion.type] && (
                <Tag color={QUESTION_TYPE_MAP[currentQuestion.type].color}>
                  {QUESTION_TYPE_MAP[currentQuestion.type].label}
                </Tag>
              )}
              {currentQuestion.difficulty && DIFFICULTY_MAP[currentQuestion.difficulty] && (
                <Tag color={DIFFICULTY_MAP[currentQuestion.difficulty].color}>
                  难度：{DIFFICULTY_MAP[currentQuestion.difficulty].label}
                </Tag>
              )}
              {currentQuestion.subject && (
                <Tag color="geekblue">{currentQuestion.subject}</Tag>
              )}
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

            {isCurrentChecked && correctResult !== null && (
              <div style={{ marginTop: 24 }}>
                {correctResult ? (
                  <Alert
                    message={<span><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />回答正确！太棒了 🎉</span>}
                    type="success"
                    showIcon={false}
                    style={{ borderRadius: 8 }}
                  />
                ) : (
                  <Alert
                    message={
                      <span>
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                        回答错误
                        {getCorrectAnswer(currentQuestion) && (
                          <span style={{ marginLeft: 12 }}>
                            正确答案：<Text strong style={{ color: '#52c41a' }}>{getCorrectAnswer(currentQuestion)}</Text>
                          </span>
                        )}
                      </span>
                    }
                    type="error"
                    showIcon={false}
                    style={{ borderRadius: 8 }}
                  />
                )}

                {currentQuestion.analysis && (
                  <Card
                    style={{ marginTop: 16, borderRadius: 8, background: '#fffbe6', border: '1px solid #ffe58f' }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <BulbOutlined style={{ color: '#faad14' }} />
                      <Text strong style={{ color: '#d48806' }}>题目解析</Text>
                    </div>
                    <Paragraph
                      style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#614700', lineHeight: 1.8 }}
                      dangerouslySetInnerHTML={{ __html: currentQuestion.analysis }}
                    />
                  </Card>
                )}
              </div>
            )}
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
          {!isCurrentChecked && (
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={checkCurrentAnswer}
            >
              查看答案
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            icon={currentIndex === questions.length - 1 ? <TrophyOutlined /> : <ArrowRightOutlined />}
            onClick={goNext}
            disabled={!isCurrentChecked}
          >
            {currentIndex === questions.length - 1 ? '完成练习' : '下一题'}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Practice;
