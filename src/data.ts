export type WorldKey = 'home'|'story'|'yeye'|'memories'|'map'|'quests'|'letters'|'hidden';
export const chapters = [
 {n:'序章',title:'两个原本互不相干的人',meta:'故事开始以前',text:'在那条走廊出现以前，我们拥有两张完全不同的地图。'},
 {n:'第一章',title:'随机相遇',meta:'雅加达 · 酒店走廊',text:'门刚合上，就遇见了她。她先开口：“你也是一起去吃饭的吗？”'},
 {n:'第二章',title:'Bromo',meta:'世纪大合照',text:'火山、清晨、被风吹乱的衣角。下山时，一个新的称呼第一次出现。'},
 {n:'第三章',title:'好像有点不一样了',meta:'Maybe',text:'第一次牵手。向导问：“她是你女朋友吗？” 回答像一句提前写好的预言。'},
 {n:'第四章',title:'信号错位',meta:'案件 001',text:'线索明明到处都是，她却一直以为，我喜欢的是别人。'},
 {n:'第五章',title:'旅行结束以后',meta:'两个城市 · 同一场夜聊',text:'旅行散场以后，故事没有结束。我们终于在深夜里确认了彼此的心意。'},
 {n:'第六章',title:'广州',meta:'第一次专程见面',text:'城市不再只是地名，它成为一次朝彼此走去。'},
 {n:'第七章',title:'长沙',meta:'甜蜜之外',text:'第一次明显的危机，也第一次认真看见关系真实的重量。'},
 {n:'第八章',title:'终于组队成功',meta:'五一 · 双人模式',text:'经历一点波折以后，我们终于正式站到了同一支队伍里。'},
 {n:'第九章',title:'低能量时期',meta:'六月',text:'虽然那段时间我很难受，但有你在的时候，总觉得一切都没事。'},
 {n:'第十章',title:'短暂离线',meta:'七月',text:'那几天让我意识到：原来我比自己想象中，还要喜欢你。'}
];
export const zones = [
 {key:'story' as WorldKey,no:'01',title:'双生之境',sub:'主线故事 · 10 个章节',symbol:'☾',featured:true},
 {key:'yeye' as WorldKey,no:'02',title:'椰椰档案',sub:'特殊玩家 · 了解进度 37%',symbol:'✦'},
 {key:'memories' as WorldKey,no:'03',title:'记忆档案馆',sub:'两个人的不同视角',symbol:'◇'},
 {key:'map' as WorldKey,no:'04',title:'冒险地图',sub:'4 个已抵达地点',symbol:'⌖'},
 {key:'quests' as WorldKey,no:'05',title:'双人任务',sub:'把以后变成正在发生',symbol:'◎'},
 {key:'letters' as WorldKey,no:'06',title:'给椰椰的信',sub:'写下还没说完的话',symbol:'✉'}
];
