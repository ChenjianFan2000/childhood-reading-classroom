(function (root) {
  'use strict';
  // Short quotations and researched reading notes have distinct text identities.
  // Longer edition-specific diary excerpts can replace pages without changing navigation.
  const scenes = {
    annecontext: {
      pages: [
        {
          title: '窗外的街道，不能走出去',
          kind: '背景阅读',
          blocks: [
            {kind: 'prose', source: 'annePeople', text: '第二次世界大战期间，犹太女孩安妮·弗兰克为了躲避纳粹迫害，和家人在荷兰阿姆斯特丹藏匿。1942年至1944年，包括安妮一家在内的八个人，依靠帮助者维持藏身生活。'},
            {kind: 'prose', source: 'annePeople', text: '食物、衣物和书报需要从外面送进来。窗外仍有街道和人们的日常生活，但躲藏的人不能像从前那样出门。屋内有人陪伴，并不意味着屋外已经安全。'}
          ]
        },
        {
          title: '一天，从保持安静开始',
          kind: '背景阅读 · 安妮的短引文',
          blocks: [
            {kind: 'prose', source: 'anneDay', text: '上午八点半，楼下仓库的工人开始工作，知情的办公室帮助者还没有到。躲藏的人必须格外小心，因为楼下的人不知道他们就在头顶。'},
            {kind: 'quote', source: 'anneQuiet', text: '一滴水也不能放，不能上厕所，不能走动，一切都要安静。', speaker: '安妮写下的话'},
            {kind: 'prose', source: 'anneDay', text: '九点以后，帮助者来到办公室，藏匿者仍要轻声活动。阅读和学习占据了上午的许多时间。等到天黑，窗户还必须遮严，屋里再次安静下来。'}
          ]
        }
      ]
    },
    annehelp: {
      pages: [
        {
          title: '帮助，怎样来到房间里',
          kind: '背景阅读',
          blocks: [
            {kind: 'prose', source: 'annePeople', text: '六位帮助者把藏身处和外面的世界联系起来。他们送来食物、衣物、书籍、杂志和报纸。每一种物品，都对应着房间里真实的生活需要。'},
            {kind: 'prose', source: 'anneDay', text: '午间，楼下的工人离开后，一些帮助者会来到藏身处，和大家一起吃午饭，带来城里的消息。帮助不只是一句安慰，也体现在反复奔走、送来物品和相聚的时间里。'}
          ],
          illustration: 'help'
        }
      ]
    },
    annewish: {
      pages: [
        {
          title: '安静，并不总是安宁',
          kind: '背景阅读 · 安妮的短引文',
          blocks: [
            {kind: 'prose', source: 'anneDay', text: '藏身处的星期日有另一种节奏：清扫、洗衣、整理床铺，听广播，再休息。安妮却觉得星期日尤其难熬。活动仍被限制在楼里，漫长的安静不能让她忘记外面的生活。'},
            {kind: 'quote', source: 'anneDay', text: '外面，新鲜的空气和笑声！', speaker: '安妮心里的呼喊'},
            {kind: 'prose', source: 'anneDay', text: '把这样的日常放在心里，再读她写下的愿望。留意那些平常的动作：它们要在怎样的生活里，才会成为随时可以做的事？'}
          ]
        },
        {
          title: '她渴望的，是怎样的生活？',
          kind: '日记短引',
          blocks: [
            {kind: 'quote', source: 'anneFreedom', text: '我渴望骑车、跳舞、吹口哨，看看世界，感受青春，知道自己是自由的。', interactive: 'wishes'}
          ],
          illustration: 'wishes',
          prompt: '读出一种普通的愿望，也读出它需要的条件。'
        }
      ]
    },
    yamen: {
      pages: [
        {
          title: '他想回到学校',
          kind: '报道阅读 · 短引文与内容整理',
          blocks: [
            {kind: 'prose', source: 'yamen', text: '在联合国儿童基金会这篇关于加沙的报道中，亚门仍在学习。他的母亲是一名教师，在家里教他功课。学习之外，他还要取水，收集做饭用的木柴。'},
            {kind: 'quote', source: 'yamen', text: '我想念上学的日子，很想重新接受教育。', speaker: '亚门'},
            {kind: 'quote', source: 'yamen', text: '妈妈是一名教师，她在家里教我。', speaker: '亚门'}
          ]
        },
        {
          title: '有人教他，学校仍然重要',
          kind: '报道内容整理',
          blocks: [
            {kind: 'prose', source: 'yamen', text: '父亲肯定母亲为弥补孩子失学所作的努力，也指出家庭教学的局限：在合适的教室里与同伴一起学习，仍然无法被完全替代。'},
            {kind: 'prose', source: 'yamen', text: '报道还写到，一些没有被毁坏的学校被用作避难处。许多孩子的生活被取水、搬运和照顾弟妹占据；重新找到学习的地方，又可能因新的撤离而中断。'},
            {kind: 'prose', source: 'yamen', text: '家庭和社区正在尝试恢复学习。对这些孩子来说，需要回来的不仅是课本，还有能够安稳学习、与同伴相处的日常。'}
          ]
        }
      ]
    },
    varvara: {
      pages: [
        {
          title: '妈妈点亮了蜡烛',
          kind: '报道内容整理',
          blocks: [
            {kind: 'prose', source: 'varvara', text: '报道中的瓦尔瓦拉当时七岁，住在乌克兰布恰。停电时，母亲点起蜡烛，让她和哥哥继续读书、写作业。'},
            {kind: 'prose', source: 'varvara', text: '她喜欢的童话里，有一只害怕春天到来的狐狸。她自己却盼着冬天赶快结束：家中供暖依赖电力，战争造成的停电让房间既暗又冷。'},
            {kind: 'prose', source: 'varvara', text: '哥哥在烛光下学习英语。母亲仍设法照顾他们，可是几支蜡烛能照亮作业本，不能恢复整栋楼的供暖。'}
          ]
        },
        {
          title: '她还需要一个安稳的夜晚',
          kind: '报道阅读 · 短引文与内容整理',
          blocks: [
            {kind: 'quote', source: 'varvara', text: '没有灯光，我就睡不着。', speaker: '瓦尔瓦拉'},
            {kind: 'quote', source: 'varvara', text: '有时我害怕走过走廊，因为那里没有灯光。', speaker: '瓦尔瓦拉'},
            {kind: 'prose', source: 'varvara', text: '她借助手电筒和蜡烛阅读、写作业，也用它们在家里找路。白天，学校的课程还常被防空警报打断。读书、取暖和睡觉，这些普通的事都受到战争影响。'}
          ]
        }
      ]
    }
  };
  const sources = {
    annePeople: {title:'The main characters',publisher:'Anne Frank House',url:'https://www.annefrank.org/en/anne-frank/main-characters/',status:'背景整理；不是安妮日记原文。八名藏匿者、六位帮助者及物品种类也见用户提供的完整教案。'},
    anneDay: {title:'A typical day in the Secret Annex',publisher:'Anne Frank House',url:'https://www.annefrank.org/en/anne-frank/go-in-depth/typical-day-secret-annex/',status:'日常作息据馆方说明整理；“外面，新鲜的空气和笑声！”是其中所引安妮文字的短句工作译文。阅读提示为教师编写。'},
    anneQuiet: {title:'The Secret Annex — When the people in hiding had to be quiet, Otto Frank read Dickens',publisher:'Anne Frank House',url:'https://www.annefrank.org/en/anne-frank/secret-annex/entrance/',status:'安妮短文相关引句的课堂工作译文；馆方注明1943年8月6日短文、1943年8月23日日记收录，不冒充中文出版译本。'},
    anneFreedom: {title:'EXTRA Freedom',publisher:'Anne Frank House',url:'https://www.annefrank.org/media/filer_public/d9/b4/d9b451a0-5471-4789-8ead-ea417eebeecb/afvd_werkblad_vo_5_vrijheid-en.pdf',status:'1943年12月24日日记短引，沿用用户提供教案的课堂工作译文。'},
    yamen: {title:'Hope amid the rubble – Restoring learning in the Gaza Strip',publisher:'UNICEF',author:'Jane Courtney',published:'2024-09-10',url:'https://www.unicef.org/blog/hope-amid-rubble-restoring-learning-gaza-strip',status:'有引号的两句是亚门采访短引的工作译文；其余为报道内容整理，不是逐字翻译。照片为亚门与父亲；不补写未报道的年龄。'},
    varvara: {title:'As winter bites, needs intensify for families in Ukraine',publisher:'UNICEF',published:'2022-12-19',url:'https://www.unicef.org/ukraine/en/stories/needs-intensify-for-families-in-ukraine',status:'有引号的两句是瓦尔瓦拉采访短引的工作译文；其余为报道内容整理。“七岁”为报道当时年龄；照片不是烛光阅读现场。'}
  };
  const api = {scenes,sources};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LESSON_READING = api;
})(typeof window === 'object' ? window : this);
