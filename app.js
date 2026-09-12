const SUPABASE_URL = 'https://bvpyxrwwkpaodajuazlf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_57eYCu9yiI4KLXhxZjuh4A_PmBg6juA';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let userId = localStorage.getItem('tokencon_user_id');
if (!userId) {
  userId = crypto.randomUUID ? crypto.randomUUID() : 'usr_' + Math.random().toString(36).substring(2, 11);
  localStorage.setItem('tokencon_user_id', userId);
}

// Navigation Setup
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetView = item.getAttribute('data-target');

    navItems.forEach(nav => nav.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));

    item.classList.add('active');
    document.getElementById(targetView).classList.add('active');

    if (targetView === 'viewLeaderboard') loadLeaderboard();
    if (targetView === 'viewWishlist') loadMyWishlist();
  });
});

// MAIN GAME RATING LOGIC
const gameInput = document.getElementById('gameInput');
const dropdown = document.getElementById('resultsDropdown');
const selectedBanner = document.getElementById('selectedBanner');
const selectedTitle = document.getElementById('selectedTitle');
const ratingForm = document.getElementById('ratingForm');
const submitBtn = document.getElementById('submitBtn');
const msgBox = document.getElementById('msgBox');

let currentSelectedGameId = null;

gameInput.addEventListener('input', async (e) => {
  const searchTerm = e.target.value.trim();
  if (searchTerm.length < 2) {
    dropdown.style.display = 'none';
    return;
  }

  const { data: games, error } = await supabaseClient
    .from('games')
    .select('id, title, is_prototype')
    .ilike('title', `%${searchTerm}%`)
    .limit(6);

  if (error) return;

  dropdown.innerHTML = '';

  if (games.length === 0) {
    const addItem = document.createElement('div');
    addItem.className = 'dropdown-item';
    addItem.style.fontWeight = 'bold';
    addItem.style.color = '#2563eb';
    addItem.innerHTML = `➕ Add "${searchTerm}" as a new game`;

    addItem.addEventListener('click', async () => {
      const isProto = confirm(`Is "${searchTerm}" an unpublished prototype or playtest game?\n\nClick OK for YES (Prototype)\nClick Cancel for NO (Published Game)`);

      const { data: newGame, error: insertError } = await supabaseClient
        .from('games')
        .insert([{ title: searchTerm, is_custom: true, is_prototype: isProto }])
        .select()
        .single();

      if (insertError) {
        alert('Error adding game: ' + insertError.message);
        return;
      }

      currentSelectedGameId = newGame.id;
      selectedTitle.textContent = newGame.title + (isProto ? ' (Prototype)' : '');
      selectedBanner.style.display = 'block';
      ratingForm.style.display = 'block';
      gameInput.value = newGame.title;
      dropdown.style.display = 'none';
      msgBox.style.display = 'none';
    });

    dropdown.appendChild(addItem);
  } else {
    games.forEach(game => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.textContent = game.title + (game.is_prototype ? ' 🛠️ (Prototype)' : '');
      
      item.addEventListener('click', () => {
        currentSelectedGameId = game.id;
        selectedTitle.textContent = game.title + (game.is_prototype ? ' (Prototype)' : '');
        selectedBanner.style.display = 'block';
        ratingForm.style.display = 'block';
        gameInput.value = game.title;
        dropdown.style.display = 'none';
        msgBox.style.display = 'none';
      });
      dropdown.appendChild(item);
    });
  }

  dropdown.style.display = 'block';
});

submitBtn.addEventListener('click', async () => {
  if (!currentSelectedGameId) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const payload = {
    game_id: currentSelectedGameId,
    score: parseInt(document.getElementById('score').value),
    would_buy: parseInt(document.getElementById('wouldBuy').value),
    wishlist: document.getElementById('wishlistToggle').checked,
    setup_dif: parseInt(document.getElementById('setupDif').value),
    play_dif: parseInt(document.getElementById('playDif').value),
    user_id: userId,
    review_date: new Date().toISOString()
  };

  const { error } = await supabaseClient
    .from('ratings')
    .insert([payload]);

  if (error) {
    msgBox.className = 'message error';
    msgBox.textContent = 'Error: ' + error.message;
  } else {
    msgBox.className = 'message success';
    msgBox.textContent = 'Rating saved!';
    gameInput.value = '';
    currentSelectedGameId = null;
    document.getElementById('wishlistToggle').checked = false;
    selectedBanner.style.display = 'none';
    ratingForm.style.display = 'none';
  }

  msgBox.style.display = 'block';
  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit Rating';
});

// PLAYTEST MODULE LOGIC
const protoInput = document.getElementById('protoInput');
const protoDropdown = document.getElementById('protoDropdown');
const protoSelectedBanner = document.getElementById('protoSelectedBanner');
const protoSelectedTitle = document.getElementById('protoSelectedTitle');
const playtestForm = document.getElementById('playtestForm');
const submitPtBtn = document.getElementById('submitPtBtn');
const ptMsgBox = document.getElementById('ptMsgBox');

let currentProtoGameId = null;

protoInput.addEventListener('input', async (e) => {
  const searchTerm = e.target.value.trim();
  if (searchTerm.length < 2) {
    protoDropdown.style.display = 'none';
    return;
  }

  const { data: games, error } = await supabaseClient
    .from('games')
    .select('id, title, is_prototype')
    .ilike('title', `%${searchTerm}%`)
    .limit(6);

  if (error) return;

  protoDropdown.innerHTML = '';

  if (games.length === 0) {
    const addItem = document.createElement('div');
    addItem.className = 'dropdown-item';
    addItem.style.fontWeight = 'bold';
    addItem.style.color = '#2563eb';
    addItem.innerHTML = `🛠️ Register "${searchTerm}" as new Prototype`;

    addItem.addEventListener('click', async () => {
      const { data: newGame, error: insertError } = await supabaseClient
        .from('games')
        .insert([{ title: searchTerm, is_custom: true, is_prototype: true }])
        .select()
        .single();

      if (insertError) {
        alert('Error adding prototype: ' + insertError.message);
        return;
      }

      currentProtoGameId = newGame.id;
      protoSelectedTitle.textContent = newGame.title;
      protoSelectedBanner.style.display = 'block';
      playtestForm.style.display = 'block';
      protoInput.value = newGame.title;
      protoDropdown.style.display = 'none';
      ptMsgBox.style.display = 'none';
    });

    protoDropdown.appendChild(addItem);
  } else {
    games.forEach(game => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.textContent = game.title + (game.is_prototype ? ' 🛠️' : '');
      
      item.addEventListener('click', () => {
        currentProtoGameId = game.id;
        protoSelectedTitle.textContent = game.title;
        protoSelectedBanner.style.display = 'block';
        playtestForm.style.display = 'block';
        protoInput.value = game.title;
        protoDropdown.style.display = 'none';
        ptMsgBox.style.display = 'none';
      });
      protoDropdown.appendChild(item);
    });
  }

  protoDropdown.style.display = 'block';
});

submitPtBtn.addEventListener('click', async () => {
  if (!currentProtoGameId) return;

  submitPtBtn.disabled = true;
  submitPtBtn.textContent = 'Submitting Feedback...';

  const payload = {
    game_id: currentProtoGameId,
    user_id: userId,
    player_count: parseInt(document.getElementById('ptPlayerCount').value),
    game_length_mins: parseInt(document.getElementById('ptGameLength').value),
    fun_rating: parseInt(document.getElementById('ptFun').value),
    rules_clarity: parseInt(document.getElementById('ptRules').value),
    downtime_rating: parseInt(document.getElementById('ptPacing').value),
    theme_fit: parseInt(document.getElementById('ptTheme').value),
    favorite_part: document.getElementById('ptFavorite').value.trim(),
    frustration_points: document.getElementById('ptFrustration').value.trim(),
    general_notes: document.getElementById('ptNotes').value.trim()
  };

  const { error } = await supabaseClient
    .from('playtest_feedback')
    .insert([payload]);

  if (error) {
    console.error(error);
    ptMsgBox.className = 'message error';
    ptMsgBox.textContent = 'Error: ' + error.message;
  } else {
    ptMsgBox.className = 'message success';
    ptMsgBox.textContent = 'Playtest feedback sent to designer!';
    
    protoInput.value = '';
    currentProtoGameId = null;
    document.getElementById('ptFavorite').value = '';
    document.getElementById('ptFrustration').value = '';
    document.getElementById('ptNotes').value = '';
    protoSelectedBanner.style.display = 'none';
    playtestForm.style.display = 'none';
  }

  ptMsgBox.style.display = 'block';
  submitPtBtn.disabled = false;
  submitPtBtn.textContent = 'Submit Playtest Feedback';
});

// LEADERBOARD LOGIC
let currentLeaderboardTab = 'top_rated';

async function loadLeaderboard() {
  const listEl = document.getElementById('leaderboardList');
  listEl.innerHTML = '<li style="text-align:center; padding: 20px; color:#9ca3af;">Calculating stats...</li>';

  const { data: ratings, error } = await supabaseClient
    .from('ratings')
    .select('score, wishlist, games(id, title, is_prototype)');

  if (error) {
    listEl.innerHTML = '<li style="color:red; text-align:center;">Failed to load stats.</li>';
    return;
  }

  const statsMap = {};
  ratings.forEach(r => {
    if (!r.games || r.games.is_prototype) return;
    const gId = r.games.id;
    if (!statsMap[gId]) {
      statsMap[gId] = { title: r.games.title, totalRatings: 0, sumScore: 0, wishlistCount: 0 };
    }
    statsMap[gId].totalRatings += 1;
    statsMap[gId].sumScore += r.score || 0;
    if (r.wishlist) statsMap[gId].wishlistCount += 1;
  });

  let gamesArray = Object.values(statsMap).map(g => ({
    title: g.title,
    totalRatings: g.totalRatings,
    avgScore: (g.sumScore / g.totalRatings).toFixed(1),
    wishlistCount: g.wishlistCount
  }));

  if (currentLeaderboardTab === 'top_rated') {
    gamesArray.sort((a, b) => b.avgScore - a.avgScore || b.totalRatings - a.totalRatings);
  } else if (currentLeaderboardTab === 'wishlisted') {
    gamesArray.sort((a, b) => b.wishlistCount - a.wishlistCount || b.avgScore - a.avgScore);
  } else if (currentLeaderboardTab === 'most_rated') {
    gamesArray.sort((a, b) => b.totalRatings - a.totalRatings || b.avgScore - a.avgScore);
  }

  const top10 = gamesArray.slice(0, 10);
  listEl.innerHTML = '';
  
  if (top10.length === 0) {
    listEl.innerHTML = '<li style="text-align:center; padding: 20px; color:#9ca3af;">No ratings logged yet!</li>';
    return;
  }

  top10.forEach((game, index) => {
    const rankNum = index + 1;
    let badgeText = '';
    let subText = '';

    if (currentLeaderboardTab === 'top_rated') {
      badgeText = `⭐ ${game.avgScore} / 5`;
      subText = `${game.totalRatings} play rating${game.totalRatings > 1 ? 's' : ''}`;
    } else if (currentLeaderboardTab === 'wishlisted') {
      badgeText = `❤️ ${game.wishlistCount} saved`;
      subText = `Avg Score: ${game.avgScore} ★`;
    } else if (currentLeaderboardTab === 'most_rated') {
      badgeText = `🔥 ${game.totalRatings} plays`;
      subText = `Avg Score: ${game.avgScore} ★`;
    }

    const li = document.createElement('li');
    li.className = 'game-card';
    li.innerHTML = `
      <div class="rank rank-${rankNum}">#${rankNum}</div>
      <div class="game-info">
        <div class="game-title">${game.title}</div>
        <div class="game-sub">${subText}</div>
      </div>
      <div class="stat-badge">${badgeText}</div>
    `;
    listEl.appendChild(li);
  });
}

document.getElementById('tabTopRated').addEventListener('click', (e) => setLeaderboardTab(e.target, 'top_rated'));
document.getElementById('tabWishlisted').addEventListener('click', (e) => setLeaderboardTab(e.target, 'wishlisted'));
document.getElementById('tabMostRated').addEventListener('click', (e) => setLeaderboardTab(e.target, 'most_rated'));

function setLeaderboardTab(btn, tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentLeaderboardTab = tabName;
  loadLeaderboard();
}

// MY WISHLIST LOGIC
async function loadMyWishlist() {
  const listEl = document.getElementById('myWishlistList');
  listEl.innerHTML = '<li style="text-align:center; padding: 20px; color:#9ca3af;">Fetching your saved games...</li>';

  const { data: userRatings, error } = await supabaseClient
    .from('ratings')
    .select('score, would_buy, wishlist, review_date, games(title)')
    .eq('user_id', userId)
    .order('review_date', { ascending: false });

  if (error) {
    listEl.innerHTML = '<li style="color:red; text-align:center;">Failed to load your wishlist.</li>';
    return;
  }

  listEl.innerHTML = '';
  if (!userRatings || userRatings.length === 0) {
    listEl.innerHTML = '<li style="text-align:center; padding: 20px; color:#9ca3af;">You haven\'t rated or wishlisted any games yet!</li>';
    return;
  }

  userRatings.forEach(r => {
    if (!r.games) return;
    const li = document.createElement('li');
    li.className = 'game-card';
    li.innerHTML = `
      <div class="game-info">
        <div class="game-title">${r.games.title}</div>
        <div class="game-sub">Rated: ${r.score}★ | Replay: ${r.would_buy}/5</div>
      </div>
      <div>${r.wishlist ? '<span class="stat-badge" style="background:#fef2f2; color:#dc2626;">❤️ Wishlisted</span>' : ''}</div>
    `;
    listEl.appendChild(li);
  });
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#viewRate .search-container')) dropdown.style.display = 'none';
  if (!e.target.closest('#viewPlaytest .search-container')) protoDropdown.style.display = 'none';
});
