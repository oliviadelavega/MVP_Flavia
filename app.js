 import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js'
  import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
  } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js'
  import {
    getFirestore,
    doc,
    collection,
    setDoc,
    addDoc,
    serverTimestamp,
  } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js'
  import {
    getStorage,
    ref as storageRef,
    uploadBytes,
  } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js'

  // ============================================================
  // Configuration — paste the firebaseConfig from the Firebase
  // console (Project settings → General → Your apps → Web app).
  // ============================================================
  const firebaseConfig = {
    apiKey: 'AIzaSyBeiifMf8FTgJDO-_ZtU6VqV3THk9_Dt-4',
    authDomain: 'flavia-e5670.firebaseapp.com',
    projectId: 'flavia-e5670',
    storageBucket: 'flavia-e5670.firebasestorage.app',
    messagingSenderId: '122439372365',
    appId: '1:122439372365:web:5401fb354a7152b06e9604',
    measurementId: 'G-SV71XGP1B3',
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)
  const storage = getStorage(app)

  const BODY_PARTS = ['hands','wrists','inner_elbows','behind_knees','face','eyelids','neck','scalp','torso','back','feet','ankles']
  const TOPICALS = ['none','emollient','moisturizer','steroid_low','steroid_mid','steroid_high','tacrolimus','pimecrolimus','other']
  const FOOD_TAGS = ['dairy','gluten','sugar','refined_carbs','spicy','alcohol','caffeine','citrus','nuts','eggs','soy','nightshades','high_histamine','fermented','processed','seed_oils','red_meat','fish','shellfish','chocolate','tea']
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
  function getUser() {
    return auth.currentUser
  }

  async function handleAuthSubmit(e) {
    e.preventDefault()
    const btn = $('button[type="submit"]', e.target)
    const status = $('#auth-status')
    status.textContent = ''
    setBusy(btn, true, 'signing in…')
    const email = e.target.email.value.trim()
    const password = e.target.password.value
    try {
      await signInWithEmailAndPassword(auth, email, password)
      showScreen('home')
    } catch (error) {
      status.textContent = error.message
    } finally {
      setBusy(btn, false)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    showScreen('auth')
  }

  // ---------------- form submissions ----------------
  async function submitDaily(e) {
    e.preventDefault()
    const btn = $('button[type="submit"]', e.target)
    setBusy(btn, true, 'saving…')
    const user = getUser()
    if (!user) { setBusy(btn, false); return }
    const fd = new FormData(e.target)
    const menstrual = fd.get('menstrual_day')
    const date = todayString()
    const row = {
      user_id: user.uid,
      date,
      eczema_severity: getScale('eczema_severity'),
      itch_level: getScale('itch_level'),
      stress_level: getScale('stress_level'),
      body_parts_affected: getChips('body_parts_affected'),
      topicals_used: getChips('topicals_used'),
      menstrual_day: menstrual ? Number(menstrual) : null,
      notes: fd.get('notes')?.toString().trim() || null,
      updated_at: serverTimestamp(),
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'manual_log', date), row, { merge: true })
    } catch (error) {
      setBusy(btn, false)
      return alert(error.message)
    }
    setBusy(btn, false)
    resetForm('form-daily')
    flashSaved()
  }

  async function submitMeal(e) {
    e.preventDefault()
    const btn = $('button[type="submit"]', e.target)
    setBusy(btn, true, 'saving…')
    const user = getUser()
    if (!user) { setBusy(btn, false); return }
    const fd = new FormData(e.target)
    const row = {
      user_id: user.uid,
      date: todayString(),
      time: fd.get('time'),
      description: fd.get('description'),
      tags: getChips('food_tags'),
      created_at: serverTimestamp(),
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'food_log'), row)
    } catch (error) {
      setBusy(btn, false)
      return alert(error.message)
    }
    setBusy(btn, false)
    resetForm('form-meal')
    flashSaved()
  }

  async function submitPhoto(e) {
    e.preventDefault()
    const btn = $('button[type="submit"]', e.target)
    setBusy(btn, true, 'uploading…')
    const user = getUser()
    if (!user) { setBusy(btn, false); return }
    const fd = new FormData(e.target)
    const file = fd.get('file')
    const kinds = getChips('photo_kind')
    if (!kinds.length) { setBusy(btn, false); return alert('Pick: skin, food, or cream.') }
    const kind = kinds[0]
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${user.uid}/${todayString()}/${kind}-${Date.now()}.${ext}`
    try {
      await uploadBytes(storageRef(storage, path), file, { contentType: file.type })
    } catch (error) {
      setBusy(btn, false)
      return alert(error.message)
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'photos'), {
        user_id: user.uid,
        date: todayString(),
        kind,
        storage_path: path,
        notes: fd.get('notes')?.toString().trim() || null,
        created_at: serverTimestamp(),
      })
    } catch (error) {
      setBusy(btn, false)
      return alert(error.message)
    }
    setBusy(btn, false)
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

  function boot() {
    buildScales(); buildChips(); wire()
    const dateEl = $('#today-date'); if (dateEl) dateEl.textContent = todayHuman()
    onAuthStateChanged(auth, (user) => {
      showScreen(user ? 'home' : 'auth')
    })
  }
  boot()
