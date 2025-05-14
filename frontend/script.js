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
//         ? `http://localhost:1339${coverData.url}`
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

// const API_BASE = 'http://localhost:1339/api';

// let jwt = localStorage.getItem('jwt');
// let currentUser = localStorage.getItem('user')
//   ? JSON.parse(localStorage.getItem('user'))
//   : null;
// /** 
// // Håller koll på vilka böcker användaren redan sparat
// */
// let savedBookIds = [];


// /**
//  * Hjälpfunktion: extrahera attributes / relationer
//  */
// function extractData(resp) {
//   return resp.data && resp.data.data
//     ? resp.data.data.attributes
//     : resp.data;
// }

// /**
//  * Hjälpfunktion: hämta relationens entry-array oavsett format
//  */
// function extractRelation(rel) {
//   if (!rel) return [];
//   if (Array.isArray(rel)) return rel;
//   if (rel.data && Array.isArray(rel.data)) return rel.data;
//   return [];
// }


// document.addEventListener('DOMContentLoaded', () => {
//   const loginBtn   = document.getElementById('login-btn');
//   const modal      = document.getElementById('auth-modal');
//   const closeModal = document.querySelector('#auth-modal .modal-close');

//   loginBtn.onclick   = () => modal.classList.remove('hidden');
//   closeModal.onclick = () => modal.classList.add('hidden');
//   modal.onclick      = e => {
//     if (e.target.id === 'auth-modal') modal.classList.add('hidden');
//   };

//   document.getElementById('form-register').onsubmit = async e => {
//     e.preventDefault();
//     await registerUser(
//       document.getElementById('reg-username').value,
//       document.getElementById('reg-email').value,
//       document.getElementById('reg-password').value
//     );
//   };

//   document.getElementById('form-login').onsubmit = async e => {
//     e.preventDefault();
//     await loginUser(
//       document.getElementById('login-identifier').value,
//       document.getElementById('login-password').value
//     );
//   };

//   updateLoginState();
//   fetchBooks();
// });


// /**
//  * Hämta och rendera alla böcker.
//  */
// async function fetchBooks() {
//   const container = document.getElementById('books-container');
//   container.innerHTML = 'Laddar böcker...';

//   try {
//     if (jwt && currentUser) {
//       await loadSavedBookIds();
//     } else {
//       savedBookIds = [];
//     }

//     const resp  = await axios.get(`${API_BASE}/books?populate=cover`);
//     const books = resp.data.data;

//     container.innerHTML = books.map(book => {
//       const { id, title, author, pages, published, cover } = book;
//       const coverUrl = cover?.url
//         ? `http://localhost:1339${cover.url}`
//         : 'https://via.placeholder.com/150';

//       const already = savedBookIds.includes(id);
//       const btnText = already
//         ? 'Ta bort från läslista'
//         : 'Lägg till i läslista';

//       // Samma knappmarkup som i läslistan
//       const saveBtn = jwt
//         ? `<button class="save-btn" data-id="${id}">${btnText}</button>`
//         : '';

//       return `
//         <article class="book-card">
//           <img src="${coverUrl}" alt="${title} omslag" />
//           <h2>${title}</h2>
//           <p><strong>Författare:</strong> ${author}</p>
//           <p><strong>Sidor:</strong> ${pages}</p>
//           <p><strong>Utgivningsdatum:</strong> ${published}</p>
//           ${saveBtn}
//         </article>
//       `;
//     }).join('');

//     if (jwt) {
//       container.querySelectorAll('.save-btn').forEach(btn => {
//         btn.onclick = () => toggleSaved(+btn.dataset.id);
//       });
//     }
//   } catch (err) {
//     container.innerHTML = '<p>Kunde inte ladda böcker.</p>';
//     console.error(err);
//   }
// }


// /**
//  * Läs in sparade bok‐ID:n
//  */
// async function loadSavedBookIds() {
//   try {
//     const resp = await axios.get(
//       `${API_BASE}/users/${currentUser.id}?populate=*`,
//       { headers: { Authorization: `Bearer ${jwt}` } }
//     );
//     const attrs = extractData(resp);
//     const rel   = extractRelation(attrs.savedBooks);
//     savedBookIds = rel.map(item => item.id);
//   } catch (err) {
//     console.error('Fel vid laddning av sparade böcker:', err);
//     savedBookIds = [];
//   }
// }


// /**
//  * Växla sparad/ta bort
//  */
// async function toggleSaved(bookId) {
//   if (!jwt) {
//     alert('Du måste vara inloggad för att spara böcker.');
//     return;
//   }

//   const action = savedBookIds.includes(bookId)
//     ? 'disconnect'
//     : 'connect';

//   try {
//     await axios.put(
//       `${API_BASE}/users/${currentUser.id}`,
//       { savedBooks: { [action]: [bookId] } },
//       { headers: { Authorization: `Bearer ${jwt}` } }
//     );

//     await loadSavedBookIds();
//     await fetchBooks();

//     const section = document.getElementById('userBookList');
//     if (section && !section.classList.contains('hidden')) {
//       await fetchSavedBooks();
//     }
//   } catch (err) {
//     console.error('Fel vid uppdatering av läslista:', err);
//     alert('Misslyckades att uppdatera din läslista.');
//   }
// }


// /**
//  * Registrera ny användare
//  */
// async function registerUser(username, email, password) {
//   try {
//     const resp = await axios.post(
//       `${API_BASE}/auth/local/register`,
//       { username, email, password }
//     );
//     if (resp.data.user) {
//       alert('Registrering lyckades! Du kan nu logga in.');
//       document.getElementById('auth-modal').classList.add('hidden');
//     } else {
//       alert('Registrering misslyckades:\n' + (resp.data.error?.message || resp.data));
//     }
//   } catch (err) {
//     console.error(err);
//     alert('Registrering misslyckades:\n' + (err.response?.data?.error?.message || err.message));
//   }
// }


// /**
//  * Logga in befintlig användare
//  */
// async function loginUser(identifier, password) {
//   try {
//     const resp = await axios.post(
//       `${API_BASE}/auth/local`,
//       { identifier, password }
//     );
//     if (resp.data.jwt) {
//       jwt = resp.data.jwt;
//       currentUser = resp.data.user;
//       localStorage.setItem('jwt', jwt);
//       localStorage.setItem('user', JSON.stringify(currentUser));
//       updateLoginState();
//       document.getElementById('auth-modal').classList.add('hidden');
//       fetchBooks();
//     } else {
//       alert('Inloggning misslyckades:\n' + (resp.data.error?.message || resp.data));
//     }
//   } catch (err) {
//     console.error(err);
//     alert('Inloggning misslyckades:\n' + (err.response?.data?.error?.message || err.message));
//   }
// }


// /**
//  * Uppdatera UI för inloggad/utloggad
//  */
// function updateLoginState() {
//   const loginBtn   = document.getElementById('login-btn');
//   const savedBooks = document.getElementById('savedBooks');

//   if (jwt && currentUser) {
//     loginBtn.textContent = `Logga ut (${currentUser.username})`;
//     savedBooks.classList.remove('hidden');

//     loginBtn.onclick = () => {
//       localStorage.clear();
//       jwt = currentUser = null;
//       savedBookIds = [];
//       loginBtn.textContent = 'Logga in / Registrera';
//       savedBooks.classList.add('hidden');
//       loginBtn.onclick = () => document.getElementById('auth-modal').classList.remove('hidden');
//       fetchBooks();
//     };

//     savedBooks.onclick = () => fetchSavedBooks();
//   } else {
//     loginBtn.textContent = 'Logga in / Registrera';
//     savedBooks.classList.add('hidden');
//     loginBtn.onclick = () => document.getElementById('auth-modal').classList.remove('hidden');
//   }
// }


// /**
//  * Hämta och visa endast sparade böcker
//  */
// async function fetchSavedBooks() {
//   const section = document.getElementById('userBookList');
//   const list    = document.getElementById('savedBookList');
//   section.classList.remove('hidden');
//   list.innerHTML = 'Laddar din läslista...';

//   try {
//     const resp = await axios.get(
//       `${API_BASE}/users/${currentUser.id}` +
//         `?populate[savedBooks][populate]=cover`,
//       { headers: { Authorization: `Bearer ${jwt}` } }
//     );

//     const attrs = extractData(resp);
//     const rel   = extractRelation(attrs.savedBooks);

//     if (rel.length === 0) {
//       list.innerHTML = '<li>Ingen bok sparad ännu.</li>';
//       return;
//     }

//     list.innerHTML = rel.map(item => {
//       const book = item.attributes ?? item;
//       const coverUrl = book.cover?.url
//         ? `http://localhost:1339${book.cover.url}`
//         : 'https://via.placeholder.com/150';
//       const { id, title, author } = book;

//       const already = savedBookIds.includes(id);
//       const btnText = already
//         ? 'Ta bort från läslista'
//         : 'Lägg till i läslista';

//       const saveBtn = `<button class="save-btn" data-id="${id}">${btnText}</button>`;

//       return `
//         <section class="read-list-container">
//           <article class="read-list">
//             <img src="${coverUrl}" alt="${title} omslag" height="200" class="read-list-cover"/>
//             <div class="saved-book-item">
//               <h3>${title} av ${author}</h3>
//             ${saveBtn}
//             </div>
//           </article>
//         </section>
//       `;
//     }).join('');

//     list.querySelectorAll('.save-btn').forEach(btn => {
//       btn.onclick = () => toggleSaved(+btn.dataset.id);
//     });
//   } catch (err) {
//     list.innerHTML = '<li>Kunde inte ladda din läslista.</li>';
//     console.error(err);
//   }
// }


// script.js
const API_BASE = 'http://localhost:1339/api';

let jwt = localStorage.getItem('jwt');
let currentUser = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

// Array med ID:n på sparade böcker (för att visa rätt knapp-text)
let savedBookIds = [];

/**
 * Hjälp: plocka ut resp.data.data.attributes eller direkt resp.data
 */
function extractData(resp) {
  if (resp.data && resp.data.data && resp.data.data.attributes) {
    return resp.data.data.attributes;
  }
  return resp.data;
}

/**
 * Hjälp: plocka alltid ut en array från relationer (Strapi v5)
 */
function extractRelation(rel) {
  if (!rel) return [];
  // Strapi v5: rel.data är en array
  if (rel.data && Array.isArray(rel.data)) {
    return rel.data;
  }
  // alternativt om vi råkar få en ren array
  if (Array.isArray(rel)) {
    return rel;
  }
  return [];
}

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn   = document.getElementById('login-btn');
  const modal      = document.getElementById('auth-modal');
  const closeModal = document.querySelector('#auth-modal .modal-close');

  // Öppna/stäng inloggningsmodal
  loginBtn.onclick   = () => modal.classList.remove('hidden');
  closeModal.onclick = () => modal.classList.add('hidden');
  modal.onclick      = e => {
    if (e.target.id === 'auth-modal') modal.classList.add('hidden');
  };

  // Registreringsform
  document.getElementById('form-register').onsubmit = async e => {
    e.preventDefault();
    await registerUser(
      document.getElementById('reg-username').value,
      document.getElementById('reg-email').value,
      document.getElementById('reg-password').value
    );
  };

  // Inloggningsform
  document.getElementById('form-login').onsubmit = async e => {
    e.preventDefault();
    await loginUser(
      document.getElementById('login-identifier').value,
      document.getElementById('login-password').value
    );
  };

  // Sätt rätt knapp-text / vy
  updateLoginState();
  // Ladda bokvisningen
  fetchBooks();
});

/**
 * Hämta & rendera alla böcker med omslag + snittbetyg.
 */
async function fetchBooks() {
  const container = document.getElementById('books-container');
  container.innerHTML = 'Laddar böcker…';

  try {
    // Om inloggad: läs in vilka böcker som är sparade
    if (jwt && currentUser) {
      await loadSavedBookIds();
    } else {
      savedBookIds = [];
    }

    // Hämta alla böcker, omslag + ratings
    const resp  = await axios.get(`${API_BASE}/books?populate=deep`);
    const books = resp.data.data;

    container.innerHTML = books.map(book => {
      const { id, attributes } = book;
      const {
        title,
        author,
        pages,
        published,
        cover,
        ratings
      } = attributes;

      // Omslags-URL
      const coverAttr = cover?.data?.attributes;
      const coverUrl  = coverAttr?.url
        ? `http://localhost:1339${coverAttr.url}`
        : 'https://via.placeholder.com/150';

      // Snittbetyg
      const ratingList = extractRelation(ratings);
      const avgRating  = ratingList.length
        ? (
            ratingList.reduce((sum, r) => sum + r.attributes.value, 0)
            / ratingList.length
          ).toFixed(1)
        : '–';

      // Spara/ta-bort-knappens text
      const already  = savedBookIds.includes(id);
      const btnText  = already
        ? 'Ta bort från läslista'
        : 'Lägg till i läslista';
      const saveBtn  = jwt
        ? `<button class="save-btn" data-id="${id}">${btnText}</button>`
        : '';

      return `
        <article class="book-card">
          <img src="${coverUrl}" alt="${title} omslag" />
          <h2>${title}</h2>
          <p><strong>Författare:</strong> ${author}</p>
          <p><strong>Sidor:</strong> ${pages}</p>
          <p><strong>Utgivningsdatum:</strong> ${new Date(published).toLocaleDateString('sv-SE')}</p>
          <p><strong>Snittbetyg:</strong> ${avgRating} / 10</p>
          ${saveBtn}
        </article>
      `;
    }).join('');

    // Koppla toggleSaved på alla knappar
    if (jwt) {
      container.querySelectorAll('.save-btn').forEach(btn => {
        btn.onclick = () => toggleSaved(+btn.dataset.id);
      });
    }
  } catch (err) {
    console.error('Fel vid fetchBooks:', err);
    container.innerHTML = '<p>Kunde inte ladda böcker.</p>';
  }
}

/**
 * Hämta ID:n på sparade böcker för den inloggade användaren.
 */
async function loadSavedBookIds() {
  try {
    const resp = await axios.get(
      `${API_BASE}/users/${currentUser.id}?populate=deep`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const attrs = extractData(resp);
    const rel   = extractRelation(attrs.savedBooks);
    // Spara bara ID:t
    savedBookIds = rel.map(item => item.id);
  } catch (err) {
    console.error('Fel vid loadSavedBookIds:', err);
    savedBookIds = [];
  }
}

/**
 * Lägg till / ta bort en bok i läslistan.
 */
async function toggleSaved(bookId) {
  if (!jwt) {
    return alert('Du måste vara inloggad för att spara böcker.');
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
    // Uppdatera lokalt & friska upp vyerna
    await loadSavedBookIds();
    await fetchBooks();
    const section = document.getElementById('userBookList');
    if (section && !section.classList.contains('hidden')) {
      await fetchSavedBooks();
    }
  } catch (err) {
    console.error('Fel vid toggleSaved:', err);
    alert('Misslyckades att uppdatera din läslista.');
  }
}

/**
 * Spara användarens betyg på en bok.
 */
async function saveRating(bookId, value) {
  try {
    await axios.post(
      `${API_BASE}/ratings`,
      {
        value,
        book: bookId,
        users_permissions_user: currentUser.id
      },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    // Friska upp läslistan
    await fetchSavedBooks();
  } catch (err) {
    console.error('Fel vid saveRating:', err);
    alert('Kunde inte spara ditt betyg.');
  }
}

/**
 * Visa endast sparade böcker + låt sätta/spara betyg.
 */
async function fetchSavedBooks() {
  const section = document.getElementById('userBookList');
  const list    = document.getElementById('savedBookList');
  section.classList.remove('hidden');
  list.innerHTML = 'Laddar din läslista…';

  try {
    const resp = await axios.get(
      `${API_BASE}/users/${currentUser.id}?populate=deep`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const attrs = extractData(resp);
    const rel   = extractRelation(attrs.savedBooks);

    if (!rel.length) {
      list.innerHTML = '<li>Ingen bok sparad ännu.</li>';
      return;
    }

    list.innerHTML = rel.map(item => {
      // Varje bok ligger under item.attributes
      const book = item.attributes;
      const {
        id,
        title,
        author,
        cover,
        ratings
      } = book;

      // Omslag
      const cv = cover?.data?.attributes;
      const coverUrl = cv?.url
        ? `http://localhost:1339${cv.url}`
        : 'https://via.placeholder.com/150';

      // Hitta om användaren redan satt ett betyg
      const myEntry = extractRelation(ratings)
        .find(r => r.attributes.users_permissions_user.data.id === currentUser.id);
      const myVal   = myEntry ? myEntry.attributes.value : '';

      // Spara/ta-bort-knapp
      const already = savedBookIds.includes(id);
      const saveText = already
        ? 'Ta bort från läslista'
        : 'Lägg till i läslista';

      return `
        <li class="saved-book-item">
          <img src="${coverUrl}" alt="${title} omslag" width="50" />
          <span>${title} av ${author}</span>
          <button class="save-btn" data-id="${id}">${saveText}</button>
          <input
            type="number"
            class="rating-input"
            data-id="${id}"
            min="1" max="10"
            placeholder="1–10"
            value="${myVal}"
          />
          <button class="rate-btn" data-id="${id}">Spara betyg</button>
        </li>
      `;
    }).join('');

    // Koppla knappar
    list.querySelectorAll('.save-btn').forEach(btn => {
      btn.onclick = () => toggleSaved(+btn.dataset.id);
    });
    list.querySelectorAll('.rate-btn').forEach(btn => {
      btn.onclick = () => {
        const bid   = +btn.dataset.id;
        const input = document.querySelector(`.rating-input[data-id="${bid}"]`);
        const v     = Number(input.value);
        if (!v || v < 1 || v > 10) {
          return alert('Ange ett heltal mellan 1 och 10');
        }
        saveRating(bid, v);
      };
    });

  } catch (err) {
    console.error('Fel vid fetchSavedBooks:', err);
    list.innerHTML = '<li>Kunde inte ladda din läslista.</li>';
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
      alert('Misslyckades:\n' + (resp.data.error?.message || JSON.stringify(resp.data)));
    }
  } catch (err) {
    console.error('Fel vid registerUser:', err);
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
      alert('Inloggning misslyckades:\n' + (resp.data.error?.message || JSON.stringify(resp.data)));
    }
  } catch (err) {
    console.error('Fel vid loginUser:', err);
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
