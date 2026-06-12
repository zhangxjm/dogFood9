import { PrismaClient } from "@prisma/client";
import CryptoJS from "crypto-js";

const prisma = new PrismaClient();

function sha256(content: string): string {
  return CryptoJS.SHA256(content).toString(CryptoJS.enc.Hex);
}

function hmacSha256(content: string, key: string = "copyright-system"): string {
  return CryptoJS.HmacSHA256(content, key).toString(CryptoJS.enc.Hex);
}

function randomTxHash(): string {
  return "0x" + sha256(Math.random().toString() + Date.now().toString());
}

function randomBlockNumber(): number {
  return Math.floor(1000000 + Math.random() * 9000000);
}

function generateCertNo(): string {
  const prefix = "CR";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${date}${random}`;
}

const sampleWorks = [
  {
    title: "《星河之梦》原创歌曲",
    type: "MUSIC",
    author: "张明",
    description: "一首描绘宇宙星河的流行电子音乐作品，融合了古典交响乐元素与现代电子合成器音色。",
    content: `星河之梦 - 词曲：张明

verse 1:
仰望星空 闪烁的光点
穿越亿万光年的思念
每一颗星都是一个梦
在黑暗中等待着黎明

chorus:
让我们追逐星河的梦
穿越时间的尽头
在宇宙的深处寻找
那属于我们的永恒

verse 2:
银河倾泻 洒满了夜空
月光下跳动的音符
旋律是灵魂的翅膀
带我们飞向远方`
  },
  {
    title: "《城市印象》纪录片",
    type: "VIDEO",
    author: "张明",
    description: "记录现代都市生活的人文纪录片，展现城市中不同人群的生活状态与情感故事。",
    content: `城市印象 - 纪录片脚本

第一幕：黎明
清晨五点的城市，街道空旷，只有清洁工和早餐摊主开始忙碌。第一缕阳光透过摩天大楼的缝隙，洒在柏油路上。

第二幕：早高峰
地铁里人潮涌动，每个人都有自己的目的地。耳机里的音乐、手机屏幕的光、疲倦却充满希望的脸庞。

第三幕：午间
写字楼底下的餐厅，上班族匆匆用餐。公园里有老人下棋，有孩子奔跑。

第四幕：黄昏
夕阳染红了天空，下班的人潮再次涌动。城市亮起了万家灯火。

第五幕：深夜
24小时便利店的灯光，加班族的身影，城市从不入眠。`
  },
  {
    title: "《时光旅人》长篇小说",
    type: "TEXT",
    author: "张明",
    description: "一部关于时间、记忆与爱的科幻小说，讲述主角穿越时空寻找失落记忆的故事。",
    content: `时光旅人

第一章 奇异的钟表店

林晓在城市最古老的巷子里发现了一家从未见过的钟表店。推开门，风铃发出清脆的声响，店内摆满了各式各样的钟表，每一个都指向不同的时间。

"欢迎来到时光当铺。"一个白发苍苍的老人从柜台后面抬起头，"你可以典当任何东西，换取你想要的时间。"

林晓笑了笑，以为这只是一家主题店。但当她的目光落在一块怀表上时，她发现指针正在逆时针转动...

第二章 第一次穿越

当林晓再次睁开眼睛，她发现自己站在1998年的街道上。她的父母正年轻，手牵着手走在梧桐树下，而她的母亲已经身怀六甲。

那是她出生的前一个月。

第三章 记忆的碎片

每一次穿越，林晓都能找回一段失去的记忆。那些被遗忘的童年、那些错过的告别、那些未曾说出口的话...

第四章 最后的选择

当她终于拼凑起所有的记忆，她面临一个选择：留在过去，与逝去的亲人团聚；还是回到现在，珍惜眼前的一切。

结局

林晓选择了现在。因为她终于明白，真正重要的不是改变过去，而是铭记过去，活好当下。`
  },
  {
    title: "《雨后的午后》钢琴曲",
    type: "MUSIC",
    author: "张明",
    description: "一首轻柔舒缓的钢琴独奏曲，描绘雨后午后阳光洒进窗台的宁静时光。",
    content: `雨后的午后 - 钢琴曲

调性：C大调
节奏：Andante 行板

主题A (第1-8小节):
右手以分解和弦开场，左手轻柔的根音伴奏，模仿雨滴落下的节奏。

主题B (第9-24小节):
旋律逐渐展开，更加如歌，仿佛云层散开，阳光出现。

发展部 (第25-40小节):
调性转为G大调，情绪逐渐高涨，描写彩虹出现的惊喜。

再现部 (第41-56小节):
回到主题A，但更加饱满，加入了更多和声色彩。

尾声 (第57-64小节):
逐渐减弱，最后一个和弦在寂静中消散。`
  },
  {
    title: "《未来之城》概念短片",
    type: "VIDEO",
    author: "张明",
    description: "科幻概念短片，描绘2080年人类与AI和谐共生的未来城市景象。",
    content: `未来之城 - 概念短片脚本

时长：5分钟
风格：科幻 / 治愈

镜头1 (0:00-0:30):
航拍视角，展示2080年的超级城市。垂直森林建筑覆盖着绿植，空中轨道上磁悬浮列车穿梭。

镜头2 (0:30-1:30):
主角陈博士走进实验室，AI助手阿雅以全息投影形式出现。他们讨论着即将进行的火星殖民计划。

镜头3 (1:30-3:00):
蒙太奇：城市中的人们与AI和谐共处。机器人协助残障人士出行，AI教师为山区孩子远程授课，医疗AI完成精密手术。

镜头4 (3:00-4:30):
陈博士站在巨大的落地窗前，望着远方正在建造的太空电梯。阿雅问他："博士，你害怕未来吗？" 陈博士微笑："未来是用来创造的。"

镜头5 (4:30-5:00):
镜头拉远，从城市到大陆，从地球到月球，最后定格在璀璨的银河。字幕出现："科技以人为本。"`
  },
  {
    title: "《算法之美》技术散文",
    type: "TEXT",
    author: "张明",
    description: "探讨计算机算法背后的数学之美与哲学思考，面向技术爱好者的科普文章。",
    content: `算法之美

一、引言

当我们谈论算法时，我们在谈论什么？是一串冰冷的代码？是复杂的数学公式？还是...一种别样的美？

二、排序：秩序的艺术

冒泡排序如潮水般一遍遍冲刷着无序的海滩，快速排序像一位精明的指挥官迅速划分战场。每一种排序算法都有它独特的个性和哲学。

三、搜索：在未知中寻找

二分查找是"分而治之"的优雅实践，深度优先搜索则像一个执着的探险家不断深入未知的洞穴。

四、图论：连接的力量

Dijkstra算法寻找最短路径，正如我们在人生的十字路口做出最优选择。最小生成树告诉我们：有时候，最简单的连接才是最坚固的。

五、结语

算法不仅是工具，更是人类智慧的结晶。在0和1的世界里，隐藏着无限的美学可能。当我们理解了算法之美，我们就在某种程度上理解了宇宙运行的规律。`
  }
];

const infringementSources = [
  { url: "https://pirate-site-a.com/content/101", title: "热门歌曲合集免费下载 - 星河之梦", similarity: 92 },
  { url: "https://video-sharing-b.net/watch/xyz123", title: "城市印象 纪录片完整在线观看", similarity: 87 },
  { url: "https://book-pirate-c.com/novel/789", title: "时光旅人 小说全文免费阅读", similarity: 95 },
  { url: "https://mp3-download-d.com/music/456", title: "钢琴曲精选 - 雨后的午后免费MP3", similarity: 78 },
  { url: "https://stream-e.org/play/abc", title: "科幻短片 未来之城 高清完整版", similarity: 83 },
  { url: "https://article-rip-f.cn/post/234", title: "算法之美 技术文章 转载", similarity: 65 }
];

async function main() {
  console.log("Seeding database...");

  const creator = await prisma.user.upsert({
    where: { email: "creator@copyright.com" },
    update: {},
    create: {
      id: "default-creator-uuid",
      name: "张明",
      email: "creator@copyright.com",
      role: "CREATOR",
      balance: 0
    }
  });

  const licensee = await prisma.user.upsert({
    where: { email: "licensee@copyright.com" },
    update: {},
    create: {
      id: "default-licensee-uuid",
      name: "李华",
      email: "licensee@copyright.com",
      role: "LICENSEE",
      balance: 10000
    }
  });

  console.log(`Users created: ${creator.name}, ${licensee.name}`);

  const createdWorks = [];

  for (let i = 0; i < sampleWorks.length; i++) {
    const w = sampleWorks[i];
    const contentHash = sha256(w.content);
    const txHash = randomTxHash();
    const blockNo = randomBlockNumber();
    const certNo = generateCertNo();

    const work = await prisma.work.upsert({
      where: { id: `seed-work-${i + 1}` },
      update: {},
      create: {
        id: `seed-work-${i + 1}`,
        title: w.title,
        type: w.type as any,
        author: w.author,
        description: w.description,
        content: w.content,
        contentHash,
        blockchainTxHash: txHash,
        blockchainBlockNumber: blockNo,
        certificateNo: certNo,
        status: "CONFIRMED",
        userId: creator.id
      }
    });

    createdWorks.push(work);
    console.log(`Work created: ${work.title}`);
  }

  const createdInfringements = [];
  for (let i = 0; i < Math.min(infringementSources.length, createdWorks.length); i++) {
    const src = infringementSources[i];
    const work = createdWorks[i];

    const riskLevel = src.similarity >= 80 ? "HIGH" : src.similarity >= 50 ? "MEDIUM" : "LOW";

    const infringement = await prisma.infringementRecord.upsert({
      where: { id: `seed-inf-${i + 1}` },
      update: {},
      create: {
        id: `seed-inf-${i + 1}`,
        workId: work.id,
        sourceUrl: src.url,
        sourceTitle: src.title,
        similarity: src.similarity,
        riskLevel: riskLevel as any,
        status: i < 3 ? "EVIDENCE_FIXED" : "DETECTED"
      }
    });

    createdInfringements.push(infringement);
    console.log(`Infringement created for: ${work.title}`);

    if (i < 3) {
      const snapshotData = JSON.stringify({
        sourceUrl: src.url,
        sourceTitle: src.title,
        similarity: src.similarity,
        workTitle: work.title,
        detectedAt: infringement.detectedAt.toISOString(),
        capturedAt: new Date().toISOString()
      });
      const evidenceHash = sha256(snapshotData);
      const signature = hmacSha256(evidenceHash);
      const evTxHash = randomTxHash();

      await prisma.evidence.upsert({
        where: { id: `seed-ev-${i + 1}` },
        update: {},
        create: {
          id: `seed-ev-${i + 1}`,
          infringementId: infringement.id,
          workId: work.id,
          evidenceHash,
          blockchainTxHash: evTxHash,
          timestamp: new Date(),
          contentSnapshot: snapshotData,
          digitalSignature: signature,
          status: "CHAIN_CONFIRMED"
        }
      });
      console.log(`Evidence fixed for: ${work.title}`);
    }
  }

  const licensePrices = [1200, 800, 2500];
  const licenseDurations = [365, 180, 730];
  const licenseTypes: any[] = ["EXCLUSIVE", "NON_EXCLUSIVE", "NON_EXCLUSIVE"];

  for (let i = 0; i < 3; i++) {
    const work = createdWorks[i];
    const price = licensePrices[i];
    const duration = licenseDurations[i];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const license = await prisma.license.upsert({
      where: { id: `seed-lic-${i + 1}` },
      update: {},
      create: {
        id: `seed-lic-${i + 1}`,
        workId: work.id,
        licensorId: creator.id,
        licenseeId: licensee.id,
        type: licenseTypes[i],
        price,
        duration,
        startDate,
        endDate,
        status: "ACTIVE"
      }
    });

    const platformFee = Math.round(price * 0.1 * 100) / 100;
    const netAmount = Math.round((price - platformFee) * 100) / 100;

    await prisma.royaltySettlement.upsert({
      where: { id: `seed-roy-${i + 1}` },
      update: {},
      create: {
        id: `seed-roy-${i + 1}`,
        licenseId: license.id,
        workId: work.id,
        amount: price,
        platformFee,
        netAmount,
        status: "SETTLED",
        settledAt: new Date()
      }
    });

    await prisma.user.update({
      where: { id: creator.id },
      data: { balance: { increment: netAmount } }
    });

    console.log(`License created: ${work.title} -> ¥${price}`);
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
