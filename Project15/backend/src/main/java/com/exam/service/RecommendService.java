package com.exam.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.exam.entity.*;
import com.exam.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendService {

    @Autowired
    private WrongBookMapper wrongBookMapper;

    @Autowired
    private StudyProgressMapper studyProgressMapper;

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private QuestionKnowledgeMapper questionKnowledgeMapper;

    @Autowired
    private AnswerRecordMapper answerRecordMapper;

    @Autowired
    private ExamStudentMapper examStudentMapper;

    public List<Question> getRecommendList(Long userId, Integer limit) {
        int recLimit = limit == null || limit <= 0 ? 10 : limit;
        Map<Long, Double> scoreMap = new HashMap<>();

        addWrongBookCandidates(userId, scoreMap);
        addLowAccuracyKnowledgeCandidates(userId, scoreMap);
        addRecentExamWrongCandidates(userId, scoreMap);

        List<Map.Entry<Long, Double>> sortedEntries = new ArrayList<>(scoreMap.entrySet());
        sortedEntries.sort((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()));

        List<Long> recommendIds = new ArrayList<>();
        for (Map.Entry<Long, Double> entry : sortedEntries) {
            recommendIds.add(entry.getKey());
            if (recommendIds.size() >= recLimit) {
                break;
            }
        }

        if (recommendIds.size() < recLimit) {
            fillWithRandomQuestions(userId, recommendIds, recLimit);
        }

        List<Question> result = new ArrayList<>();
        if (!recommendIds.isEmpty()) {
            LambdaQueryWrapper<Question> qWrapper = new LambdaQueryWrapper<>();
            qWrapper.in(Question::getId, recommendIds);
            List<Question> questions = questionMapper.selectList(qWrapper);
            Map<Long, Question> qMap = questions.stream()
                    .collect(Collectors.toMap(Question::getId, q -> q));
            for (Long id : recommendIds) {
                Question q = qMap.get(id);
                if (q != null) {
                    result.add(q);
                }
            }
        }

        return result;
    }

    private void addWrongBookCandidates(Long userId, Map<Long, Double> scoreMap) {
        LambdaQueryWrapper<WrongBook> wbWrapper = new LambdaQueryWrapper<>();
        wbWrapper.eq(WrongBook::getUserId, userId)
                .eq(WrongBook::getMasterStatus, 0)
                .orderByDesc(WrongBook::getWrongCount);
        List<WrongBook> wrongBooks = wrongBookMapper.selectList(wbWrapper);

        if (wrongBooks == null || wrongBooks.isEmpty()) {
            return;
        }

        int maxWrongCount = wrongBooks.stream()
                .mapToInt(wb -> wb.getWrongCount() == null ? 1 : wb.getWrongCount())
                .max()
                .orElse(1);

        for (WrongBook wb : wrongBooks) {
            int wc = wb.getWrongCount() == null ? 1 : wb.getWrongCount();
            double normalized = maxWrongCount > 0 ? (double) wc / maxWrongCount : 0.5;
            double score = normalized * 50.0;
            BigDecimal bd = BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
            scoreMap.merge(wb.getQuestionId(), bd.doubleValue(), Double::sum);
        }
    }

    private void addLowAccuracyKnowledgeCandidates(Long userId, Map<Long, Double> scoreMap) {
        LambdaQueryWrapper<StudyProgress> spWrapper = new LambdaQueryWrapper<>();
        spWrapper.eq(StudyProgress::getUserId, userId)
                .lt(StudyProgress::getAccuracy, 60.0);
        List<StudyProgress> lowAccuracyList = studyProgressMapper.selectList(spWrapper);

        if (lowAccuracyList == null || lowAccuracyList.isEmpty()) {
            return;
        }

        List<Long> lowKnowledgeIds = lowAccuracyList.stream()
                .map(StudyProgress::getKnowledgeId)
                .collect(Collectors.toList());

        Map<Long, Double> accuracyGapMap = new HashMap<>();
        for (StudyProgress sp : lowAccuracyList) {
            double accuracy = sp.getAccuracy() == null ? 0.0 : sp.getAccuracy();
            double gap = (60.0 - accuracy) / 60.0;
            accuracyGapMap.put(sp.getKnowledgeId(), gap);
        }

        LambdaQueryWrapper<QuestionKnowledge> qkWrapper = new LambdaQueryWrapper<>();
        qkWrapper.in(QuestionKnowledge::getKnowledgeId, lowKnowledgeIds);
        List<QuestionKnowledge> qkList = questionKnowledgeMapper.selectList(qkWrapper);

        if (qkList == null || qkList.isEmpty()) {
            return;
        }

        double maxGap = accuracyGapMap.values().stream()
                .mapToDouble(Double::doubleValue)
                .max()
                .orElse(1.0);
        if (maxGap == 0) maxGap = 1.0;

        Map<Long, Set<Long>> questionKnowledgeMap = new HashMap<>();
        for (QuestionKnowledge qk : qkList) {
            questionKnowledgeMap
                    .computeIfAbsent(qk.getQuestionId(), k -> new HashSet<>())
                    .add(qk.getKnowledgeId());
        }

        for (Map.Entry<Long, Set<Long>> entry : questionKnowledgeMap.entrySet()) {
            Long questionId = entry.getKey();
            Set<Long> kIds = entry.getValue();
            double totalGap = 0.0;
            for (Long kid : kIds) {
                Double gap = accuracyGapMap.get(kid);
                if (gap != null) {
                    totalGap += gap;
                }
            }
            double normalized = kIds.size() > 0 ? (totalGap / kIds.size()) / maxGap : 0.3;
            double score = normalized * 30.0;
            BigDecimal bd = BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
            scoreMap.merge(questionId, bd.doubleValue(), Double::sum);
        }
    }

    private void addRecentExamWrongCandidates(Long userId, Map<Long, Double> scoreMap) {
        LambdaQueryWrapper<ExamStudent> esWrapper = new LambdaQueryWrapper<>();
        esWrapper.eq(ExamStudent::getUserId, userId)
                .isNotNull(ExamStudent::getSubmitTime)
                .orderByDesc(ExamStudent::getSubmitTime)
                .last("LIMIT 5");
        List<ExamStudent> recentExams = examStudentMapper.selectList(esWrapper);

        if (recentExams == null || recentExams.isEmpty()) {
            return;
        }

        List<Long> examStudentIds = recentExams.stream()
                .map(ExamStudent::getId)
                .collect(Collectors.toList());

        LambdaQueryWrapper<AnswerRecord> arWrapper = new LambdaQueryWrapper<>();
        arWrapper.in(AnswerRecord::getExamStudentId, examStudentIds)
                .eq(AnswerRecord::getIsCorrect, 0);
        List<AnswerRecord> wrongRecords = answerRecordMapper.selectList(arWrapper);

        if (wrongRecords == null || wrongRecords.isEmpty()) {
            return;
        }

        List<Long> wrongQuestionIds = wrongRecords.stream()
                .map(AnswerRecord::getQuestionId)
                .distinct()
                .collect(Collectors.toList());

        LambdaQueryWrapper<QuestionKnowledge> qkWrapper = new LambdaQueryWrapper<>();
        qkWrapper.in(QuestionKnowledge::getQuestionId, wrongQuestionIds);
        List<QuestionKnowledge> qkList = questionKnowledgeMapper.selectList(qkWrapper);

        Set<Long> relatedKnowledgeIds = qkList.stream()
                .map(QuestionKnowledge::getKnowledgeId)
                .collect(Collectors.toSet());

        if (relatedKnowledgeIds.isEmpty()) {
            return;
        }

        LambdaQueryWrapper<QuestionKnowledge> relatedQkWrapper = new LambdaQueryWrapper<>();
        relatedQkWrapper.in(QuestionKnowledge::getKnowledgeId, relatedKnowledgeIds);
        List<QuestionKnowledge> relatedQkList = questionKnowledgeMapper.selectList(relatedQkWrapper);

        if (relatedQkList == null || relatedQkList.isEmpty()) {
            return;
        }

        Map<Long, Long> knowledgeCountMap = qkList.stream()
                .collect(Collectors.groupingBy(
                        QuestionKnowledge::getKnowledgeId,
                        Collectors.counting()
                ));

        long maxCount = knowledgeCountMap.values().stream()
                .mapToLong(Long::longValue)
                .max()
                .orElse(1L);
        if (maxCount == 0) maxCount = 1L;

        Map<Long, Set<Long>> questionRelatedKnowledgeMap = new HashMap<>();
        for (QuestionKnowledge qk : relatedQkList) {
            questionRelatedKnowledgeMap
                    .computeIfAbsent(qk.getQuestionId(), k -> new HashSet<>())
                    .add(qk.getKnowledgeId());
        }

        final long finalMaxCount = maxCount;
        for (Map.Entry<Long, Set<Long>> entry : questionRelatedKnowledgeMap.entrySet()) {
            Long questionId = entry.getKey();
            Set<Long> kIds = entry.getValue();
            double totalWeight = 0.0;
            for (Long kid : kIds) {
                Long count = knowledgeCountMap.get(kid);
                if (count != null) {
                    totalWeight += (double) count / finalMaxCount;
                }
            }
            double normalized = kIds.size() > 0 ? (totalWeight / kIds.size()) : 0.2;
            double score = normalized * 20.0;
            BigDecimal bd = BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
            scoreMap.merge(questionId, bd.doubleValue(), Double::sum);
        }
    }

    private void fillWithRandomQuestions(Long userId, List<Long> recommendIds, int limit) {
        Set<Long> existingIds = new HashSet<>(recommendIds);
        LambdaQueryWrapper<Question> qWrapper = new LambdaQueryWrapper<>();
        qWrapper.orderByAsc(Question::getId);
        List<Question> allQuestions = questionMapper.selectList(qWrapper);

        if (allQuestions == null || allQuestions.isEmpty()) {
            return;
        }

        List<Question> shuffled = new ArrayList<>(allQuestions);
        Collections.shuffle(shuffled, new Random(LocalDateTime.now().getNano()));

        for (Question q : shuffled) {
            if (!existingIds.contains(q.getId())) {
                recommendIds.add(q.getId());
                existingIds.add(q.getId());
                if (recommendIds.size() >= limit) {
                    break;
                }
            }
        }
    }
}
