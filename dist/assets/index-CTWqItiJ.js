import{r as e,c as t,g as a,a as n}from"./math-gvfvQHv_.js";import{d as o,o as s,a as i,b as c,_ as x}from"./index-CBIm98R_.js";const d={id:"canvas"},l=x(o({__name:"index",setup:o=>(s((()=>{const o=document.getElementById("canvas"),s=o.getContext("2d"),i=window.devicePixelRatio||1;console.log("devicePixelRatio",i),s.canvas.width=800*i,s.canvas.height=400*i;const c={x:300,y:200},x={x:200,y:300};s.beginPath(),s.moveTo(c.x,c.y),s.lineTo(x.x,x.y),s.stroke(),o.addEventListener("mousemove",(d=>{const l={x:(d.clientX-o.getBoundingClientRect().left)*i,y:(d.clientY-o.getBoundingClientRect().top)*i},y=Math.atan2(x.y-c.y,x.x-c.x),[m,g,h]=[c,x,l].map((t=>e(t,c,-y))),r=t(g,h),v=Math.abs(r/2/Math.sin(a(m,g,g,h)));let p;s.clearRect(0,0,o.width,o.height),s.beginPath(),s.moveTo(c.x,c.y),s.lineTo(x.x,x.y),s.stroke(),s.beginPath();let b=!1;h.y<g.y?(p={x:g.x,y:g.y-v},b=!(g.x<m.x)):(p={x:g.x,y:g.y+v},b=g.x<m.x);const[u,P,R]=[g,h,p].map((t=>e(t,m,y))),_=n(R,u,P,b);s.arc(..._),s.stroke()}))})),(e,t)=>(c(),i("canvas",d)))}),[["__scopeId","data-v-c5554b41"]]);export{l as default};
