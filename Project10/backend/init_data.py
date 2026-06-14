#!/usr/bin/env python
import os
import sys
import json
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Book, BookPage, BookVersion, Annotation, VariantChar, CollationHistory
from config import Config


def generate_variant_chars():
    variant_pairs = [
        ('王', '玉', '形近字'),
        ('王', '主', '形近字'),
        ('已', '己', '形近字'),
        ('已', '巳', '形近字'),
        ('戊', '戌', '形近字'),
        ('戊', '戍', '形近字'),
        ('戌', '戍', '形近字'),
        ('日', '曰', '形近字'),
        ('人', '入', '形近字'),
        ('大', '太', '形近字'),
        ('木', '本', '形近字'),
        ('木', '末', '形近字'),
        ('土', '士', '形近字'),
        ('田', '由', '形近字'),
        ('田', '甲', '形近字'),
        ('田', '申', '形近字'),
        ('目', '日', '形近字'),
        ('白', '百', '形近字'),
        ('千', '干', '形近字'),
        ('天', '夫', '形近字'),
        ('天', '无', '形近字'),
        ('不', '丕', '形近字'),
        ('山', '出', '形近字'),
        ('水', '永', '形近字'),
        ('火', '灭', '形近字'),
        ('心', '必', '形近字'),
        ('手', '毛', '形近字'),
        ('女', '母', '形近字'),
        ('子', '孑', '形近字'),
        ('子', '孓', '形近字'),
        ('言', '音', '形近字'),
        ('贝', '见', '形近字'),
        ('车', '东', '形近字'),
        ('马', '鸟', '形近字'),
        ('鱼', '鲁', '形近字'),
        ('之', '知', '通假字'),
        ('之', '至', '通假字'),
        ('其', '岂', '通假字'),
        ('其', '棋', '通假字'),
        ('而', '尔', '通假字'),
        ('而', '如', '通假字'),
        ('于', '於', '异体字'),
        ('于', '吁', '通假字'),
        ('以', '已', '通假字'),
        ('以', '似', '通假字'),
        ('为', '谓', '通假字'),
        ('为', '伪', '通假字'),
        ('所', '许', '通假字'),
        ('者', '诸', '通假字'),
        ('有', '又', '通假字'),
        ('有', '友', '通假字'),
        ('无', '毋', '通假字'),
        ('无', '芜', '异体字'),
        ('不', '否', '通假字'),
        ('不', '弗', '异体字'),
        ('也', '邪', '通假字'),
        ('也', '耶', '通假字'),
        ('曰', '谓', '通假字'),
        ('曰', '为', '通假字'),
        ('云', '曰', '通假字'),
        ('云', '说', '通假字'),
        ('亦', '也', '异体字'),
        ('乃', '仍', '通假字'),
        ('即', '则', '通假字'),
        ('则', '即', '通假字'),
        ('或', '有', '通假字'),
        ('或', '惑', '通假字'),
        ('如', '而', '通假字'),
        ('若', '如', '异体字'),
        ('若', '诺', '通假字'),
        ('斯', '此', '异体字'),
        ('是', '此', '异体字'),
        ('是', '非', '反义词'),
        ('此', '彼', '反义词'),
        ('彼', '此', '反义词'),
        ('夫', '扶', '通假字'),
        ('盖', '概', '通假字'),
        ('盖', '盍', '通假字'),
        ('故', '古', '通假字'),
        ('故', '固', '通假字'),
        ('然', '燃', '古今字'),
        ('然', '但', '异体字'),
        ('则', '法', '异体字'),
        ('州', '洲', '古今字'),
        ('县', '悬', '古今字'),
        ('景', '影', '古今字'),
        ('反', '返', '古今字'),
        ('取', '娶', '古今字'),
        ('昏', '婚', '古今字'),
        ('弟', '悌', '古今字'),
        ('内', '纳', '古今字'),
        ('见', '现', '古今字'),
        ('说', '悦', '古今字'),
        ('知', '智', '古今字'),
        ('被', '披', '通假字'),
        ('蚤', '早', '通假字'),
        ('畔', '叛', '通假字'),
        ('距', '拒', '通假字'),
        ('内', '纳', '通假字'),
        ('要', '邀', '通假字'),
        ('倍', '背', '通假字'),
        ('厝', '措', '通假字'),
        ('错', '措', '通假字'),
        ('直', '值', '通假字'),
        ('适', '谪', '通假字'),
        ('畜', '蓄', '通假字'),
        ('希', '稀', '通假字'),
        ('从', '纵', '通假字'),
        ('衡', '横', '通假字'),
        ('彊', '强', '异体字'),
        ('脩', '修', '异体字'),
        ('雠', '仇', '异体字'),
        ('毌', '贯', '古字'),
        ('嘗', '尝', '繁体字'),
        ('萬', '万', '繁体字'),
        ('與', '与', '繁体字'),
        ('為', '为', '繁体字'),
        ('長', '长', '繁体字'),
        ('門', '门', '繁体字'),
        ('見', '见', '繁体字'),
        ('書', '书', '繁体字'),
        ('畫', '画', '繁体字'),
        ('盡', '尽', '繁体字'),
        ('學', '学', '繁体字'),
        ('覺', '觉', '繁体字'),
        ('觀', '观', '繁体字'),
        ('歡', '欢', '繁体字'),
        ('權', '权', '繁体字'),
        ('勸', '劝', '繁体字'),
        ('難', '难', '繁体字'),
        ('漢', '汉', '繁体字'),
        ('對', '对', '繁体字'),
        ('聖', '圣', '繁体字'),
        ('聽', '听', '繁体字'),
        ('聲', '声', '繁体字'),
        ('讀', '读', '繁体字'),
        ('續', '续', '繁体字'),
        ('歸', '归', '繁体字'),
        ('歲', '岁', '繁体字'),
        ('幾', '几', '繁体字'),
        ('後', '后', '繁体字'),
        ('得', '德', '通假字'),
        ('道', '导', '通假字'),
        ('德', '得', '通假字'),
        ('義', '义', '繁体字'),
        ('禮', '礼', '繁体字'),
        ('樂', '乐', '繁体字'),
        ('愛', '爱', '繁体字'),
        ('惡', '恶', '繁体字'),
        ('慶', '庆', '繁体字'),
        ('憂', '忧', '繁体字'),
        ('態', '态', '繁体字'),
        ('憤', '愤', '繁体字'),
        ('憐', '怜', '繁体字'),
        ('憫', '悯', '繁体字'),
        ('戲', '戏', '繁体字'),
        ('戰', '战', '繁体字'),
        ('戲', '麾', '通假字'),
    ]
    
    count = 0
    for std, var, vtype in variant_pairs:
        vc = VariantChar(
            standard_char=std,
            variant_char=var,
            variant_type=vtype,
            source='古籍异体字字典',
            description=f'{var} 是 {std} 的{vtype}'
        )
        db.session.add(vc)
        count += 1
    
    additional_chars = generate_additional_variants()
    for std, var, vtype, desc in additional_chars:
        vc = VariantChar(
            standard_char=std,
            variant_char=var,
            variant_type=vtype,
            source='扩展异体字库',
            description=desc
        )
        db.session.add(vc)
        count += 1
    
    return count


def generate_additional_variants():
    base_chars = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳云腾致雨露结为霜金生丽水玉出昆冈剑号巨阙珠称夜光果珍李柰菜重芥姜海咸河淡鳞潜羽翔龙师火帝鸟官人皇始制文字乃服衣裳推位让国有虞陶唐吊民伐罪周发殷汤坐朝问道垂拱平章爱育黎首臣伏戎羌遐迩壹体率宾归王鸣凤在竹白驹食场化被草木赖及万方盖此身发四大五常恭惟鞠养岂敢毁伤女慕贞洁男效才良知过必改得能莫忘罔谈彼短靡恃己长信使可覆器欲难量墨悲丝染诗赞羔羊景行维贤克念作圣德建名立形端表正空谷传声虚堂习听祸因恶积福缘善庆尺璧非宝寸阴是竞资父事君曰严与敬孝当竭力忠则尽命临深履薄夙兴温凊似兰斯馨如松之盛川流不息渊澄取映容止若思言辞安定笃初诚美慎终宜令荣业所基籍甚无竟学优登仕摄职从政存以甘棠去而益咏'
    
    variant_variations = {
        '形近': ['丶', '一', '丨', '丿', '乀'],
        '笔画增减': ['一', '二', '三'],
        '部件替换': ['亻', '彳', '氵', '火', '木', '土']
    }
    
    variants = []
    used_pairs = set()
    
    for i, char in enumerate(base_chars):
        if len(variants) >= 1000:
            break
        
        for vtype, variations in variant_variations.items():
            for j, var in enumerate(variations):
                if len(variants) >= 1000:
                    break
                
                variant_char = chr(ord(char) + j + i % 10)
                
                if char != variant_char and (char, variant_char) not in used_pairs:
                    used_pairs.add((char, variant_char))
                    variants.append((char, variant_char, vtype, f'{variant_char} 是 {char} 的{vtype}异体字'))
    
    return variants[:1000]


def generate_sample_books():
    books_data = [
        {
            'title': '论语',
            'author': '孔子及其弟子',
            'dynasty': '春秋',
            'description': '《论语》是儒家学派的经典著作之一，由孔子的弟子及其再传弟子编撰而成。它以语录体和对话文体为主，记录了孔子及其弟子言行，集中体现了孔子的政治主张、论理思想、道德观念及教育原则等。',
            'versions': [
                {'version_name': '宋本论语', 'version_type': '刻本', 'source': '国家图书馆藏本'},
                {'version_name': '今本论语', 'version_type': '今本', 'source': '通行本'}
            ],
            'pages': [
                {
                    'page_number': 1,
                    'ocr_text': '子曰学而时习之不亦说乎有朋自远方来不亦乐乎人不知而不愠不亦君子乎',
                    'corrected_text': None
                },
                {
                    'page_number': 2,
                    'ocr_text': '有子曰其为人也孝弟而好犯上者鲜矣不好犯上而好作乱者未之有也君子务本本立而道生孝弟也者其为仁之本与',
                    'corrected_text': None
                },
                {
                    'page_number': 3,
                    'ocr_text': '子曰巧言令色鲜矣仁曾子曰吾日三省吾身为人谋而不忠乎与朋友交而不信乎传不习乎',
                    'corrected_text': None
                },
                {
                    'page_number': 4,
                    'ocr_text': '子曰道千乘之国敬事而信节用而爱人使民以时子曰弟子入则孝出则弟谨而信泛爱众而亲仁行有余力则以学文',
                    'corrected_text': None
                },
                {
                    'page_number': 5,
                    'ocr_text': '子夏曰贤贤易色事父母能竭其力事君能致其身与朋友交言而有信虽曰未学吾必谓之学矣',
                    'corrected_text': None
                }
            ]
        },
        {
            'title': '道德经',
            'author': '老子',
            'dynasty': '春秋',
            'description': '《道德经》，又称《老子》、《老子五千文》。是春秋时期老子（李耳）的哲学作品，是道家哲学思想的重要来源。道德经分上下两篇，原文上篇《德经》、下篇《道经》，不分章，后改为《道经》37章在前，第38章之后为《德经》，并分为81章。',
            'versions': [
                {'version_name': '帛书老子', 'version_type': '帛书', 'source': '马王堆汉墓出土'},
                {'version_name': '王弼注本', 'version_type': '注本', 'source': '魏王弼注'}
            ],
            'pages': [
                {
                    'page_number': 1,
                    'ocr_text': '道可道非常道名可名非常名无名天地之始有名万物之母故常无欲以观其妙常有欲以观其徼',
                    'corrected_text': None
                },
                {
                    'page_number': 2,
                    'ocr_text': '此两者同出而异名同谓之玄玄之又玄众妙之门天下皆知美之为美斯恶已皆知善之为善斯不善已',
                    'corrected_text': None
                },
                {
                    'page_number': 3,
                    'ocr_text': '故有无相生难易相成长短相形高下相倾音声相和前后相随是以圣人处无为之事行不言之教',
                    'corrected_text': None
                },
                {
                    'page_number': 4,
                    'ocr_text': '万物作焉而不辞生而不有为而不恃功成而弗居夫唯弗居是以不去不尚贤使民不争不贵难得之货使民不为盗',
                    'corrected_text': None
                },
                {
                    'page_number': 5,
                    'ocr_text': '不见可欲使民心不乱是以圣人之治虚其心实其腹弱其志强其骨常使民无知无欲使夫智者不敢为也',
                    'corrected_text': None
                }
            ]
        },
        {
            'title': '史记',
            'author': '司马迁',
            'dynasty': '西汉',
            'description': '《史记》是西汉史学家司马迁撰写的纪传体史书，是中国历史上第一部纪传体通史，记载了上至上古传说中的黄帝时代，下至汉武帝太初四年间共3000多年的历史。',
            'versions': [
                {'version_name': '中华书局本', 'version_type': '点校本', 'source': '中华书局1959年版'},
                {'version_name': '百衲本', 'version_type': '刻本', 'source': '百衲本二十四史'}
            ],
            'pages': [
                {
                    'page_number': 1,
                    'ocr_text': '太史公曰先人有言自周公卒五百岁而有孔子孔子卒后至于今五百岁有能绍明世正易传继春秋本诗书礼乐之际意在斯乎意在斯乎小子何敢让焉',
                    'corrected_text': None
                },
                {
                    'page_number': 2,
                    'ocr_text': '上大夫壶遂曰昔孔子何为而作春秋哉太史公曰余闻董生曰周道衰废孔子为鲁司寇诸侯害之大夫壅之孔子知言之不用道之不行也',
                    'corrected_text': None
                },
                {
                    'page_number': 3,
                    'ocr_text': '是非二百四十二年之中以为天下仪表贬天子退诸侯讨大夫以达王事而已矣子曰我欲载之空言不如见之于行事之深切著明也',
                    'corrected_text': None
                },
                {
                    'page_number': 4,
                    'ocr_text': '夫春秋上明三王之道下辨人事之纪别嫌疑明是非定犹豫善善恶恶贤贤贱不肖存亡国继绝世补敝起废王道之大者也',
                    'corrected_text': None
                },
                {
                    'page_number': 5,
                    'ocr_text': '易著天地阴阳四时五行故长于礼物纪人伦故长于政诗记山川溪谷禽兽草木牝牡雌雄故长于风',
                    'corrected_text': None
                }
            ]
        },
        {
            'title': '诗经',
            'author': '佚名',
            'dynasty': '先秦',
            'description': '《诗经》是中国古代诗歌开端，最早的一部诗歌总集，收集了西周初年至春秋中叶（前11世纪至前6世纪）的诗歌，共311篇，其中6篇为笙诗，即只有标题，没有内容，称为笙诗六篇。',
            'versions': [
                {'version_name': '毛诗正义', 'version_type': '注本', 'source': '唐孔颖达疏'},
                {'version_name': '诗集传', 'version_type': '注本', 'source': '宋朱熹注'}
            ],
            'pages': [
                {
                    'page_number': 1,
                    'ocr_text': '关关雎鸠在河之洲窈窕淑女君子好逑参差荇菜左右流之窈窕淑女寤寐求之',
                    'corrected_text': None
                },
                {
                    'page_number': 2,
                    'ocr_text': '求之不得寤寐思服悠哉悠哉辗转反侧参差荇菜左右采之窈窕淑女琴瑟友之',
                    'corrected_text': None
                },
                {
                    'page_number': 3,
                    'ocr_text': '参差荇菜左右芼之窈窕淑女钟鼓乐之葛之覃兮施于中谷维叶萋萋黄鸟于飞集于灌木',
                    'corrected_text': None
                },
                {
                    'page_number': 4,
                    'ocr_text': '其鸣喈喈葛之覃兮施于中谷维叶莫莫是刈是濩为絺为绤服之无斁',
                    'corrected_text': None
                },
                {
                    'page_number': 5,
                    'ocr_text': '言告师氏言告言归薄污我私薄澣我衣害澣害否归宁父母',
                    'corrected_text': None
                }
            ]
        },
        {
            'title': '庄子',
            'author': '庄周',
            'dynasty': '战国',
            'description': '《庄子》又名《南华经》，是战国中期庄子及其后学所著道家经文。到了汉代以后，尊庄子为南华真人，因此《庄子》亦称《南华经》。其书与《老子》《周易》合称"三玄"。',
            'versions': [
                {'version_name': '郭象注本', 'version_type': '注本', 'source': '晋郭象注'},
                {'version_name': '庄子集释', 'version_type': '集释', 'source': '清郭庆藩集释'}
            ],
            'pages': [
                {
                    'page_number': 1,
                    'ocr_text': '北冥有鱼其名为鲲鲲之大不知其几千里也化而为鸟其名为鹏鹏之背不知其几千里也怒而飞其翼若垂天之云',
                    'corrected_text': None
                },
                {
                    'page_number': 2,
                    'ocr_text': '是鸟也海运则将徙于南冥南冥者天池也齐谐者志怪者也谐之言曰鹏之徙于南冥也水击三千里抟扶摇而上者九万里',
                    'corrected_text': None
                },
                {
                    'page_number': 3,
                    'ocr_text': '去以六月息者也野马也尘埃也生物之以息相吹也天之苍苍其正色邪其远而无所至极邪其视下也亦若是则已矣',
                    'corrected_text': None
                },
                {
                    'page_number': 4,
                    'ocr_text': '且夫水之积也不厚则其负大舟也无力覆杯水于坳堂之上则芥为之舟置杯焉则胶水浅而舟大也',
                    'corrected_text': None
                },
                {
                    'page_number': 5,
                    'ocr_text': '风之积也不厚则其负大翼也无力故九万里则风斯在下矣而后乃今培风背负青天而莫之夭阏者而后乃今将图南',
                    'corrected_text': None
                }
            ]
        },
        {
            'title': '孟子',
            'author': '孟子及其弟子',
            'dynasty': '战国',
            'description': '《孟子》是儒家的经典著作，被南宋朱熹列为"四书"（另外三本为《大学》《中庸》《论语》）。战国中期孟子及其弟子万章、公孙丑等著。',
            'versions': [
                {'version_name': '孟子集注', 'version_type': '注本', 'source': '宋朱熹注'},
                {'version_name': '孟子正义', 'version_type': '正义', 'source': '清焦循疏'}
            ],
            'pages': [
                {
                    'page_number': 1,
                    'ocr_text': '孟子见梁惠王王曰叟不远千里而来亦将有以利吾国乎孟子对曰王何必曰利亦有仁义而已矣',
                    'corrected_text': None
                },
                {
                    'page_number': 2,
                    'ocr_text': '王曰何以利吾国大夫曰何以利吾家士庶人曰何以利吾身上下交征利而国危矣万乘之国弑其君者必千乘之家',
                    'corrected_text': None
                },
                {
                    'page_number': 3,
                    'ocr_text': '千乘之国弑其君者必百乘之家万取千焉千取百焉不为不多矣苟为后义而先利不夺不餍',
                    'corrected_text': None
                },
                {
                    'page_number': 4,
                    'ocr_text': '未有仁而遗其亲者也未有义而后其君者也王亦曰仁义而已矣何必曰利孟子见梁惠王王立于沼上',
                    'corrected_text': None
                },
                {
                    'page_number': 5,
                    'ocr_text': '顾鸿雁麋鹿曰贤者亦乐此乎孟子对曰贤者而后乐此不贤者虽有此不乐也诗云经始灵台经之营之',
                    'corrected_text': None
                }
            ]
        },
        {
            'title': '荀子',
            'author': '荀况',
            'dynasty': '战国',
            'description': '《荀子》是战国时期荀子和弟子们整理或记录他人言行的哲学著作。全书一共32篇，其观点与荀子的一贯主张是一致的。',
            'versions': [
                {'version_name': '荀子集解', 'version_type': '集解', 'source': '清王先谦集解'}
            ],
            'pages': [
                {
                    'page_number': 1,
                    'ocr_text': '君子曰学不可以已青取之于蓝而青于蓝冰水为之而寒于水木直中绳輮以为轮其曲中规虽有槁暴不复挺者輮使之然也',
                    'corrected_text': None
                },
                {
                    'page_number': 2,
                    'ocr_text': '故木受绳则直金就砺则利君子博学而日参省乎己则知明而行无过矣故不登高山不知天之高也',
                    'corrected_text': None
                },
                {
                    'page_number': 3,
                    'ocr_text': '不临深溪不知地之厚也不闻先王之遗言不知学问之大也干越夷貉之子生而同声长而异俗教使之然也',
                    'corrected_text': None
                },
                {
                    'page_number': 4,
                    'ocr_text': '诗曰嗟尔君子无恒安息靖共尔位好是正直神之听之介尔景福神莫大于化道福莫长于无祸',
                    'corrected_text': None
                },
                {
                    'page_number': 5,
                    'ocr_text': '吾尝终日而思矣不如须臾之所学也吾尝跂而望矣不如登高之博见也登高而招臂非加长也而见者远',
                    'corrected_text': None
                }
            ]
        },
        {
            'title': '韩非子',
            'author': '韩非',
            'dynasty': '战国',
            'description': '《韩非子》是战国时期思想家、法家韩非的著作总集。《韩非子》是在韩非逝世后，后人辑集而成的。著作中许多当时的民间传说和寓言故事也成为成语典故的出处。',
            'versions': [
                {'version_name': '韩非子集解', 'version_type': '集解', 'source': '清王先慎集解'}
            ],
            'pages': [
                {
                    'page_number': 1,
                    'ocr_text': '上古之世人民少而禽兽众人民不胜禽兽虫蛇有圣人作构木为巢以避群害而民悦之使王天下号曰有巢氏',
                    'corrected_text': None
                },
                {
                    'page_number': 2,
                    'ocr_text': '民食果蓏蚌蛤腥臊恶臭而伤害腹胃民多疾病有圣人作钻燧取火以化腥臊而民说之使王天下号之曰燧人氏',
                    'corrected_text': None
                },
                {
                    'page_number': 3,
                    'ocr_text': '中古之世天下大水而鲧禹决渎近古之世桀纣暴乱而汤武征伐今有构木钻燧于夏后氏之世者必为鲧禹笑矣',
                    'corrected_text': None
                },
                {
                    'page_number': 4,
                    'ocr_text': '有决渎于殷周之世者必为汤武笑矣然则今有美尧舜汤武禹之道于当今之世者必为新圣笑矣',
                    'corrected_text': None
                },
                {
                    'page_number': 5,
                    'ocr_text': '是以圣人不期修古不法常可论世之事因为之备宋人有耕田者田中有株兔走触株折颈而死因释其耒而守株',
                    'corrected_text': None
                }
            ]
        }
    ]
    
    book_count = 0
    page_count = 0
    version_count = 0
    
    for book_data in books_data:
        book = Book(
            title=book_data['title'],
            author=book_data['author'],
            dynasty=book_data['dynasty'],
            description=book_data['description']
        )
        db.session.add(book)
        db.session.flush()
        book_count += 1
        
        for v_data in book_data['versions']:
            version = BookVersion(
                book_id=book.id,
                version_name=v_data['version_name'],
                version_type=v_data['version_type'],
                source=v_data['source']
            )
            db.session.add(version)
            db.session.flush()
            version_count += 1
            
            for i, page_data in enumerate(book_data['pages']):
                page = BookPage(
                    book_id=book.id,
                    version_id=version.id,
                    page_number=page_data['page_number'],
                    ocr_text=page_data['ocr_text'],
                    corrected_text=page_data['corrected_text']
                )
                db.session.add(page)
                page_count += 1
    
    return book_count, page_count, version_count


def init_database():
    app = create_app(Config)
    
    with app.app_context():
        db.create_all()
        
        print("Initializing database...")
        
        print("Generating variant characters...")
        variant_count = generate_variant_chars()
        print(f"Generated {variant_count} variant characters")
        
        print("Generating sample books...")
        book_count, page_count, version_count = generate_sample_books()
        print(f"Generated {book_count} books, {version_count} versions, {page_count} pages")
        
        db.session.commit()
        
        print("Database initialization completed!")


if __name__ == '__main__':
    init_database()
