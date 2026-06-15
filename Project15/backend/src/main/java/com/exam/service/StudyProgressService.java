package com.exam.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.exam.entity.KnowledgePoint;
import com.exam.entity.QuestionKnowledge;
import com.exam.entity.StudyProgress;
import com.exam.entity.WrongBook;
import com.exam.mapper.KnowledgePointMapper;
import com.exam.mapper.QuestionKnowledgeMapper;
import com.exam.mapper.StudyProgressMapper;
import com.exam.mapper.WrongBookMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudyProgressService {

    @Autowired
    private StudyProgressMapper studyProgressMapper;

    @Autowired
    private QuestionKnowledgeMapper questionKnowledgeMapper;

    @Autowired
    private KnowledgePointMapper knowledgePointMapper;

    @Autowired
    private WrongBookMapper wrongBookMapper;

    @Transactional
    public void updateProgress(Long userId, Long questionId, boolean isCorrect) {
        LambdaQueryWrapper<QuestionKnowledge> qkWrapper = new LambdaQueryWrapper<>();
        qkWrapper.eq(QuestionKnowledge::getQuestionId, questionId);
        List<QuestionKnowledge> qkList = questionKnowledgeMapper.selectList(qkWrapper);

        if (qkList == null || qkList.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        for (QuestionKnowledge qk : qkList) {
            Long knowledgeId = qk.getKnowledgeId();

            LambdaQueryWrapper<StudyProgress> spWrapper = new LambdaQueryWrapper<>();
            spWrapper.eq(StudyProgress::getUserId, userId)
                    .eq(StudyProgress::getKnowledgeId, knowledgeId);
            StudyProgress exist = studyProgressMapper.selectOne(spWrapper);

            if (exist != null) {
                exist.setTotalQuestions(exist.getTotalQuestions() + 1);
                if (isCorrect) {
                    exist.setCorrectCount(exist.getCorrectCount() + 1);
                }
                double accuracy = exist.getTotalQuestions() > 0
                        ? (double) exist.getCorrectCount() / exist.getTotalQuestions() * 100
                        : 0.0;
                exist.setAccuracy(BigDecimal.valueOf(accuracy).setScale(2, RoundingMode.HALF_UP).doubleValue());
                exist.setLastPracticeTime(now);
                studyProgressMapper.updateById(exist);
            } else {
                StudyProgress sp = new StudyProgress();
                sp.setUserId(userId);
                sp.setKnowledgeId(knowledgeId);
                sp.setTotalQuestions(1);
                sp.setCorrectCount(isCorrect ? 1 : 0);
                double accuracy = isCorrect ? 100.0 : 0.0;
                sp.setAccuracy(accuracy);
                sp.setLastPracticeTime(now);
                studyProgressMapper.insert(sp);
            }
        }
    }

    public List<Map<String, Object>> getKnowledgeAnalysis(Long userId) {
        LambdaQueryWrapper<StudyProgress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StudyProgress::getUserId, userId);
        List<StudyProgress> progressList = studyProgressMapper.selectList(wrapper);

        if (progressList == null || progressList.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> knowledgeIds = progressList.stream()
                .map(StudyProgress::getKnowledgeId)
                .collect(Collectors.toList());

        Map<Long, KnowledgePoint> kpMap = new HashMap<>();
        if (!knowledgeIds.isEmpty()) {
            LambdaQueryWrapper<KnowledgePoint> kpWrapper = new LambdaQueryWrapper<>();
            kpWrapper.in(KnowledgePoint::getId, knowledgeIds);
            List<KnowledgePoint> kpList = knowledgePointMapper.selectList(kpWrapper);
            kpMap = kpList.stream()
                    .collect(Collectors.toMap(KnowledgePoint::getId, k -> k));
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (StudyProgress sp : progressList) {
            KnowledgePoint kp = kpMap.get(sp.getKnowledgeId());
            Map<String, Object> item = new HashMap<>();
            item.put("knowledgeId", sp.getKnowledgeId());
            item.put("knowledgeName", kp != null ? kp.getName() : "未知知识点");
            item.put("totalQuestions", sp.getTotalQuestions());
            item.put("correctCount", sp.getCorrectCount());
            item.put("accuracy", sp.getAccuracy());

            String masterLevel;
            Double accuracy = sp.getAccuracy() == null ? 0.0 : sp.getAccuracy();
            if (accuracy < 40.0) {
                masterLevel = "未掌握";
            } else if (accuracy < 70.0) {
                masterLevel = "一般";
            } else if (accuracy < 90.0) {
                masterLevel = "良好";
            } else {
                masterLevel = "优秀";
            }
            item.put("masterLevel", masterLevel);
            result.add(item);
        }

        return result;
    }

    public Map<String, Object> getStudyDashboard(Long userId) {
        Map<String, Object> result = new HashMap<>();

        LambdaQueryWrapper<StudyProgress> spWrapper = new LambdaQueryWrapper<>();
        spWrapper.eq(StudyProgress::getUserId, userId);
        List<StudyProgress> progressList = studyProgressMapper.selectList(spWrapper);

        int totalQuestions = 0;
        int totalCorrect = 0;
        int masteredCount = 0;
        Set<Long> practicedKnowledgeIds = new HashSet<>();

        if (progressList != null && !progressList.isEmpty()) {
            for (StudyProgress sp : progressList) {
                totalQuestions += sp.getTotalQuestions() == null ? 0 : sp.getTotalQuestions();
                totalCorrect += sp.getCorrectCount() == null ? 0 : sp.getCorrectCount();
                practicedKnowledgeIds.add(sp.getKnowledgeId());
                Double accuracy = sp.getAccuracy() == null ? 0.0 : sp.getAccuracy();
                if (accuracy >= 90.0) {
                    masteredCount++;
                }
            }
        }

        double overallAccuracy = totalQuestions > 0
                ? (double) totalCorrect / totalQuestions * 100
                : 0.0;
        overallAccuracy = BigDecimal.valueOf(overallAccuracy).setScale(2, RoundingMode.HALF_UP).doubleValue();

        LambdaQueryWrapper<WrongBook> wbWrapper = new LambdaQueryWrapper<>();
        wbWrapper.eq(WrongBook::getUserId, userId);
        Long wrongCount = wrongBookMapper.selectCount(wbWrapper);

        List<Map<String, Object>> last30DaysTrend = getLast30DaysTrend(userId, progressList);

        result.put("totalQuestions", totalQuestions);
        result.put("totalCorrect", totalCorrect);
        result.put("overallAccuracy", overallAccuracy);
        result.put("wrongCount", wrongCount == null ? 0 : wrongCount.intValue());
        result.put("practicedKnowledgeCount", practicedKnowledgeIds.size());
        result.put("masteredKnowledgeCount", masteredCount);
        result.put("last30DaysTrend", last30DaysTrend);

        return result;
    }

    private List<Map<String, Object>> getLast30DaysTrend(Long userId, List<StudyProgress> progressList) {
        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        Map<String, int[]> dailyStats = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            LocalDateTime day = now.minusDays(i);
            String dateKey = day.toLocalDate().toString();
            dailyStats.put(dateKey, new int[]{0, 0});
        }

        if (progressList != null) {
            for (StudyProgress sp : progressList) {
                LocalDateTime lastPractice = sp.getLastPracticeTime();
                if (lastPractice != null && !lastPractice.isBefore(thirtyDaysAgo)) {
                    String dateKey = lastPractice.toLocalDate().toString();
                    int[] stats = dailyStats.get(dateKey);
                    if (stats != null) {
                        stats[0] += sp.getTotalQuestions() == null ? 0 : sp.getTotalQuestions();
                        stats[1] += sp.getCorrectCount() == null ? 0 : sp.getCorrectCount();
                    }
                }
            }
        }

        for (Map.Entry<String, int[]> entry : dailyStats.entrySet()) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", entry.getKey());
            dayData.put("totalQuestions", entry.getValue()[0]);
            dayData.put("correctCount", entry.getValue()[1]);
            double acc = entry.getValue()[0] > 0
                    ? (double) entry.getValue()[1] / entry.getValue()[0] * 100
                    : 0.0;
            dayData.put("accuracy", BigDecimal.valueOf(acc).setScale(2, RoundingMode.HALF_UP).doubleValue());
            trend.add(dayData);
        }

        return trend;
    }
}
