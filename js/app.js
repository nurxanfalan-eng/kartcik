// ============================================================
// APP.JS - Main Application Controller
// ============================================================

// ---- State ----
const State = {
  currentView: 'home',
  currentCard: null,
  isAdminOpen: false,
  isLoggedIn: false,
  txFormType: 'expense',
  txFormVisible: false,
  deferredInstallPrompt: null,
  installBannerShown: false
};

// ---- Utils ----
function $(id) { return document.getElementById(id); }

function showToast(msg, type = 'info') {
  const container = $('toast-container');
  const icons = { success: '✅', error: '❌', info: '💡' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; }, 2500);
  setTimeout(() => toast.remove(), 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Des'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
}

function getTodayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getBalanceClass(amount) {
  if (amount > 0) return 'positive';
  if (amount < 0) return 'negative';
  return 'zero';
}

function maskNumber(num) {
  if (!num) return '';
  const clean = num.replace(/\s/g, '');
  if (clean.length >= 16) {
    return '**** **** **** ' + clean.slice(-4);
  }
  if (clean.length >= 8) {
    return clean.slice(0, 4) + ' **** ' + clean.slice(-4);
  }
  return num;
}

function getCardTypeIcon(type) {
  const icons = {
    visa: '💳', mastercard: '💳', transit: '🚌',
    id: '🪪', other: '📋', loyalty: '🛒'
  };
  return icons[type] || '💳';
}

// ---- Splash / Login ----
function initSplash() {
  $('splash-login-btn').addEventListener('click', handleLogin);
  $('splash-password').addEventListener('keyup', e => {
    if (e.key === 'Enter') handleLogin();
  });
}

function handleLogin() {
  const user = $('splash-username').value.trim();
  const pass = $('splash-password').value;
  if (user === 'admin123' && pass === '1245') {
    $('splash-error').textContent = '';
    $('splash-screen').style.opacity = '0';
    $('splash-screen').style.transition = 'opacity 0.5s';
    setTimeout(() => {
      $('splash-screen').style.display = 'none';
      $('app').style.display = 'block';
      State.isLoggedIn = true;
      renderHome();
    }, 500);
  } else {
    $('splash-error').textContent = '❌ İstifadəçi adı və ya şifrə səhvdir!';
    $('splash-password').value = '';
    // Shake effect
    const box = document.querySelector('.splash-login-box');
    box.style.animation = 'none';
    box.offsetHeight;
    box.style.animation = 'shake 0.4s ease';
  }
}

// ---- Navigation ----
function navigate(view, data = null) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = $(`view-${view}`);
  if (el) {
    el.classList.add('active');
    el.scrollTop = 0;
  }
  State.currentView = view;

  // Topbar
  const backBtn = $('topbar-back');
  const topTitle = $('topbar-title');
  if (view === 'home') {
    backBtn.style.display = 'none';
    topTitle.textContent = 'KartManager';
  } else {
    backBtn.style.display = 'flex';
    if (view === 'card-detail' && data) {
      topTitle.textContent = data.name;
    } else if (view === 'history' && data) {
      topTitle.textContent = data.name + ' — Tarixçə';
    } else {
      topTitle.textContent = view === 'home' ? 'KartManager' : '';
    }
  }

  if (view === 'home') renderHome();
  if (view === 'card-detail' && data) renderCardDetail(data);
  if (view === 'history' && data) renderHistory(data);
}

// ---- Home Render ----
function renderHome() {
  const total = DB.getTotalBalance();
  $('total-balance').textContent = DB.formatMoney(total);

  const cards = DB.getCards();
  const container = $('cards-container');
  container.innerHTML = '';

  // Separate admin and regular
  const regular = cards.filter(c => !c.isAdmin);
  const adminCards = cards.filter(c => c.isAdmin);

  // Regular cards
  if (regular.length > 0) {
    const sec = document.createElement('div');
    sec.className = 'section-title';
    sec.innerHTML = '💳 Kartlarım';
    container.appendChild(sec);

    const list = document.createElement('div');
    list.className = 'cards-list';
    regular.forEach(card => {
      list.appendChild(buildCardItem(card));
    });
    container.appendChild(list);
  }

  // Admin cards
  if (adminCards.length > 0) {
    const sec = document.createElement('div');
    sec.className = 'section-title';
    sec.innerHTML = '🔒 Admin Kartlar';
    container.appendChild(sec);

    const list = document.createElement('div');
    list.className = 'cards-list';
    adminCards.forEach(card => {
      list.appendChild(buildCardItem(card));
    });
    container.appendChild(list);
    const note = document.createElement('div');
    note.style.cssText = 'padding:8px 20px 4px; font-size:0.7rem; color:var(--text-muted);';
    note.textContent = '* Admin detalları üçün Admin Panelə daxil olun';
    container.appendChild(note);
  }
}

function buildCardItem(card) {
  const item = document.createElement('div');
  item.className = 'card-item';
  item.style.setProperty('--card-color', card.color);

  const bal = parseFloat(card.balance) || 0;
  const balClass = getBalanceClass(bal);

  let badgeHtml = '';
  if (card.isAdmin) {
    badgeHtml = `<span class="card-badge badge-admin">Admin</span>`;
  } else if (card.type === 'visa') {
    badgeHtml = `<span class="card-badge badge-visa">VISA</span>`;
  } else if (card.type === 'mastercard') {
    badgeHtml = `<span class="card-badge badge-mastercard">MC</span>`;
  } else {
    badgeHtml = `<span class="card-badge badge-other">${card.type.toUpperCase()}</span>`;
  }

  let cashbackHtml = '';
  if (card.hasCashback) {
    cashbackHtml = `<span class="card-cashback-tag">⭐ Keşbek: ${DB.formatMoney(card.cashback)}</span>`;
  }

  item.innerHTML = `
    <div class="card-item-header">
      <div>
        <div class="card-item-name">${card.name}</div>
        <div class="card-item-bank">${card.bank}</div>
      </div>
      ${badgeHtml}
    </div>
    <div class="card-item-bottom">
      <div>
        <div class="card-number-mask">${maskNumber(card.number)}</div>
        ${cashbackHtml}
      </div>
      <div class="card-balance ${balClass}">${DB.formatMoney(bal)}</div>
    </div>
  `;

  item.addEventListener('click', () => navigate('card-detail', card));
  return item;
}

// ---- Card Detail Render ----
function renderCardDetail(cardData) {
  // Refresh from storage
  const card = DB.getCard(cardData.id) || cardData;
  State.currentCard = card;

  const view = $('view-card-detail');
  view.innerHTML = '';

  // Hero card visual
  const hero = document.createElement('div');
  hero.className = 'card-hero';
  hero.style.background = `linear-gradient(135deg, ${card.color}dd, ${card.color}88)`;

  const bal = parseFloat(card.balance) || 0;
  hero.innerHTML = `
    <div class="card-hero-top">
      <div>
        <div class="card-hero-name">${card.name}</div>
        <div class="card-hero-bank">${card.bank}</div>
      </div>
      <div class="card-type-icon">${getCardTypeIcon(card.type)}</div>
    </div>
    <div class="card-hero-middle">
      <div class="card-hero-number">${card.number}</div>
    </div>
    <div>
      <div class="card-hero-balance-label">Mövcud Balans</div>
      <div class="card-hero-balance">${DB.formatMoney(bal)}</div>
    </div>
    <div class="card-hero-bottom">
      ${card.expiry !== '-' ? `<div class="card-info-chip"><div class="card-info-chip-label">Bitmə</div><div class="card-info-chip-value">${card.expiry}</div></div>` : ''}
      ${card.hasCashback ? `<div class="card-info-chip"><div class="card-info-chip-label">Keşbek</div><div class="card-info-chip-value">${DB.formatMoney(card.cashback)}</div></div>` : ''}
    </div>
  `;
  view.appendChild(hero);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'action-row';
  actions.innerHTML = `
    <button class="action-btn" id="btn-expense">
      <span class="icon">💸</span>
      <span class="label">Xərc<br>Əlavə Et</span>
    </button>
    <button class="action-btn" id="btn-income">
      <span class="icon">💰</span>
      <span class="label">Gəlir<br>Əlavə Et</span>
    </button>
    <button class="action-btn" id="btn-history-nav">
      <span class="icon">📋</span>
      <span class="label">Tam<br>Tarixçə</span>
    </button>
    <button class="action-btn" id="btn-set-balance">
      <span class="icon">✏️</span>
      <span class="label">Balans<br>Düzəlt</span>
    </button>
  `;
  view.appendChild(actions);

  // Transaction form (hidden by default)
  const formContainer = document.createElement('div');
  formContainer.id = 'tx-form-container';
  formContainer.style.display = 'none';
  view.appendChild(formContainer);

  // Today's transactions
  const todayLabel = document.createElement('div');
  todayLabel.className = 'section-title';
  todayLabel.innerHTML = `📅 Bu Günün Əməliyyatları — ${formatDate(getTodayStr())}`;
  view.appendChild(todayLabel);

  const todayTxContainer = document.createElement('div');
  todayTxContainer.id = 'today-tx-container';
  view.appendChild(todayTxContainer);
  renderTodayTransactions(card);

  // Events
  $('btn-expense').addEventListener('click', () => showTxForm('expense', card, formContainer));
  $('btn-income').addEventListener('click', () => showTxForm('income', card, formContainer));
  $('btn-history-nav').addEventListener('click', () => navigate('history', card));
  $('btn-set-balance').addEventListener('click', () => showSetBalanceModal(card));
}

function renderTodayTransactions(card) {
  const c = DB.getCard(card.id) || card;
  const today = getTodayStr();
  const txs = DB.getTransactionsByDate(c.id, today);
  const container = $('today-tx-container');
  if (!container) return;
  container.innerHTML = '';

  if (txs.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>Bu gün heç bir əməliyyat yoxdur</p></div>`;
    return;
  }

  const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const dayIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);

  const summary = document.createElement('div');
  summary.style.cssText = 'display:flex;gap:10px;padding:0 16px 10px;';
  summary.innerHTML = `
    <div style="flex:1;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px;text-align:center;">
      <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:4px;">XƏRCLƏDİM</div>
      <div style="font-weight:700;color:var(--accent-red);">${DB.formatMoney(dayExpense)}</div>
    </div>
    <div style="flex:1;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:10px;text-align:center;">
      <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:4px;">ALDIM</div>
      <div style="font-weight:700;color:var(--accent-green);">${DB.formatMoney(dayIncome)}</div>
    </div>
  `;
  container.appendChild(summary);

  // Check if day is ended
  const isDayEnded = txs.some(t => t.dayEnded);
  const dayEndDiv = document.createElement('div');
  dayEndDiv.style.cssText = 'padding:0 16px 10px;display:flex;align-items:center;justify-content:space-between;';
  dayEndDiv.innerHTML = `
    <span style="font-size:0.72rem;color:var(--text-muted);">${txs.length} əməliyyat</span>
    <button class="tx-day-end ${isDayEnded ? 'closed' : 'open'}" id="day-end-btn">
      ${isDayEnded ? '🔒 Gün Bağlanıb' : '✅ Günü Bitir'}
    </button>
  `;
  container.appendChild(dayEndDiv);

  $('day-end-btn').addEventListener('click', () => toggleDayEnd(c, today));

  // List
  const list = document.createElement('div');
  list.style.cssText = 'padding:0 16px;';
  txs.forEach(tx => {
    list.appendChild(buildTxItem(tx, c.id, true));
  });
  container.appendChild(list);
}

function showTxForm(type, card, container) {
  State.txFormType = type;
  container.style.display = 'block';

  container.innerHTML = `
    <div class="form-card">
      <h3>${type === 'expense' ? '💸 Xərc Əlavə Et' : '💰 Gəlir Əlavə Et'}</h3>
      <div class="type-toggle">
        <button class="type-btn ${type === 'expense' ? 'active-expense' : ''}" id="toggle-expense">💸 Xərc</button>
        <button class="type-btn ${type === 'income' ? 'active-income' : ''}" id="toggle-income">💰 Gəlir</button>
      </div>
      <div class="form-group">
        <label>Məbləğ (₼)</label>
        <input type="number" id="tx-amount" placeholder="0.00" step="0.01" min="0">
      </div>
      <div class="form-group">
        <label>Səbəb / Açıqlama</label>
        <input type="text" id="tx-reason" placeholder="Məs: Market alışı, Nəqliyyat...">
      </div>
      <div class="form-group">
        <label>Tarix</label>
        <input type="date" id="tx-date" value="${getTodayStr()}">
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-outline" id="tx-cancel" style="flex:1;">Ləğv Et</button>
        <button class="btn btn-primary" id="tx-save" style="flex:2;">Yadda Saxla</button>
      </div>
    </div>
  `;

  $('toggle-expense').addEventListener('click', () => { State.txFormType = 'expense'; showTxForm('expense', card, container); });
  $('toggle-income').addEventListener('click', () => { State.txFormType = 'income'; showTxForm('income', card, container); });
  $('tx-cancel').addEventListener('click', () => { container.style.display = 'none'; container.innerHTML = ''; });
  $('tx-save').addEventListener('click', () => saveTx(card, container));
  $('tx-amount').focus();
}

function saveTx(card, container) {
  const amount = parseFloat($('tx-amount').value);
  const reason = $('tx-reason').value.trim();
  const date = $('tx-date').value;

  if (!amount || amount <= 0) { showToast('Məbləği daxil edin!', 'error'); return; }
  if (!reason) { showToast('Səbəbi daxil edin!', 'error'); return; }
  if (!date) { showToast('Tarixi seçin!', 'error'); return; }

  DB.addTransaction(card.id, {
    type: State.txFormType,
    amount,
    reason,
    date,
    dayEnded: false
  });

  container.style.display = 'none';
  container.innerHTML = '';

  showToast(State.txFormType === 'expense' ? '💸 Xərc əlavə edildi!' : '💰 Gəlir əlavə edildi!', 'success');
  renderCardDetail(DB.getCard(card.id));
  renderHome();
}

function toggleDayEnd(card, date) {
  const txs = DB.getTransactionsByDate(card.id, date);
  const allEnded = txs.every(t => t.dayEnded);
  const all = JSON.parse(localStorage.getItem(DB.KEYS.TRANSACTIONS) || '{}');
  if (!all[card.id]) return;
  all[card.id] = all[card.id].map(t => {
    if (t.date === date) t.dayEnded = !allEnded;
    return t;
  });
  localStorage.setItem(DB.KEYS.TRANSACTIONS, JSON.stringify(all));
  showToast(allEnded ? '🔓 Gün yenidən açıldı' : '🔒 Gün uğurla bağlandı!', 'success');
  renderTodayTransactions(card);
}

function buildTxItem(tx, cardId, showDelete = true) {
  const item = document.createElement('div');
  item.className = 'tx-item';

  const icon = document.createElement('div');
  icon.className = `tx-icon ${tx.type}`;
  icon.innerHTML = tx.type === 'expense' ? '💸' : '💰';

  const info = document.createElement('div');
  info.className = 'tx-info';
  info.innerHTML = `<div class="tx-reason">${tx.reason}</div><div class="tx-time">${formatTime(tx.timestamp)}</div>`;

  const amount = document.createElement('div');
  amount.className = `tx-amount ${tx.type}`;
  amount.textContent = (tx.type === 'expense' ? '-' : '+') + DB.formatMoney(tx.amount);

  item.appendChild(icon);
  item.appendChild(info);
  item.appendChild(amount);

  if (showDelete) {
    const del = document.createElement('button');
    del.className = 'tx-delete-btn';
    del.innerHTML = '🗑️';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`"${tx.reason}" silinsin?`)) {
        DB.deleteTransaction(cardId, tx.id);
        item.remove();
        showToast('Əməliyyat silindi', 'info');
        renderHome();
        // refresh card hero balance
        const cardView = $('view-card-detail');
        if (cardView && State.currentCard) {
          renderCardDetail(DB.getCard(State.currentCard.id));
        }
      }
    });
    item.appendChild(del);
  }

  return item;
}

// ---- History Render ----
function renderHistory(cardData) {
  const card = DB.getCard(cardData.id) || cardData;
  const view = $('view-history');
  view.innerHTML = '';

  // Stats
  const allTxs = DB.getTransactions(card.id);
  const totalExpense = allTxs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalIncome = allTxs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);

  const stats = document.createElement('div');
  stats.className = 'history-stats';
  stats.innerHTML = `
    <div class="stat-box">
      <div class="stat-box-label">Ümumi Xərc</div>
      <div class="stat-box-value" style="color:var(--accent-red)">${DB.formatMoney(totalExpense)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-label">Ümumi Gəlir</div>
      <div class="stat-box-value" style="color:var(--accent-green)">${DB.formatMoney(totalIncome)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-label">Cəmi</div>
      <div class="stat-box-value" style="color:var(--accent-cyan)">${allTxs.length}</div>
    </div>
  `;
  view.appendChild(stats);

  const dates = DB.getTransactionDates(card.id);

  if (dates.length === 0) {
    view.innerHTML += `<div class="empty-state"><div class="empty-icon">📭</div><p>Heç bir tarixçə tapılmadı</p></div>`;
    return;
  }

  dates.forEach(date => {
    const txs = DB.getTransactionsByDate(card.id, date);
    const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    const dayIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const isDayEnded = txs.some(t => t.dayEnded);

    const group = document.createElement('div');
    group.className = 'tx-date-group';

    const header = document.createElement('div');
    header.className = 'tx-date-header';
    const dayNet = dayIncome - dayExpense;
    header.innerHTML = `
      <div class="tx-date-label">📅 ${formatDate(date)} ${isDayEnded ? '🔒' : ''}</div>
      <div class="tx-date-total ${dayNet >= 0 ? 'pos' : 'neg'}">${dayNet >= 0 ? '+' : ''}${DB.formatMoney(dayNet)}</div>
    `;
    group.appendChild(header);

    txs.forEach(tx => {
      group.appendChild(buildTxItem(tx, card.id, true));
    });

    view.appendChild(group);
  });
}

// ---- Set Balance Modal ----
function showSetBalanceModal(card) {
  const modal = $('balance-modal');
  const input = $('balance-modal-input');
  input.value = parseFloat(card.balance) || 0;
  modal.classList.add('open');
  input.focus();
  input.select();

  $('balance-modal-save').onclick = () => {
    const val = parseFloat(input.value);
    if (isNaN(val)) { showToast('Keçərli rəqəm daxil edin', 'error'); return; }
    DB.updateCard(card.id, { balance: val });
    modal.classList.remove('open');
    showToast('Balans yeniləndi!', 'success');
    renderCardDetail(DB.getCard(card.id));
    renderHome();
  };

  $('balance-modal-cancel').onclick = () => modal.classList.remove('open');
  document.querySelector('#balance-modal .modal-overlay').onclick = () => modal.classList.remove('open');
}

// ---- Admin Panel ----
function initAdminPanel() {
  $('admin-panel-btn').addEventListener('click', () => {
    showAdminLogin();
  });
}

let adminAuthenticated = false;

function showAdminLogin() {
  if (adminAuthenticated) {
    openAdminPanel();
    return;
  }
  const modal = $('admin-login-modal');
  $('admin-login-error').textContent = '';
  $('admin-login-user').value = '';
  $('admin-login-pass').value = '';
  modal.classList.add('open');

  $('admin-login-confirm').onclick = () => {
    const u = $('admin-login-user').value.trim();
    const p = $('admin-login-pass').value;
    if (u === 'admin' && p === '1234') {
      adminAuthenticated = true;
      modal.classList.remove('open');
      openAdminPanel();
    } else {
      $('admin-login-error').textContent = '❌ Yanlış ad və ya şifrə!';
    }
  };

  $('admin-login-cancel').onclick = () => modal.classList.remove('open');
  document.querySelector('#admin-login-modal .modal-overlay').onclick = () => modal.classList.remove('open');
  $('admin-login-pass').addEventListener('keyup', e => { if (e.key === 'Enter') $('admin-login-confirm').click(); });
}

function openAdminPanel() {
  const panel = $('admin-panel');
  panel.classList.add('open');
  renderAdminContent();
}

function renderAdminContent() {
  // Tabs: card info, cashback
  renderAdminCardInfo();
  renderAdminCashback();
  renderAdminOtherCards();
}

function renderAdminCardInfo() {
  const container = $('admin-cards-info');
  container.innerHTML = '';
  const cards = DB.getCards().filter(c => !c.isAdmin).slice(0, 7); // first 7

  cards.forEach(card => {
    const row = document.createElement('div');
    row.className = 'admin-card-row';
    row.innerHTML = `
      <div class="admin-card-row-header">
        <div>
          <div class="admin-card-name">${card.name}</div>
          <div class="admin-card-num">${card.number}</div>
        </div>
        <span class="card-badge badge-${card.type}">${card.type.toUpperCase()}</span>
      </div>
      <div class="admin-info-grid">
        <div class="admin-info-item">
          <div class="admin-info-label">Son İstifadə Tarixi</div>
          <div class="admin-info-value">${card.expiry}</div>
        </div>
        <div class="admin-info-item">
          <div class="admin-info-label">CVV</div>
          <div class="admin-info-value">${card.cvv}</div>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderAdminOtherCards() {
  const container = $('admin-other-cards');
  container.innerHTML = '';
  const cards = DB.getCards().filter(c => c.isAdmin);

  cards.forEach(card => {
    const row = document.createElement('div');
    row.className = 'admin-card-row';
    row.innerHTML = `
      <div class="admin-card-row-header">
        <div>
          <div class="admin-card-name">${card.name}</div>
          <div class="admin-card-num">${card.number}</div>
        </div>
      </div>
      <div class="admin-info-item" style="margin-bottom:8px;">
        <div class="admin-info-label">Admin Qeydi</div>
        <div class="admin-info-value">${card.adminNote || '-'}</div>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderAdminCashback() {
  const container = $('admin-cashback-content');
  container.innerHTML = '';
  const cards = DB.getCards().filter(c => c.hasCashback);

  cards.forEach(card => {
    const cbs = DB.getCashbacks(card.id);

    const section = document.createElement('div');
    section.className = 'admin-card-row';
    section.innerHTML = `
      <div class="admin-card-row-header">
        <div>
          <div class="admin-card-name">${card.name}</div>
          <div class="admin-card-num">Keşbek Balans: <strong style="color:var(--accent-yellow)">${DB.formatMoney(card.cashback)}</strong></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button class="btn btn-success btn-sm" style="flex:1;" data-card="${card.id}" data-type="in">+ Gəlir</button>
        <button class="btn btn-danger btn-sm" style="flex:1;" data-card="${card.id}" data-type="out">- Çıxış</button>
      </div>
      <div class="cashback-list-${card.id}">
        ${cbs.length === 0 ? '<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:10px;">Keşbek tarixçəsi yoxdur</div>' : ''}
      </div>
    `;
    container.appendChild(section);

    const cbList = section.querySelector(`.cashback-list-${card.id}`);
    cbs.forEach(cb => {
      const el = document.createElement('div');
      el.className = 'cashback-entry';
      el.innerHTML = `
        <div class="cashback-entry-info">
          <div class="cashback-entry-date">${formatDate(cb.date)} ${formatTime(cb.timestamp)}</div>
          <div class="cashback-entry-note">${cb.note || (cb.type === 'in' ? 'Keşbek Gəliri' : 'Keşbek İstifadəsi')}</div>
        </div>
        <div class="cashback-entry-amount ${cb.type}">${cb.type === 'in' ? '+' : '-'}${DB.formatMoney(cb.amount)}</div>
        <button class="tx-delete-btn" data-cb="${cb.id}" data-card="${card.id}">🗑️</button>
      `;
      cbList.appendChild(el);
    });

    // Delete cashback buttons
    section.querySelectorAll('[data-cb]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cbId = btn.dataset.cb;
        const cId = btn.dataset.card;
        if (confirm('Bu keşbek silindi?')) {
          DB.deleteCashback(cId, cbId);
          renderAdminCashback();
          showToast('Keşbek silindi', 'info');
        }
      });
    });

    // Add cashback buttons
    section.querySelectorAll('[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.dataset.card;
        const cType = btn.dataset.type;
        showCashbackForm(cId, cType);
      });
    });
  });
}

function showCashbackForm(cardId, type) {
  const modal = $('cashback-modal');
  const title = $('cashback-modal-title');
  title.textContent = type === 'in' ? '💰 Keşbek Gəliri Əlavə Et' : '💳 Keşbek İstifadəsi';
  $('cashback-modal-amount').value = '';
  $('cashback-modal-date').value = getTodayStr();
  modal.classList.add('open');

  $('cashback-modal-save').onclick = () => {
    const amount = parseFloat($('cashback-modal-amount').value);
    const date = $('cashback-modal-date').value;
    if (!amount || amount <= 0) { showToast('Məbləği daxil edin', 'error'); return; }
    DB.addCashback(cardId, { type, amount, date, note: type === 'in' ? 'Keşbek Gəliri' : 'Keşbek İstifadəsi' });
    modal.classList.remove('open');
    renderAdminCashback();
    renderHome();
    showToast('Keşbek yeniləndi!', 'success');
  };

  $('cashback-modal-cancel').onclick = () => modal.classList.remove('open');
  document.querySelector('#cashback-modal .modal-overlay').onclick = () => modal.classList.remove('open');
}

// ---- Admin Tabs ----
function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $(tab.dataset.tab).classList.add('active');
    });
  });
}

// ---- PWA Install ----
function initPWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[PWA] Service Worker registered:', reg.scope);
    }).catch(err => console.warn('[PWA] SW registration failed:', err));
  }

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    State.deferredInstallPrompt = e;
    showInstallBanner();
  });

  // When app is installed
  window.addEventListener('appinstalled', () => {
    hideInstallBanner();
    showToast('🎉 Tətbiq quraşdırıldı!', 'success');
    State.deferredInstallPrompt = null;
  });
}

function showInstallBanner() {
  if (State.installBannerShown) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  const banner = $('install-banner');
  if (banner) {
    banner.style.display = 'flex';
    State.installBannerShown = true;
  }
}

function hideInstallBanner() {
  const banner = $('install-banner');
  if (banner) banner.style.display = 'none';
}

function initInstallButtons() {
  const installBtn = $('install-btn');
  const closeBanner = $('close-banner');

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (State.deferredInstallPrompt) {
        State.deferredInstallPrompt.prompt();
        const result = await State.deferredInstallPrompt.userChoice;
        if (result.outcome === 'accepted') {
          hideInstallBanner();
        }
        State.deferredInstallPrompt = null;
      }
    });
  }

  if (closeBanner) {
    closeBanner.addEventListener('click', () => hideInstallBanner());
  }
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  initSplash();
  initPWA();
  initInstallButtons();
  initAdminPanel();
  initAdminTabs();

  // Back button
  $('topbar-back').addEventListener('click', () => {
    if (State.currentView === 'history' && State.currentCard) {
      navigate('card-detail', State.currentCard);
    } else {
      navigate('home');
    }
  });

  // Close admin panel
  $('close-admin-panel').addEventListener('click', () => {
    $('admin-panel').classList.remove('open');
  });
  document.querySelector('#admin-panel .admin-overlay').addEventListener('click', () => {
    $('admin-panel').classList.remove('open');
  });

  // Start on home
  navigate('home');

  // Show install banner on first load (fallback for iOS)
  setTimeout(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone && !State.installBannerShown) {
      const banner = $('install-banner');
      if (banner) {
        banner.style.display = 'flex';
        State.installBannerShown = true;
      }
    }
  }, 2000);
});
