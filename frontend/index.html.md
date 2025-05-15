<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>BookDucks</title>
  <link rel="stylesheet" href="styles.css" />
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="script.js" defer></script>
</head>
<body>
  <header class="site-header">
    <h1>BookDucks</h1>
    <button id="login-btn">Logga in / Registrera</button>
  </header>

  <div id="loggedInUser"><h2></h2></div>

  <div class="user-controls">
    <button id="savedBooks" class="hidden">📚 Min läslista</button>
    <!-- <button id="logoutBtn" class="hidden">Logga ut</button> -->
  </div>

  <main id="books-container">
    <!-- Här hamnar bokkorten -->
  </main>

  <section id="userBookList" class="hidden">
    <h2>Min läslista</h2>
    <div class="sort-controls">
      <button id="sortByTitle">Sortera på titel</button>
      <button id="sortByAuthor">Sortera på författare</button>
    </div>
    <ul id="savedBookList"></ul>
  </section>

  <div id="auth-modal" class="hidden">
    <div class="modal-content">
      <button class="modal-close" aria-label="Stäng" onclick="document.getElementById('auth-modal').classList.add('hidden')">&times;</button>

      <form id="form-login">
        <h2>Logga in</h2>
        <label for="login-identifier">E-post eller användarnamn</label>
        <input type="text" id="login-identifier" name="identifier" autocomplete="username" required>
        <label for="login-password">Lösenord</label>
        <input type="password" id="login-password" name="password" autocomplete="current-password" required>
        <button type="submit">Logga in</button>
      </form>

      <hr>

      <form id="form-register">
        <h2>Registrera</h2>
        <label for="reg-username">Användarnamn</label>
        <input type="text" id="reg-username" name="username" autocomplete="username" required>
        <label for="reg-email">E-post</label>
        <input type="email" id="reg-email" name="email" autocomplete="email" required>
        <label for="reg-password">Lösenord</label>
        <input type="password" id="reg-password" name="password" autocomplete="new-password" required>
        <button type="submit">Registrera</button>
      </form>
    </div>
  </div>
</body>
</html>
