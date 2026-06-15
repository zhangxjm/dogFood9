package com.exam.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.exam.common.PageResult;
import com.exam.dto.PaperCreateDTO;
import com.exam.dto.PaperStrategyDTO;
import com.exam.entity.*;
import com.exam.exception.BusinessException;
import com.exam.mapper.PaperMapper;
import com.exam.mapper.PaperQuestionMapper;
import com.exam.mapper.QuestionKnowledgeMapper;
import com.exam.mapper.QuestionMapper;
import com.exam.mapper.QuestionOptionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaperService {

    private final PaperMapper paperMapper;
    private final PaperQuestionMapper paperQuestionMapper;
    private final QuestionService questionService;
    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;
    private final QuestionKnowledgeMapper questionKnowledgeMapper;

    private static final int TYPE_SINGLE = 1;
    private static final int TYPE_MULTIPLE = 2;
    private static final int TYPE_JUDGE = 3;
    private static final int TYPE_FILL = 4;
    private static final int TYPE_SUBJECTIVE = 5;

    @Transactional
    public Paper createPaper(PaperCreateDTO dto, Long createBy) {
        PaperStrategyDTO strategy = dto.getStrategy();
        if (strategy == null) {
            throw new BusinessException("组卷策略不能为空");
        }

        Double avgDifficulty = strategy.getDifficulty();
        List<Long> knowledgeIds = strategy.getKnowledgeIds();
        String subject = dto.getSubject();

        Paper paper = new Paper();
        paper.setTitle(dto.getTitle());
        paper.setDescription(dto.getDescription());
        paper.setSubject(subject);
        paper.setDuration(dto.getDuration());
        paper.setStatus(0);
        paper.setCreateBy(createBy);
        paperMapper.insert(paper);

        List<Question> allSelectedQuestions = new ArrayList<>();
        List<PaperQuestion> paperQuestions = new ArrayList<>();
        int questionOrder = 1;
        double totalScore = 0;
        int totalQuestions = 0;

        totalScore += processQuestionType(paper, strategy, TYPE_SINGLE, strategy.getSingleCount(),
                strategy.getSingleScore(), avgDifficulty, knowledgeIds, subject,
                allSelectedQuestions, paperQuestions, questionOrder);
        totalQuestions += strategy.getSingleCount() != null ? strategy.getSingleCount() : 0;
        questionOrder += strategy.getSingleCount() != null ? strategy.getSingleCount() : 0;

        totalScore += processQuestionType(paper, strategy, TYPE_MULTIPLE, strategy.getMultipleCount(),
                strategy.getMultipleScore(), avgDifficulty, knowledgeIds, subject,
                allSelectedQuestions, paperQuestions, questionOrder);
        totalQuestions += strategy.getMultipleCount() != null ? strategy.getMultipleCount() : 0;
        questionOrder += strategy.getMultipleCount() != null ? strategy.getMultipleCount() : 0;

        totalScore += processQuestionType(paper, strategy, TYPE_JUDGE, strategy.getJudgeCount(),
                strategy.getJudgeScore(), avgDifficulty, knowledgeIds, subject,
                allSelectedQuestions, paperQuestions, questionOrder);
        totalQuestions += strategy.getJudgeCount() != null ? strategy.getJudgeCount() : 0;
        questionOrder += strategy.getJudgeCount() != null ? strategy.getJudgeCount() : 0;

        totalScore += processQuestionType(paper, strategy, TYPE_FILL, strategy.getFillCount(),
                strategy.getFillScore(), avgDifficulty, knowledgeIds, subject,
                allSelectedQuestions, paperQuestions, questionOrder);
        totalQuestions += strategy.getFillCount() != null ? strategy.getFillCount() : 0;
        questionOrder += strategy.getFillCount() != null ? strategy.getFillCount() : 0;

        totalScore += processQuestionType(paper, strategy, TYPE_SUBJECTIVE, strategy.getSubjectiveCount(),
                strategy.getSubjectiveScore(), avgDifficulty, knowledgeIds, subject,
                allSelectedQuestions, paperQuestions, questionOrder);
        totalQuestions += strategy.getSubjectiveCount() != null ? strategy.getSubjectiveCount() : 0;

        paper.setTotalScore(totalScore);
        paper.setTotalQuestions(totalQuestions);
        paperMapper.updateById(paper);

        paperQuestions.forEach(paperQuestionMapper::insert);

        return paper;
    }

    private double processQuestionType(Paper paper, PaperStrategyDTO strategy, int type, Integer count,
                                        Double score, Double avgDifficulty, List<Long> knowledgeIds,
                                        String subject, List<Question> allSelectedQuestions,
                                        List<PaperQuestion> paperQuestions, int startOrder) {
        if (count == null || count <= 0 || score == null) {
            return 0;
        }

        Set<Long> selectedIds = allSelectedQuestions.stream()
                .map(Question::getId)
                .collect(Collectors.toSet());

        List<Question> candidates = queryCandidates(type, subject, knowledgeIds,
                avgDifficulty, selectedIds, 1);

        if (candidates.size() < count) {
            candidates = queryCandidates(type, subject, knowledgeIds,
                    avgDifficulty, selectedIds, 2);
        }

        if (candidates.size() < count) {
            candidates = queryCandidates(type, subject, knowledgeIds,
                    null, selectedIds, Integer.MAX_VALUE);
        }

        if (candidates.size() < count) {
            throw new BusinessException("题型[" + getTypeName(type) + "]题目数量不足，需要" + count + "题，仅有" + candidates.size() + "题");
        }

        List<Question> selected = selectQuestionsGreedy(candidates, count, avgDifficulty, knowledgeIds);
        allSelectedQuestions.addAll(selected);

        int order = startOrder;
        for (Question q : selected) {
            PaperQuestion pq = new PaperQuestion();
            pq.setPaperId(paper.getId());
            pq.setQuestionId(q.getId());
            pq.setQuestionOrder(order++);
            pq.setScore(score);
            paperQuestions.add(pq);
        }

        return count * score;
    }

    private List<Question> queryCandidates(int type, String subject, List<Long> knowledgeIds,
                                            Double avgDifficulty, Set<Long> excludeIds, int range) {
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Question::getType, type);
        if (subject != null && !subject.isEmpty()) {
            wrapper.eq(Question::getSubject, subject);
        }
        if (avgDifficulty != null) {
            int minDiff = Math.max(1, (int) Math.floor(avgDifficulty - range));
            int maxDiff = Math.min(5, (int) Math.ceil(avgDifficulty + range));
            wrapper.between(Question::getDifficulty, minDiff, maxDiff);
        }
        if (!excludeIds.isEmpty()) {
            wrapper.notIn(Question::getId, excludeIds);
        }
        wrapper.orderByDesc(Question::getCreateTime);

        List<Question> questions = questionMapper.selectList(wrapper);

        if (knowledgeIds != null && !knowledgeIds.isEmpty()) {
            Set<Long> matchedQuestionIds = new HashSet<>();
            for (Question q : questions) {
                LambdaQueryWrapper<QuestionKnowledge> kw = new LambdaQueryWrapper<>();
                kw.eq(QuestionKnowledge::getQuestionId, q.getId());
                kw.in(QuestionKnowledge::getKnowledgeId, knowledgeIds);
                if (questionKnowledgeMapper.selectCount(kw) > 0) {
                    matchedQuestionIds.add(q.getId());
                }
            }
            questions = questions.stream()
                    .filter(q -> matchedQuestionIds.contains(q.getId()))
                    .collect(Collectors.toList());
        }

        return questions;
    }

    private List<Question> selectQuestionsGreedy(List<Question> candidates, int count,
                                                  Double avgDifficulty, List<Long> knowledgeIds) {
        if (candidates.size() <= count) {
            return new ArrayList<>(candidates);
        }

        Map<Long, Set<Long>> questionKnowledgeMap = new HashMap<>();
        for (Question q : candidates) {
            LambdaQueryWrapper<QuestionKnowledge> kw = new LambdaQueryWrapper<>();
            kw.eq(QuestionKnowledge::getQuestionId, q.getId());
            List<QuestionKnowledge> qkList = questionKnowledgeMapper.selectList(kw);
            Set<Long> kIds = qkList.stream()
                    .map(QuestionKnowledge::getKnowledgeId)
                    .collect(Collectors.toSet());
            questionKnowledgeMap.put(q.getId(), kIds);
        }

        Set<Long> coveredKnowledge = new HashSet<>();
        Set<Long> selectedIds = new HashSet<>();
        List<Question> result = new ArrayList<>();

        List<Question> shuffled = new ArrayList<>(candidates);
        Collections.shuffle(shuffled);

        double targetDiff = avgDifficulty != null ? avgDifficulty : 3.0;

        while (result.size() < count) {
            Question best = null;
            double bestScore = Double.NEGATIVE_INFINITY;

            for (Question q : shuffled) {
                if (selectedIds.contains(q.getId())) continue;

                double diffPenalty = -Math.abs(q.getDifficulty() - targetDiff);

                double knowledgeBonus = 0;
                Set<Long> kIds = questionKnowledgeMap.getOrDefault(q.getId(), Collections.emptySet());
                for (Long kid : kIds) {
                    if (!coveredKnowledge.contains(kid)) {
                        knowledgeBonus += 2.0;
                    }
                }

                double score = diffPenalty + knowledgeBonus + Math.random();

                if (score > bestScore) {
                    bestScore = score;
                    best = q;
                }
            }

            if (best == null) break;

            selectedIds.add(best.getId());
            result.add(best);
            coveredKnowledge.addAll(questionKnowledgeMap.getOrDefault(best.getId(), Collections.emptySet()));
        }

        return result;
    }

    private String getTypeName(int type) {
        switch (type) {
            case TYPE_SINGLE: return "单选题";
            case TYPE_MULTIPLE: return "多选题";
            case TYPE_JUDGE: return "判断题";
            case TYPE_FILL: return "填空题";
            case TYPE_SUBJECTIVE: return "主观题";
            default: return "未知";
        }
    }

    public PageResult<Paper> getPaperList(String keyword, String subject, Integer status, Long createBy, Integer pageNum, Integer pageSize) {
        Page<Paper> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Paper> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(Paper::getTitle, keyword);
        }
        if (subject != null && !subject.isEmpty()) {
            wrapper.eq(Paper::getSubject, subject);
        }
        if (status != null) {
            wrapper.eq(Paper::getStatus, status);
        }
        if (createBy != null) {
            wrapper.eq(Paper::getCreateBy, createBy);
        }
        wrapper.orderByDesc(Paper::getCreateTime);
        Page<Paper> result = paperMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), pageNum, pageSize);
    }

    public Map<String, Object> getPaperDetail(Long id) {
        Paper paper = paperMapper.selectById(id);
        if (paper == null) {
            throw new BusinessException("试卷不存在");
        }

        List<Map<String, Object>> questions = getPaperQuestionsWithDetail(id);

        Map<String, Object> result = new HashMap<>();
        result.put("paper", paper);
        result.put("questions", questions);
        return result;
    }

    public void publishPaper(Long id) {
        Paper paper = paperMapper.selectById(id);
        if (paper == null) {
            throw new BusinessException("试卷不存在");
        }
        paper.setStatus(1);
        paperMapper.updateById(paper);
    }

    public void deletePaper(Long id) {
        Paper paper = paperMapper.selectById(id);
        if (paper == null) {
            throw new BusinessException("试卷不存在");
        }
        paperMapper.deleteById(id);
    }

    public List<Map<String, Object>> getPaperQuestions(Long paperId) {
        return getPaperQuestionsWithDetail(paperId);
    }

    private List<Map<String, Object>> getPaperQuestionsWithDetail(Long paperId) {
        LambdaQueryWrapper<PaperQuestion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PaperQuestion::getPaperId, paperId);
        wrapper.orderByAsc(PaperQuestion::getQuestionOrder);
        List<PaperQuestion> paperQuestions = paperQuestionMapper.selectList(wrapper);

        List<Map<String, Object>> result = new ArrayList<>();
        for (PaperQuestion pq : paperQuestions) {
            Question question = questionMapper.selectById(pq.getQuestionId());
            if (question == null) continue;

            LambdaQueryWrapper<QuestionOption> ow = new LambdaQueryWrapper<>();
            ow.eq(QuestionOption::getQuestionId, question.getId());
            List<QuestionOption> options = questionOptionMapper.selectList(ow);

            LambdaQueryWrapper<QuestionKnowledge> kw = new LambdaQueryWrapper<>();
            kw.eq(QuestionKnowledge::getQuestionId, question.getId());
            List<QuestionKnowledge> qkList = questionKnowledgeMapper.selectList(kw);
            List<Long> knowledgeIdList = qkList.stream()
                    .map(QuestionKnowledge::getKnowledgeId)
                    .collect(Collectors.toList());

            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", question.getId());
            qMap.put("type", question.getType());
            qMap.put("content", question.getContent());
            qMap.put("image", question.getImage());
            qMap.put("analysis", question.getAnalysis());
            qMap.put("difficulty", question.getDifficulty());
            qMap.put("subject", question.getSubject());
            qMap.put("score", pq.getScore());
            qMap.put("questionOrder", pq.getQuestionOrder());
            qMap.put("options", options);
            qMap.put("knowledgeIds", knowledgeIdList);

            result.add(qMap);
        }

        return result;
    }
}
