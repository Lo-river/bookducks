// alternativscript.js

const API_BASE = 'http://localhost:1339/api'; // ändra om du har annan port

let jwt = localStorage.getItem('jwt');
let currentUser = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

let savedItems = []; // [{ itemId, bookId, title, author, rating }]

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


// ===================== Ladda alla böcker ===========================
// async function fetchBooks() {
//   const container = document.getElementById('books-container');
//   container.innerHTML = 'Laddar böcker…';

//   try {
//     if (jwt && currentUser) {
//       await loadSavedItems();
//     } else {
//       savedItems = [];
//     }

//     const resp  = await axios.get(`${API_BASE}/books?populate=*`);
//     const books = resp.data.data;
//     //** */ DEBUG:
//     console.log('Books fetched:', books);

//     container.innerHTML = books.map(bookEntry => {
//       const id        = bookEntry.id;
//       const title     = bookEntry.title     || '—';
//       const author    = bookEntry.author    || '—';
//       const pages     = bookEntry.pages     ?? '—';
//       const published = bookEntry.published || '—';
//       const cover     = bookEntry.cover;
//       const coverUrl  = cover && cover.url
//         ? `${API_BASE.replace('/api','')}${cover.url}`
//         : 'https://placeholder.com/150';

//       const already = savedItems.some(x => x.bookId === id);
//       const btnText = already
//         ? 'Ta bort från läslista'
//         : 'Lägg till i läslista';

//       return `
//         <article class="book-card">
//           <img src="${coverUrl}" alt="${title} omslag" />
//           <h2>${title}</h2>
//           <div>
//             <p><strong>Författare:</strong> ${author}</p>
//             <p><strong>Sidor:</strong> ${pages}</p>
//             <p><strong>Utgivningsdatum:</strong> ${published}</p>
//           </div>
//           ${jwt
//             ? `<button class="save-btn" data-bookid="${id}" data-itemid="${already ? savedItems.find(x=>x.bookId===id).itemId : ''}">
//   ${btnText}
// </button>`
//             : ''}
//         </article>
//       `;
//     }).join('');

//     if (jwt) {
//       container.querySelectorAll('.save-btn').forEach(btn => {
//         btn.onclick = () => {
//           const bookId = +btn.dataset.bookid;
//           const itemId = btn.dataset.itemid ? +btn.dataset.itemid : null;
//           toggleSaved(bookId, itemId);
//         };      });
//     }
//   } catch (err) {
//     console.error('fetchBooks error', err);
//     container.innerHTML = '<p>Kunde inte ladda böcker.</p>';
//   }
// }
async function fetchBooks() {
  const container = document.getElementById('books-container');
  container.innerHTML = 'Laddar böcker…';

  try {
    if (jwt && currentUser) {
      await loadSavedItems();
    } else {
      savedItems = [];
    }

    const resp  = await axios.get(`${API_BASE}/books?populate=*`);
    const books = resp.data.data; // OBS: varje objekt har .id + .attributes

    container.innerHTML = books.map(entry => {
      const { id, attributes } = entry;
      const { title, author, pages, published, cover } = attributes;

      const coverUrl = cover?.url
        ? `${API_BASE.replace('/api','')}${cover.url}`
        : 'https://placeholder.com/150';

      const already = savedItems.some(x => x.bookId === id);
      const btnText = already ? 'Ta bort' : 'Lägg till';

      return `
        <article class="book-card">
          <img src="${coverUrl}" alt="${title} omslag" />
          <h2>${title}</h2>
          <div>
            <p><strong>Författare:</strong> ${author}</p>
            <p><strong>Sidor:</strong> ${pages ?? '–'}</p>
            <p><strong>Utgivningsår:</strong> ${published}</p>
          </div>
          ${jwt ? `<button class="save-btn" data-bookid="${id}">${btnText}</button>` : ''}
        </article>
      `;
    }).join('');

    // Sätt knapparna
    if (jwt) {
      container.querySelectorAll('.save-btn').forEach(btn => {
        btn.onclick = () => toggleSaved(+btn.dataset.bookid);
      });
    }
  } catch (err) {
    console.error('fetchBooks error', err);
    container.innerHTML = '<p>Kunde inte ladda böcker.</p>';
  }
}


// ==================== Hämta sparade läslistor ======================
// async function loadSavedItems() {
//   try {
//     const resp = await axios.get(
//       `${API_BASE}/reading-list-items?filters[user][id][$eq]=${currentUser.id}&populate=book`,
//       { headers: { Authorization: `Bearer ${jwt}` } }
//     );

     // DEBUG: se exakt vad Strapi svarar
//     console.log('reading-list-items response:', resp.data);

//     savedItems = resp.data.data.map(item => {
//       const book = item.book; // v5: relation ligger direkt
//       if (!book) {
//         console.warn('Ingen bok kopplad till item', item);
//         return null;
//       }
//       return {
//         itemId: item.id,
//         bookId: book.id,
//         title: book.title,
//         author: book.author,
//         rating: item.rating
//       };
//     }).filter(Boolean);

//   } catch (err) {
//     console.error('Fel vid laddning av sparade items:', err);
//     savedItems = [];
//   }
// }


// SENASTE 16 maj 01.23
// async function loadSavedItems() {
//   try {
//     const resp = await axios.get(
//       `${API_BASE}/reading-list-items?filters[user][id][$eq]=${currentUser.id}&populate=book`,
//       { headers: { Authorization: `Bearer ${jwt}` } }
//     );

//     console.log('reading-list-items response:', resp.data);

//     savedItems = resp.data.data.map(item => {
//       const book = item.book;

//       // Kontrollera att det finns en bok kopplad
//       if (!book || !book.id) {
//         console.warn('Ingen giltig bok kopplad till item:', item);
//         return null;
//       }

//     //   return {
//     //     itemId: item.id,
//     //     bookId: book.id,
//     //     title: book.title,
//     //     author: book.author,
//     //     rating: item.rating
//     //   };
//     savedItems = resp.data.data
//   .filter(item => item.book !== null) // lägg till detta!
//   .map(item => {
//     const book = item.book;
//     return {
//       itemId: item.id,
//       bookId: book.id,
//       title: book.title,
//       author: book.author,
//       rating: item.rating
//     };
//   });
//     }).filter(Boolean); // Ta bort null:er

//   } catch (err) {
//     console.error('Fel vid laddning av sparade items:', err);
//     savedItems = [];
//   }
// }
async function loadSavedItems() {
  if (!jwt || !currentUser) return savedItems = [];

  try {
    const resp = await axios.get(
      `${API_BASE}/reading-list-items?filters[user][id][$eq]=${currentUser.id}&populate=book`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    console.log('reading-list-items response:', resp.data);

    // Bygg savedItems korrekt som en flat array
    savedItems = resp.data.data
      .filter(item => item.book && item.book.id)   // plocka bort poster utan bok
      .map(item => ({
        itemId: item.id,
        bookId: item.book.id,
        title:    item.book.title    || '–',
        author:   item.book.author   || '–',
        rating:   item.rating        ?? null,
      }));
  } catch (err) {
    console.error('Fel vid laddning av sparade items:', err);
    savedItems = [];
  }
}



// ======================= Lägg till/ta bort från läslista ===============
// async function toggleSaved(bookId) {
//   if (!jwt) {
//     return alert('Du måste vara inloggad för att spara böcker.');
//   }
//   const existing = savedItems.find(x => x.bookId === bookId);

//   try {
//     if (existing) {
//       await axios.delete(
//         `${API_BASE}/reading-list-items/${existing.itemId}`,
//         { headers: { Authorization: `Bearer ${jwt}` } }
//       );
//     } else {
//       await axios.post(
//         `${API_BASE}/reading-list-items`,
//         { data: { user: currentUser.id, book: bookId } },
//         { headers: { Authorization: `Bearer ${jwt}` } }
//       );
//     }
//     await loadSavedItems();
//     fetchBooks();

//     const section = document.getElementById('userBookList');
//     if (section && !section.classList.contains('hidden')) {
//       fetchSavedBooks();
//     }
//   } catch (err) {
//     console.error('Fel vid uppdatering av läslista:', err);
//     alert('Misslyckades att uppdatera din läslista.');
//   }
// }
// async function toggleSaved(bookId, itemId) {
//   if (!jwt) return alert('Du måste vara inloggad för att spara böcker.');
//   try {
//     if (itemId) {
//       await axios.delete(
//         `${API_BASE}/reading-list-items/${itemId}`,
//         { headers: { Authorization: `Bearer ${jwt}` } }
//       );
//     } else {
       // **const bookId = book.id;
       // const userId = user.id;

//       await axios.post(`${API_BASE}/reading-list-items`, {
//         data: {
//           rating: 4,
//           book: { connect: [{ id: bookId }] },
//           user: { connect: [{ id: currentUser.id }] }
//         }
//       }, {
//         headers: { Authorization: `Bearer ${jwt}` }
//       });
      

       // **await axios.post(
       //  ** `${API_BASE}/reading-list-items`,
       //   **{ data: { user: currentUser.id, book: bookId } },
       //  ** { headers: { Authorization: `Bearer ${jwt}` } }
       // **);
//     }
//     await loadSavedItems();
//     fetchBooks();
//     const section = document.getElementById('userBookList');
//     if (section && !section.classList.contains('hidden')) {
//       fetchSavedBooks();
//     }
//   } catch (err) {
//     console.error('Fel vid uppdatering av läslista:', err);
//     alert('Misslyckades att uppdatera din läslista.');
//   }
// }
async function toggleSaved(bookId, itemId) {
  if (!jwt) return alert('Du måste vara inloggad för att spara böcker.');

  try {
    if (itemId) {
      // Ta bort från läslistan
      await axios.delete(
        `${API_BASE}/reading-list-items/${itemId}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
    } else {
      // Lägg till i läslistan
      await axios.post(`${API_BASE}/reading-list-items`, {
        data: {
          rating: 4,
          book: { connect: [{ id: bookId }] },
          user: { connect: [{ id: currentUser.id }] }
        }
      }, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
    }

    await loadSavedItems();
    fetchBooks();

    const section = document.getElementById('userBookList');
    if (section && !section.classList.contains('hidden')) {
      fetchSavedBooks();
    }
  } catch (err) {
    console.error('Fel vid uppdatering av läslista:', err);
    alert('Misslyckades att uppdatera din läslista.');
  }
}


// ====================== Registrera användare ====================
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
      alert('Registrering misslyckades:\n' +
        (resp.data.error?.message || JSON.stringify(resp.data)));
    }
  } catch (err) {
    console.error(err);
    alert('Registrering misslyckades:\n' +
      (err.response?.data?.error?.message || err.message));
  }
}


// ========================= Logga in användare ==========================
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
      alert('Inloggning misslyckades:\n' +
        (resp.data.error?.message || JSON.stringify(resp.data)));
    }
  } catch (err) {
    console.error(err);
    alert('Inloggning misslyckades:\n' +
      (err.response?.data?.error?.message || err.message));
  }
}


// ========================= Hantera inloggningsstatus ====================
function updateLoginState() {
  const loginBtn   = document.getElementById('login-btn');
  const savedBooks = document.getElementById('savedBooks');

  if (jwt && currentUser) {
    loginBtn.textContent = `Logga ut (${currentUser.username})`;
    savedBooks.classList.remove('hidden');
    loginBtn.onclick = () => {
      localStorage.clear();
      jwt = currentUser = null;
      savedItems = [];
      loginBtn.textContent = 'Logga in / Registrera';
      savedBooks.classList.add('hidden');
      loginBtn.onclick = () => document.getElementById('auth-modal').classList.remove('hidden');
      fetchBooks();
    };
    savedBooks.onclick = fetchSavedBooks;
  } else {
    loginBtn.textContent = 'Logga in / Registrera';
    savedBooks.classList.add('hidden');
    loginBtn.onclick = () => document.getElementById('auth-modal').classList.remove('hidden');
  }
}


// =================== Visa användarens sparade böcker =====================
// async function fetchSavedBooks() {
//   const section = document.getElementById('userBookList');
//   const list    = document.getElementById('savedBookList');
//   section.classList.remove('hidden');
//   list.innerHTML = 'Laddar din läslista…';

//   try {
//     await loadSavedItems();

//     if (savedItems.length === 0) {
//       list.innerHTML = '<li>Ingen bok sparad ännu.</li>';
//       return;
//     }

//     const htmlArr = await Promise.all(
//       savedItems.map(async ({ itemId, bookId, rating, title, author }) => {
         // Hämta boken igen för att få cover (med populate)
//         const resp = await axios.get(
//           `${API_BASE}/books/${bookId}?populate=cover`,
//           { headers: { Authorization: `Bearer ${jwt}` } }
//         );
         //const bk = resp.data.data; // Ingen .attributes!
//         const bk = resp.data.data;
//         if (!bk) throw new Error('Book not found');
//         const cover = bk.cover;
//         const coverUrl = cover && cover.url
//  **         ? `${API_BASE.replace('/api','')}${cover.url}`
//           : 'https://placeholder.com/150';

//         return `
//           <section class="read-list-container">
//             <article class="read-list">
//               <img src="${coverUrl}" alt="${title} omslag" height="200"/>
//               <div class="saved-book-item">
//                 <h3>${title} av ${author}</h3>
//                 <p><strong>Betyg:</strong> ${rating ?? 'Inget betyg ännu'}</p>
//                 <label for="rating-${bookId}">Sätt betyg (1–5):</label>
//                 <select id="rating-${bookId}" class="rating-select">
//                   <option value="">Välj</option>
//                   ${[1,2,3,4,5].map(n =>
//                     `<option value="${n}"${n===rating?' selected':''}>${n}</option>`
//                   ).join('')}
//                 </select>
//                 <button class="rate-btn" data-id="${itemId}" data-book="${bookId}">
//                   Spara betyg
//                 </button>
//                 <button class="save-btn" data-id="${bookId}">
//                   Ta bort från läslista
//                 </button>
//               </div>
//             </article>
//           </section>
//         `;
        
//       })
//     );

//     list.innerHTML = htmlArr.join('');

//     list.querySelectorAll('.save-btn').forEach(btn => {
//       btn.onclick = () => toggleSaved(+btn.dataset.id);
//     });
//     list.querySelectorAll('.rate-btn').forEach(btn => {
//       btn.onclick = async () => {
//         const itemId = btn.dataset.id;
//         const bookId = btn.dataset.book;
//         const select = document.getElementById(`rating-${bookId}`);
//         const newRating = parseInt(select.value, 10);
//         if (!newRating || newRating < 1 || newRating > 5) {
//           return alert('Välj ett giltigt betyg mellan 1 och 5.');
//         }
//         try {

//           await axios.patch(`${API_BASE}/reading-list-items/${itemId}`, {
//             data: { rating: newRating }
//           }, {
//             headers: { Authorization: `Bearer ${jwt}` }
//           });
//           alert(`Betyget ${newRating} sparades!`);
//           await loadSavedItems();
//           fetchSavedBooks();
//         } catch (e) {
//           console.error('Fel vid sparande av betyg:', e);
//           alert('Kunde inte spara betyget.');
//         }
//       };
//     });
//   } catch (err) {
//     console.error(err);
//     list.innerHTML = '<li>Kunde inte ladda din läslista.</li>';
//   }
// }
          // await axios.put(
          //   `${API_BASE}/reading-list-items/${itemId}`,
          //   { data: { rating: newRating } },
          //   { headers: { Authorization: `Bearer ${jwt}` } }
          // );

          async function fetchSavedBooks() {
            const section = document.getElementById('userBookList');
            const list    = document.getElementById('savedBookList');
            section.classList.remove('hidden');
            list.innerHTML = 'Laddar din läslista…';
          
            try {
              await loadSavedItems();
          
              if (savedItems.length === 0) {
                list.innerHTML = '<li>Ingen bok sparad ännu.</li>';
                return;
              }
          
              const htmlArr = await Promise.all(
                savedItems.map(async ({ itemId, bookId, rating, title, author }) => {
                  try {
                    const resp = await axios.get(
                      `${API_BASE}/books/${bookId}?populate=cover`,
                      { headers: { Authorization: `Bearer ${jwt}` } }
                    );
                    const bk = resp.data.data;
                    if (!bk) throw new Error('Book not found');
                    const cover = bk.cover;
                    const coverUrl = cover && cover.url
                      ? `${API_BASE.replace('/api', '')}${cover.url}`
                      : 'https://placeholder.com/150';
          
                    return `
                      <section class="read-list-container">
                        <article class="read-list">
                          <img src="${coverUrl}" alt="${title} omslag" height="200"/>
                          <div class="saved-book-item">
                            <h3>${title} av ${author}</h3>
                            <p><strong>Betyg:</strong> ${rating ?? 'Inget betyg ännu'}</p>
                            <label for="rating-${bookId}">Sätt betyg (1–5):</label>
                            <select id="rating-${bookId}" class="rating-select">
                              <option value="">Välj</option>
                              ${[1, 2, 3, 4, 5].map(n =>
                                `<option value="${n}"${n === rating ? ' selected' : ''}>${n}</option>`
                              ).join('')}
                            </select>
                            <button class="rate-btn" data-id="${itemId}" data-book="${bookId}">
                              Spara betyg
                            </button>
                            <button class="save-btn" data-id="${bookId}">
                              Ta bort från läslista
                            </button>
                          </div>
                        </article>
                      </section>
                    `;
                  } catch (err) {
                    console.warn(`Kunde inte hämta bok ${bookId}`, err);
                    return `<li>Kunde inte hämta bok med ID ${bookId}.</li>`;
                  }
                })
              );
          
              list.innerHTML = htmlArr.join('');
          
              list.querySelectorAll('.save-btn').forEach(btn => {
                btn.onclick = () => toggleSaved(+btn.dataset.id);
              });
              list.querySelectorAll('.rate-btn').forEach(btn => {
                btn.onclick = async () => {
                  const itemId = btn.dataset.id;
                  const bookId = btn.dataset.book;
                  const select = document.getElementById(`rating-${bookId}`);
                  const newRating = parseInt(select.value, 10);
                  if (!newRating || newRating < 1 || newRating > 5) {
                    return alert('Välj ett giltigt betyg mellan 1 och 5.');
                  }
                  try {
                    await axios.patch(`${API_BASE}/reading-list-items/${itemId}`, {
                      data: { rating: newRating }
                    }, {
                      headers: { Authorization: `Bearer ${jwt}` }
                    });
                    alert(`Betyget ${newRating} sparades!`);
                    await loadSavedItems();
                    fetchSavedBooks();
                  } catch (e) {
                    console.error('Fel vid sparande av betyg:', e);
                    alert('Kunde inte spara betyget.');
                  }
                };
              });
            } catch (err) {
              console.error(err);
              list.innerHTML = '<li>Kunde inte ladda din läslista.</li>';
            }
          }
          