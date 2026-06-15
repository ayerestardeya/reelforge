import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, Music, Play, Pause, Download, Trash2, Plus, Film, Type,
  Clock, Wand2, Zap, X, Loader2, AlertTriangle, ImagePlus, Layers,
  FileText, ChevronDown, ChevronUp, Video, Sparkles, ChevronLeft,
  ChevronRight, RotateCcw, Copy,
} from "lucide-react";

/* ═══════════════════════════ CONFIG ═══════════════════════════ */
const RATIOS = [
  { id: "9:16", label: "TikTok", w: 1080, h: 1920 },
  { id: "4:5",  label: "Feed",   w: 1080, h: 1350 },
  { id: "1:1",  label: "Cuadrado", w: 1080, h: 1080 },
];
const EFFECTS = [
  { id: "zin",    name: "Zoom in",   zFrom:1.0, zTo:1.16, pxFrom:0,   pxTo:0,   pyFrom:0,    pyTo:0 },
  { id: "zout",   name: "Zoom out",  zFrom:1.16,zTo:1.0,  pxFrom:0,   pxTo:0,   pyFrom:0,    pyTo:0 },
  { id: "kb",     name: "Ken Burns", zFrom:1.04,zTo:1.18, pxFrom:-0.6,pxTo:0.6, pyFrom:-0.35,pyTo:0.35 },
  { id: "pright", name: "Barrido →", zFrom:1.14,zTo:1.14, pxFrom:-1,  pxTo:1,   pyFrom:0,    pyTo:0 },
  { id: "pleft",  name: "Barrido ←", zFrom:1.14,zTo:1.14, pxFrom:1,   pxTo:-1,  pyFrom:0,    pyTo:0 },
  { id: "rise",   name: "Ascenso",   zFrom:1.12,zTo:1.12, pxFrom:0,   pxTo:0,   pyFrom:1,    pyTo:-1 },
  { id: "none",   name: "Sin efecto",zFrom:1.0, zTo:1.0,  pxFrom:0,   pxTo:0,   pyFrom:0,    pyTo:0 },
];
const effectById = (id) => EFFECTS.find(e => e.id === id) || EFFECTS[0];

const TRANSITIONS = [
  { id: "fade",  name: "Fundido" },
  { id: "slide", name: "Deslizar" },
  { id: "zoom",  name: "Zoom" },
];
const CAPTION_STYLES = [
  { id: "cine",    name: "Cine" },
  { id: "impacto", name: "Impacto" },
  { id: "viral",   name: "Viral" },
];
const TEXT_POS = [
  { id: "top",    name: "↑",  y: 0.14 },
  { id: "center", name: "↔",  y: 0.45 },
  { id: "bottom", name: "↓",  y: 0.78 },
];
const TEXT_SIZES = [
  { id: "sm", name: "S", factor: 0.72 },
  { id: "md", name: "M", factor: 1.0 },
  { id: "lg", name: "L", factor: 1.3 },
  { id: "xl", name: "XL", factor: 1.6 },
];
const FILTERS = [
  { id: "none",     name: "Original",   css: "none",                                                        dot: "#888" },
  { id: "cine",     name: "Cine",       css: "contrast(1.15) saturate(0.85) brightness(0.95)",              dot: "#6b7cbb" },
  { id: "warm",     name: "Cálido",     css: "saturate(1.25) sepia(0.15) brightness(1.05)",                 dot: "#e8914a" },
  { id: "cold",     name: "Frío",       css: "saturate(0.9) hue-rotate(15deg) brightness(1.05)",            dot: "#4ab3e8" },
  { id: "vintage",  name: "Vintage",    css: "sepia(0.35) contrast(1.1) brightness(0.95)",                  dot: "#c8a86b" },
  { id: "bw",       name: "B/N",        css: "grayscale(1) contrast(1.15)",                                  dot: "#aaa" },
  { id: "dramatic", name: "Dramático",  css: "contrast(1.35) saturate(1.15) brightness(0.9)",               dot: "#e05" },
  { id: "fade",     name: "Deslavado",  css: "saturate(0.6) brightness(1.1) contrast(0.9)",                 dot: "#bbb" },
];
const TRANS_DUR = 0.5;
const DEFAULT_DUR = 3;
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

/* ═══════════════════════════ MATH ═══════════════════════════ */
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp  = (a,b,t) => a+(b-a)*t;
const easeInOut = t => t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut   = t => 1-Math.pow(1-t,3);

function timeline(clips) {
  let acc=0;
  const starts = clips.map(c=>{const s=acc;acc+=c.duration;return s;});
  return {starts,total:acc};
}
const fmt = s => {
  s=Math.max(0,s);
  const m=Math.floor(s/60), r=Math.floor(s%60), cs=Math.floor((s%1)*10);
  return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}.${cs}`;
};
const wordCount = t => (t||"").trim().split(/\s+/).filter(Boolean).length;
const calcDuration = text => {
  const wc=wordCount(text); if(!wc) return DEFAULT_DUR;
  return Math.max(2, Math.min(10, Math.round((wc*0.42+0.8)*2)/2));
};

/* ═══════════════════════════ SCRIPT DIST ═══════════════════════════ */
function distributeScript(text,n) {
  if(!text.trim()||!n) return Array(n).fill("");
  let segs=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  if(!segs.length) return Array(n).fill("");
  if(segs.length===n) return segs;
  if(segs.length>n){
    const r=[];const p=segs.length/n;
    for(let i=0;i<n;i++) r.push(segs.slice(Math.round(i*p),Math.round((i+1)*p)).join(" "));
    return r;
  }
  const sents=[];
  for(const s of segs){
    const ps=s.split(/(?<=[.!?…])\s+/).filter(Boolean);
    ps.length>1?sents.push(...ps):sents.push(s);
  }
  if(sents.length>=n){
    const r=[];const p=sents.length/n;
    for(let i=0;i<n;i++) r.push(sents.slice(Math.round(i*p),Math.round((i+1)*p)).join(" "));
    return r;
  }
  const r=Array(n).fill("");
  const sp=n/sents.length;
  sents.forEach((s,i)=>{r[Math.round(i*sp)]=s;});
  return r;
}

/* ═══════════════════════════ CANVAS ═══════════════════════════ */
function roundRect(ctx,x,y,w,h,r) {
  r=Math.min(r,h/2,w/2);
  ctx.beginPath();ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function wrapText(ctx,text,maxW) {
  const words=text.trim().split(/\s+/),lines=[];let cur="";
  for(const w of words){
    const t=cur?cur+" "+w:w;
    if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;
  }
  if(cur)lines.push(cur);return lines;
}
function getMediaDims(slide) {
  if(slide.type==="video"){const v=slide.mediaEl;return v?{w:v.videoWidth||0,h:v.videoHeight||0}:{w:0,h:0};}
  const i=slide.mediaEl;return i?{w:i.naturalWidth||0,h:i.naturalHeight||0}:{w:0,h:0};
}
function isMediaReady(slide) {
  if(slide.type==="video") return slide.mediaEl&&slide.mediaEl.readyState>=2;
  return slide.mediaEl&&slide.mediaEl.complete&&slide.mediaEl.naturalWidth>0;
}

/* ─── FIX #1: drawSlide applies its OWN filter (fixes transition bug) ─── */
function drawSlide(ctx,slide,progress,W,H) {
  if(!isMediaReady(slide)){ctx.fillStyle="#15151c";ctx.fillRect(0,0,W,H);return;}
  const el=slide.mediaEl;
  const dims=getMediaDims(slide);
  if(!dims.w||!dims.h) return;

  /* FIX #1b: filter applied per-slide so transitions don't bleed */
  const filterCss=(FILTERS.find(f=>f.id===slide.filter)||FILTERS[0]).css;
  ctx.filter=filterCss;

  const e=effectById(slide.effectId);
  const ep=easeInOut(clamp(progress,0,1));
  const cover=Math.max(W/dims.w,H/dims.h);
  const scale=cover*lerp(e.zFrom,e.zTo,ep);
  const dw=dims.w*scale, dh=dims.h*scale;
  const ox=lerp(e.pxFrom,e.pxTo,ep), oy=lerp(e.pyFrom,e.pyTo,ep);
  const x=(W-dw)/2+(ox*(dw-W))/2, y=(H-dh)/2+(oy*(dh-H))/2;
  ctx.drawImage(el,x,y,dw,dh);
  ctx.filter="none";
}

/* ─── Caption styles ─── */
function drawCaptionCine(ctx,text,W,H,local,dur,posY,sf) {
  if(!text||!text.trim()) return;
  sf=sf||1;
  const a=easeOut(clamp(local/0.45,0,1));if(a<=.001)return;
  const fontSize=Math.round(W*0.055*sf);
  ctx.font=`800 ${fontSize}px ${FONT}`;
  ctx.textAlign="center";ctx.textBaseline="middle";
  const lines=wrapText(ctx,text,W*0.84);
  const lh=fontSize*1.34,padX=fontSize*0.44,padY=fontSize*0.24,totalH=lines.length*lh;
  const slideUp=(1-a)*(H*0.02);
  const anchorY=(posY||0.78)*H;
  let y=anchorY-totalH/2+lh/2+slideUp;
  ctx.save();ctx.globalAlpha=a;
  for(const line of lines){
    const tw=ctx.measureText(line).width,bw=tw+padX*2,bh=lh-fontSize*0.12+padY;
    roundRect(ctx,(W-bw)/2,y-bh/2,bw,bh,bh*0.36);
    ctx.fillStyle="rgba(8,8,12,0.65)";ctx.fill();
    ctx.shadowColor="rgba(0,0,0,0.5)";ctx.shadowBlur=fontSize*0.22;ctx.shadowOffsetY=2;
    ctx.fillStyle="#fff";ctx.fillText(line,W/2,y);
    ctx.shadowColor="transparent";ctx.shadowBlur=0;y+=lh;
  }
  ctx.restore();
}
function drawCaptionImpacto(ctx,text,W,H,local,dur,posY,sf) {
  if(!text||!text.trim()) return;
  sf=sf||1;
  const scaleT=easeOut(clamp(local/0.35,0,1));if(scaleT<=.001)return;
  const fontSize=Math.round(W*0.085*sf);
  ctx.save();ctx.translate(W/2,(posY||0.45)*H);
  const s=lerp(1.15,1,scaleT);ctx.scale(s,s);
  ctx.font=`900 ${fontSize}px ${FONT}`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.globalAlpha=scaleT;
  const lines=wrapText(ctx,text.toUpperCase(),W*0.82);
  const lh=fontSize*1.22,totalH=lines.length*lh;let y=-totalH/2+lh/2;
  for(const line of lines){
    ctx.strokeStyle="rgba(0,0,0,0.95)";ctx.lineWidth=fontSize*0.14;ctx.lineJoin="round";
    ctx.strokeText(line,0,y);ctx.fillStyle="#fff";ctx.fillText(line,0,y);y+=lh;
  }
  ctx.restore();
}
function drawCaptionViral(ctx,text,W,H,local,dur,posY,sf) {
  if(!text||!text.trim()) return;
  sf=sf||1;
  const words=text.trim().split(/\s+/),n=words.length;if(!n)return;
  const revealTime=Math.min(dur*0.85,n*0.5);
  const activeIdx=Math.min(Math.floor((local/revealTime)*n),n-1);
  const a=easeOut(clamp(local/0.3,0,1));if(a<=.001)return;
  const fontSize=Math.round(W*0.072*sf);
  ctx.save();ctx.globalAlpha=a;
  ctx.font=`900 ${fontSize}px ${FONT}`;ctx.textAlign="center";ctx.textBaseline="middle";
  const maxW=W*0.84,lineData=[],spaceW=ctx.measureText(" ").width;
  let curLine=[],curW=0;
  for(let i=0;i<words.length;i++){
    const ww=ctx.measureText(words[i]).width;
    if(curLine.length>0&&curW+spaceW+ww>maxW){lineData.push(curLine);curLine=[{idx:i,word:words[i],w:ww}];curW=ww;}
    else{curLine.push({idx:i,word:words[i],w:ww});curW+=(curLine.length>1?spaceW:0)+ww;}
  }
  if(curLine.length)lineData.push(curLine);
  const lh=fontSize*1.28,totalH=lineData.length*lh;
  let y=(posY||0.45)*H-totalH/2+lh/2;
  for(const line of lineData){
    const fullLine=line.map(l=>l.word).join(" ");
    const lineW=ctx.measureText(fullLine).width;
    let x=W/2-lineW/2;
    for(const item of line){
      const shown=item.idx<=activeIdx,active=item.idx===activeIdx;
      ctx.strokeStyle="rgba(0,0,0,0.9)";ctx.lineWidth=fontSize*0.1;ctx.lineJoin="round";
      ctx.globalAlpha=shown?a:a*0.18;
      ctx.strokeText(item.word,x+item.w/2,y);
      ctx.fillStyle=active?"#facc15":"#fff";ctx.fillText(item.word,x+item.w/2,y);
      ctx.globalAlpha=a;x+=item.w+spaceW;
    }
    y+=lh;
  }
  ctx.restore();
}
const captionDrawers={cine:drawCaptionCine,impacto:drawCaptionImpacto,viral:drawCaptionViral};

function drawVignette(ctx,W,H) {
  const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.72);
  g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,0.42)");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}

/* ─── FIX #1c: renderFrame no longer sets global ctx.filter ─── */
function renderFrame(ctx,t,clips,ratio) {
  const W=ratio.w,H=ratio.h;
  ctx.globalAlpha=1;ctx.setTransform(1,0,0,1,0,0);ctx.filter="none";
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
  if(!clips.length)return;
  const {starts,total}=timeline(clips);
  let idx=clips.length-1;
  for(let i=0;i<clips.length;i++){if(t<starts[i]+clips[i].duration){idx=i;break;}}
  if(t>=total)idx=clips.length-1;
  const clip=clips[idx];
  const local=clamp(t-starts[idx],0,clip.duration);
  const prog=clamp(local/clip.duration,0,1);
  const T=Math.min(TRANS_DUR,clip.duration*0.4,idx>0?clips[idx-1].duration*0.4:TRANS_DUR);
  const inTrans=idx>0&&local<T;

  if(inTrans){
    drawSlide(ctx,clips[idx-1],1,W,H);      /* prev slide with its own filter */
    const tp=easeInOut(local/T);
    ctx.save();
    const trans=clip.transition||"fade";
    if(trans==="fade")ctx.globalAlpha=tp;
    else if(trans==="slide")ctx.translate((1-tp)*W,0);
    else if(trans==="zoom"){const s=lerp(1.12,1,tp);ctx.globalAlpha=tp;ctx.translate(W/2,H/2);ctx.scale(s,s);ctx.translate(-W/2,-H/2);}
    drawSlide(ctx,clip,prog,W,H);            /* curr slide with its own filter */
    ctx.restore();ctx.globalAlpha=1;
  } else {
    drawSlide(ctx,clip,prog,W,H);
  }
  ctx.filter="none";
  drawVignette(ctx,W,H);
  const posY=(TEXT_POS.find(p=>p.id===clip.textPos)||TEXT_POS[2]).y;
  const sizeFactor=(TEXT_SIZES.find(s=>s.id===clip.textSize)||TEXT_SIZES[1]).factor;
  const drawFn=captionDrawers[clip.captionStyle||"cine"]||drawCaptionCine;
  drawFn(ctx,clip.caption,W,H,local,clip.duration,posY,sizeFactor);
}

/* ─── FIX #7: async video seek for export ─── */
function seekVideoTo(video,t){
  return new Promise(resolve=>{
    if(Math.abs(video.currentTime-t)<0.04){resolve();return;}
    let done=false;
    const onSeeked=()=>{done=true;video.removeEventListener("seeked",onSeeked);resolve();};
    video.addEventListener("seeked",onSeeked);
    try{video.currentTime=Math.max(0,t);}catch(e){if(!done)resolve();}
    setTimeout(()=>{if(!done){video.removeEventListener("seeked",onSeeked);resolve();}},600);
  });
}

function pickMime() {
  const c=["video/mp4;codecs=avc1,mp4a","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];
  for(const m of c)if(typeof MediaRecorder!=="undefined"&&MediaRecorder.isTypeSupported(m))return m;
  return "video/webm";
}

/* ═══════════════════════════ UI ATOMS ═══════════════════════════ */
function Field({label,icon,children,action}){
  return(
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-zinc-400">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
        {action}
      </div>
      {children}
    </div>
  );
}
const isImageFile=f=>(f.type&&f.type.startsWith("image/"))||/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name||"");
const isVideoFile=f=>(f.type&&f.type.startsWith("video/"))||/\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(f.name||"");

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
let UID=0;
export default function ReelForge() {
  const [clips,setClips]=useState([]);
  const [audio,setAudio]=useState(null);
  const [selectedId,setSelectedId]=useState(null);
  const [ratio,setRatio]=useState(RATIOS[0]);
  const [isPlaying,setPlaying]=useState(false);
  const [currentTime,setCurrentTime]=useState(0);
  const [playingIdx,setPlayingIdx]=useState(-1);   /* FIX #6: track active clip */
  const [exporting,setExporting]=useState(false);
  const [progress,setProgress]=useState(0);
  const [exportUrl,setExportUrl]=useState(null);
  const [exportName,setExportName]=useState("");
  const [dragIdx,setDragIdx]=useState(null);
  const [errMsg,setErrMsg]=useState("");
  const [script,setScript]=useState("");
  const [scriptOpen,setScriptOpen]=useState(false);
  const [dropping,setDropping]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(null);

  const canvasRef=useRef(null);
  const audioRef=useRef(null);
  const rafRef=useRef(0);
  const clockRef=useRef({start:0});
  const fileInput=useRef(null);
  const audioInput=useRef(null);
  const activeVidRef=useRef(null);   /* FIX #2: track playing video */

  const clipsRef=useRef(clips);
  const ratioRef=useRef(ratio);
  const isPlayingRef=useRef(isPlaying);  /* FIX #3: stable ref */
  const currentTimeRef=useRef(currentTime);
  clipsRef.current=clips;
  ratioRef.current=ratio;
  isPlayingRef.current=isPlaying;
  currentTimeRef.current=currentTime;

  const {total}=timeline(clips);
  const selected=clips.find(c=>c.id===selectedId)||null;

  const getCtx=()=>{
    const c=canvasRef.current;if(!c)return null;
    if(c.width!==ratio.w||c.height!==ratio.h){c.width=ratio.w;c.height=ratio.h;}
    return c.getContext("2d");
  };

  useEffect(()=>{
    if(isPlaying)return;
    const ctx=getCtx();
    if(ctx)renderFrame(ctx,currentTime,clips,ratio);
  },[clips,ratio,currentTime,isPlaying]);

  useEffect(()=>{setCurrentTime(c=>c>total?total:c);},[total]);

  const stopLoop=()=>cancelAnimationFrame(rafRef.current);

  /* ─── FIX #2: pause also stops active video ─── */
  const pause=useCallback(()=>{
    stopLoop();
    if(audioRef.current)audioRef.current.pause();
    if(activeVidRef.current){try{activeVidRef.current.pause();}catch(e){}}
    activeVidRef.current=null;
    setPlaying(false);
    setPlayingIdx(-1);
  },[]);

  /* ─── FIX #2: play syncs active video clip ─── */
  const play=useCallback(()=>{
    if(!clipsRef.current.length)return;
    const {total,starts}=timeline(clipsRef.current);
    const startAt=currentTimeRef.current>=total-0.05?0:currentTimeRef.current;
    clockRef.current.start=performance.now()-startAt*1000;
    if(audioRef.current&&audioRef.current.src){
      try{audioRef.current.currentTime=startAt;audioRef.current.play().catch(()=>{});}catch(e){}
    }
    setPlaying(true);

    const loop=()=>{
      const t=(performance.now()-clockRef.current.start)/1000;
      const cs=clipsRef.current;
      const {total:tot,starts:sts}=timeline(cs);
      if(t>=tot){
        const ctx=getCtx();if(ctx)renderFrame(ctx,tot-0.001,cs,ratioRef.current);
        setCurrentTime(tot);setPlayingIdx(-1);
        if(audioRef.current)audioRef.current.pause();
        if(activeVidRef.current){try{activeVidRef.current.pause();}catch(e){}}
        activeVidRef.current=null;
        setPlaying(false);return;
      }
      /* find active clip index */
      let idx=cs.length-1;
      for(let i=0;i<cs.length;i++){if(t<sts[i]+cs[i].duration){idx=i;break;}}
      setPlayingIdx(idx);

      /* FIX #2: manage video element play/pause */
      const ac=cs[idx];
      if(ac.type==="video"&&ac.mediaEl){
        if(activeVidRef.current!==ac.mediaEl){
          if(activeVidRef.current)try{activeVidRef.current.pause();}catch(e){}
          activeVidRef.current=ac.mediaEl;
          const localT=clamp(t-sts[idx],0,ac.duration);
          try{ac.mediaEl.currentTime=Math.min(localT,ac.mediaEl.duration-0.01||ac.duration);}catch(e){}
          ac.mediaEl.play().catch(()=>{});
        }
      } else {
        if(activeVidRef.current){try{activeVidRef.current.pause();}catch(e){}activeVidRef.current=null;}
      }

      const ctx=getCtx();
      if(ctx)renderFrame(ctx,t,cs,ratioRef.current);
      setCurrentTime(t);
      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
  },[]);   /* FIX #3: no deps needed — uses refs */

  const seek=useCallback((t)=>{
    t=clamp(t,0,total);
    setCurrentTime(t);
    if(isPlayingRef.current){
      clockRef.current.start=performance.now()-t*1000;
      if(audioRef.current)try{audioRef.current.currentTime=t;}catch(e){}
    } else {
      /* sync video if on a video clip */
      const {starts}=timeline(clipsRef.current);
      let idx=clipsRef.current.length-1;
      for(let i=0;i<clipsRef.current.length;i++){if(t<starts[i]+clipsRef.current[i].duration){idx=i;break;}}
      const ac=clipsRef.current[idx];
      if(ac&&ac.type==="video"&&ac.mediaEl){
        const localT=clamp(t-starts[idx],0,ac.duration);
        try{ac.mediaEl.currentTime=Math.min(localT,ac.mediaEl.duration-0.01||ac.duration);}catch(e){}
      }
      const ctx=getCtx();if(ctx)renderFrame(ctx,t,clipsRef.current,ratioRef.current);
    }
  },[total]);

  /* ─── FIX #3: keyboard shortcuts use stable refs, no re-registration per frame ─── */
  const seekRef=useRef(seek);seekRef.current=seek;
  useEffect(()=>{
    const h=e=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
      if(e.code==="Space"){e.preventDefault();isPlayingRef.current?pause():play();}
      if(e.code==="ArrowRight"){e.preventDefault();seekRef.current(currentTimeRef.current+0.5);}
      if(e.code==="ArrowLeft"){e.preventDefault();seekRef.current(currentTimeRef.current-0.5);}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);  /* empty deps — all via refs */

  const updateClip=(id,patch)=>setClips(prev=>prev.map(p=>p.id===id?{...p,...patch}:p));

  const addMedia=files=>{
    const arr=Array.from(files).filter(f=>isImageFile(f)||isVideoFile(f));
    if(!arr.length)return;
    const baseLen=clips.length;
    const phs=arr.map((file,i)=>{
      const isVid=isVideoFile(file),idx=baseLen+i;
      return{id:++UID,type:isVid?"video":"image",mediaEl:null,thumbUrl:"",url:"",name:file.name,
        file,duration:DEFAULT_DUR,caption:"",captionStyle:"cine",textPos:"bottom",textSize:"md",
        filter:"none",effectId:isVid?"none":EFFECTS[idx%(EFFECTS.length-1)].id,
        transition:"fade",loaded:false,error:false,videoDuration:0};
    });
    setClips(prev=>[...prev,...phs]);
    if(selectedId==null&&phs[0])setSelectedId(phs[0].id);
    phs.forEach(ph=>{
      if(ph.type==="image"){
        const r=new FileReader();
        r.onload=()=>{
          const d=r.result,img=new Image();
          img.onload=()=>updateClip(ph.id,{url:d,thumbUrl:d,mediaEl:img,loaded:true,error:false});
          img.onerror=()=>updateClip(ph.id,{error:true});
          img.src=d;
        };
        r.onerror=()=>updateClip(ph.id,{error:true});
        r.readAsDataURL(ph.file);
      } else {
        const url=URL.createObjectURL(ph.file);
        const video=document.createElement("video");
        video.muted=true;video.playsInline=true;video.preload="auto";
        video.onloadeddata=()=>{
          const vDur=video.duration||DEFAULT_DUR;
          const clipDur=Math.min(Math.max(1,vDur),15);
          try{
            video.currentTime=Math.min(0.5,vDur*0.1);
            video.onseeked=()=>{
              let thumbUrl="";
              try{
                const tc=document.createElement("canvas");
                tc.width=160;tc.height=Math.round(160*(video.videoHeight/(video.videoWidth||1)));
                tc.getContext("2d").drawImage(video,0,0,tc.width,tc.height);
                thumbUrl=tc.toDataURL("image/jpeg",0.7);
              }catch(e){}
              video.onseeked=null;video.currentTime=0;
              updateClip(ph.id,{url,mediaEl:video,thumbUrl,loaded:true,error:false,
                duration:Math.round(clipDur*2)/2,videoDuration:vDur});
            };
          }catch(e){
            updateClip(ph.id,{url,mediaEl:video,thumbUrl:"",loaded:true,error:false,
              duration:Math.round(clipDur*2)/2,videoDuration:vDur});
          }
        };
        video.onerror=()=>updateClip(ph.id,{error:true});
        video.src=url;
      }
    });
  };

  const addAudio=file=>{
    if(!file||!file.type.startsWith("audio/"))return;
    if(audio?.url)URL.revokeObjectURL(audio.url);
    setAudio({url:URL.createObjectURL(file),name:file.name,file});
  };

  const removeClip=id=>{
    setClips(prev=>{
      const c=prev.find(p=>p.id===id);
      if(c&&c.type==="video"&&c.url)URL.revokeObjectURL(c.url);
      return prev.filter(p=>p.id!==id);
    });
    if(selectedId===id)setSelectedId(null);
    setConfirmDelete(null);
  };

  const reorder=(from,to)=>{
    if(from===to||from==null||to==null)return;
    setClips(prev=>{const n=[...prev];const[m]=n.splice(from,1);n.splice(to,0,m);return n;});
  };

  /* ─── FIX #5: Apply to all ─── */
  const applyToAll=(field,value)=>setClips(prev=>prev.map(c=>({...c,[field]:value})));

  const doDistribute=autoTime=>{
    if(!clips.length||!script.trim())return;
    const texts=distributeScript(script,clips.length);
    setClips(prev=>prev.map((c,i)=>({...c,caption:texts[i]||"",...(autoTime?{duration:calcDuration(texts[i])}:{})})));
    setScriptOpen(false);setErrMsg("");
  };

  const resetProject=()=>{
    pause();
    clips.forEach(c=>{if(c.type==="video"&&c.url)URL.revokeObjectURL(c.url);});
    if(audio?.url)URL.revokeObjectURL(audio.url);
    if(exportUrl)URL.revokeObjectURL(exportUrl);   /* FIX #4 */
    setClips([]);setAudio(null);setSelectedId(null);setCurrentTime(0);
    setExportUrl(null);setExportName("");setErrMsg("");setScript("");setPlayingIdx(-1);
  };

  /* ─── FIX #4 + FIX #7: export with async video seek + blob cleanup ─── */
  const doExport=async()=>{
    if(!clips.length||exporting)return;
    if(clips.some(c=>c.error)){setErrMsg("Quita los clips con error antes de exportar.");return;}
    if(clips.some(c=>!c.loaded)){setErrMsg("Espera a que todos los clips carguen.");return;}
    pause();
    setErrMsg("");setExporting(true);setProgress(0);
    /* FIX #4: revoke previous export URL */
    if(exportUrl)URL.revokeObjectURL(exportUrl);
    setExportUrl(null);
    const ctx=getCtx();const canvas=canvasRef.current;
    const{total}=timeline(clipsRef.current);
    let audioCtx=null,srcNode=null;
    try{
      if(typeof canvas.captureStream!=="function"||typeof MediaRecorder==="undefined")throw new Error("unsupported");
      const vStream=canvas.captureStream(30);let tracks=[...vStream.getVideoTracks()];
      try{
        if(audio?.file){
          audioCtx=new(window.AudioContext||window.webkitAudioContext)();
          if(audioCtx.state==="suspended")await audioCtx.resume();
          const buf=await audio.file.arrayBuffer();
          const decoded=await audioCtx.decodeAudioData(buf);
          const dest=audioCtx.createMediaStreamDestination();
          srcNode=audioCtx.createBufferSource();srcNode.buffer=decoded;
          srcNode.connect(dest);tracks=[...tracks,...dest.stream.getAudioTracks()];
        }
      }catch(e){}
      const stream=new MediaStream(tracks);const mime=pickMime();
      let rec;
      try{rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10_000_000});}
      catch(e){rec=new MediaRecorder(stream);}
      const recMime=rec.mimeType||mime;const chunks=[];
      rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
      const stopped=new Promise(res=>rec.onstop=res);
      rec.start();if(srcNode)try{srcNode.start();}catch(e){}
      const start=performance.now();
      const{starts}=timeline(clipsRef.current);
      await new Promise(resolve=>{
        const loop=async()=>{
          const t=(performance.now()-start)/1000;
          if(t>=total){resolve();return;}
          /* FIX #7: for video clips, seek and wait */
          let idx=clipsRef.current.length-1;
          for(let i=0;i<clipsRef.current.length;i++){if(t<starts[i]+clipsRef.current[i].duration){idx=i;break;}}
          const ac=clipsRef.current[idx];
          if(ac&&ac.type==="video"&&ac.mediaEl){
            const localT=clamp(t-starts[idx],0,ac.duration);
            await seekVideoTo(ac.mediaEl,Math.min(localT,(ac.mediaEl.duration||ac.duration)-0.01));
          }
          renderFrame(ctx,t,clipsRef.current,ratioRef.current);
          setProgress(clamp(t/total,0,1));
          rafRef.current=requestAnimationFrame(loop);
        };
        loop();
      });
      renderFrame(ctx,total-0.001,clipsRef.current,ratioRef.current);setProgress(1);
      try{rec.stop();}catch(e){}if(srcNode)try{srcNode.stop();}catch(e){}
      await stopped;
      if(!chunks.length)throw new Error("empty");
      const blob=new Blob(chunks,{type:recMime});
      const url=URL.createObjectURL(blob);
      const ext=recMime.includes("mp4")?"mp4":"webm";
      const name="reelforge-"+Date.now()+"."+ext;
      setExportUrl(url);setExportName(name);
      const a=document.createElement("a");a.href=url;a.download=name;
      document.body.appendChild(a);a.click();a.remove();
    }catch(e){setErrMsg("Tu navegador no pudo generar el video. Prueba en Chrome.");}
    finally{
      if(audioCtx)try{await audioCtx.close();}catch(e){}
      cancelAnimationFrame(rafRef.current);setExporting(false);
    }
  };

  /* ─── FIX #9: dropping state with proper detection ─── */
  const onDrop=e=>{
    e.preventDefault();setDropping(false);
    const fs=Array.from(e.dataTransfer.files||[]);
    const media=fs.filter(f=>isImageFile(f)||isVideoFile(f));
    const aud=fs.find(f=>f.type.startsWith("audio/"));
    if(media.length)addMedia(media);if(aud)addAudio(aud);
  };

  const pct=total>0?(currentTime/total)*100:0;

  /* ─── FIX #8: estimated export time ─── */
  const estExportSecs=Math.round(total);

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return(
    <div className="w-full min-h-screen text-zinc-100 flex flex-col"
      style={{backgroundColor:"#07070b",fontFamily:FONT}}
      onDragEnter={e=>{e.preventDefault();if(Array.from(e.dataTransfer.types||[]).includes("Files"))setDropping(true);}}
      onDragOver={e=>{if(Array.from(e.dataTransfer.types||[]).includes("Files"))e.preventDefault();}}
      /* FIX #9: check relatedTarget to properly detect drag leave */
      onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDropping(false);}}
      onDrop={onDrop}>

      <input ref={fileInput} type="file" accept="image/*,video/*" multiple className="hidden"
        onChange={e=>{addMedia(e.target.files);e.target.value="";}}/>
      <input ref={audioInput} type="file" accept="audio/*" className="hidden"
        onChange={e=>{addAudio(e.target.files[0]);e.target.value="";}}/>
      {audio&&<audio ref={audioRef} src={audio.url} preload="auto"/>}

      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800" style={{backgroundColor:"#0b0b12"}}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg">
            <Zap size={16} className="text-white" fill="white"/>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-black tracking-tight">
              Reel<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Forge</span>
            </div>
          </div>
          {/* FIX #13: total duration indicator */}
          {clips.length>0&&(
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <span className="text-xs text-zinc-500">{clips.length} clips</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs font-mono text-zinc-500">{fmt(total)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* FIX #12: Reset project */}
          {clips.length>0&&(
            <button onClick={resetProject}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500 transition">
              <RotateCcw size={12}/>Resetear
            </button>
          )}
          <div className="hidden sm:flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            {RATIOS.map(r=>(
              <button key={r.id} onClick={()=>setRatio(r)}
                className={"px-2 py-1 rounded-md text-xs font-bold transition-colors "+(ratio.id===r.id?"bg-zinc-700 text-white":"text-zinc-400 hover:text-zinc-200")}>
                {r.id}
              </button>
            ))}
          </div>
          <button onClick={doExport} disabled={!clips.length||exporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg transition-all">
            {exporting?<Loader2 size={15} className="animate-spin"/>:<Download size={15}/>}
            {exporting?Math.round(progress*100)+"%":"Exportar"}
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* PREVIEW */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 gap-3 min-w-0">
          <div className="relative p-2 border border-zinc-800 shadow-2xl" style={{borderRadius:"1.5rem",background:"linear-gradient(160deg,#16161f,#0c0c12)"}}>
            <div className="relative overflow-hidden bg-black flex items-center justify-center"
              style={{borderRadius:"1rem",aspectRatio:`${ratio.w}/${ratio.h}`,height:"min(62vh,620px)",maxWidth:"80vw"}}>
              <canvas ref={canvasRef} className="block" style={{width:"100%",height:"100%",display:clips.length?"block":"none"}}/>
              {!clips.length&&(
                <button onClick={()=>fileInput.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6 group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-zinc-800 border border-zinc-700 group-hover:border-violet-500 transition-colors">
                    <ImagePlus size={24} className="text-zinc-400 group-hover:text-violet-400"/>
                  </div>
                  <div className="text-zinc-300 font-semibold text-sm">Sube fotos o videos para empezar</div>
                  <div className="text-zinc-500 text-xs">Arrastra archivos aquí o haz clic</div>
                </button>
              )}
              {exporting&&(
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                  <Loader2 size={30} className="animate-spin text-fuchsia-400"/>
                  <div className="text-sm font-semibold text-zinc-200">Renderizando…</div>
                  <div className="w-40 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{width:progress*100+"%"}}/>
                  </div>
                  {/* FIX #8: estimated time */}
                  <div className="text-xs text-zinc-500">~{Math.max(1,Math.round(estExportSecs*(1-progress)))}s restantes</div>
                </div>
              )}
            </div>
          </div>

          {/* TRANSPORT — FIX #10: scrubber disabled during export */}
          <div className="w-full flex items-center gap-3" style={{maxWidth:"min(420px,80vw)"}}>
            <button onClick={()=>isPlaying?pause():play()} disabled={!clips.length||exporting}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 shrink-0">
              {isPlaying?<Pause size={18} fill="black"/>:<Play size={18} fill="black" className="ml-0.5"/>}
            </button>
            <span className="text-xs font-mono text-zinc-400 tabular-nums w-12">{fmt(currentTime)}</span>
            <div className={"relative flex-1 h-2 rounded-full bg-zinc-800 "+(exporting?"opacity-30 cursor-not-allowed":"cursor-pointer")}
              onClick={e=>{if(exporting)return;const r=e.currentTarget.getBoundingClientRect();seek(((e.clientX-r.left)/r.width)*total);}}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{width:pct+"%"}}/>
              <div className="absolute top-1/2 w-3 h-3 rounded-full bg-white shadow" style={{left:pct+"%",transform:"translate(-50%,-50%)"}}/>
            </div>
            <span className="text-xs font-mono text-zinc-500 tabular-nums w-12 text-right">{fmt(total)}</span>
          </div>

          {/* TIMELINE */}
          <div className="w-full max-w-full">
            <div className="flex items-center gap-1.5 mb-1.5 px-1 text-zinc-500">
              <Layers size={12}/>
              <span className="text-xs font-semibold uppercase tracking-wider">Timeline</span>
              {clips.length>0&&<span className="text-xs text-zinc-600">· {clips.length} clips · {fmt(total)}</span>}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {clips.map((cl,i)=>(
                <div key={cl.id}
                  className="group relative shrink-0 flex flex-col gap-1">
                  {/* FIX #11: mobile move buttons */}
                  <div className="flex gap-1">
                    <button onClick={()=>reorder(i,i-1)} disabled={i===0}
                      className="flex-1 h-5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-0 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={10} className="text-zinc-300"/>
                    </button>
                    <button onClick={()=>reorder(i,i+1)} disabled={i===clips.length-1}
                      className="flex-1 h-5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-0 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                      <ChevronRight size={10} className="text-zinc-300"/>
                    </button>
                  </div>

                  <div draggable
                    onDragStart={()=>setDragIdx(i)}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={()=>{reorder(dragIdx,i);setDragIdx(null);}}
                    onDragEnd={()=>setDragIdx(null)}
                    onClick={()=>{setSelectedId(cl.id);seek(timeline(clips).starts[i]);}}
                    className={"relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all "
                      +(selectedId===cl.id?"border-fuchsia-500":cl.error?"border-red-500":playingIdx===i&&isPlaying?"border-violet-400":"border-transparent hover:border-zinc-600")}
                    style={{width:68,height:105,background:"#15151c"}}>
                    {cl.thumbUrl&&<img src={cl.thumbUrl} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none"/>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"/>
                    {/* FIX #6: playing pulse */}
                    {playingIdx===i&&isPlaying&&(
                      <div className="absolute inset-0 border-2 border-violet-400 rounded-lg animate-pulse pointer-events-none"/>
                    )}
                    {!cl.loaded&&!cl.error&&(
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/70">
                        <Loader2 size={14} className="animate-spin text-zinc-400"/>
                      </div>
                    )}
                    {cl.error&&(
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/85">
                        <AlertTriangle size={14} className="text-red-400"/>
                        <span className="text-zinc-400 mt-1" style={{fontSize:8}}>Error</span>
                      </div>
                    )}
                    <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5">
                      <span className="bg-black/60 rounded px-1 font-mono text-zinc-300" style={{fontSize:9}}>{i+1}</span>
                      {cl.type==="video"&&<span className="bg-violet-600/80 rounded px-0.5"><Video size={8} className="text-white"/></span>}
                    </div>
                    <div className="absolute bottom-0.5 left-0.5 right-0.5 flex items-center justify-between">
                      <span className="font-mono text-white/90 bg-black/50 rounded px-1" style={{fontSize:9}}>{cl.duration.toFixed(1)}s</span>
                      {/* FIX #14: confirm delete */}
                      {confirmDelete===cl.id?(
                        <button onClick={e=>{e.stopPropagation();removeClip(cl.id);}}
                          className="bg-red-600 rounded p-0.5 animate-pulse">
                          <X size={10} className="text-white"/>
                        </button>
                      ):(
                        <button onClick={e=>{e.stopPropagation();setConfirmDelete(cl.id);setTimeout(()=>setConfirmDelete(null),2000);}}
                          className="opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-red-600 rounded p-0.5 transition">
                          <Trash2 size={10} className="text-white"/>
                        </button>
                      )}
                    </div>
                    {cl.caption&&!cl.error&&<div className="absolute bottom-5 left-0.5"><Type size={8} className="text-fuchsia-400"/></div>}
                  </div>
                </div>
              ))}
              {clips.length>0&&(
                <div className="flex flex-col gap-1 shrink-0">
                  <div className="h-5"/>
                  <button onClick={()=>fileInput.current?.click()}
                    style={{width:68,height:105}}
                    className="rounded-lg border-2 border-dashed border-zinc-700 hover:border-violet-500 flex items-center justify-center text-zinc-500 hover:text-violet-400 transition">
                    <Plus size={20}/>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* INSPECTOR */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 p-4 overflow-y-auto" style={{backgroundColor:"#0b0b12"}}>

          {/* Script */}
          {clips.length>0&&(
            <div className="mb-5">
              <button onClick={()=>setScriptOpen(!scriptOpen)}
                className="w-full flex items-center justify-between py-2 text-sm font-bold text-violet-300 hover:text-violet-200 transition">
                <div className="flex items-center gap-2">
                  <FileText size={14}/><span>Guión completo</span>
                  <span className="text-xs font-normal text-zinc-500">· pega y distribuye</span>
                </div>
                {scriptOpen?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
              </button>
              {scriptOpen&&(
                <div className="mt-2 space-y-2">
                  <textarea value={script} onChange={e=>setScript(e.target.value)}
                    placeholder={"Pega tu guión completo aquí.\nCada línea = un clip.\nSi hay más líneas que clips, se agrupan.\nSi hay menos, se reparten."}
                    rows={6}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm resize-y focus:outline-none focus:border-violet-500 placeholder:text-zinc-600"/>
                  <div className="flex gap-2">
                    <button onClick={()=>doDistribute(false)} disabled={!script.trim()}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition">
                      Distribuir texto
                    </button>
                    <button onClick={()=>doDistribute(true)} disabled={!script.trim()}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 transition flex items-center justify-center gap-1">
                      <Sparkles size={12}/> + Auto-tiempo
                    </button>
                  </div>
                </div>
              )}
              <div className="h-px bg-zinc-800 mt-4"/>
            </div>
          )}

          {/* Audio */}
          <Field label="Música" icon={<Music size={13}/>}>
            {audio?(
              <div className="flex items-center gap-2 bg-zinc-900 rounded-xl p-2.5 border border-zinc-800">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0">
                  <Music size={14} className="text-white"/>
                </div>
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{audio.name}</div></div>
                <button onClick={()=>{URL.revokeObjectURL(audio.url);setAudio(null);}} className="text-zinc-500 hover:text-red-400 p-1">
                  <Trash2 size={14}/>
                </button>
              </div>
            ):(
              <button onClick={()=>audioInput.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-700 hover:border-violet-500 text-zinc-400 hover:text-violet-400 text-sm font-medium transition">
                <Upload size={14}/> Añadir canción
              </button>
            )}
          </Field>

          <div className="h-px bg-zinc-800 my-4"/>

          {/* Clip editor */}
          {selected?(
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center text-xs font-bold">
                  {clips.findIndex(c=>c.id===selected.id)+1}
                </div>
                <span className="text-sm font-bold">{selected.type==="video"?"Video":"Foto"} seleccionado</span>
                {selected.type==="video"&&(
                  <span className="text-xs text-zinc-500">· {(selected.videoDuration||0).toFixed(1)}s</span>
                )}
              </div>

              <Field label="Texto en pantalla" icon={<Type size={13}/>}>
                <textarea value={selected.caption}
                  onChange={e=>updateClip(selected.id,{caption:e.target.value})}
                  placeholder="Escribe un texto que enganche…"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-violet-500 placeholder:text-zinc-600"/>
              </Field>

              <Field label="Estilo de texto" icon={<Sparkles size={13}/>}>
                <div className="grid grid-cols-3 gap-1.5">
                  {CAPTION_STYLES.map(cs=>(
                    <button key={cs.id} onClick={()=>updateClip(selected.id,{captionStyle:cs.id})}
                      className={"px-2 py-2 rounded-lg text-xs font-semibold transition-colors border "
                        +(selected.captionStyle===cs.id?"bg-violet-600/20 border-violet-500 text-violet-300":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600")}>
                      {cs.name}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Posición</div>
                  <div className="flex gap-1">
                    {TEXT_POS.map(p=>(
                      <button key={p.id} onClick={()=>updateClip(selected.id,{textPos:p.id})}
                        className={"flex-1 py-2 rounded-lg text-sm font-bold border transition-colors "
                          +((selected.textPos||"bottom")===p.id?"bg-violet-600/20 border-violet-500 text-violet-300":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600")}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Tamaño</div>
                  <div className="flex gap-1">
                    {TEXT_SIZES.map(s=>(
                      <button key={s.id} onClick={()=>updateClip(selected.id,{textSize:s.id})}
                        className={"flex-1 py-2 rounded-lg text-xs font-bold border transition-colors "
                          +((selected.textSize||"md")===s.id?"bg-violet-600/20 border-violet-500 text-violet-300":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600")}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* FIX #5: Apply to all for filter */}
              <Field label="Filtro de color" icon={<Wand2 size={13}/>}
                action={<button onClick={()=>applyToAll("filter",selected.filter||"none")}
                  className="text-xs text-zinc-500 hover:text-violet-400 flex items-center gap-1 transition">
                  <Copy size={10}/>a todos
                </button>}>
                <div className="grid grid-cols-4 gap-1.5">
                  {FILTERS.map(f=>(
                    <button key={f.id} onClick={()=>updateClip(selected.id,{filter:f.id})}
                      className={"flex flex-col items-center gap-1 px-1 py-2 rounded-lg text-xs font-semibold border transition-colors "
                        +((selected.filter||"none")===f.id?"bg-violet-600/20 border-violet-500 text-violet-300":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600")}>
                      <div className="w-4 h-4 rounded-full border border-zinc-700" style={{background:f.dot}}/>
                      <span style={{fontSize:9}}>{f.name}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={"Duración · "+selected.duration.toFixed(1)+"s"} icon={<Clock size={13}/>}>
                <div className="flex items-center gap-2">
                  <input type="range" min={0.5} max={15} step={0.5} value={selected.duration}
                    onChange={e=>updateClip(selected.id,{duration:parseFloat(e.target.value)})}
                    className="flex-1 accent-fuchsia-500"/>
                  <input type="number" min={0.5} max={30} step={0.5} value={selected.duration}
                    onChange={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)&&v>=0.5)updateClip(selected.id,{duration:v});}}
                    className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-violet-500"/>
                </div>
              </Field>

              {/* FIX #5: Apply to all for effect */}
              <Field label="Efecto de cámara" icon={<Wand2 size={13}/>}
                action={<button onClick={()=>applyToAll("effectId",selected.effectId)}
                  className="text-xs text-zinc-500 hover:text-violet-400 flex items-center gap-1 transition">
                  <Copy size={10}/>a todos
                </button>}>
                <div className="grid grid-cols-2 gap-1.5">
                  {EFFECTS.map(e=>(
                    <button key={e.id} onClick={()=>updateClip(selected.id,{effectId:e.id})}
                      className={"px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors border "
                        +(selected.effectId===e.id?"bg-violet-600/20 border-violet-500 text-violet-300":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600")}>
                      {e.name}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Transición" icon={<Film size={13}/>}>
                <div className="grid grid-cols-3 gap-1.5">
                  {TRANSITIONS.map(tr=>(
                    <button key={tr.id} onClick={()=>updateClip(selected.id,{transition:tr.id})}
                      className={"px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors border "
                        +(selected.transition===tr.id?"bg-violet-600/20 border-violet-500 text-violet-300":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600")}>
                      {tr.name}
                    </button>
                  ))}
                </div>
              </Field>

              {confirmDelete===selected.id?(
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-center">
                  <div className="text-red-300 font-semibold mb-2">¿Eliminar este clip?</div>
                  <div className="flex gap-2">
                    <button onClick={()=>setConfirmDelete(null)} className="flex-1 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold">Cancelar</button>
                    <button onClick={()=>removeClip(selected.id)} className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold">Eliminar</button>
                  </div>
                </div>
              ):(
                <button onClick={()=>setConfirmDelete(selected.id)}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/40 transition">
                  <Trash2 size={13}/>Eliminar clip
                </button>
              )}
            </div>
          ):(
            <div className="text-center py-8 px-4">
              <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
                <Film size={18} className="text-zinc-600"/>
              </div>
              <p className="text-sm text-zinc-500">{clips.length?"Selecciona un clip para editarlo.":"Sube fotos o videos para empezar."}</p>
            </div>
          )}

          {errMsg&&(
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0"/>
              <div className="flex-1 text-sm text-red-200">{errMsg}</div>
              <button onClick={()=>setErrMsg("")} className="text-red-300 hover:text-white"><X size={13}/></button>
            </div>
          )}

          {exportUrl&&!exporting&&(
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-2">
                <Download size={13}/>Video listo
              </div>
              <a href={exportUrl} download={exportName}
                className="block text-center py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition">
                Descargar de nuevo
              </a>
            </div>
          )}
        </aside>
      </div>

      {/* Drop overlay */}
      {dropping&&(
        <div className="fixed inset-0 z-50 pointer-events-none" style={{background:"rgba(124,58,237,0.12)"}}>
          <div className="absolute inset-6 flex items-center justify-center backdrop-blur-sm"
            style={{borderRadius:"1.5rem",border:"2px dashed rgba(167,139,250,0.7)"}}>
            <div className="text-center">
              <Upload size={32} className="text-violet-300 mx-auto mb-2"/>
              <div className="text-base font-bold text-white">Suelta fotos, videos o música</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
