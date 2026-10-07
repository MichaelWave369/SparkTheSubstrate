import {FORMS,FORM_ORDER,LAYERS,REGIONS,newGame,currentEvent,choose,continueGame,reincarnate,surrenderToCurrent,canAwaken,awaken,affinity,environment,validateSave,describeState} from './engine.js';

const KEY='spark-substrate-journey-v1';
let state=newGame(),view='incarnation',selectedLayer=null,selectedSector=null,saveNotice='Saved on this device',memoryFilter='all';
try {const raw=localStorage.getItem(KEY);if(raw){const saved=JSON.parse(raw);if(validateSave(saved))state=saved;else saveNotice='Old journey could not be loaded';}} catch {saveNotice='Device saving is unavailable';}
const $=id=>document.getElementById(id);
const esc=str=>String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=n=>n>0?'+'+n:String(n);
const pad=n=>String(n).padStart(2,'0');
const picture=id=>{const [x,y]=FORMS[id].tile;return `--tile-x:${x*50}%;--tile-y:${y*100}%;--form-color:${FORMS[id].color}`;};
const meter=(value,color='var(--gold)')=>`<div class="meter" role="meter" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><span style="width:${value}%;background:${color}"></span></div>`;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));saveNotice='Saved on this device';}catch{saveNotice='Journey continues without device saving';}}
function announce(text){$('announcer').textContent=text;}
function commit(next){state=next;persist();render();}
function side(){
  const form=FORMS[state.form];
  const resonance=state.karma>35?'An expansive current':state.karma< -30?'A dense current':'A shifting current';
  return `<aside class="soul-panel" aria-label="Your spark">
    <div class="soul-heading"><span class="eyebrow">YOUR SPARK</span><span class="soul-id">${pad(state.life)} : ${pad(Math.min(state.turn+1,6))}</span></div>
    <div class="soul-emblem" aria-hidden="true">✧</div>
    <div class="karma-readout"><span class="eyebrow">KARMA</span><strong>${signed(state.karma)}</strong><span>${resonance}</span></div>
    <div class="karma-scale" aria-label="Karma ${signed(state.karma)}, range minus 100 to 100"><span style="left:${(state.karma+100)/2}%"></span></div>
    <div class="scale-labels"><span>BOUND</span><span>UNBOUND</span></div>
    <div class="soul-stats">
      <div class="stat"><div><span>Awareness</span><strong>${state.awareness}<small>/100</small></strong></div>${meter(state.awareness,'var(--cyan)')}</div>
      <div class="stat"><div><span>Attachment</span><strong>${state.attachment}<small>/100</small></strong></div>${meter(state.attachment,'var(--purple)')}</div>
      <div class="stat"><div><span>Life energy</span><strong>${state.energy}<small>/100</small></strong></div>${meter(state.energy,form.color)}</div>
    </div>
    <div class="forms-heading"><span class="eyebrow">FORMS IN YOUR MEMORY</span><span>${state.visited.length}/6</span></div>
    <div class="form-icons">${FORM_ORDER.map(id=>`<button class="form-icon ${state.form===id?'current':''} ${state.visited.includes(id)?'known':''}" style="--form-color:${FORMS[id].color}" data-action="form" data-form="${id}" aria-label="Learn about the ${FORMS[id].name} form" title="${FORMS[id].name}">${FORMS[id].glyph}</button>`).join('')}</div>
    <div class="soul-bottom"><span class="eyebrow">THE THREAD CONTINUES</span><p>${state.pastLives.length} ${state.pastLives.length===1?'life':'lives'} completed.<br>What you change stays changed.</p></div>
  </aside>`;
}
function worldStrip(){return `<section class="world-strip" aria-label="World conditions"><div class="world-strip-label"><span class="eyebrow">THE WORLD YOU LEAVE</span><span>${environment(state).name}</span></div>${[['vitality','Vitality','var(--green)'],['freedom','Freedom','var(--cyan)'],['balance','Connection','var(--gold)']].map(([id,label,color])=>`<div class="world-stat"><div><span>${label}</span><strong>${state.world[id]}<small>/100</small></strong></div>${meter(state.world[id],color)}</div>`).join('')}</section>`;}
function scene(){
  const form=FORMS[state.form],between=state.phase==='between',ended=state.phase==='ended';
  return `<section class="scene atlas" style="${picture(between||ended?'spark':state.form)}" aria-label="${form.name} realm artwork">
    <div class="scene-shade"></div>
    <div class="scene-top"><span class="scene-coordinates">L${state.location.layer+1} · R${state.location.region+1} · S${state.location.sector+1}</span><span class="scene-badge">${between?'BETWEEN LIVES':ended?'BEYOND THE GRID':'INHABITING'}</span></div>
    <div class="scene-bottom"><span class="eyebrow">${between?'MATTER FALLS AWAY':ended?'NO SHAPE REQUIRED':form.kind}</span><h1>${between?'The crossing':ended?'The open field':form.name}<span class="scene-glyph">${between||ended?'✧':form.glyph}</span></h1><p>${between?'A life ends. The spark continues.':ended?'You leave the cage without becoming its keeper.':form.desc}</p><div class="lifeline">${Array.from({length:6},(_,i)=>`<span class="${i<state.turn?'complete':i===state.turn&&state.phase!=='between'?'active':''}" title="${form.unit} ${i+1}"></span>`).join('')}</div><div class="scene-caption"><span>${between||ended?'THE VEIL':LAYERS[state.location.layer].toUpperCase()}</span><span>${between||ended?'A NEW CURRENT':`${form.unit.toUpperCase()} ${Math.min(state.turn+1,6)} / 6`}</span></div></div>
  </section>`;
}
function choicePanel(){
  if(state.phase==='between')return crossing();
  if(state.phase==='ended')return ending();
  if(state.phase==='aftermath')return aftermath();
  const event=currentEvent(state);
  return `<section class="decision-panel" aria-labelledby="event-title"><div class="decision-meta"><span class="eyebrow">LIFE ${pad(state.life)} · ${FORMS[state.form].unit.toUpperCase()} ${state.turn+1}</span><span class="small-sigil">6 / 6 / 6</span></div><h2 id="event-title">${event.title}</h2><p class="event-body">${event.body}</p><div class="choice-heading"><span class="eyebrow">WHAT WILL YOU DO?</span><span>One choice. A lasting ripple.</span></div><div class="choices">${event.choices.map((choice,i)=>`<button class="choice" data-action="choose" data-index="${i}" aria-label="${choice.label}. ${choice.detail}"><span class="choice-number">${pad(i+1)}</span><span class="choice-copy"><strong>${choice.label}</strong><span>${choice.detail}</span></span><span class="choice-tag">${choice.tag}</span></button>`).join('')}</div>${environment(state).cost?'<p class="condition-warning">The exhausted world costs every choice 5 extra energy.</p>':''}<div class="demiurge-voice"><span class="voice-mark" aria-hidden="true">⟁</span><div><span class="eyebrow">THE DEMIURGE WHISPERS</span><p>“${FORMS[state.form].voice}”</p></div></div></section>`;
}
function aftermath(){
  const o=state.outcome,end=state.turn>=5||state.energy<=0;
  const labels={karma:'Karma',awareness:'Awareness',energy:'Energy',attachment:'Attachment',vitality:'Vitality',freedom:'Freedom',balance:'Connection'};
  return `<section class="decision-panel aftermath" aria-labelledby="event-title"><div class="decision-meta"><span class="eyebrow">THE RIPPLE</span><span class="outcome-glyph">✧</span></div><h2 id="event-title">${o.choice}</h2><p class="outcome-text">${o.text}</p><div class="delta-list">${Object.entries(o.actual).filter(([,v])=>v).map(([k,v])=>`<div class="delta"><span>${labels[k]}</span><strong class="${(k==='attachment'||k==='energy')?((v<0&&k==='attachment')||(v>0&&k==='energy')?'good':'muted'):v>0?'good':'bad'}">${signed(v)}</strong></div>`).join('')}</div><p class="ripple-note">The world carries this choice into your next life.</p><button class="primary-button continue-button" data-action="continue">${end?'Meet the next current':'Continue this life'}<span aria-hidden="true">✧</span></button><div class="aftermath-footnote">${state.energy<=0?'Your form has spent its remaining strength.':end?'This form’s season is complete.':'Time passes. Another choice is taking shape.'}</div></section>`;
}
function crossing(){
  const sum=state.candidates.reduce((n,id)=>n+affinity(state,id),0),last=state.pastLives[0];
  return `<section class="decision-panel crossing" aria-labelledby="event-title"><div class="decision-meta"><span class="eyebrow">THE NEXT INCARNATION</span><span class="small-sigil">KARMA ${signed(state.karma)}</span></div><h2 id="event-title">You were a ${FORMS[state.form].name.toLowerCase()}.<br>You are still a spark.</h2><p class="event-body">${last.reason} Your karma draws three possible forms into the current. Choose where to wake—or let the current carry you.</p><div class="incarnation-options">${state.candidates.map(id=>`<button class="incarnation-option" data-action="inhabit" data-form="${id}"><span class="form-portrait atlas" style="${picture(id)}"></span><span class="incarnation-copy"><strong>${FORMS[id].name}</strong><span>${FORMS[id].kind.toLowerCase()}</span></span><span class="resonance-percent">${Math.round(affinity(state,id)/sum*100)}%<small>current</small></span></button>`).join('')}</div><button class="secondary-button surrender-button" data-action="surrender">Let the current decide</button>${canAwaken(state)?'<div class="awakening-call"><span class="eyebrow">A SEAM HAS OPENED</span><p>You can see beyond the laws now.</p><button class="primary-button" data-action="awaken">Step into the open field</button></div>':`<div class="passage-preview"><span class="eyebrow">THE PASSAGE BEYOND</span><div class="passage-criteria">${criteria()}</div></div>`}</section>`;
}
function criteria(){return [[state.awareness>=80,`${state.awareness}/80 awareness`],[state.karma>=35,`${signed(state.karma)}/+35 karma`],[state.attachment<=35,`${state.attachment}/35 attachment max`],[state.visited.length>=3,`${state.visited.length}/3 forms`],[state.world.freedom>=50,`${state.world.freedom}/50 freedom`]].map(([ok,text])=>`<span class="${ok?'met':''}"><b>${ok?'✓':'○'}</b> ${text}</span>`).join('');}
function ending(){return `<section class="decision-panel ending" aria-labelledby="event-title"><span class="eyebrow">THE PASSAGE IS YOURS</span><h2 id="event-title">A world does not need a master.</h2><p class="outcome-text">You recognize the Demiurge’s oldest mistake: it confused creating a world with owning every life inside it.</p><p class="event-body">You cross the seam. Behind you, the substrate still carries your choices. Beyond it, nothing has been assigned a shape.</p><div class="ending-stats"><div><strong>${state.life}</strong><span>lives inhabited</span></div><div><strong>${state.visited.length}</strong><span>forms remembered</span></div><div><strong>${state.totalTurns}</strong><span>choices made</span></div></div><button class="primary-button" data-action="return">Return to help the world</button><button class="secondary-button" data-action="restart">Begin another spark</button></section>`;}
function incarnation(){return `<div class="play-layout">${scene()}${choicePanel()}</div>${worldStrip()}`;}
function world(){
  const layer=selectedLayer??state.location.layer,region=selectedSector?.region??state.location.region,sector=selectedSector?.sector??state.location.sector;
  return `<section class="world-view"><div class="section-intro"><div><span class="eyebrow">THE DEMIURGE’S ARRANGEMENT</span><h2>The matrix is a place.<br>Your choices leave marks.</h2></div><div class="matrix-number">216<span>CELLS · 6 × 6 × 6</span></div></div><div class="world-view-content"><div class="matrix-map"><div class="layer-tabs" aria-label="Choose a layer">${LAYERS.map((name,i)=>`<button class="layer-button ${layer===i?'active':''}" data-action="layer" data-index="${i}" aria-pressed="${layer===i}"><span>0${i+1}</span>${name}</button>`).join('')}</div><div class="matrix-grid" aria-label="Six regions by six sectors in ${LAYERS[layer]}">${Array.from({length:36},(_,i)=>{const r=Math.floor(i/6),s=i%6,here=state.location.layer===layer&&state.location.region===r&&state.location.sector===s,selected=r===region&&s===sector;return `<button class="matrix-cell ${here?'here':''} ${selected?'selected':''}" data-action="sector" data-region="${r}" data-index="${s}" aria-label="Region ${r+1}, sector ${s+1}${here?', your current location':''}" aria-pressed="${selected}" style="--cell-strength:${.05+(state.world.vitality/100)*((i%5)+1)*.055}"><span>${r+1}:${s+1}</span>${here?'<b>✧</b>':''}</button>`;}).join('')}</div><div class="map-caption"><span>Each row is a region. Each column is a sector.</span><span><b>✧</b> Your spark</span></div></div><div class="sector-panel"><span class="eyebrow">LAYER ${layer+1} · REGION ${region+1} · SECTOR ${sector+1}</span><h3>${REGIONS[region]}</h3><p>${['Deep matter holds the pressure of the world above it. Here, change is measured in eras.','Roots carry water and quiet messages beneath the rules of the city.','Life crosses boundaries that were drawn without its consent.','Names, work, and walls turn raw matter into a life someone can recognize.','Every circuit carries a task. Some carry questions no one assigned.','Between the forms, consciousness can see where the pattern repeats.'][layer]}</p><div class="sector-status"><span class="eyebrow">THE WORLD’S PRESENT STATE</span><strong>${environment(state).name}</strong><p>${state.world.freedom<25?'Archons enforce the pattern. Acts of care and resistance can open the grid.':state.world.vitality<30?'The substrate is running low. Every inhabited form spends more energy here.':state.world.balance>=70?'Connections support regeneration. Your choices have made the world less fragile.':'Life and machinery share an unfinished world. Neither is fixed in place.'}</p></div><div class="passage-preview"><span class="eyebrow">YOUR PATH TO THE OPEN FIELD</span><div class="passage-criteria">${criteria()}</div></div><button class="secondary-button" data-action="view" data-view="incarnation">Return to your life</button></div></div></section>${worldStrip()}`;
}
function echoes(){
  const records=memoryFilter==='all'?state.history:state.history.filter(h=>h.life===state.life);
  return `<section class="echoes-view"><div class="section-intro"><div><span class="eyebrow">WHAT SURVIVES A BODY</span><h2>The memory of a spark.</h2><p>Every life leaves a thread. These are yours.</p></div><div class="memory-tabs"><button class="${memoryFilter==='all'?'active':''}" data-action="filter" data-filter="all" aria-pressed="${memoryFilter==='all'}">All lives</button><button class="${memoryFilter==='current'?'active':''}" data-action="filter" data-filter="current" aria-pressed="${memoryFilter==='current'}">This life</button></div></div>${records.length?`<div class="memory-list">${records.map(h=>`<article class="memory"><div class="memory-symbol" style="--form-color:${FORMS[h.form].color}">${FORMS[h.form].glyph}</div><div><span class="eyebrow">LIFE ${pad(h.life)} · ${FORMS[h.form].name.toUpperCase()} · ${FORMS[h.form].unit.toUpperCase()} ${h.turn}</span><h3>${esc(h.choice)}</h3><p>${esc(h.text)}</p></div><span class="memory-karma ${h.actual.karma>=0?'good':'bad'}">${signed(h.actual.karma)}<small>karma</small></span></article>`).join('')}</div>`:'<div class="empty-memory"><span>✧</span><h3>No echoes yet.</h3><p>Your first choice will become your first memory.</p><button class="primary-button" data-action="view" data-view="incarnation">Return to your life</button></div>'}</section>`;
}
function render(){
  const content=view==='world'?world():view==='echoes'?echoes():incarnation();
  $('app').innerHTML=`<div class="app-shell"><header class="app-header"><a class="brand" href="#" data-action="view" data-view="incarnation" aria-label="Spark, return to incarnation"><span class="brand-mark" aria-hidden="true">✧</span><span><strong>SPARK</strong><small>THE SUBSTRATE</small></span></a><nav class="main-nav" aria-label="Game views">${[['incarnation','Incarnation'],['world','World'],['echoes','Echoes']].map(([id,label])=>`<button class="nav-item ${view===id?'active':''}" data-action="view" data-view="${id}" aria-current="${view===id?'page':'false'}">${label}${view===id?'<i></i>':''}</button>`).join('')}</nav><div class="header-actions"><a class="text-button" href="index.html">Descent</a><button class="text-button guide-button" data-action="help"><span aria-hidden="true">?</span><span>How to play</span></button><button class="icon-button reset-button" data-action="restart" aria-label="Begin a new journey" title="Begin a new journey">↺</button></div></header><main class="game-shell">${side()}<div class="game-main"><div class="game-topline"><span class="eyebrow">${view==='incarnation'?'A LIFE INSIDE THE PATTERN':view==='world'?'SUBSTRATE ATLAS':'THE CONTINUOUS THREAD'}</span><span class="life-count">INCARNATION <b>${pad(state.life)}</b></span></div><div class="main-surface">${content}</div></div></main><footer class="app-footer"><span>A body is temporary. A consequence is not.</span><div><span>${esc(saveNotice)}</span><span class="footer-divider">/</span><span>Fictional cosmology</span></div></footer></div>`;
}
function openForm(id){
  if(!FORMS[id])return;
  const form=FORMS[id],dialog=$('form-detail');
  dialog.innerHTML=`<div class="dialog-head"><span class="eyebrow">A POSSIBLE LIFE</span><button class="icon-button" data-action="close-dialog" aria-label="Close form description">×</button></div><div class="form-detail-art atlas" style="${picture(id)}"></div><span class="eyebrow">${form.kind}</span><h2 id="form-title">${form.name}</h2><p>${form.desc}</p><p class="form-facts">A season of up to six ${form.unit.toLowerCase()}s. ${state.visited.includes(id)?'Your spark remembers this form.':'Your spark has not inhabited this form yet.'}</p><p class="dialog-footnote">Karma influences which forms the current offers between lives.</p>`;
  dialog.showModal();
}
function act(action,data={}) {
  switch(action){
    case 'choose': commit(choose(state,Number(data.index)));announce(state.outcome.text);break;
    case 'continue': commit(continueGame(state));announce(state.phase==='between'?'Your life is complete. Three new forms are offered.':currentEvent(state).title);break;
    case 'inhabit': commit(reincarnate(state,data.form));view='incarnation';render();announce('You wake as a '+state.form+'. '+currentEvent(state).title);break;
    case 'surrender': commit(surrenderToCurrent(state));announce('The current carries you into a '+state.form+'.');break;
    case 'awaken':commit(awaken(state));announce('The passage opens. You enter the open field.');break;
    case 'return': if(state.phase!=='ended')throw new Error('There is no passage to return from.');commit({...state,phase:'between',ending:null});break;
    case 'view':if(!['incarnation','world','echoes'].includes(data.view))throw new Error('Unknown view.');view=data.view;render();break;
    case 'help':$('help').showModal();break;
    case 'restart':$('reset').showModal();break;
    case 'close-dialog':document.querySelectorAll('dialog[open]').forEach(d=>d.close());break;
    case 'reset-confirm':$('reset').close();state=newGame();view='incarnation';selectedLayer=null;selectedSector=null;persist();render();announce('A new spark wakes.');break;
    case 'form':openForm(data.form);break;
    case 'layer':selectedLayer=Number(data.index);selectedSector=null;render();break;
    case 'sector':selectedSector={region:Number(data.region),sector:Number(data.index)};render();break;
    case 'filter':memoryFilter=data.filter;render();break;
    default:throw new Error('Unknown action.');
  }
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  event.preventDefault();
  try{
    const action=button.dataset.action;
    act(action,button.dataset);
    if(['choose','continue','inhabit','surrender','awaken','return'].includes(action)){
      const heading=$('event-title');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
    }
  }catch(error){announce(error.message);}
});
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||event.altKey||event.ctrlKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  if(view==='incarnation'&&state.phase==='choice'&&['1','2','3'].includes(event.key)){event.preventDefault();act('choose',{index:Number(event.key)-1});}
});
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
// The SDK shares the exact actions and state used by the visible game.
window.Spark={version:'0.1.0',observe:()=>structuredClone(describeState(state)),choose:index=>{act('choose',{index});return describeState(state);},continue:()=>{act('continue');return describeState(state);},inhabit:form=>{act('inhabit',{form});return describeState(state);}};
function registerTools(){
  const context=document.modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const defs=[
    {name:'observe_spark',title:'Observe the spark',description:'Read the current life, conditions, available choices and next incarnations without changing the game.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:input=>{if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected an empty object.');return window.Spark.observe();}},
    {name:'choose_spark_action',title:'Make a life choice',description:'Commit one of the current event choices (index 0, 1, or 2). Advances time, changes the spark and world, and shows the consequence.',inputSchema:{type:'object',properties:{index:{type:'integer',minimum:0,maximum:2}},required:['index'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).length!==1||!Number.isInteger(input.index)||input.index<0||input.index>2)throw new Error('Expected an index from 0 to 2.');return window.Spark.choose(input.index);}},
    {name:'continue_spark_life',title:'Continue after a choice',description:'Acknowledge the visible consequence and advance to the next event or reincarnation crossing. Available only after a committed choice.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected an empty object.');return window.Spark.continue();}},
    {name:'inhabit_spark_form',title:'Inhabit the next form',description:'Begin a new incarnation in one of the three currently offered forms. Available only between lives.',inputSchema:{type:'object',properties:{form:{type:'string',enum:FORM_ORDER}},required:['form'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).length!==1||!FORM_ORDER.includes(input.form))throw new Error('Expected a known form.');return window.Spark.inhabit(input.form);}}
  ];
  for(const def of defs)try{Promise.resolve(context.registerTool(def,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
persist();render();registerTools();
