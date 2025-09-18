
const form = document.getElementById('taskForm');
const titleIn = document.getElementById('title');
const subjectIn = document.getElementById('subject');
const dateIn = document.getElementById('date');
const timeIn = document.getElementById('time');
const priorityIn = document.getElementById('priority');
const tasksEl = document.getElementById('tasks');
const searchIn = document.getElementById('search');
const countEl = document.getElementById('count');

let tasks = JSON.parse(localStorage.getItem('ss_tasks') || '[]');
let editId = null;
let activeFilter = localStorage.getItem('ss_filter') || 'all';

function saveTasks(){ localStorage.setItem('ss_tasks', JSON.stringify(tasks)); }
function setFilter(f){ activeFilter=f; localStorage.setItem('ss_filter', f); updateFilterUI(); render(); }

function addTask(obj){ tasks.unshift(obj); saveTasks(); render(); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function render(){
  const q = searchIn.value.trim().toLowerCase();
  const today = new Date().toISOString().slice(0,10);
  let filtered = tasks.filter(t => {
    if(activeFilter==='today' && t.date !== today) return false;
    if(activeFilter==='pending' && t.completed) return false;
    if(activeFilter==='completed' && !t.completed) return false;
    return true;
  });

  if(q) filtered = filtered.filter(t => (t.title + ' ' + (t.subject||'')).toLowerCase().includes(q));

  tasksEl.innerHTML = '';
  countEl.textContent = filtered.length + ' tasks';

  if(!filtered.length){ tasksEl.innerHTML = '<p style="color:var(--muted)">No tasks found.</p>'; return; }

  filtered.forEach(t => {
    const div = document.createElement('div'); div.className='task';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!t.completed;
    cb.addEventListener('change', ()=>{ t.completed = cb.checked; saveTasks(); render(); });

    const main = document.createElement('div'); main.className='main';
    const title = document.createElement('div'); title.className='title'; title.textContent = t.title;
    if(t.completed) title.classList.add('completed');
    const meta = document.createElement('div'); meta.className='meta';
    const parts = [];
    if(t.subject) parts.push(t.subject);
    if(t.date) parts.push(t.date + (t.time? ' • '+t.time:''));
    parts.push(t.priority?.toUpperCase() || 'MED');
    meta.textContent = parts.join(' • ');
    main.appendChild(title); main.appendChild(meta);

    const actions = document.createElement('div'); actions.className='actions';
    const edit = document.createElement('button'); edit.className='btn'; edit.title='Edit'; edit.textContent='✏';
    edit.addEventListener('click', ()=>{ startEdit(t.id); });
    const del = document.createElement('button'); del.className='btn delete'; del.title='Delete'; del.textContent='🗑';
    del.addEventListener('click', ()=>{ if(confirm('Delete this task?')){ tasks = tasks.filter(x=>x.id!==t.id); saveTasks(); render(); } });

    actions.appendChild(edit); actions.appendChild(del);

    div.appendChild(cb); div.appendChild(main); div.appendChild(actions);
    tasksEl.appendChild(div);
  });
}

function startEdit(id){ const t = tasks.find(x=>x.id===id); if(!t) return; editId = id; titleIn.value = t.title; subjectIn.value = t.subject || ''; dateIn.value = t.date || ''; timeIn.value = t.time || ''; priorityIn.value = t.priority || 'medium'; document.getElementById('saveBtn').textContent = 'Update Task'; }

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = { title: titleIn.value.trim(), subject: subjectIn.value.trim(), date: dateIn.value || '', time: timeIn.value || '', priority: priorityIn.value || 'medium' };
  if(!data.title){ alert('Please enter task title'); return; }
  if(editId){ const idx = tasks.findIndex(x=>x.id===editId); if(idx>-1){ tasks[idx] = {...tasks[idx], ...data}; editId=null; document.getElementById('saveBtn').textContent='Add Task'; saveTasks(); render(); form.reset(); } }
  else{ addTask({ id: uid(), ...data, completed:false }); form.reset(); }
});

document.getElementById('clearBtn').addEventListener('click', ()=>{ form.reset(); editId=null; document.getElementById('saveBtn').textContent='Add Task'; });

searchIn.addEventListener('input', ()=>{ render(); });

document.querySelectorAll('.chip').forEach(c=>{ c.addEventListener('click', ()=>{ setFilter(c.dataset.filter); }); });

function updateFilterUI(){ document.querySelectorAll('.chip').forEach(c=>{ c.classList.toggle('active', c.dataset.filter===activeFilter); }); }

document.getElementById('clearCompleted').addEventListener('click', ()=>{ if(confirm('Remove all completed tasks?')){ tasks = tasks.filter(t=>!t.completed); saveTasks(); render(); } });

document.getElementById('exportBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='smart-study-planner-tasks.json'; a.click(); URL.revokeObjectURL(url);
});

updateFilterUI(); render();
