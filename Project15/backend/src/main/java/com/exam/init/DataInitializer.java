package com.exam.init;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.exam.entity.*;
import com.exam.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import cn.hutool.crypto.digest.BCrypt;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final KnowledgePointMapper knowledgePointMapper;
    private final QuestionMapper questionMapper;
    private final QuestionOptionMapper questionOptionMapper;
    private final QuestionKnowledgeMapper questionKnowledgeMapper;
    private final PaperMapper paperMapper;
    private final PaperQuestionMapper paperQuestionMapper;
    private final ExamMapper examMapper;
    private final ExamStudentMapper examStudentMapper;

    @Override
    @Transactional
    public void run(String... args) {
        Long userCount = userMapper.selectCount(new LambdaQueryWrapper<>());
        if (userCount > 0) {
            log.info("Data already initialized, skip initialization.");
            return;
        }
        log.info("Starting data initialization...");

        initUsers();
        initKnowledgePoints();
        initQuestions();
        initPaperAndExam();

        log.info("Data initialization completed.");
    }

    private void initUsers() {
        log.info("Initializing users...");
        List<User> users = new ArrayList<>();

        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(BCrypt.hashpw("admin123"));
        admin.setRealName("系统管理员");
        admin.setRole(1);
        admin.setEmail("admin@exam.com");
        admin.setPhone("13800000000");
        admin.setStatus(1);
        users.add(admin);

        User teacher = new User();
        teacher.setUsername("teacher");
        teacher.setPassword(BCrypt.hashpw("teacher123"));
        teacher.setRealName("张老师");
        teacher.setRole(1);
        teacher.setEmail("teacher@exam.com");
        teacher.setPhone("13800000001");
        teacher.setStatus(1);
        users.add(teacher);

        String[] studentNames = {"张三", "李四", "王五", "赵六", "孙七", "周八", "吴九", "郑十"};
        for (int i = 0; i < studentNames.length; i++) {
            User student = new User();
            student.setUsername("student" + (i + 1));
            student.setPassword(BCrypt.hashpw("student123"));
            student.setRealName(studentNames[i]);
            student.setRole(2);
            student.setEmail("student" + (i + 1) + "@exam.com");
            student.setPhone("138000000" + String.format("%02d", i + 10));
            student.setStatus(1);
            users.add(student);
        }

        for (User user : users) {
            userMapper.insert(user);
        }
        log.info("Initialized {} users.", users.size());
    }

    private void initKnowledgePoints() {
        log.info("Initializing knowledge points...");
        List<KnowledgePoint> kps = new ArrayList<>();

        String[][] mathData = {
                {"集合", "集合的概念与运算"},
                {"函数", "函数的概念、性质与图像"},
                {"三角函数", "三角函数定义、图像与性质"},
                {"数列", "等差数列、等比数列"},
                {"平面向量", "向量的运算与应用"},
                {"不等式", "不等式的性质与解法"},
                {"立体几何", "空间几何体、点线面关系"},
                {"解析几何", "直线、圆、圆锥曲线"},
                {"导数", "导数的概念与应用"},
                {"概率统计", "概率、统计与分布"}
        };

        for (int i = 0; i < mathData.length; i++) {
            KnowledgePoint kp = new KnowledgePoint();
            kp.setName(mathData[i][0]);
            kp.setSubject("数学");
            kp.setParentId(0L);
            kp.setDescription(mathData[i][1]);
            kps.add(kp);
        }

        String[][] englishData = {
                {"词汇", "基础词汇与短语"},
                {"语法", "词法与句法"},
                {"听力", "听力理解技巧"},
                {"阅读", "阅读理解策略"},
                {"写作", "写作方法与范文"}
        };

        for (int i = 0; i < englishData.length; i++) {
            KnowledgePoint kp = new KnowledgePoint();
            kp.setName(englishData[i][0]);
            kp.setSubject("英语");
            kp.setParentId(0L);
            kp.setDescription(englishData[i][1]);
            kps.add(kp);
        }

        for (KnowledgePoint kp : kps) {
            knowledgePointMapper.insert(kp);
        }
        log.info("Initialized {} knowledge points.", kps.size());
    }

    private void initQuestions() {
        log.info("Initializing questions...");
        List<Question> questions = new ArrayList<>();
        List<QuestionOption> options = new ArrayList<>();
        List<QuestionKnowledge> qks = new ArrayList<>();

        User teacher = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "teacher"));

        String[][] singleChoice = {
                {"已知集合A={x|x^2-5x+6=0},B={x|x^2-3x+2=0},则A∩B=?", "{2}", "{1}", "{1,2}", "∅", "A", "因式分解得A={2,3},B={1,2},交集为{2}", "3"},
                {"函数f(x)=lg(x-1)的定义域是?", "(1,+∞)", "[1,+∞)", "(-∞,1)", "R", "A", "真数大于0,即x-1>0,x>1", "2"},
                {"sin60°的值为?", "√3/2", "1/2", "√2/2", "1", "A", "特殊角的三角函数值,sin60°=√3/2", "2"},
                {"等差数列{an}中,a1=2,d=3,则a10=?", "29", "32", "27", "30", "A", "an=a1+(n-1)d=2+9*3=29", "3"},
                {"已知向量a=(1,2),b=(x,6),若a∥b,则x=", "3", "12", "-3", "-12", "A", "向量平行则1*6=2x,x=3", "2"},
                {"不等式x^2-4x+3<0的解集是?", "(1,3)", "(-∞,1)∪(3,+∞)", "[1,3]", "(-∞,1]∪[3,+∞)", "A", "因式分解得(x-1)(x-3)<0,所以1<x<3", "3"},
                {"正方体的棱长为2,则其外接球的表面积为?", "12π", "8π", "6π", "4π", "A", "外接球直径=体对角线=2√3,S=4πR^2=12π", "3"},
                {"过点(1,2)且斜率为3的直线方程是?", "3x-y-1=0", "3x-y+1=0", "x+3y-7=0", "x+3y+7=0", "A", "点斜式y-2=3(x-1),整理得3x-y-1=0", "3"},
                {"函数f(x)=x^3-3x的极大值点是?", "x=-1", "x=1", "x=0", "x=2", "A", "f'(x)=3x^2-3=0,x=±1,二阶导数判断x=-1为极大值点", "4"},
                {"从1,2,3,4,5中任取2个数,和为偶数的概率是?", "2/5", "3/5", "1/2", "3/10", "A", "共C(5,2)=10种,同奇偶的有C(3,2)+C(2,2)=4种,P=4/10=2/5", "4"}
        };

        for (int i = 0; i < singleChoice.length; i++) {
            String[] q = singleChoice[i];
            Question question = new Question();
            question.setType(1);
            question.setContent(q[0]);
            question.setAnalysis(q[6]);
            question.setDifficulty(Integer.parseInt(q[7]));
            question.setScore(5.0);
            question.setSubject("数学");
            question.setCreateBy(teacher.getId());
            questions.add(question);
        }

        String[][] multiChoice = {
                {"下列函数中,是偶函数的是?", "y=x^2", "y=|x|", "y=x^3", "y=cosx", "0,1,3", "偶函数满足f(-x)=f(x)，x^2、|x|、cosx都是偶函数", "3"},
                {"关于等比数列,下列说法正确的是?", "各项不能为0", "公比不能为0", "常数列是等比数列", "等比中项有两个", "0,1,3", "等比数列各项和公比都不能为0,常数列如0,0,0不是等比数列", "4"},
                {"直线与圆的位置关系有?", "相离", "相切", "相交", "内含", "0,1,2", "直线与圆有三种位置关系：相离、相切、相交", "2"},
                {"下列函数存在极值的是?", "y=x^2", "y=x^3-3x", "y=e^x", "y=lnx(x>0)", "0,1", "y=x^2在x=0取极小值，y=x^3-3x有极大值和极小值", "4"},
                {"下列事件是必然事件的是?", "太阳从东方升起", "抛硬币正面朝上", "水往低处流", "掷骰子点数大于0", "0,2,3", "必然事件是一定会发生的事件，太阳东升、水往低处流、骰子点数>0都是必然", "2"}
        };

        int scStart = questions.size();
        for (int i = 0; i < multiChoice.length; i++) {
            String[] q = multiChoice[i];
            Question question = new Question();
            question.setType(2);
            question.setContent(q[0]);
            question.setAnalysis(q[6]);
            question.setDifficulty(Integer.parseInt(q[7]));
            question.setScore(6.0);
            question.setSubject("数学");
            question.setCreateBy(teacher.getId());
            questions.add(question);
        }

        String[][] judgeQuestions = {
                {"空集是任何集合的子集。", "对", "空集的基本性质，∅⊆A对任意A成立", "1"},
                {"函数y=f(x)在x=x0处可导,则在该点连续。", "对", "可导必连续是微积分基本定理", "2"},
                {"两个向量的数量积等于它们模的乘积。", "错", "a·b=|a||b|cosθ，是模乘以夹角余弦", "2"},
                {"等差数列前n项和公式Sn=n(a1+an)/2。", "对", "这是等差数列求和的基本公式", "1"},
                {"圆的标准方程为x^2+y^2=R^2,圆心在原点。", "对", "这是圆心在原点半径为R的圆的标准方程", "1"},
                {"任何两个集合的交集都是它们的并集的子集。", "对", "A∩B⊆A∪B恒成立", "2"},
                {"sin^2x + cos^2x = 2。", "错", "正确的恒等式是sin^2x+cos^2x=1", "1"},
                {"二次函数y=ax^2+bx+c(a≠0)的图像是抛物线。", "对", "二次函数图像的基本形状就是抛物线", "1"}
        };

        int jStart = questions.size();
        for (int i = 0; i < judgeQuestions.length; i++) {
            String[] q = judgeQuestions[i];
            Question question = new Question();
            question.setType(3);
            question.setContent(q[0]);
            question.setAnalysis(q[2]);
            question.setDifficulty(Integer.parseInt(q[3]));
            question.setScore(3.0);
            question.setSubject("数学");
            question.setCreateBy(teacher.getId());
            questions.add(question);
        }

        String[][] fillBlank = {
                {"已知全集U=R,A={x|x<3},则∁UA=___。", "{x|x≥3}|[3,+∞)", "补集是全集中不属于A的元素", "2"},
                {"函数y=√(x-2)的定义域是___。", "[2,+∞)|x≥2", "被开方数大于等于0", "2"},
                {"tan45°=___。", "1", "特殊角的三角函数值", "1"},
                {"等比数列{2,6,18,...}的公比q=___。", "3", "q=6/2=3", "1"},
                {"向量a=(3,4)的模|a|=___。", "5", "|a|=√(9+16)=5", "2"},
                {"抛物线y=x^2-4x+3的对称轴是x=___。", "2", "x=-b/(2a)=4/2=2", "3"},
                {"复数(1+i)(1-i)=___。", "2", "展开=1-i^2=1-(-1)=2", "3"},
                {"球的体积公式V=___πR^3(填系数)。", "4/3|1.33", "球体积公式V=4/3πR^3", "2"}
        };

        int fStart = questions.size();
        for (int i = 0; i < fillBlank.length; i++) {
            String[] q = fillBlank[i];
            Question question = new Question();
            question.setType(4);
            question.setContent(q[0]);
            question.setAnalysis(q[2]);
            question.setDifficulty(Integer.parseInt(q[3]));
            question.setScore(5.0);
            question.setSubject("数学");
            question.setCreateBy(teacher.getId());
            questions.add(question);
        }

        String[][] subjective = {
                {"证明：对于任意正整数n，有1+2+3+...+n = n(n+1)/2。", "用数学归纳法证明：\n" +
                        "1) 基例：n=1时，左边=1，右边=1*2/2=1，等式成立。\n" +
                        "2) 假设n=k时等式成立，即1+2+...+k=k(k+1)/2。\n" +
                        "3) 当n=k+1时，左边=1+2+...+k+(k+1)\n" +
                        "   = k(k+1)/2 + (k+1) = (k+1)(k+2)/2 = 右边。\n" +
                        "所以对任意正整数n，等式成立。", "数学归纳法的标准格式，包含基例、归纳假设、归纳步骤三部分", "5"},
                {"求函数f(x) = x^3 - 6x^2 + 9x + 2的单调区间和极值。", "f'(x)=3x^2-12x+9=3(x-1)(x-3)\n" +
                        "令f'(x)=0,得x=1或x=3\n" +
                        "x<1时,f'(x)>0,单调递增\n" +
                        "1<x<3时,f'(x)<0,单调递减\n" +
                        "x>3时,f'(x)>0,单调递增\n" +
                        "极大值f(1)=1-6+9+2=6\n" +
                        "极小值f(3)=27-54+27+2=2", "求导、找驻点、分区间判断导数符号、得出单调区间、计算极值", "4"},
                {"简述集合的三种表示方法，并各举一例。", "集合的三种表示方法：\n" +
                        "1) 列举法：将集合中元素一一列出，如A={1,2,3,4,5}\n" +
                        "2) 描述法：用元素的公共属性描述，如B={x|x是偶数,x∈N}\n" +
                        "3) 图示法（维恩图）：用封闭曲线表示集合，常用于集合关系的直观展示", "列举法、描述法、图示法，每种方法要有定义和例子", "2"},
                {"求过点(0,1)和(1,3)的直线方程，并判断点(2,5)是否在该直线上。", "斜率k=(3-1)/(1-0)=2\n" +
                        "由点斜式：y-1=2(x-0)\n" +
                        "直线方程：y=2x+1\n" +
                        "代入点(2,5)：y=2*2+1=5，与给定点纵坐标相等\n" +
                        "所以点(2,5)在该直线上。", "先求斜率，再写直线方程，最后验证点在直线上", "3"}
        };

        int sStart = questions.size();
        for (int i = 0; i < subjective.length; i++) {
            String[] q = subjective[i];
            Question question = new Question();
            question.setType(5);
            question.setContent(q[0]);
            question.setAnalysis(q[2]);
            question.setDifficulty(Integer.parseInt(q[3]));
            question.setScore(10.0);
            question.setSubject("数学");
            question.setCreateBy(teacher.getId());
            questions.add(question);
        }

        for (Question q : questions) {
            questionMapper.insert(q);
        }

        for (int i = 0; i < singleChoice.length; i++) {
            String[] q = singleChoice[i];
            Long qid = questions.get(i).getId();
            String[] labels = {"A", "B", "C", "D"};
            for (int j = 0; j < 4; j++) {
                QuestionOption opt = new QuestionOption();
                opt.setQuestionId(qid);
                opt.setOptionLabel(labels[j]);
                opt.setOptionContent(q[j + 1]);
                opt.setIsCorrect(labels[j].equals(q[5]) ? 1 : 0);
                options.add(opt);
            }
            QuestionKnowledge qk = new QuestionKnowledge();
            qk.setQuestionId(qid);
            qk.setKnowledgeId((long) ((i % 10) + 1));
            qks.add(qk);
        }

        for (int i = 0; i < multiChoice.length; i++) {
            String[] q = multiChoice[i];
            Long qid = questions.get(scStart + i).getId();
            String[] labels = {"A", "B", "C", "D"};
            Set<String> correctIdx = new HashSet<>(Arrays.asList(q[5].split(",")));
            for (int j = 0; j < 4; j++) {
                QuestionOption opt = new QuestionOption();
                opt.setQuestionId(qid);
                opt.setOptionLabel(labels[j]);
                opt.setOptionContent(q[j + 1]);
                opt.setIsCorrect(correctIdx.contains(String.valueOf(j)) ? 1 : 0);
                options.add(opt);
            }
            QuestionKnowledge qk = new QuestionKnowledge();
            qk.setQuestionId(qid);
            qk.setKnowledgeId((long) (((scStart + i) % 10) + 1));
            qks.add(qk);
        }

        for (int i = 0; i < judgeQuestions.length; i++) {
            String[] q = judgeQuestions[i];
            Long qid = questions.get(jStart + i).getId();
            QuestionOption opt1 = new QuestionOption();
            opt1.setQuestionId(qid);
            opt1.setOptionLabel("T");
            opt1.setOptionContent("正确");
            opt1.setIsCorrect(q[1].equals("对") ? 1 : 0);
            options.add(opt1);
            QuestionOption opt2 = new QuestionOption();
            opt2.setQuestionId(qid);
            opt2.setOptionLabel("F");
            opt2.setOptionContent("错误");
            opt2.setIsCorrect(q[1].equals("错") ? 1 : 0);
            options.add(opt2);
            QuestionKnowledge qk = new QuestionKnowledge();
            qk.setQuestionId(qid);
            qk.setKnowledgeId((long) (((jStart + i) % 10) + 1));
            qks.add(qk);
        }

        for (int i = 0; i < fillBlank.length; i++) {
            String[] q = fillBlank[i];
            Long qid = questions.get(fStart + i).getId();
            QuestionKnowledge qk = new QuestionKnowledge();
            qk.setQuestionId(qid);
            qk.setKnowledgeId((long) (((fStart + i) % 10) + 1));
            qks.add(qk);
        }

        for (int i = 0; i < subjective.length; i++) {
            String[] q = subjective[i];
            Long qid = questions.get(sStart + i).getId();
            QuestionKnowledge qk = new QuestionKnowledge();
            qk.setQuestionId(qid);
            qk.setKnowledgeId((long) (((sStart + i) % 10) + 1));
            qks.add(qk);
        }

        for (QuestionOption opt : options) {
            questionOptionMapper.insert(opt);
        }
        for (QuestionKnowledge qk : qks) {
            questionKnowledgeMapper.insert(qk);
        }
        log.info("Initialized {} questions, {} options, {} question-knowledge links.",
                questions.size(), options.size(), qks.size());
    }

    private void initPaperAndExam() {
        log.info("Initializing paper and exam...");
        User teacher = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "teacher"));
        List<Long> mathKps = knowledgePointMapper.selectList(
                new LambdaQueryWrapper<KnowledgePoint>().eq(KnowledgePoint::getSubject, "数学"))
                .stream().map(KnowledgePoint::getId).toList();

        List<Question> questions = questionMapper.selectList(
                new LambdaQueryWrapper<Question>().eq(Question::getSubject, "数学"));
        if (questions.isEmpty()) return;

        Paper paper = new Paper();
        paper.setTitle("数学综合能力测试（一）");
        paper.setDescription("覆盖高中数学核心知识点的综合测试题，检验学生基础知识掌握情况。");
        paper.setSubject("数学");
        paper.setDuration(120);
        paper.setCreateBy(teacher.getId());
        paper.setStatus(1);

        double totalScore = 0;
        int totalCount = 0;
        int order = 0;
        List<PaperQuestion> pqs = new ArrayList<>();

        Map<Integer, List<Question>> grouped = new HashMap<>();
        for (Question q : questions) {
            grouped.computeIfAbsent(q.getType(), k -> new ArrayList<>()).add(q);
        }

        List<int[]> config = Arrays.asList(
                new int[]{1, 5},
                new int[]{2, 3},
                new int[]{3, 5},
                new int[]{4, 4},
                new int[]{5, 2}
        );

        for (int[] cfg : config) {
            int type = cfg[0], count = cfg[1];
            List<Question> pool = grouped.getOrDefault(type, Collections.emptyList());
            if (pool.isEmpty()) continue;
            int take = Math.min(count, pool.size());
            Collections.shuffle(pool);
            for (int i = 0; i < take; i++) {
                Question q = pool.get(i);
                PaperQuestion pq = new PaperQuestion();
                pq.setQuestionId(q.getId());
                pq.setQuestionOrder(++order);
                pq.setScore(q.getScore());
                pqs.add(pq);
                totalScore += q.getScore();
                totalCount++;
            }
        }

        paper.setTotalScore(totalScore);
        paper.setTotalQuestions(totalCount);
        paperMapper.insert(paper);

        for (PaperQuestion pq : pqs) {
            pq.setPaperId(paper.getId());
            paperQuestionMapper.insert(pq);
        }

        Exam exam = new Exam();
        exam.setPaperId(paper.getId());
        exam.setTitle("2024年春季学期数学期中考试");
        exam.setDescription("本考试检验学生本学期数学知识的掌握情况，请认真作答。");
        exam.setStartTime(LocalDateTime.now().minusHours(1));
        exam.setEndTime(LocalDateTime.now().plusDays(7));
        exam.setDuration(paper.getDuration());
        exam.setStatus(1);
        exam.setCreateBy(teacher.getId());
        examMapper.insert(exam);

        List<User> students = userMapper.selectList(new LambdaQueryWrapper<User>().eq(User::getRole, 2));
        for (User student : students) {
            ExamStudent es = new ExamStudent();
            es.setExamId(exam.getId());
            es.setUserId(student.getId());
            es.setStatus(0);
            examStudentMapper.insert(es);
        }
        log.info("Initialized 1 paper ({} questions, score: {}) and 1 exam ({} students).",
                totalCount, totalScore, students.size());
    }
}
