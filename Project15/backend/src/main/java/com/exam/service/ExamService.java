package com.exam.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.exam.common.PageResult;
import com.exam.dto.ExamCreateDTO;
import com.exam.dto.ExamSubmitDTO;
import com.exam.dto.SubmitAnswerDTO;
import com.exam.entity.*;
import com.exam.exception.BusinessException;
import com.exam.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamMapper examMapper;
    private final ExamStudentMapper examStudentMapper;
    private final PaperMapper paperMapper;
    private final PaperQuestionMapper paperQuestionMapper;
    private final AnswerRecordMapper answerRecordMapper;
    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;
    private final PaperService paperService;
    private final WrongBookService wrongBookService;
    private final StudyProgressService studyProgressService;
    private final GradingService gradingService;

    @Transactional
    public Exam createExam(ExamCreateDTO dto, Long teacherId) {
        Paper paper = paperMapper.selectById(dto.getPaperId());
        if (paper == null) {
            throw new BusinessException("试卷不存在");
        }
        if (paper.getStatus() != 1) {
            throw new BusinessException("试卷未发布，无法创建考试");
        }

        Exam exam = new Exam();
        exam.setPaperId(dto.getPaperId());
        exam.setTitle(dto.getTitle());
        exam.setDescription(dto.getDescription());
        exam.setStartTime(dto.getStartTime());
        exam.setEndTime(dto.getEndTime());
        exam.setDuration(paper.getDuration());
        exam.setStatus(0);
        exam.setCreateBy(teacherId);
        examMapper.insert(exam);

        List<Long> studentIds = dto.getStudentIds();
        if (studentIds != null && !studentIds.isEmpty()) {
            for (Long studentId : studentIds) {
                ExamStudent examStudent = new ExamStudent();
                examStudent.setExamId(exam.getId());
                examStudent.setUserId(studentId);
                examStudent.setStatus(0);
                examStudent.setTotalScore(0.0);
                examStudent.setAutoScore(0.0);
                examStudent.setManualScore(0.0);
                examStudentMapper.insert(examStudent);
            }
        }

        return exam;
    }

    public PageResult<Exam> getExamList(Integer role, Long userId, Integer pageNum, Integer pageSize) {
        Page<Exam> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Exam> wrapper = new LambdaQueryWrapper<>();

        if (role != null && role == 2) {
            LambdaQueryWrapper<ExamStudent> esWrapper = new LambdaQueryWrapper<>();
            esWrapper.eq(ExamStudent::getUserId, userId);
            List<ExamStudent> examStudents = examStudentMapper.selectList(esWrapper);
            List<Long> examIds = examStudents.stream()
                    .map(ExamStudent::getExamId)
                    .collect(Collectors.toList());
            if (!examIds.isEmpty()) {
                wrapper.in(Exam::getId, examIds);
            } else {
                return PageResult.of(Collections.emptyList(), 0L, pageNum, pageSize);
            }
        }

        wrapper.orderByDesc(Exam::getCreateTime);
        Page<Exam> result = examMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), pageNum, pageSize);
    }

    public Map<String, Object> getExamDetail(Long id) {
        Exam exam = examMapper.selectById(id);
        if (exam == null) {
            throw new BusinessException("考试不存在");
        }

        Paper paper = paperMapper.selectById(exam.getPaperId());

        Map<String, Object> result = new HashMap<>();
        result.put("exam", exam);
        result.put("paper", paper);
        return result;
    }

    @Transactional
    public Map<String, Object> startExam(Long examId, Long studentId) {
        Exam exam = examMapper.selectById(examId);
        if (exam == null) {
            throw new BusinessException("考试不存在");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(exam.getStartTime())) {
            throw new BusinessException("考试尚未开始");
        }
        if (now.isAfter(exam.getEndTime())) {
            throw new BusinessException("考试已结束");
        }

        LambdaQueryWrapper<ExamStudent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExamStudent::getExamId, examId);
        wrapper.eq(ExamStudent::getUserId, studentId);
        ExamStudent examStudent = examStudentMapper.selectOne(wrapper);

        if (examStudent == null) {
            throw new BusinessException("您没有参加该考试的权限");
        }

        if (examStudent.getStatus() >= 2) {
            throw new BusinessException("您已提交过该考试");
        }

        if (examStudent.getStatus() == 0) {
            examStudent.setStatus(1);
            examStudent.setStartTime(now);
            examStudentMapper.updateById(examStudent);
        }

        List<Map<String, Object>> questions = paperService.getPaperQuestions(exam.getPaperId());
        List<Map<String, Object>> maskedQuestions = questions.stream()
                .map(q -> {
                    Map<String, Object> mq = new HashMap<>(q);
                    List<QuestionOption> options = (List<QuestionOption>) mq.get("options");
                    if (options != null) {
                        List<Map<String, Object>> maskedOptions = options.stream()
                                .map(opt -> {
                                    Map<String, Object> mo = new HashMap<>();
                                    mo.put("id", opt.getId());
                                    mo.put("questionId", opt.getQuestionId());
                                    mo.put("optionLabel", opt.getOptionLabel());
                                    mo.put("optionContent", opt.getOptionContent());
                                    return mo;
                                })
                                .collect(Collectors.toList());
                        mq.put("options", maskedOptions);
                    }
                    mq.remove("analysis");
                    return mq;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("examStudentId", examStudent.getId());
        result.put("exam", exam);
        result.put("questions", maskedQuestions);
        return result;
    }

    @Transactional
    public Map<String, Object> submitExam(ExamSubmitDTO dto, Long studentId) {
        ExamStudent examStudent = examStudentMapper.selectById(dto.getExamStudentId());
        if (examStudent == null) {
            throw new BusinessException("考试记录不存在");
        }

        if (!examStudent.getUserId().equals(studentId)) {
            throw new BusinessException("无权提交他人的考试");
        }

        if (examStudent.getStatus() >= 2) {
            throw new BusinessException("考试已提交，请勿重复提交");
        }

        Exam exam = examMapper.selectById(examStudent.getExamId());
        if (exam == null) {
            throw new BusinessException("考试不存在");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(exam.getEndTime())) {
            throw new BusinessException("考试时间已结束");
        }

        LambdaQueryWrapper<PaperQuestion> pqWrapper = new LambdaQueryWrapper<>();
        pqWrapper.eq(PaperQuestion::getPaperId, exam.getPaperId());
        List<PaperQuestion> paperQuestions = paperQuestionMapper.selectList(pqWrapper);
        Map<Long, Double> questionScoreMap = paperQuestions.stream()
                .collect(Collectors.toMap(PaperQuestion::getQuestionId, PaperQuestion::getScore));

        List<SubmitAnswerDTO> answers = dto.getAnswers();
        if (answers == null) {
            answers = Collections.emptyList();
        }
        Map<Long, String> answerMap = answers.stream()
                .collect(Collectors.toMap(SubmitAnswerDTO::getQuestionId, SubmitAnswerDTO::getUserAnswer, (a, b) -> a));

        double totalAutoScore = 0;
        int correctCount = 0;
        int wrongCount = 0;

        for (PaperQuestion pq : paperQuestions) {
            Long questionId = pq.getQuestionId();
            Double qScore = questionScoreMap.getOrDefault(questionId, 0.0);
            String userAnswer = answerMap.get(questionId);

            AnswerRecord record = new AnswerRecord();
            record.setExamStudentId(examStudent.getId());
            record.setQuestionId(questionId);
            record.setUserAnswer(userAnswer);
            record.setIsCorrect(0);
            record.setScore(0.0);
            record.setAutoScore(0.0);
            record.setManualScore(0.0);

            gradingService.autoGrade(record, qScore);
            answerRecordMapper.insert(record);

            if (record.getAutoScore() != null) {
                totalAutoScore += record.getAutoScore();
            }

            if (record.getIsCorrect() != null && record.getIsCorrect() == 1) {
                correctCount++;
            } else {
                wrongCount++;
                wrongBookService.addWrongQuestion(studentId, questionId);
            }

            boolean isCorrect = record.getIsCorrect() != null && record.getIsCorrect() == 1;
            studyProgressService.updateProgress(studentId, questionId, isCorrect);
        }

        examStudent.setAutoScore(totalAutoScore);
        examStudent.setTotalScore(totalAutoScore);
        examStudent.setStatus(2);
        examStudent.setSubmitTime(now);
        examStudentMapper.updateById(examStudent);

        Map<String, Object> result = new HashMap<>();
        result.put("examStudentId", examStudent.getId());
        result.put("autoScore", totalAutoScore);
        result.put("totalScore", totalAutoScore);
        result.put("correctCount", correctCount);
        result.put("wrongCount", wrongCount);
        result.put("totalQuestions", paperQuestions.size());
        return result;
    }

    public Map<String, Object> getExamResult(Long examStudentId) {
        ExamStudent examStudent = examStudentMapper.selectById(examStudentId);
        if (examStudent == null) {
            throw new BusinessException("考试记录不存在");
        }

        Exam exam = examMapper.selectById(examStudent.getExamId());
        Paper paper = paperMapper.selectById(exam.getPaperId());

        LambdaQueryWrapper<AnswerRecord> arWrapper = new LambdaQueryWrapper<>();
        arWrapper.eq(AnswerRecord::getExamStudentId, examStudentId);
        List<AnswerRecord> answerRecords = answerRecordMapper.selectList(arWrapper);
        Map<Long, AnswerRecord> recordMap = answerRecords.stream()
                .collect(Collectors.toMap(AnswerRecord::getQuestionId, r -> r));

        LambdaQueryWrapper<PaperQuestion> pqWrapper = new LambdaQueryWrapper<>();
        pqWrapper.eq(PaperQuestion::getPaperId, exam.getPaperId());
        pqWrapper.orderByAsc(PaperQuestion::getQuestionOrder);
        List<PaperQuestion> paperQuestions = paperQuestionMapper.selectList(pqWrapper);

        List<Map<String, Object>> questionDetails = new ArrayList<>();
        for (PaperQuestion pq : paperQuestions) {
            Question question = questionMapper.selectById(pq.getQuestionId());
            if (question == null) continue;

            LambdaQueryWrapper<QuestionOption> optWrapper = new LambdaQueryWrapper<>();
            optWrapper.eq(QuestionOption::getQuestionId, question.getId());
            List<QuestionOption> options = questionOptionMapper.selectList(optWrapper);

            AnswerRecord record = recordMap.get(question.getId());

            Map<String, Object> qDetail = new HashMap<>();
            qDetail.put("question", question);
            qDetail.put("options", options);
            qDetail.put("questionScore", pq.getScore());
            qDetail.put("questionOrder", pq.getQuestionOrder());
            if (record != null) {
                qDetail.put("userAnswer", record.getUserAnswer());
                qDetail.put("isCorrect", record.getIsCorrect());
                qDetail.put("score", record.getScore());
                qDetail.put("autoScore", record.getAutoScore());
                qDetail.put("manualScore", record.getManualScore());
            } else {
                qDetail.put("userAnswer", null);
                qDetail.put("isCorrect", 0);
                qDetail.put("score", 0.0);
                qDetail.put("autoScore", 0.0);
                qDetail.put("manualScore", 0.0);
            }
            questionDetails.add(qDetail);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("examStudent", examStudent);
        result.put("exam", exam);
        result.put("paper", paper);
        result.put("questionDetails", questionDetails);
        return result;
    }

    public List<Map<String, Object>> getExamStudentList(Long examId) {
        LambdaQueryWrapper<ExamStudent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExamStudent::getExamId, examId);
        wrapper.orderByDesc(ExamStudent::getTotalScore);
        List<ExamStudent> examStudents = examStudentMapper.selectList(wrapper);

        return examStudents.stream()
                .map(es -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", es.getId());
                    m.put("examId", es.getExamId());
                    m.put("userId", es.getUserId());
                    m.put("status", es.getStatus());
                    m.put("startTime", es.getStartTime());
                    m.put("submitTime", es.getSubmitTime());
                    m.put("totalScore", es.getTotalScore());
                    m.put("autoScore", es.getAutoScore());
                    m.put("manualScore", es.getManualScore());
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Scheduled(fixedRate = 60000)
    public void updateExamStatus() {
        LocalDateTime now = LocalDateTime.now();

        LambdaQueryWrapper<Exam> startWrapper = new LambdaQueryWrapper<>();
        startWrapper.eq(Exam::getStatus, 0);
        startWrapper.le(Exam::getStartTime, now);
        startWrapper.ge(Exam::getEndTime, now);
        List<Exam> toStart = examMapper.selectList(startWrapper);
        for (Exam exam : toStart) {
            exam.setStatus(1);
            examMapper.updateById(exam);
        }

        LambdaQueryWrapper<Exam> endWrapper = new LambdaQueryWrapper<>();
        endWrapper.eq(Exam::getStatus, 1);
        endWrapper.lt(Exam::getEndTime, now);
        List<Exam> toEnd = examMapper.selectList(endWrapper);
        for (Exam exam : toEnd) {
            exam.setStatus(2);
            examMapper.updateById(exam);

            LambdaQueryWrapper<ExamStudent> esWrapper = new LambdaQueryWrapper<>();
            esWrapper.eq(ExamStudent::getExamId, exam.getId());
            esWrapper.in(ExamStudent::getStatus, 0, 1);
            List<ExamStudent> unsubmitted = examStudentMapper.selectList(esWrapper);
            for (ExamStudent es : unsubmitted) {
                es.setStatus(3);
                es.setSubmitTime(now);
                es.setTotalScore(0.0);
                es.setAutoScore(0.0);
                examStudentMapper.updateById(es);
            }
        }
    }
}
