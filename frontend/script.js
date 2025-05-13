// script.js

const API_BASE = 'http://localhost:1339/api';

let jwt = localStorage.getItem('jwt');
let currentUser = null;
let readingListItems = [];

// --- AUTH ---
async function registerUser(u, e, p) {
  const res = await fetch(`${API_BASE}/auth/local/register`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ username:u, email:e, password:p })
  });
  const data = await res.json();
  if (data.jwt) {
    localStorage.setItem('jwt', data.jwt);
    jwt = data.jwt;
    await loadUserData();
    hideAuthModal();
  } else {
    alert('Registrering misslyckades:\n' + data.error.message);
  }
}

async function loginUser(idf, pwd) {
  const res = await fetch(`${API_BASE}/auth/local`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ identifier:idf, password:pwd })
  });
  const data = await res.json();
  if (data.jwt) {
    localStorage.setItem('jwt', data.jwt);
    jwt = data.jwt;
    await loadUserData();
    hideAuthModal();
  } else {
    alert('Inloggning misslyckades:\n' + data.error.message);
  }
}

async function loadUserData() {
  try {
    // Hämta användarinfo
    const meRes = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization:`Bearer ${jwt}` }
    });
    if (!meRes.ok) throw new Error('Ogiltig token');
    currentUser = await meRes.json();

    // Hämta sparade böcker
    const listRes = await fetch(
      `${API_BASE}/reading-list-items?filters[user][id][$eq]=${currentUser.id}&populate=*`,
      { headers: { Authorization:`Bearer ${jwt}` } }
    );
    const listJson = await listRes.json();
    readingListItems = listJson.data;
  } catch(err) {
    localStorage.removeItem('jwt');
    jwt = null;
    location.reload();
  }

  renderReadingList();
  renderBooks(window.lastFetchedBooks || []);
}

// --- BÖCKER ---
async function fetchBooks() {
  const res = await fetch(`${API_BASE}/books?populate=*`);
  const json = await res.json();
  return json.data;
}

async function addToReadingList(bookId) {
  const res = await fetch(`${API_BASE}/reading-list-items`, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      Authorization:`Bearer ${jwt}`
    },
    body: JSON.stringify({ data:{ book:bookId } })
  });
  const json = await res.json();
  readingListItems.push(json.data);
  renderReadingList();
  renderBooks(window.lastFetchedBooks);
}

async function removeFromReadingList(itemId) {
  await fetch(`${API_BASE}/reading-list-items/${itemId}`, {
    method:'DELETE',
    headers:{ Authorization:`Bearer ${jwt}` }
  });
  readingListItems = readingListItems.filter(i=>i.id!==itemId);
  renderReadingList();
  renderBooks(window.lastFetchedBooks);
}

async function rateBook(bookId, value) {
  await fetch(`${API_BASE}/ratings`, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      Authorization:`Bearer ${jwt}`
    },
    body: JSON.stringify({ data:{ value, book:bookId } })
  });
  alert('Ditt betyg är sparat!');
}

// --- RENDERING ---
function renderBooks(books) {
  window.lastFetchedBooks = books;
  const c = document.getElementById('books-container');
  c.innerHTML = books.map(book=>{
    const { id, attributes } = book;
    const inList = readingListItems.some(i=>i.attributes.book.data.id===id);
    return `
      <article class="book-card">
        <img src="${attributes.cover.data.attributes.url}" alt="${attributes.title} omslag"/>
        <h2>${attributes.title}</h2>
        <p>Författare: ${attributes.author}</p>
        <button class="btn-toggle-list" data-id="${id}">
          ${inList?'Ta bort från läslista':'Lägg till i läslista'}
        </button>
        <div class="rating-control">
          <label>Betyg:</label>
          <select class="select-rating" data-id="${id}">
            <option value="">–</option>
            ${[...Array(10)].map((_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}
          </select>
        </div>
      </article>
    `;
  }).join('');

  c.querySelectorAll('.btn-toggle-list').forEach(btn=>{
    btn.onclick = async ()=>{
      if (!jwt) return showAuthModal();
      const bid = btn.dataset.id;
      const inList = readingListItems.find(i=>i.attributes.book.data.id==bid);
      if (inList) await removeFromReadingList(inList.id);
      else await addToReadingList(bid);
    };
  });
  c.querySelectorAll('.select-rating').forEach(sel=>{
    sel.onchange = async ()=>{
      if (!jwt) return showAuthModal();
      const v = Number(sel.value);
      if (v) await rateBook(sel.dataset.id,v);
      sel.value = '';
    };
  });
}

function renderReadingList() {
  const lc = document.getElementById('reading-list-container');
  if (!lc) return;
  if (readingListItems.length===0) {
    lc.innerHTML = '<p>Ingen bok i din läslista än.</p>';
  } else {
    lc.innerHTML = readingListItems.map(item=>{
      const b = item.attributes.book.data;
      return `
        <article class="book-card small">
          <img src="${b.attributes.cover.data.attributes.url}" alt="${b.attributes.title}"/>
          <h3>${b.attributes.title}</h3>
          <button class="btn-remove-list" data-item-id="${item.id}">Ta bort</button>
        </article>
      `;
    }).join('');
    lc.querySelectorAll('.btn-remove-list').forEach(btn=>{
      btn.onclick = ()=>removeFromReadingList(btn.dataset.itemId);
    });
  }
}

// --- MODAL ---
function showAuthModal(){ document.getElementById('auth-modal').classList.remove('hidden'); }
function hideAuthModal(){ document.getElementById('auth-modal').classList.add('hidden'); }

document.addEventListener('DOMContentLoaded',()=>{
  // Stäng-knapp
  document.querySelector('#auth-modal .modal-close').onclick = hideAuthModal;
  document.getElementById('auth-modal').onclick = e=>{ if(e.target.id==='auth-modal') hideAuthModal(); };

  // Form-handlers
  document.getElementById('form-login').onsubmit = async e=>{
    e.preventDefault();
    await loginUser(e.target.identifier.value, e.target.password.value);
  };
  document.getElementById('form-register').onsubmit = async e=>{
    e.preventDefault();
    await registerUser(e.target.username.value, e.target.email.value, e.target.password.value);
  };

  // Login/logout-knapp
  const lb = document.getElementById('login-btn');
  if(jwt) {
    lb.textContent = 'Logga ut';
    lb.onclick = ()=>{
      localStorage.removeItem('jwt');
      location.reload();
    };
    loadUserData();
  } else {
    lb.onclick = showAuthModal;
  }

  // Ladda böcker
  fetchBooks().then(renderBooks);
});
