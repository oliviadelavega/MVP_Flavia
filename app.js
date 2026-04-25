 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
                                                                                                                                                                                                               
  // ============================================================                                                                                                                                              
  // Configuration — paste your project credentials here.                                                                                                                                                      
  // Both values are PUBLIC. The anon key is restricted by RLS,                                                                                                                                                
  // so it's safe to commit to a public repo.                                                                                                                                                                  
  // Find them in Supabase dashboard → Settings → API.
  // ============================================================                                                                                                                                              
  const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co'
  const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY'                                                                                                                                                                    
                  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)                                                                                                                                               
                  
  // Vocabularies — must match the Whoop / Excel pipeline exactly.                                                                                                                                             
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
    const status = $('#auth-status'); status.textContent = 'Sending…'                                                                                                                                          
    const email = e.target.email.value.trim()
    const { error } = await supabase.auth.signInWithOtp({                                                                                                                                                      
      email,      
      options: { emailRedirectTo: window.location.origin }                                                                                                                                                     
    })                                                                                                                                                                                                         
    status.textContent = error ? error.message : 'Check your inbox. Click the link to sign in.'
  }                                                                                                                                                                                                            
                  
  async function handleSignOut() {                                                                                                                                                                             
    await supabase.auth.signOut()
    showScreen('auth')
  }                                                                                                                                                                                                            
  
  // ---------------- form submissions ----------------                                                                                                                                                        
  async function submitDaily(e) {
    e.preventDefault()                                                                                                                                                                                         
    const user = await getUser(); if (!user) return
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
    if (error) return alert(error.message)
    resetForm('form-daily'); showScreen('screen-saved')                                                                                                                                                        
  }               
                                                                                                                                                                                                               
  async function submitMeal(e) {                                                                                                                                                                               
    e.preventDefault()
    const user = await getUser(); if (!user) return                                                                                                                                                            
    const fd = new FormData(e.target)
    const row = {
      user_id: user.id,
      date: todayString(),                                                                                                                                                                                     
      time: fd.get('time'),
      description: fd.get('description'),                                                                                                                                                                      
      tags: getChips('food_tags'),
    }
    const { error } = await supabase.from('food_log').insert(row)                                                                                                                                              
    if (error) return alert(error.message)
    resetForm('form-meal'); showScreen('screen-saved')                                                                                                                                                         
  }                                                                                                                                                                                                            
  
  async function submitPhoto(e) {                                                                                                                                                                              
    e.preventDefault()
    const user = await getUser(); if (!user) return
    const fd = new FormData(e.target)
    const file = fd.get('file')
    const kinds = getChips('photo_kind')                                                                                                                                                                       
    if (!kinds.length) return alert('Pick: skin, food, or cream.')
    const kind = kinds[0]                                                                                                                                                                                      
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${user.id}/${todayString()}/${kind}-${Date.now()}.${ext}`                                                                                                                                    
    const up = await supabase.storage.from('photos').upload(path, file, { contentType: file.type })                                                                                                            
    if (up.error) return alert(up.error.message)                                                                                                                                                               
    const ins = await supabase.from('photos').insert({                                                                                                                                                         
      user_id: user.id, date: todayString(), kind, storage_path: path,
      notes: fd.get('notes')?.toString().trim() || null,                                                                                                                                                       
    })            
    if (ins.error) return alert(ins.error.message)                                                                                                                                                             
    resetForm('form-photo'); showScreen('screen-saved')                                                                                                                                                        
  }
                                                                                                                                                                                                               
  // ---------------- wire-up + boot ----------------                                                                                                                                                          
  function wire() {
    $$('.menu-item').forEach(b => b.addEventListener('click', () => showScreen(`screen-${b.dataset.screen}`)))                                                                                                 
    $$('.back').forEach(b => b.addEventListener('click', () => showScreen('home')))                                                                                                                            
    $('#back-home')?.addEventListener('click', () => showScreen('home'))
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
    supabase.auth.onAuthStateChange((_, s) => showScreen(s ? 'home' : 'auth'))                                                                                                                                 
  }                                                                                                                                                                                                            
  boot()                                                                                                                                                                                                       
                                                                                                                                                                                                               
  ---             
  File 5 — filename: README.md

  # Skin Intelligence — manual logging
                                                                                                                                                                                                               
  Lean web prototype. Log eczema severity, food, photos. Backend: Supabase.                                                                                                                                    
  Three static files (`index.html`, `styles.css`, `app.js`) — no build step.                                                                                                                                   
                                                                                                                                                                                                               
  ## Setup        
                                                                                                                                                                                                               
  ### 1. Apply the database schema

  If Supabase is connected to this repo via the GitHub integration, the                                                                                                                                        
  file at `supabase/migrations/20260425120000_init.sql` applies automatically
  on push.                                                                                                                                                                                                     
                  
  If not, copy the SQL into Supabase → SQL Editor → run it once.                                                                                                                                               
                  
  After it's applied you should see four tables (`profiles`, `manual_log`,                                                                                                                                     
  `food_log`, `photos`) and a `photos` storage bucket.
                                                                                                                                                                                                               
  ### 2. Paste your Supabase credentials
                                                                                                                                                                                                               
  In `app.js`, replace these two lines (Supabase dashboard → Settings → API):                                                                                                                                  
  
  ```js                                                                                                                                                                                                        
  const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co'
  const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY'                                                                                                                                                                    
  ```
                                                                                                                                                                                                               
  Both are public. Row Level Security restricts the anon key. Safe to commit.                                                                                                                                  
  
  ### 3. Deploy                                                                                                                                                                                                
                  
  The app is static. Easiest hosts:                                                                                                                                                                            
  
  - **Vercel** — `vercel.com` → Add New → Project → import this repo → Deploy.                                                                                                                                 
    Auto-redeploys on every push. ~30 seconds.
  - **Cloudflare Pages, Netlify, GitHub Pages** — same idea.                                                                                                                                                   
                                                                                                                                                                                                               
  ### 4. Allow your URL in Supabase                                                                                                                                                                            
                                                                                                                                                                                                               
  Supabase → Authentication → URL Configuration:                                                                                                                                                               
  - **Site URL:** your deployed URL (e.g. `https://app.skinintelligence.io`).
  - **Redirect URLs:** the same URL.                                                                                                                                                                           
                  
  Without this, the magic-link sign-in won't redirect back to your app.                                                                                                                                        
                  
  ### 5. First sign-in                                                                                                                                                                                         
                  
  Open the deployed URL on iPhone. Enter your email. Click the link in your                                                                                                                                    
  inbox. Once you're in, **share → Add to Home Screen** — looks and feels like
  a native app.                                                                                                                                                                                                
                  
  ## What you can log                                                                                                                                                                                          
                  
  - **Daily check-in** — eczema severity, itch, stress, body parts, topicals,                                                                                                                                  
    menstrual day, notes. Upserts by date — re-open it later to edit today.
  - **Meals** — time, description, tags. Multiple per day.                                                                                                                                                     
  - **Photos** — skin / food / cream. Stored privately in Supabase Storage at                                                                                                                                  
    `photos/<user-id>/<date>/<kind>-<timestamp>.<ext>`.                                                                                                                                                        
                                                                                                                                                                                                               
  Vocabularies match the Whoop/Excel pipeline exactly so data joins cleanly.                                                                                                                                   
                                                                                                                                                                                                               
  ## What's intentionally missing                                                                                                                                                                              
                  
  - "Chat with your data" — Phase 2 of the frontend.                                                                                                                                                           
  - Whoop sync to Supabase — for now Whoop still flows to the Excel file;
    next migration adds a `daily_log` table here too and the Python script                                                                                                                                     
    will dual-write.                                                                                                                                                                                           
  - View / edit past entries — first version is write-only.                                                                                                                                                    
  - Native iOS, HealthKit, Flo bridge — Phase 3.                                                                                                                                                               
                                                                                                                                                                                                               
  ## Design notes                                                                                                                                                                                              
                                                                                                                                                                                                               
  Dark, warm, editorial. Serif (system "New York" / "Iowan Old Style") for                                                                                                                                     
  headlines, system sans for body, single warm-amber accent. No shadows, no
  gradients, no skeuomorphism. Calm.                                                                                                                                                                           
                                                                                       
