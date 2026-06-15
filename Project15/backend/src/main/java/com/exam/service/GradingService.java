package com.exam.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.exam.entity.AnswerRecord;
import com.exam.entity.Question;
import com.exam.entity.QuestionOption;
import com.exam.mapper.QuestionMapper;
import com.exam.mapper.QuestionOptionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GradingService {

    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;

    private static final int TYPE_SINGLE = 1;
    private static final int TYPE_MULTIPLE = 2;
    private static final int TYPE_JUDGE = 3;
    private static final int TYPE_FILL = 4;
    private static final int TYPE_SUBJECTIVE = 5;

    public void autoGrade(AnswerRecord record, Double questionScore) {
        Question question = questionMapper.selectById(record.getQuestionId());
        if (question == null) {
            record.setAutoScore(0.0);
            record.setScore(0.0);
            record.setIsCorrect(0);
            return;
        }

        int type = question.getType();
        String userAnswer = record.getUserAnswer();

        switch (type) {
            case TYPE_SINGLE:
            case TYPE_JUDGE:
                gradeSingleChoice(record, question, userAnswer, questionScore);
                break;
            case TYPE_MULTIPLE:
                gradeMultipleChoice(record, question, userAnswer, questionScore);
                break;
            case TYPE_FILL:
                gradeFillBlank(record, question, userAnswer, questionScore);
                break;
            case TYPE_SUBJECTIVE:
                gradeSubjective(record, userAnswer, questionScore);
                break;
            default:
                record.setAutoScore(0.0);
                record.setScore(0.0);
                record.setIsCorrect(0);
        }
    }

    private void gradeSingleChoice(AnswerRecord record, Question question, String userAnswer, Double questionScore) {
        if (userAnswer == null || userAnswer.isEmpty()) {
            record.setAutoScore(0.0);
            record.setScore(0.0);
            record.setIsCorrect(0);
            return;
        }

        String correctAnswer = getCorrectOptionLabels(question.getId()).stream()
                .findFirst()
                .orElse("");

        boolean isCorrect = userAnswer.trim().equalsIgnoreCase(correctAnswer.trim());
        record.setIsCorrect(isCorrect ? 1 : 0);
        record.setAutoScore(isCorrect ? questionScore : 0.0);
        record.setScore(isCorrect ? questionScore : 0.0);
    }

    private void gradeMultipleChoice(AnswerRecord record, Question question, String userAnswer, Double questionScore) {
        if (userAnswer == null || userAnswer.isEmpty()) {
            record.setAutoScore(0.0);
            record.setScore(0.0);
            record.setIsCorrect(0);
            return;
        }

        Set<String> correctSet = new TreeSet<>(
                getCorrectOptionLabels(question.getId()).stream()
                        .map(String::trim)
                        .map(String::toUpperCase)
                        .collect(Collectors.toList())
        );

        Set<String> userSet = new TreeSet<>(
                Arrays.stream(userAnswer.split("[,，、;；\\s]+"))
                        .map(String::trim)
                        .map(String::toUpperCase)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList())
        );

        boolean isCorrect = correctSet.equals(userSet);
        record.setIsCorrect(isCorrect ? 1 : 0);
        record.setAutoScore(isCorrect ? questionScore : 0.0);
        record.setScore(isCorrect ? questionScore : 0.0);
    }

    private void gradeFillBlank(AnswerRecord record, Question question, String userAnswer, Double questionScore) {
        if (userAnswer == null || userAnswer.isEmpty()) {
            record.setAutoScore(0.0);
            record.setScore(0.0);
            record.setIsCorrect(0);
            return;
        }

        LambdaQueryWrapper<QuestionOption> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionOption::getQuestionId, question.getId());
        wrapper.eq(QuestionOption::getIsCorrect, 1);
        List<QuestionOption> correctOptions = questionOptionMapper.selectList(wrapper);

        if (correctOptions.isEmpty()) {
            record.setAutoScore(0.0);
            record.setScore(0.0);
            record.setIsCorrect(0);
            return;
        }

        String correctAnswer = correctOptions.get(0).getOptionContent();
        boolean isCorrect = userAnswer.trim().equalsIgnoreCase(correctAnswer.trim());
        record.setIsCorrect(isCorrect ? 1 : 0);
        record.setAutoScore(isCorrect ? questionScore : 0.0);
        record.setScore(isCorrect ? questionScore : 0.0);
    }

    private void gradeSubjective(AnswerRecord record, String userAnswer, Double questionScore) {
        if (userAnswer == null || userAnswer.isEmpty()) {
            record.setAutoScore(0.0);
            record.setScore(0.0);
            record.setIsCorrect(0);
            return;
        }

        record.setAutoScore(0.0);
        record.setManualScore(0.0);
        record.setScore(0.0);
        record.setIsCorrect(0);
    }

    private List<String> getCorrectOptionLabels(Long questionId) {
        LambdaQueryWrapper<QuestionOption> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionOption::getQuestionId, questionId);
        wrapper.eq(QuestionOption::getIsCorrect, 1);
        List<QuestionOption> options = questionOptionMapper.selectList(wrapper);
        return options.stream()
                .map(QuestionOption::getOptionLabel)
                .collect(Collectors.toList());
    }
}
