package com.exam.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.exam.common.PageResult;
import com.exam.entity.Question;
import com.exam.entity.WrongBook;
import com.exam.mapper.QuestionMapper;
import com.exam.mapper.WrongBookMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WrongBookService {

    @Autowired
    private WrongBookMapper wrongBookMapper;

    @Autowired
    private QuestionMapper questionMapper;

    @Transactional
    public void addWrongQuestion(Long userId, Long questionId) {
        LambdaQueryWrapper<WrongBook> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WrongBook::getUserId, userId)
                .eq(WrongBook::getQuestionId, questionId);
        WrongBook exist = wrongBookMapper.selectOne(wrapper);

        if (exist != null) {
            exist.setWrongCount(exist.getWrongCount() + 1);
            exist.setLastWrongTime(LocalDateTime.now());
            exist.setMasterStatus(0);
            wrongBookMapper.updateById(exist);
        } else {
            WrongBook wb = new WrongBook();
            wb.setUserId(userId);
            wb.setQuestionId(questionId);
            wb.setWrongCount(1);
            wb.setLastWrongTime(LocalDateTime.now());
            wb.setMasterStatus(0);
            wrongBookMapper.insert(wb);
        }
    }

    public PageResult<Map<String, Object>> getWrongBookList(Long userId, String subject,
                                                            Integer masterStatus,
                                                            Integer pageNum, Integer pageSize) {
        LambdaQueryWrapper<WrongBook> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WrongBook::getUserId, userId);
        if (masterStatus != null) {
            wrapper.eq(WrongBook::getMasterStatus, masterStatus);
        }
        wrapper.orderByDesc(WrongBook::getLastWrongTime);

        Page<WrongBook> page = new Page<>(pageNum == null ? 1 : pageNum, pageSize == null ? 10 : pageSize);
        IPage<WrongBook> pageResult = wrongBookMapper.selectPage(page, wrapper);

        List<WrongBook> records = pageResult.getRecords();
        List<Long> questionIds = records.stream()
                .map(WrongBook::getQuestionId)
                .collect(Collectors.toList());

        Map<Long, Question> questionMap = new HashMap<>();
        if (!questionIds.isEmpty()) {
            LambdaQueryWrapper<Question> qWrapper = new LambdaQueryWrapper<>();
            qWrapper.in(Question::getId, questionIds);
            if (subject != null && !subject.trim().isEmpty()) {
                qWrapper.eq(Question::getSubject, subject);
            }
            List<Question> questions = questionMapper.selectList(qWrapper);
            questionMap = questions.stream()
                    .collect(Collectors.toMap(Question::getId, q -> q));
        }

        List<Map<String, Object>> resultList = new ArrayList<>();
        for (WrongBook wb : records) {
            Question q = questionMap.get(wb.getQuestionId());
            if (q == null) {
                continue;
            }
            if (subject != null && !subject.trim().isEmpty() && !subject.equals(q.getSubject())) {
                continue;
            }
            Map<String, Object> item = new HashMap<>();
            item.put("id", wb.getId());
            item.put("userId", wb.getUserId());
            item.put("questionId", wb.getQuestionId());
            item.put("wrongCount", wb.getWrongCount());
            item.put("lastWrongTime", wb.getLastWrongTime());
            item.put("masterStatus", wb.getMasterStatus());
            item.put("createTime", wb.getCreateTime());
            item.put("question", q);
            resultList.add(item);
        }

        return PageResult.of(resultList, (long) resultList.size(),
                pageNum == null ? 1 : pageNum, pageSize == null ? 10 : pageSize);
    }

    @Transactional
    public void markAsMastered(Long id, Long userId) {
        WrongBook wb = wrongBookMapper.selectById(id);
        if (wb != null && wb.getUserId().equals(userId)) {
            wb.setMasterStatus(1);
            wrongBookMapper.updateById(wb);
        }
    }

    @Transactional
    public void batchAdd(List<Long> userIds, List<Long> questionIds) {
        if (userIds == null || questionIds == null || userIds.isEmpty() || questionIds.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (Long userId : userIds) {
            for (Long questionId : questionIds) {
                LambdaQueryWrapper<WrongBook> wrapper = new LambdaQueryWrapper<>();
                wrapper.eq(WrongBook::getUserId, userId)
                        .eq(WrongBook::getQuestionId, questionId);
                WrongBook exist = wrongBookMapper.selectOne(wrapper);

                if (exist != null) {
                    exist.setWrongCount(exist.getWrongCount() + 1);
                    exist.setLastWrongTime(now);
                    exist.setMasterStatus(0);
                    wrongBookMapper.updateById(exist);
                } else {
                    WrongBook wb = new WrongBook();
                    wb.setUserId(userId);
                    wb.setQuestionId(questionId);
                    wb.setWrongCount(1);
                    wb.setLastWrongTime(now);
                    wb.setMasterStatus(0);
                    wrongBookMapper.insert(wb);
                }
            }
        }
    }

    public Map<String, Object> getCount(Long userId) {
        Map<String, Object> result = new HashMap<>();

        LambdaQueryWrapper<WrongBook> totalWrapper = new LambdaQueryWrapper<>();
        totalWrapper.eq(WrongBook::getUserId, userId);
        Long total = wrongBookMapper.selectCount(totalWrapper);
        result.put("total", total == null ? 0 : total.intValue());

        LambdaQueryWrapper<WrongBook> masteredWrapper = new LambdaQueryWrapper<>();
        masteredWrapper.eq(WrongBook::getUserId, userId)
                .eq(WrongBook::getMasterStatus, 1);
        Long mastered = wrongBookMapper.selectCount(masteredWrapper);
        result.put("mastered", mastered == null ? 0 : mastered.intValue());

        LambdaQueryWrapper<WrongBook> unMasteredWrapper = new LambdaQueryWrapper<>();
        unMasteredWrapper.eq(WrongBook::getUserId, userId)
                .eq(WrongBook::getMasterStatus, 0);
        Long unMastered = wrongBookMapper.selectCount(unMasteredWrapper);
        result.put("unMastered", unMastered == null ? 0 : unMastered.intValue());

        return result;
    }
}
