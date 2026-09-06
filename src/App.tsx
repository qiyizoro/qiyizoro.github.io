import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown, Compass, LockKeyhole, Menu, X } from 'lucide-react';
import { chapters, zones, type WorldKey } from './data';

const Page=({children}:{children:React.ReactNode})=><motion.main initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.5}}>{children}</motion.main>;

export function App(){
 const [entered,setEntered]=useState(false); const [page,setPage]=useState<WorldKey>('home'); const [menu,setMenu]=useState(false);
 const go=(p:WorldKey)=>{setPage(p);setMenu(false);scrollTo({top:0,behavior:'smooth'})};
 return <div className="app">
  <div className="noise"/><div className="aurora a1"/><div className="aurora a2"/>
  <AnimatePresence mode="wait">{!entered?<Launch onEnter={()=>setEntered(true)}/>:<>
   <Header page={page} go={go} menu={menu} setMenu={setMenu}/>
   {page==='home'?<Home go={go}/>:page==='story'?<Story go={go}/>:page==='yeye'?<Yeye/>:page==='memories'?<Memories/>:page==='map'?<Map/>:page==='quests'?<Quests/>:page==='letters'?<Letters/>:<Hidden/>}
  </>}</AnimatePresence>
 </div>
}

function Launch({onEnter}:{onEnter:()=>void}){return <motion.section className="launch" key="launch" exit={{opacity:0,scale:1.03}} transition={{duration:.8}}>
 <div className="stars">{Array.from({length:28},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,top:`${(i*61)%90}%`,animationDelay:`${i%7}s`}}/>)}</div>
 <div className="moon"><span/></div><div className="launch-copy"><p className="eyebrow">私人世界 · 持续生长中</p><h1>有椰之境</h1><p>这里记录着一个正在发生的世界。</p><button className="primary" onClick={onEnter}>进入世界 <ArrowRight size={17}/></button></div>
 <div className="scroll-note"><span>向内探索</span><ChevronDown size={16}/></div></motion.section>}

function Header({page,go,menu,setMenu}:{page:WorldKey,go:(p:WorldKey)=>void,menu:boolean,setMenu:(v:boolean)=>void}){return <header>
 <button className="brand" onClick={()=>go('home')}><span>Y</span><b>有椰之境</b></button><nav className={menu?'open':''}>{zones.map(z=><button className={page===z.key?'active':''} onClick={()=>go(z.key)} key={z.key}>{z.title}</button>)}<button onClick={()=>go('hidden')}><LockKeyhole size={14}/> 未知区域</button></nav><button className="menu" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
 </header>}

function Home({go}:{go:(p:WorldKey)=>void}){return <Page><section className="world-hero"><div><p className="eyebrow">世界坐标 · 06°11′S 106°49′E</p><h2>我的世界里，<br/><em>有她。</em></h2><p className="lead">这是一本仍在书写的私人世界志。关于成长、远方，也关于两个陌生人如何走进彼此的地图。</p></div><div className="orbit"><div className="orbit-ring r1"/><div className="orbit-ring r2"/><div className="planet"><span>双生<br/>之境</span></div><i className="sat s1"/><i className="sat s2"/><i className="sat s3"/></div></section>
 <section className="section"><div className="section-title"><div><p className="eyebrow">探索区域</p><h3>选择一条路径</h3></div><p>每个入口都通向一段真实发生过的生活。<br/>不必按顺序，世界会记住你的脚步。</p></div><div className="zone-grid">{zones.map(z=><button key={z.key} className={'zone '+(z.featured?'featured':'')} onClick={()=>go(z.key)}><span className="zone-no">{z.no}</span><i>{z.symbol}</i><div><h4>{z.title}</h4><p>{z.sub}</p></div><ArrowRight size={19}/></button>)}</div></section>
 <section className="future"><div><p className="eyebrow">地图边界之外</p><h3>未发生之地</h3><p>地图暂时画到这里。剩下的故事，还没有发生。</p></div><b>???</b></section><Footer/></Page>}

function Story({go}:{go:(p:WorldKey)=>void}){const [open,setOpen]=useState<number|null>(null); const [door,setDoor]=useState(false);return <Page><Hero eyebrow="核心区域 · 双生主线" title="双生之境" desc="两个原本互不相干的人，从随机相遇，到终于组队成功。"/>
 <section className="story-layout"><aside><p>当前进度</p><strong>10</strong><span>个已记录章节</span><div className="progress"><i/></div><small>故事仍在继续</small></aside><div className="timeline">{chapters.map((c,i)=><article className={'chapter '+(open===i?'expanded':'')} key={c.title} onClick={()=>setOpen(open===i?null:i)}><span>{String(i).padStart(2,'0')}</span><div><p>{c.n} · {c.meta}</p><h3>{c.title}</h3>{open===i&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}><p className="chapter-text">{c.text}</p>{i===1&&!door&&<div className="quiz" onClick={e=>e.stopPropagation()}><b>走廊里的门</b><p>我们第一次真正说话，是谁先开口？</p><div><button onClick={()=>setDoor(true)}>椰椰</button><button>我</button></div></div>}{i===1&&door&&<div className="unlocked">门已经打开。欢迎进入我们的第一章。</div>}</motion.div>}</div><ArrowRight/></article>)}</div></section><Footer/></Page>}

function Hero({eyebrow,title,desc}:{eyebrow:string,title:string,desc:string}){return <section className="subhero"><button className="back" onClick={()=>history.back()}><ArrowLeft size={16}/> 返回世界</button><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{desc}</p></section>}

function Yeye(){const [card,setCard]=useState<number|null>(null); const tarot=[['星星','即使自己的能量不多，也愿意分一点给别人。'],['月亮','非常敏锐，会注意到很多别人忽略的细节。'],['力量','比自己想象中更有力量。']];return <Page><Hero eyebrow="特殊玩家档案" title="椰椰" desc="塔罗师。隐藏身份：魔法少女。"/><section className="tarot"><div className="section-title"><div><p className="eyebrow">进入档案前</p><h3>从三张牌中选一张</h3></div><p>每一张，都是我眼中的你。</p></div><div className="cards">{tarot.map((t,i)=><button onClick={()=>setCard(i)} className={'tarot-card '+(card===i?'flipped':'')} key={t[0]}>{card===i?<><small>我眼中的你</small><strong>{t[0]}</strong><p>{t[1]}</p></>:<><i>✦</i><span>选择此牌</span></>}</button>)}</div></section><section className="profile"><div className="profile-main"><div className="avatar"><img src="/images/yeye-avatar.jpg" alt="椰椰的头像"/><span>✦</span></div><div><p className="eyebrow">玩家档案 · 稀有</p><h2>椰椰</h2><p>逻辑清醒，感知敏锐。即使自己能量很低，也会很小心地保护另一个人的感受。</p><blockquote>“那我不管。”</blockquote></div></div><div className="traits">{['逻辑分析','整理分析','环境感知','射击'].map(x=><div key={x}><span>{x}</span><b>★★★★★</b></div>)}<div><span>喜欢</span><p>小龙虾 · 辣 · 烧烤 · 三文鱼</p></div><div><span>弱点</span><p>昆虫</p></div></div><div className="knowledge"><span>当前了解进度</span><b>37%</b><div><i/></div><p>还有很多地方，没有探索完。</p></div></section><Footer/></Page>}

function Memories(){return <Page><Hero eyebrow="双视角记录" title="记忆档案馆" desc="同一件事情，在两个人心里留下不同的形状。"/><section className="memory-grid">{['雅加达的第一句话','Bromo · 世纪大合照','那场确认心意的夜聊','第一次去广州见你'].map((x,i)=><article><div className="placeholder"><span>＋</span>待添加照片</div><p>记忆碎片 {String(i+1).padStart(2,'0')}</p><h3>{x}</h3><div className="perspectives"><span>我的记忆</span><span>她的记忆 · 待补充</span></div></article>)}</section><Footer/></Page>}

function Map(){const spots=[['雅加达','一切开始的走廊'],['Bromo','火山与新称呼'],['广州','第一次专程见面'],['长沙','第一次认真面对危机']]; return <Page><Hero eyebrow="旅程坐标" title="冒险地图" desc="有些地方，因为和谁一起抵达而变得不同。"/><section className="mapbox"><div className="map-lines"/>{spots.map((s,i)=><button key={s[0]} style={{left:`${14+i*23}%`,top:`${i%2?56:32}%`}}><i>{i+1}</i><strong>{s[0]}</strong><span>{s[1]}</span></button>)}<div className="fog">未发生之地 <b>???</b></div></section><Footer/></Page>}

function Quests(){const [done,setDone]=useState<number[]>([0]);const qs=['一起看日落','去一个新的城市','一起吃一家没去过的店','再比一次射击','一起看海'];return <Page><Hero eyebrow="共同进行中" title="双人任务" desc="把想一起做的事，慢慢变成共同记忆。"/><section className="quest-list">{qs.map((q,i)=><button key={q} onClick={()=>setDone(d=>d.includes(i)?d.filter(x=>x!==i):[...d,i])} className={done.includes(i)?'done':''}><span>{done.includes(i)?'✓':String(i+1).padStart(2,'0')}</span><div><p>{done.includes(i)?'已完成':'等待领取'}</p><h3>{q}</h3></div><i>{done.includes(i)?'纪念卡已生成':'双人任务'}</i></button>)}</section><Footer/></Page>}

function Letters(){return <Page><Hero eyebrow="私人邮局" title="给椰椰的信" desc="有些话适合立刻告诉你，有些话值得留给未来。"/><section className="letters">{['今天想说的话','特殊日期','没说出口的话','写给未来','隐藏信'].map((x,i)=><article key={x} className={i>2?'locked':''}><span>{i>2?<LockKeyhole/>:'✉'}</span><div><p>信件分类 {String(i+1).padStart(2,'0')}</p><h3>{x}</h3></div><small>{i>2?'尚未解锁':'等待写入'}</small></article>)}</section><Footer/></Page>}

function Hidden(){const [value,setValue]=useState('');const [ok,setOk]=useState(false);return <Page><section className="hidden-page"><LockKeyhole/><p className="eyebrow">地图上不存在的房间</p><h1>{ok?'门后有一封信':'隐藏房间'}</h1>{ok?<><p>这里将保存酒后的视频、没发出去的话，以及只属于我们的彩蛋。</p><div className="placeholder dark">待添加隐藏内容</div></>:<><p>密码散落在曾经抵达的地方。忘记也没关系，门会一直等你。</p><form onSubmit={e=>{e.preventDefault();setOk(value==='0520')}}><input value={value} onChange={e=>setValue(e.target.value)} placeholder="输入四位密码" maxLength={4}/><button className="primary">尝试开启</button></form><small>{value.length===4&&value!=='0520'?'还差一点。提示：双人模式开启的月份与日期。':''}</small></>}</section></Page>}

function Footer(){return <footer><span>有椰之境</span><p>世界版本 0.1 · 故事持续发生中</p><Compass size={18}/></footer>}
