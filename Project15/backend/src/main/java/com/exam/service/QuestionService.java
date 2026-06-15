package com.exam.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.exam.common.PageResult;
import com.exam.dto.QuestionCreateDTO;
import com.exam.dto.QuestionOptionDTO;
import com.exam.dto.QuestionQueryDTO;
import com.exam.entity.Question;
import com.exam.entity.QuestionKnowledge;
import com.exam.entity.QuestionOption;
import com.exam.exception.BusinessException;
import com.exam.mapper.QuestionKnowledgeMapper;
import com.exam.mapper.QuestionMapper;
import com.exam.mapper.QuestionOptionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;
    private final QuestionKnowledgeMapper questionKnowledgeMapper;

    @Transactional
    public Question createQuestion(QuestionCreateDTO dto, Long userId) {
        Question question = new Question();
        question.setType(dto.getType());
        question.setContent(dto.getContent());
        question.setImage(dto.getImage());
        question.setAnalysis(dto.getAnalysis());
        question.setDifficulty(dto.getDifficulty());
        question.setScore(dto.getScore() != null ? dto.getScore() : 5.0);
        question.setSubject(dto.getSubject());
        question.setCreateBy(userId);
        questionMapper.insert(question);

        List<QuestionOptionDTO> options = dto.getOptions();
        if (options != null && !options.isEmpty()) {
            for (QuestionOptionDTO optDTO : options) {
                QuestionOption opt = new QuestionOption();
                opt.setQuestionId(question.getId());
                opt.setOptionLabel(optDTO.getOptionLabel());
                opt.setOptionContent(optDTO.getOptionContent());
                opt.setIsCorrect(optDTO.getIsCorrect() != null ? optDTO.getIsCorrect() : 0);
                questionOptionMapper.insert(opt);
            }
        }

        List<Long> knowledgeIds = dto.getKnowledgeIds();
        if (knowledgeIds != null && !knowledgeIds.isEmpty()) {
            for (Long kid : knowledgeIds) {
                QuestionKnowledge qk = new QuestionKnowledge();
                qk.setQuestionId(question.getId());
                qk.setKnowledgeId(kid);
                questionKnowledgeMapper.insert(qk);
            }
        }

        return question;
    }

    public PageResult<Question> getQuestionList(QuestionQueryDTO dto) {
        Page<Question> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        LambdaQueryWrapper<Question> wrapper = new LambdaQueryWrapper<>();
        if (dto.getType() != null) {
            wrapper.eq(Question::getType, dto.getType());
        }
        if (dto.getSubject() != null && !dto.getSubject().isEmpty()) {
            wrapper.eq(Question::getSubject, dto.getSubject());
        }
        if (dto.getDifficulty() != null) {
            wrapper.eq(Question::getDifficulty, dto.getDifficulty());
        }
        if (dto.getKeyword() != null && !dto.getKeyword().isEmpty()) {
            wrapper.like(Question::getContent, dto.getKeyword());
        }
        wrapper.orderByDesc(Question::getCreateTime);
        Page<Question> result = questionMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), dto.getPageNum(), dto.getPageSize());
    }

    public Map<String, Object> getQuestionDetail(Long id) {
        Question question = questionMapper.selectById(id);
        if (question == null) {
            throw new BusinessException("题目不存在");
        }

        LambdaQueryWrapper<QuestionOption> optWrapper = new LambdaQueryWrapper<>();
        optWrapper.eq(QuestionOption::getQuestionId, id);
        List<QuestionOption> options = questionOptionMapper.selectList(optWrapper);

        LambdaQueryWrapper<QuestionKnowledge> kwWrapper = new LambdaQueryWrapper<>();
        kwWrapper.eq(QuestionKnowledge::getQuestionId, id);
        List<QuestionKnowledge> qkList = questionKnowledgeMapper.selectList(kwWrapper);
        List<Long> knowledgeIds = qkList.stream()
                .map(QuestionKnowledge::getKnowledgeId)
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("id", question.getId());
        result.put("type", question.getType());
        result.put("content", question.getContent());
        result.put("image", question.getImage());
        result.put("analysis", question.getAnalysis());
        result.put("difficulty", question.getDifficulty());
        result.put("score", question.getScore());
        result.put("subject", question.getSubject());
        result.put("createBy", question.getCreateBy());
        result.put("createTime", question.getCreateTime());
        result.put("updateTime", question.getUpdateTime());
        result.put("options", options);
        result.put("knowledgeIds", knowledgeIds);
        return result;
    }

    @Transactional
    public void updateQuestion(Long id, QuestionCreateDTO dto) {
        Question question = questionMapper.selectById(id);
        if (question == null) {
            throw new BusinessException("题目不存在");
        }
        question.setType(dto.getType());
        question.setContent(dto.getContent());
        question.setImage(dto.getImage());
        question.setAnalysis(dto.getAnalysis());
        question.setDifficulty(dto.getDifficulty());
        if (dto.getScore() != null) question.setScore(dto.getScore());
        question.setSubject(dto.getSubject());
        questionMapper.updateById(question);

        questionOptionMapper.delete(
                new LambdaQueryWrapper<QuestionOption>().eq(QuestionOption::getQuestionId, id));
        questionKnowledgeMapper.delete(
                new LambdaQueryWrapper<QuestionKnowledge>().eq(QuestionKnowledge::getQuestionId, id));

        List<QuestionOptionDTO> options = dto.getOptions();
        if (options != null && !options.isEmpty()) {
            for (QuestionOptionDTO optDTO : options) {
                QuestionOption opt = new QuestionOption();
                opt.setQuestionId(id);
                opt.setOptionLabel(optDTO.getOptionLabel());
                opt.setOptionContent(optDTO.getOptionContent());
                opt.setIsCorrect(optDTO.getIsCorrect() != null ? optDTO.getIsCorrect() : 0);
                questionOptionMapper.insert(opt);
            }
        }

        List<Long> knowledgeIds = dto.getKnowledgeIds();
        if (knowledgeIds != null && !knowledgeIds.isEmpty()) {
            for (Long kid : knowledgeIds) {
                QuestionKnowledge qk = new QuestionKnowledge();
                qk.setQuestionId(id);
                qk.setKnowledgeId(kid);
                questionKnowledgeMapper.insert(qk);
            }
        }
    }

    @Transactional
    public void deleteQuestion(Long id) {
        Question question = questionMapper.selectById(id);
        if (question == null) {
            throw new BusinessException("题目不存在");
        }
        questionMapper.deleteById(id);
    }
}
