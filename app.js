(() => {
'use strict';
const KEY='familyEmergencyKitPWA_v1', PREF='familyEmergencyKitPWA_prefs_v1';
const $=id=>document.getElementById(id);
let items=[],editingId=null;
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const daysLeft=date=>Math.round((new Date(date+'T00:00:00')-today())/86400000);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status=x=>{const n=daysLeft(x.expiry);return n<0?'expired':n<=90?'soon':'good'};
const id=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
function save(){try{localStorage.setItem(KEY,JSON.stringify(items));$('saveStatus').textContent='Saved on this device · '+new Date().toLocaleTimeString()}catch(e){$('saveStatus').textContent='Could not save. Browser storage may be unavailable or full.'}}
function selectedReminders(){return [...document.querySelectorAll('#reminderChoices input:checked')].map(x=>Number(x.value))}
function render(){
 $('total').textContent=items.length;
 $('soon').textContent=items.filter(x=>status(x)==='soon').length;
 $('expired').textContent=items.filter(x=>status(x)==='expired').length;
 const q=$('search').value.toLowerCase(),f=$('filter').value;
 const list=items.filter(x=>[x.name,x.category,x.location,x.notes].join(' ').toLowerCase().includes(q)&&(f==='all'||status(x)===f)).sort((a,b)=>a.expiry.localeCompare(b.expiry));
 $('countLabel').textContent=`Showing ${list.length} of ${items.length} items`;
 $('empty').classList.toggle('hidden',list.length!==0);
 $('items').innerHTML=list.map(x=>{
  const n=daysLeft(x.expiry),s=status(x),label=n<0?`Expired ${Math.abs(n)} days ago`:n===0?'Expires today':`${n} days left`;
  return `<article class="item"><div style="min-width:0;flex:1"><h3>${esc(x.name)}</h3><p>${esc(x.category)} · Quantity: ${esc(x.quantity)}</p><p>${esc(x.location||'No location')} · Expires: ${esc(x.expiry)}</p>${x.notes?`<p>${esc(x.notes)}</p>`:''}<span class="pill ${s}">${label}</span></div><div class="item-actions"><button class="secondary" data-edit="${esc(x.id)}">Edit</button><button class="dangerbtn" data-delete="${esc(x.id)}">Delete</button></div></article>`;
 }).join('');
}
function openForm(x=null){
 editingId=x?.id||null;$('formTitle').textContent=x?'Edit item':'Add an item';
 $('itemId').value=x?.id||'';$('name').value=x?.name||'';$('category').value=x?.category||'Food';
 $('quantity').value=x?.quantity??1;$('expiry').value=x?.expiry||'';$('purchased').value=x?.purchased||'';
 $('location').value=x?.location||'';$('notes').value=x?.notes||'';
 $('itemForm').classList.remove('hidden');$('name').focus();
}
function closeForm(){$('itemForm').classList.add('hidden');editingId=null}
$('showAdd').onclick=()=>openForm();$('cancelEdit').onclick=closeForm;
$('itemForm').onsubmit=e=>{
 e.preventDefault();const x={id:editingId||id(),name:$('name').value.trim(),category:$('category').value,quantity:Math.max(1,Number($('quantity').value)||1),expiry:$('expiry').value,purchased:$('purchased').value,location:$('location').value.trim(),notes:$('notes').value.trim()};
 if(!x.name||!x.expiry)return;
 items=editingId?items.map(a=>a.id===editingId?x:a):[...items,x];save();render();closeForm();
};
$('items').addEventListener('click',e=>{
 const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
 if(edit){const x=items.find(a=>a.id===edit.dataset.edit);if(x)openForm(x)}
 if(del){const x=items.find(a=>a.id===del.dataset.delete);if(x&&confirm(`Delete "${x.name}"?`)){items=items.filter(a=>a.id!==x.id);save();render()}}
});
$('search').oninput=render;$('filter').onchange=render;
function readPrefs(){try{return JSON.parse(localStorage.getItem(PREF)||'{}')}catch{return {}}}
function writePrefs(){const p=readPrefs();p.reminders=selectedReminders();localStorage.setItem(PREF,JSON.stringify(p))}
document.querySelectorAll('#reminderChoices input').forEach(x=>x.addEventListener('change',writePrefs));
function checkReminders(){
 if(!('Notification'in window)||Notification.permission!=='granted')return;
 const prefs=readPrefs(),sent=prefs.sent||{},todayKey=today().toISOString().slice(0,10);
 for(const x of items){const n=daysLeft(x.expiry);if(n<0||!selectedReminders().includes(n))continue;
  const k=`${x.id}_${x.expiry}_${n}`;if(sent[k])continue;
  try{new Notification('Family Emergency Kit reminder',{body:`${x.name} expires ${n===0?'today':`in ${n} days`}.`});sent[k]=todayKey}catch{}
 }
 prefs.sent=sent;localStorage.setItem(PREF,JSON.stringify(prefs));
}
$('enableNotifications').onclick=async()=>{
 if(!('Notification'in window)){alert('This browser does not support notifications.');return}
 try{const p=await Notification.requestPermission();$('notificationStatus').textContent=p==='granted'?'Notifications allowed':`Permission: ${p}`;if(p==='granted')checkReminders()}catch{$('notificationStatus').textContent='Could not request permission'}
};
function updateNotificationStatus(){if(!('Notification'in window))$('notificationStatus').textContent='Not supported';else $('notificationStatus').textContent=Notification.permission==='granted'?'Notifications allowed':Notification.permission==='denied'?'Blocked in browser settings':'Permission not requested'}
$('exportBtn').onclick=()=>{
 const blob=new Blob([JSON.stringify({app:'Family Emergency Kit',version:1,exportedAt:new Date().toISOString(),items},null,2)],{type:'application/json'});
 const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='family-emergency-kit-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('importBtn').onclick=()=>$('backupFile').click();
$('backupFile').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{const obj=JSON.parse(await file.text()),arr=Array.isArray(obj)?obj:obj.items;
  if(!Array.isArray(arr)||arr.some(x=>!x||typeof x.name!=='string'||typeof x.expiry!=='string'||!x.name||!x.expiry))throw Error();
  if(confirm(`Import ${arr.length} items? This replaces the inventory on this device.`)){items=arr.map(x=>({...x,id:String(x.id||id())}));save();render()}
 }catch{alert('That file does not look like a valid Family Emergency Kit backup.')}
 e.target.value='';
};
$('clearAll').onclick=()=>{if(confirm('Permanently delete every inventory item from this device? Export a backup first if needed.')){items=[];save();render()}};
try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(v))items=v}catch{alert('Saved inventory could not be read.')}
const prefs=readPrefs();if(Array.isArray(prefs.reminders))document.querySelectorAll('#reminderChoices input').forEach(x=>x.checked=prefs.reminders.includes(Number(x.value)));
render();updateNotificationStatus();checkReminders();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();checkReminders()}});
setInterval(checkReminders,60000);
if('serviceWorker'in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();