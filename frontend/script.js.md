// const API_BASE = 'http://localhost:1339/api';

// document.addEventListener('DOMContentLoaded', () => {
//   const loginBtn = document.getElementById('login-btn');
//   const modal = document.getElementById('auth-modal');
//   const closeModal = document.querySelector('#auth-modal .modal-close');

//   loginBtn.onclick = () => modal.classList.remove('hidden');
//   closeModal.onclick = () => modal.classList.add('hidden');
//   modal.onclick = e => {
//     if (e.target.id === 'auth-modal') modal.classList.add('hidden');
//   };

//   fetchBooks();
// });

// async function fetchBooks() {
//   const container = document.getElementById('books-container');
//   container.innerHTML = 'Laddar böcker...';

//   try {
//     const res = await fetch(`${API_BASE}/books?populate=cover`);
//     const json = await res.json();
//     const books = json.data;

//     container.innerHTML = books.map(book => {
//       const title     = book.title;
//       const author    = book.author;
//       const pages     = book.pages;
//       const published = book.published;

//       -/-/ Direkt i objektet (inte nested i attributes längre som strapi v4)
//       const coverData = book.cover;
//       const coverUrl = coverData && coverData.url
//         : 'https://via.placeholder.com/150';

//       return `
//         <article class="book-card">
//           <img src="${coverUrl}" alt="${title} omslag" />
//           <h2>${title}</h2>
//           <p><strong>Författare:</strong> ${author}</p>
//           <p><strong>Sidor:</strong> ${pages}</p>
//           <p><strong>Utgivning:</strong> ${new Date(published).toLocaleDateString('sv-SE')}</p>
//         </article>
//       `;
//     }).join('');
//   } catch (err) {
//     container.innerHTML = '<p>Kunde inte ladda böcker.</p>';
//     console.error('Fel vid hämtning av böcker:', err);
//   }
// }


// script.js
// script.js


// FUNKAR SOM DEN SKA:

// script.js

const API_BASE = 'http://localhost:1339/api';

let jwt = localStorage.getItem('jwt');
let currentUser = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

// Håller koll på vilka böcker användaren redan sparat
let savedBookIds = [];

/**
 * Hjälpfunktion: extrahera attributes / relationer
 */
function extractData(resp) {
  return resp.data && resp.data.data
    ? resp.data.data.attributes
    : resp.data;
}

/**
 * Hjälpfunktion: hämta relationens entry-array oavsett format
 */
function extractRelation(rel) {
  if (!rel) return [];
  if (Array.isArray(rel)) return rel;
  if (rel.data && Array.isArray(rel.data)) return rel.data;
  return [];
}

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn   = document.getElementById('login-btn');
  const modal      = document.getElementById('auth-modal');
  const closeModal = document.querySelector('#auth-modal .modal-close');

  loginBtn.onclick   = () => modal.classList.remove('hidden');
  closeModal.onclick = () => modal.classList.add('hidden');
  modal.onclick      = e => {
    if (e.target.id === 'auth-modal') modal.classList.add('hidden');
  };

  document.getElementById('form-register').onsubmit = async e => {
    e.preventDefault();
    await registerUser(
      document.getElementById('reg-username').value,
      document.getElementById('reg-email').value,
      document.getElementById('reg-password').value
    );
  };

  document.getElementById('form-login').onsubmit = async e => {
    e.preventDefault();
    await loginUser(
      document.getElementById('login-identifier').value,
      document.getElementById('login-password').value
    );
  };

  updateLoginState();
  fetchBooks();
});

/** 1–4: Hämta och rendera alla böcker */
async function fetchBooks() {
  const container = document.getElementById('books-container');
  container.innerHTML = 'Laddar böcker...';

  try {
    if (jwt && currentUser) {
      await loadSavedBookIds();
    } else {
      savedBookIds = [];
    }

    const resp  = await axios.get(`${API_BASE}/books?populate=cover`);
    const books = resp.data.data;

    container.innerHTML = books.map(book => {
      const { id, title, author, pages, published, cover } = book;
      const coverUrl = cover?.url
        ? `http://localhost:1339${cover.url}`
        : 'https://via.placeholder.com/150';

      const already = savedBookIds.includes(id);
      const btnText = already
        ? 'Ta bort från läslista'
        : 'Lägg till i läslista';

      const saveBtn = jwt
        ? `<button class="save-btn" data-id="${id}">${btnText}</button>`
        : '';

      return `
        <article class="book-card">
          <img src="${coverUrl}" alt="${title} omslag" />
          <h2>${title}</h2>
          <p><strong>Författare:</strong> ${author}</p>
          <p><strong>Sidor:</strong> ${pages}</p>
          <p><strong>Utgivningsdatum:</strong> ${published}</p>
          ${saveBtn}
        </article>
      `;
    }).join('');

    if (jwt) {
      container.querySelectorAll('.save-btn').forEach(btn => {
        btn.onclick = () => toggleSaved(+btn.dataset.id);
      });
    }
  } catch (err) {
    container.innerHTML = '<p>Kunde inte ladda böcker.</p>';
    console.error(err);
  }
}

/** Läs in sparade bok‐ID:n */
async function loadSavedBookIds() {
  try {
    const resp = await axios.get(
      `${API_BASE}/users/${currentUser.id}?populate=*`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const attrs = extractData(resp);
    const rel   = extractRelation(attrs.savedBooks);
    savedBookIds = rel.map(item => item.id);
  } catch (err) {
    console.error('Fel vid laddning av sparade böcker:', err);
    savedBookIds = [];
  }
}

/** 5 & 8: Växla sparad/ta bort */
async function toggleSaved(bookId) {
  if (!jwt) {
    alert('Du måste vara inloggad för att spara böcker.');
    return;
  }

  const action = savedBookIds.includes(bookId)
    ? 'disconnect'
    : 'connect';

  try {
    await axios.put(
      `${API_BASE}/users/${currentUser.id}`,
      { savedBooks: { [action]: [bookId] } },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );

    await loadSavedBookIds();
    fetchBooks();
  } catch (err) {
    console.error('Fel vid uppdatering av läslista:', err);
    alert('Misslyckades att uppdatera din läslista.');
  }
}

/** 2) Registrera ny användare */
async function registerUser(username, email, password) {
  try {
    const resp = await axios.post(
      `${API_BASE}/auth/local/register`,
      { username, email, password }
    );
    if (resp.data.user) {
      alert('Registrering lyckades! Du kan nu logga in.');
      document.getElementById('auth-modal').classList.add('hidden');
    } else {
      alert('Registrering misslyckades:\n' + (resp.data.error?.message || resp.data));
    }
  } catch (err) {
    console.error(err);
    alert('Registrering misslyckades:\n' + (err.response?.data?.error?.message || err.message));
  }
}

/** 3) Logga in befintlig användare */
async function loginUser(identifier, password) {
  try {
    const resp = await axios.post(
      `${API_BASE}/auth/local`,
      { identifier, password }
    );
    if (resp.data.jwt) {
      jwt = resp.data.jwt;
      currentUser = resp.data.user;
      localStorage.setItem('jwt', jwt);
      localStorage.setItem('user', JSON.stringify(currentUser));
      updateLoginState();
      document.getElementById('auth-modal').classList.add('hidden');
      fetchBooks();
    } else {
      alert('Inloggning misslyckades:\n' + (resp.data.error?.message || resp.data));
    }
  } catch (err) {
    console.error(err);
    alert('Inloggning misslyckades:\n' + (err.response?.data?.error?.message || err.message));
  }
}

/** 4) Uppdatera UI för inloggad/utloggad */
function updateLoginState() {
  const loginBtn   = document.getElementById('login-btn');
  const savedBooks = document.getElementById('savedBooks');

  if (jwt && currentUser) {
    loginBtn.textContent = `Logga ut (${currentUser.username})`;
    savedBooks.classList.remove('hidden');

    loginBtn.onclick = () => {
      localStorage.clear();
      jwt = currentUser = null;
      savedBookIds = [];
      loginBtn.textContent = 'Logga in / Registrera';
      savedBooks.classList.add('hidden');
      loginBtn.onclick = () => document.getElementById('auth-modal').classList.remove('hidden');
      fetchBooks();
    };

    savedBooks.onclick = () => fetchSavedBooks();
  } else {
    loginBtn.textContent = 'Logga in / Registrera';
    savedBooks.classList.add('hidden');
    loginBtn.onclick = () => document.getElementById('auth-modal').classList.remove('hidden');
  }
}

/** 6 & 7: Hämta och visa endast sparade böcker + rating */
async function fetchSavedBooks() {
  const section = document.getElementById('userBookList');
  const list    = document.getElementById('savedBookList');
  section.classList.remove('hidden');
  list.innerHTML = 'Laddar din läslista...';

  try {
    const resp = await axios.get(
      `${API_BASE}/reading-list-items?` +
        `filters[user][id][$eq]=${currentUser.id}` +
        `&populate=book.cover`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const items = resp.data.data;

    if (items.length === 0) {
      list.innerHTML = '<li>Ingen bok sparad ännu.</li>';
      return;
    }

    list.innerHTML = items.map(item => {
      const { id: itemId, attributes } = item;
      const { rating, book }          = attributes;
      const bookData                  = book.data.attributes;
      const coverUrl = book.data.attributes.cover?.data?.attributes?.url
        ? `http://localhost:1339${book.data.attributes.cover.data.attributes.url}`
        : 'https://via.placeholder.com/150';

      return `
        <section class="read-list-container">
          <article class="read-list">
            <img src="${coverUrl}" alt="${bookData.title} omslag" height="200"/>
            <div class="saved-book-item">
              <h3>${bookData.title} av ${bookData.author}</h3>
              <p><strong>Betyg:</strong> ${rating ?? 'Inget ännu'}</p>

              <label for="rating-${itemId}">Nytt betyg (1–5):</label>
              <select id="rating-${itemId}" class="rating-select">
                <option value="">Välj</option>
                ${[1,2,3,4,5].map(n =>
                  `<option value="${n}" ${n===rating?'selected':''}>${n}</option>`
                ).join('')}
              </select>
              <button class="rate-btn" data-item-id="${itemId}">
                Spara betyg
              </button>

              <button class="save-btn" data-id="${book.data.id}">
                Ta bort från läslista
              </button>
            </div>
          </article>
        </section>
      `;
    }).join('');

    // Ta bort bok
    list.querySelectorAll('.save-btn').forEach(btn => {
      btn.onclick = () => toggleSaved(+btn.dataset.id);
    });

    // Spara/uppdatera betyg
    list.querySelectorAll('.rate-btn').forEach(btn => {
      btn.onclick = async () => {
        const itemId    = +btn.dataset.itemId;
        const select    = document.getElementById(`rating-${itemId}`);
        const newRating = Number(select.value);
        if (!newRating || newRating < 1 || newRating > 5) {
          return alert('Välj ett giltigt betyg (1–5).');
        }
        try {
          await axios.put(
            `${API_BASE}/reading-list-items/${itemId}`,
            { data: { rating: newRating } },
            { headers: { Authorization: `Bearer ${jwt}` } }
          );
          fetchSavedBooks();
        } catch (err) {
          console.error('Kunde inte spara betyget:', err);
          alert('Kunde inte spara betyget.');
        }
      };
    });

  } catch (err) {
    list.innerHTML = '<li>Kunde inte ladda din läslista.</li>';
    console.error(err);
  }
}



// script.js
