// FUNKAR SOM DEN SKA:

const API_BASE = 'http://localhost:1339/api';

let jwt = localStorage.getItem('jwt');
let currentUser = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;
/** 
// Håller koll på vilka böcker användaren redan sparat
*/
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


/**
 * Hämta och rendera alla böcker.
 */
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
      const { id, title, author, pages, published, cover, rating } = book;
      const coverUrl = cover?.url
        ? `http://localhost:1339${cover.url}`
        : 'https://via.placeholder.com/150';

      const already = savedBookIds.includes(id);
      const btnText = already
        ? 'Ta bort från läslista'
        : 'Lägg till i läslista';

      // Samma knappmarkup som i läslistan
      const saveBtn = jwt
        ? `<button class="save-btn" data-id="${id}">${btnText}</button>`
        : '';

      return `
        <article class="book-card">
          <img src="${coverUrl}" alt="${title} omslag" />
          <h2>${title}</h2>
          <div>
          <p><strong>Författare:</strong> ${author}</p>
          <p><strong>Sidor:</strong> ${pages}</p>
          <p><strong>Utgivningsdatum:</strong> ${published}</p>
          <p><strong>Betyg:</strong> ${rating}</p>
          </div>
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


/**
 * Läs in sparade bok‐ID:n
 */
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


/**
 * Växla sparad/ta bort
 */
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
    await fetchBooks();

    const section = document.getElementById('userBookList');
    if (section && !section.classList.contains('hidden')) {
      await fetchSavedBooks();
    }
  } catch (err) {
    console.error('Fel vid uppdatering av läslista:', err);
    alert('Misslyckades att uppdatera din läslista.');
  }
}


/**
 * Registrera ny användare
 */
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


/**
 * Logga in befintlig användare
 */
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


/**
 * Uppdatera UI för inloggad/utloggad
 */
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


/**
 * Hämta och visa endast sparade böcker
 */
async function fetchSavedBooks() {
  const section = document.getElementById('userBookList');
  const list    = document.getElementById('savedBookList');
  section.classList.remove('hidden');
  list.innerHTML = 'Laddar din läslista...';

  try {
    const resp = await axios.get(
      `${API_BASE}/users/${currentUser.id}` +
        `?populate[savedBooks][populate]=cover`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );

    const attrs = extractData(resp);
    const rel   = extractRelation(attrs.savedBooks);

    if (rel.length === 0) {
      list.innerHTML = '<li>Ingen bok sparad ännu.</li>';
      return;
    }

    list.innerHTML = rel.map(item => {
      const book = item.attributes ?? item;
      const coverUrl = book.cover?.url
        ? `http://localhost:1339${book.cover.url}`
        : 'https://via.placeholder.com/150';
      const { id, title, author, rating } = book;

      const already = savedBookIds.includes(id);
      const btnText = already
        ? 'Ta bort från läslista'
        : 'Lägg till i läslista';

      const saveBtn = `<button class="save-btn" data-id="${id}">${btnText}</button>`;

      // return `
      //   <section class="read-list-container">
      //     <article class="read-list">
      //       <img src="${coverUrl}" alt="${title} omslag" height="200" class="read-list-cover"/>
      //       <div class="saved-book-item">
      //         <h3>${title} av ${author}</h3>
      //         <p><strong>Betyg:</strong> ${rating}</p>

      //       ${saveBtn}
      //       </div>
      //     </article>
      //   </section>
      // `;

      return `
  <section class="read-list-container">
    <article class="read-list">
      <img src="${coverUrl}" alt="${title} omslag" height="200" class="read-list-cover"/>
      <div class="saved-book-item">
        <h3>${title} av ${author}</h3>
        <p><strong>Betyg:</strong> ${rating || 'Inget betyg ännu'}</p>

        <label for="rating-${id}">Sätt betyg (1–5):</label>
        <select id="rating-${id}" class="rating-select">
          <option value="">Välj</option>
          ${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n}</option>`).join('')}
        </select>
        <button class="rate-btn" data-id="${id}">Spara betyg</button>
        ${saveBtn}
      </div>
    </article>
  </section>
`;
    }).join('');

    // Knappar för att spara/ta bort bok
list.querySelectorAll('.save-btn').forEach(btn => {
  btn.onclick = () => toggleSaved(+btn.dataset.id);
});

// Knappar för att spara betyg
list.querySelectorAll('.rate-btn').forEach(btn => {
  btn.onclick = async () => {
    const bookId = +btn.dataset.id;
    const select = document.getElementById(`rating-${bookId}`);
    const rating = parseInt(select.value);

    if (!rating || rating < 1 || rating > 5) {
      alert('Välj ett giltigt betyg mellan 1 och 5.');
      return;
    }

    try {
      const resp = await axios.get(
        `${API_BASE}/reading-list-items?populate=book&filters[user][id][$eq]=${currentUser.id}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      const items = resp.data.data;
      console.log('Alla items:', items);
      console.log('BookId att hitta:', bookId);

      // 💡 RÄTT find() för Strapi v5
      const item = items.find(i => i.book?.id === bookId);

      if (!item) {
        alert('Kunde inte hitta din läslista-post för denna bok.');
        return;
      }

      await axios.put(`${API_BASE}/reading-list-items/${item.id}`, {
        data: { rating: rating }
      }, {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      alert(`Betyget ${rating} sparades!`);
      fetchSavedBooks();
    } catch (err) {
      console.error('Fel vid betygssättning:', err);
      alert('Kunde inte spara betyget.');
    }
  };
});



    list.querySelectorAll('.save-btn').forEach(btn => {
      btn.onclick = () => toggleSaved(+btn.dataset.id);
    });
  } catch (err) {
    list.innerHTML = '<li>Kunde inte ladda din läslista.</li>';
    console.error(err);
  }
};