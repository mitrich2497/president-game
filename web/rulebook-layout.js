// Small screens read diagrams in short steps instead of shrinking text or scrolling.
export function ruleReadingLayout(width,height){return {compact:height<700||width<380,shortLandscape:height<=480&&width>=560};}
export function adaptRuleLayout(root,{compact=false,shortLandscape=false,step=0}={}){
 const body=root.querySelector('.rb-body'),footer=root.querySelector('.rb-footer'),note=body.querySelector(':scope > .rb-note'),chapter=body.dataset.ruleSection,page=Number(body.dataset.rulePage);
 let groups=[];
 if(compact&&chapter!=='abilities'){
  const children=[...body.children].filter(e=>e!==note&&!e.matches('.rb-wide-only,[data-rule-decorative]'));
  for(const el of children){
   if(el.matches('.rb-prep-grid,.rb-turn-grid,.rb-special-grid,.rb-two')){
    for(const child of [...el.children].filter(e=>!e.hasAttribute('data-rule-decorative')))groups.push([child]);
   }else if(el.matches('.rb-office-layout')){
    groups.push([el.querySelector('.rb-prerequisites')]);
    const city=el.querySelector(':scope > .rb-city');city.classList.add('rb-office-focus');groups.push([city]);
   }else if(el.matches('.rb-capture')){
    const before=el.querySelector('.rb-capture-before'),after=el.querySelector('.rb-capture-after');
    before.classList.add('rb-capture-focus');after.classList.add('rb-capture-focus');groups.push([before],[after]);
   }else if(el.matches('.rb-victory-layout')){
    for(const child of el.querySelectorAll(':scope > .rb-panel'))groups.push([child]);
   }else if(el.matches('.rb-costline,.rb-retain,.rb-route-roll')){
    if(groups.length)groups[groups.length-1].push(el);else groups.push([el]);
   }else groups.push([el]);
  }
  const requested=Number(step),index=requested===-1?groups.length-1:Math.max(0,Math.min(groups.length-1,Number.isFinite(requested)?requested:0));
  const selected=groups[index]||[];
  body.replaceChildren(...selected,...(note?[note]:[]));
  step=index;
 }
 let count=groups.length||1;
 if(compact&&chapter==='abilities'&&shortLandscape){
  count=2;step=Number(step)===-1?1:Math.max(0,Math.min(1,Number(step)||0));
  const copy=body.querySelector('.rb-hero-copy');
  copy.querySelector(step===0?'.rb-hero-example':'.rb-ability').remove();
  copy.classList.add('rb-hero-short-page');
 }else if(!compact||chapter==='abilities')step=0;
 root.classList.toggle('rb-compact-reading',compact);
 body.classList.toggle('rb-sliced',compact&&count>1);
 const previous=footer.querySelector('button:first-child'),next=footer.querySelector('button:last-child');
 previous.dataset.action='ruleAdvance';previous.dataset.direction='-1';
 previous.disabled=chapter==='preparation'&&page===0&&step===0;
 next.dataset.action=chapter==='victory'&&page===1&&step===count-1?'close':'ruleAdvance';next.dataset.direction='1';
 next.textContent=next.dataset.action==='close'?'Понятно ✓':'Далее →';
 if(count>1)footer.querySelector('.rb-progress b').textContent=chapter==='abilities'?(step===0?'Способность · 1 / 2':'Пример · 2 / 2'):'Часть '+(step+1)+' / '+count;
 return {step,count,compact,shortLandscape};
}

