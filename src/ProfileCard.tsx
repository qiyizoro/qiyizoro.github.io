import {useEffect,useRef} from'react';
import './ProfileCard.css';

type Props={avatarUrl:string;name:string;title:string;handle?:string;status?:string;contactText?:string;onContactClick?:()=>void;onAvatarLongPress?:()=>void};

export default function ProfileCard({avatarUrl,name,title,handle='yeye',status='档案持续更新',contactText='更换头像',onContactClick,onAvatarLongPress}:Props){
 const wrap=useRef<HTMLDivElement>(null),timer=useRef<number|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const move=(e:React.PointerEvent)=>{const el=wrap.current;if(!el)return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--rx',`${-y*12}deg`);el.style.setProperty('--ry',`${x*14}deg`);el.style.setProperty('--px',`${(x+.5)*100}%`);el.style.setProperty('--py',`${(y+.5)*100}%`)};
 const down=(e:React.PointerEvent)=>{if(e.pointerType==='touch')timer.current=window.setTimeout(()=>onAvatarLongPress?.(),650)};
 const cancel=()=>clearTimeout(timer.current);
 return <div ref={wrap} className="archive-card-wrap" onPointerMove={move} onPointerLeave={e=>{cancel();e.currentTarget.style.setProperty('--rx','0deg');e.currentTarget.style.setProperty('--ry','0deg')}} onPointerDown={down} onPointerUp={cancel} onPointerCancel={cancel}>
  <div className="archive-card-glow"/><article className="archive-card"><div className="archive-card-grid"/><div className="archive-card-shine"/><img src={avatarUrl} alt={`${name}的头像`} draggable={false}/><div className="archive-card-title"><small>RESIDENT · 217</small><h3>{name}</h3><p>{title}</p></div><footer><div><b>@{handle}</b><span>{status}</span></div><button type="button" onClick={onContactClick}>{contactText}</button></footer></article>
 </div>
}
