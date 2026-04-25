 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
                                                                                                                                                                                                               
  // ============================================================
  // Configuration — KEEP YOUR EXISTING VALUES, don't overwrite.                                                                                                                                               
  // (If you've already pasted your Supabase URL + key here,                                                                                                                                                   
  // leave them alone — only update the rest of the file.)                                                                                                                                                     
  // ============================================================                                                                                                                                              
  const SUPABASE_URL = 'https://jfixrvxylbmhbhpqzyjw.supabase.co'                                                                                                                                                   
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmaXhydnh5bGJtaGJocHF6eWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzYzOTksImV4cCI6MjA5MjcxMjM5OX0.-Ys0dbX2NEC49N0XL8QKuUI0v_jBw-qtgCdKbhFtvKM'                                                                                                                                                                    
                  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)                                                                                                                                               
                  
  const BODY_PARTS = ['hands','wrists','inner_elbows','behind_knees','face','eyelids','neck','scalp','torso','back','feet','ankles']                                                                           
  const TOPICALS = ['none','emollient','moisturizer','steroid_low','steroid_mid','steroid_high','tacrolimus','pimecrolimus','other']
  const FOOD_TAGS = ['dairy','gluten','sugar','refined_carbs','spicy','alcohol','caffeine','citrus','nuts','eggs','soy','nightshades','high_histamine','fermented','processed','seed_oils','red_meat','fish','s
  hellfish','chocolate','tea']                                                                                                                                                                                 
  const PHOTO_KINDS = ['skin','food','cream']                                                                                                                                                                  
                                                                                                                                                                                                               
  const VOCAB = { 
    body_parts_affected: BODY_PARTS,                                                                                                                                                                           
    topicals_used: TOPICALS,                                                                                                                                                                                   
    food_tags: FOOD_TAGS,
    photo_kind: PHOTO_KINDS,                                                                                                                                                                                   
  }               
                                                                                                                                                                                                               
  // ---------------- helpers ----------------                                                                                                                                                                 
  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))                                                                                                                                  
                                                                                                                                                                                                               
  const showScreen = id => $$('.screen').forEach(s => { s.hidden = s.id !== id })                                                                                                                              
                                                                                                                                                                                                               
  const todayString = () => {                                                                                                                                                                                  
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`                                                                                               
  }                                                                                                                                                                                                            
  const todayHuman = () =>
    new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' }).toLowerCase()                                                                                                      
                                                                                                                                                                                                               
  const setBusy = (btn, busy, busyText = '…') => {                                                                                                                                                             
    if (busy) {                                                                                                                                                                                                
      btn.dataset.original = btn.dataset.original || btn.textContent                                                                                                                                           
      btn.textContent = busyText
      btn.disabled = true                                                                                                                                                                                      
    } else {      
      btn.textContent = btn.dataset.original || btn.textContent                                                                                                                                                
      btn.disabled = false
    }                                                                                                                                                                                                          
  }               

  const flashSaved = () => {
    showScreen('screen-saved')
    setTimeout(() => showScreen('home'), 1400)                                                                                                                                                                 
  }
                                                                                                                                                                                                               
  // ---------------- dynamic UI ----------------                                                                                                                                                              
  function buildScales() {
    $$('.scale').forEach(el => {                                                                                                                                                                               
      el.innerHTML = ''
      for (let i = 0; i <= 5; i++) {                                                                                                                                                                           
        const btn = document.createElement('button')
        btn.type = 'button'; btn.textContent = i; btn.dataset.value = i                                                                                                                                        
        btn.addEventListener('click', () => {
          $$('button', el).forEach(b => b.classList.remove('active'))                                                                                                                                          
          btn.classList.add('active')
          el.dataset.selected = i                                                                                                                                                                              
        })        
        el.appendChild(btn)                                                                                                                                                                                    
      }           
    })
  }

  function buildChips() {                                                                                                                                                                                      
    $$('.chips').forEach(el => {
      const vocab = VOCAB[el.dataset.chips] || []                                                                                                                                                              
      const single = el.classList.contains('single')                                                                                                                                                           
      el.innerHTML = ''
      vocab.forEach(v => {                                                                                                                                                                                     
        const btn = document.createElement('button')
        btn.type = 'button'; btn.dataset.value = v                                                                                                                                                             
        btn.textContent = v.replace(/_/g, ' ')
        btn.addEventListener('click', () => {                                                                                                                                                                  
          if (single) $$('button', el).forEach(b => b.classList.remove('active'))
          btn.classList.toggle('active')                                                                                                                                                                       
        })        
        el.appendChild(btn)                                                                                                                                                                                    
      })          
    })
  }

  const getScale = name => {                                                                                                                                                                                   
    const v = $(`.scale[data-scale="${name}"]`)?.dataset.selected
    return v == null ? null : Number(v)                                                                                                                                                                        
  }               
  const getChips = name =>                                                                                                                                                                                     
    $$(`.chips[data-chips="${name}"] button.active`).map(b => b.dataset.value)                                                                                                                                 
   
  const resetForm = formId => {                                                                                                                                                                                
    const form = $(`#${formId}`)
    form.reset()                                                                                                                                                                                               
    $$('.scale button.active, .chips button.active', form).forEach(b => b.classList.remove('active'))
    $$('.scale', form).forEach(el => delete el.dataset.selected)                                                                                                                                               
  }
                                                                                                                                                                                                               
  // ---------------- auth ----------------
  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()                                                                                                                                                   
    return user
  }                                                                                                                                                                                                            
                  
  async function handleAuthSubmit(e) {                                                                                                                                                                         
    e.preventDefault()
    const btn = $('button[type="submit"]', e.target)                                                                                                                                                           
    const status = $('#auth-status')
    status.textContent = ''
    setBusy(btn, true, 'signing in…')
    const email = e.target.email.value.trim()                                                                                                                                                                  
    const password = e.target.password.value
    const { error } = await supabase.auth.signInWithPassword({ email, password })                                                                                                                              
    setBusy(btn, false)                                                                                                                                                                                        
    if (error) { status.textContent = error.message; return }
    showScreen('home')   // ← the fix: explicit redirect on success                                                                                                                                            
  }                                                                                                                                                                                                            
   
  async function handleSignOut() {                                                                                                                                                                             
    await supabase.auth.signOut()
    showScreen('auth')
  }
                                                                                                                                                                                                               
  // ---------------- form submissions ----------------
  async function submitDaily(e) {                                                                                                                                                                              
    e.preventDefault()
    const btn = $('button[type="submit"]', e.target)                                                                                                                                                           
    setBusy(btn, true, 'saving…')
    const user = await getUser()                                                                                                                                                                               
    if (!user) { setBusy(btn, false); return }
    const fd = new FormData(e.target)                                                                                                                                                                          
    const menstrual = fd.get('menstrual_day')
    const row = {                                                                                                                                                                                              
      user_id: user.id,
      date: todayString(),                                                                                                                                                                                     
      eczema_severity: getScale('eczema_severity'),
      itch_level: getScale('itch_level'),                                                                                                                                                                      
      stress_level: getScale('stress_level'),
      body_parts_affected: getChips('body_parts_affected'),                                                                                                                                                    
      topicals_used: getChips('topicals_used'),                                                                                                                                                                
      menstrual_day: menstrual ? Number(menstrual) : null,
      notes: fd.get('notes')?.toString().trim() || null,                                                                                                                                                       
      updated_at: new Date().toISOString(),                                                                                                                                                                    
    }                                                                                                                                                                                                          
    const { error } = await supabase.from('manual_log').upsert(row, { onConflict: 'user_id,date' })                                                                                                            
    setBusy(btn, false)                                                                                                                                                                                        
    if (error) return alert(error.message)
    resetForm('form-daily')                                                                                                                                                                                    
    flashSaved()                                                                                                                                                                                               
  }
                                                                                                                                                                                                               
  async function submitMeal(e) {
    e.preventDefault()
    const btn = $('button[type="submit"]', e.target)                                                                                                                                                           
    setBusy(btn, true, 'saving…')
    const user = await getUser()                                                                                                                                                                               
    if (!user) { setBusy(btn, false); return }
    const fd = new FormData(e.target)                                                                                                                                                                          
    const row = {
      user_id: user.id,                                                                                                                                                                                        
      date: todayString(),
      time: fd.get('time'),
      description: fd.get('description'),                                                                                                                                                                      
      tags: getChips('food_tags'),
    }                                                                                                                                                                                                          
    const { error } = await supabase.from('food_log').insert(row)
    setBusy(btn, false)                                                                                                                                                                                        
    if (error) return alert(error.message)
    resetForm('form-meal')                                                                                                                                                                                     
    flashSaved()  
  }

  async function submitPhoto(e) {                                                                                                                                                                              
    e.preventDefault()
    const btn = $('button[type="submit"]', e.target)                                                                                                                                                           
    setBusy(btn, true, 'uploading…')
    const user = await getUser()                                                                                                                                                                               
    if (!user) { setBusy(btn, false); return }
    const fd = new FormData(e.target)                                                                                                                                                                          
    const file = fd.get('file')
    const kinds = getChips('photo_kind')                                                                                                                                                                       
    if (!kinds.length) { setBusy(btn, false); return alert('Pick: skin, food, or cream.') }
    const kind = kinds[0]                                                                                                                                                                                      
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${user.id}/${todayString()}/${kind}-${Date.now()}.${ext}`                                                                                                                                    
    const up = await supabase.storage.from('photos').upload(path, file, { contentType: file.type })                                                                                                            
    if (up.error) { setBusy(btn, false); return alert(up.error.message) }                                                                                                                                      
    const ins = await supabase.from('photos').insert({                                                                                                                                                         
      user_id: user.id, date: todayString(), kind, storage_path: path,
      notes: fd.get('notes')?.toString().trim() || null,                                                                                                                                                       
    })            
    setBusy(btn, false)                                                                                                                                                                                        
    if (ins.error) return alert(ins.error.message)                                                                                                                                                             
    resetForm('form-photo')
    flashSaved()                                                                                                                                                                                               
  }               

  // ---------------- wire-up + boot ----------------                                                                                                                                                          
  function wire() {
    $$('.menu-item').forEach(b => b.addEventListener('click', () => showScreen(`screen-${b.dataset.screen}`)))                                                                                                 
    $$('.back').forEach(b => b.addEventListener('click', () => showScreen('home')))                                                                                                                            
    $('#signout')?.addEventListener('click', handleSignOut)                                                                                                                                                    
    $('#auth-form')?.addEventListener('submit', handleAuthSubmit)                                                                                                                                              
    $('#form-daily')?.addEventListener('submit', submitDaily)                                                                                                                                                  
    $('#form-meal')?.addEventListener('submit', submitMeal)                                                                                                                                                    
    $('#form-photo')?.addEventListener('submit', submitPhoto)
  }                                                                                                                                                                                                            
                  
  async function boot() {                                                                                                                                                                                      
    buildScales(); buildChips(); wire()
    const dateEl = $('#today-date'); if (dateEl) dateEl.textContent = todayHuman()
    const { data: { session } } = await supabase.auth.getSession()                                                                                                                                             
    showScreen(session ? 'home' : 'auth')                                                                                                                                                                      
    supabase.auth.onAuthStateChange((event) => {                                                                                                                                                               
      if (event === 'SIGNED_IN') showScreen('home')                                                                                                                                                            
      if (event === 'SIGNED_OUT') showScreen('auth')
    })                                                                                                                                                                                                         
  }               
  boot()                            
