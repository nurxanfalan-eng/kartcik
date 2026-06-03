// ============================================================
// DATA LAYER - LocalStorage Management
// All data persists in localStorage - never lost on RAM clear
// ============================================================

const DB = {
  // ---- Keys ----
  KEYS: {
    CARDS: 'km_cards',
    TRANSACTIONS: 'km_transactions',
    CASHBACKS: 'km_cashbacks',
    SETTINGS: 'km_settings'
  },

  // ---- Card Definitions (static, always present) ----
  DEFAULT_CARDS: [
    {
      id: 'card_1',
      name: 'Tələbə Kartı',
      number: '4405 5304 0675 5297',
      expiry: '07/30',
      cvv: '560',
      bank: 'Kapital Bank',
      type: 'visa',
      color: '#7c3aed',
      balance: 0,
      hasCashback: true,
      cashback: 0,
      isAdmin: false
    },
    {
      id: 'card_2',
      name: 'ABB',
      number: '5522 0993 7514 1249',
      expiry: '07/30',
      cvv: '560',
      bank: 'ABB Bank',
      type: 'mastercard',
      color: '#db2777',
      balance: 0,
      hasCashback: true,
      cashback: 0,
      isAdmin: false
    },
    {
      id: 'card_3',
      name: 'Bir Bank (BAHAR)',
      number: '4169 7388 7486 8981',
      expiry: '07/30',
      cvv: '560',
      bank: 'Bir Bank',
      type: 'visa',
      color: '#0891b2',
      balance: 0,
      hasCashback: true,
      cashback: 0,
      isAdmin: false
    },
    {
      id: 'card_4',
      name: 'PAŞA',
      number: '5402 6919 5083 3409',
      expiry: '07/30',
      cvv: '560',
      bank: 'PAŞA Bank',
      type: 'mastercard',
      color: '#059669',
      balance: 0,
      hasCashback: true,
      cashback: 0,
      isAdmin: false
    },
    {
      id: 'card_5',
      name: 'Bir Bank Yeni',
      number: '4169 7388 8713 4223',
      expiry: '07/30',
      cvv: '560',
      bank: 'Bir Bank',
      type: 'visa',
      color: '#d97706',
      balance: 0,
      hasCashback: true,
      cashback: 0,
      isAdmin: false
    },
    {
      id: 'card_6',
      name: 'Bir Bank Yeni 2',
      number: '4169 7388 0404 9231',
      expiry: '07/30',
      cvv: '560',
      bank: 'Bir Bank',
      type: 'visa',
      color: '#dc2626',
      balance: 0,
      hasCashback: true,
      cashback: 0,
      isAdmin: false
    },
    {
      id: 'card_7',
      name: 'Bir Bank Premium',
      number: '4169 7388 6879 8897',
      expiry: '07/30',
      cvv: '560',
      bank: 'Bir Bank',
      type: 'visa',
      color: '#7c3aed',
      balance: 0,
      hasCashback: true,
      cashback: 0,
      isAdmin: false
    },
    {
      id: 'card_8',
      name: 'Bakı Kart',
      number: '06019-57648-6',
      expiry: '-',
      cvv: '-',
      bank: 'Bakı Nəqliyyat Agentliyi',
      type: 'transit',
      color: '#0f766e',
      balance: 0,
      hasCashback: false,
      cashback: 0,
      isAdmin: false
    },
    {
      id: 'card_9',
      name: 'Şəxsiyyət Vəsiqəsi',
      number: 'AA4780000',
      expiry: '-',
      cvv: '-',
      bank: 'FİN: XXXXXXX',
      type: 'id',
      color: '#1e40af',
      balance: 0,
      hasCashback: false,
      cashback: 0,
      isAdmin: true,
      adminNote: 'FİN-XXXXXXX'
    },
    {
      id: 'card_10',
      name: 'Oxu Kart (Nurxan)',
      number: '0011918276',
      expiry: '-',
      cvv: '-',
      bank: 'Oxu Kart - 10379',
      type: 'other',
      color: '#7c2d12',
      balance: 181.56260,
      hasCashback: false,
      cashback: 0,
      isAdmin: true,
      adminNote: '10379 - Nurxan'
    },
    {
      id: 'card_11',
      name: 'Oxu Kart (Vüsal)',
      number: '0011918279',
      expiry: '-',
      cvv: '-',
      bank: 'Oxu Kart - 10378',
      type: 'other',
      color: '#065f46',
      balance: 181.56263,
      hasCashback: false,
      cashback: 0,
      isAdmin: true,
      adminNote: '10378 - Vüsal'
    },
    {
      id: 'card_12',
      name: 'Araz Müştəri',
      number: '2015 0000 0374 8438',
      expiry: '-',
      cvv: '-',
      bank: 'Araz Supermarket',
      type: 'loyalty',
      color: '#4338ca',
      balance: 0,
      hasCashback: false,
      cashback: 0,
      isAdmin: false
    }
  ],

  // ---- Init ----
  init() {
    if (!localStorage.getItem(this.KEYS.CARDS)) {
      localStorage.setItem(this.KEYS.CARDS, JSON.stringify(this.DEFAULT_CARDS));
    } else {
      // Merge new default cards if missing
      const stored = this.getCards();
      let changed = false;
      this.DEFAULT_CARDS.forEach(dc => {
        if (!stored.find(c => c.id === dc.id)) {
          stored.push(dc);
          changed = true;
        }
      });
      if (changed) localStorage.setItem(this.KEYS.CARDS, JSON.stringify(stored));
    }
    if (!localStorage.getItem(this.KEYS.TRANSACTIONS)) {
      localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify({}));
    }
    if (!localStorage.getItem(this.KEYS.CASHBACKS)) {
      localStorage.setItem(this.KEYS.CASHBACKS, JSON.stringify({}));
    }
  },

  // ---- Cards ----
  getCards() {
    return JSON.parse(localStorage.getItem(this.KEYS.CARDS) || '[]');
  },

  getCard(id) {
    return this.getCards().find(c => c.id === id);
  },

  updateCard(id, updates) {
    const cards = this.getCards();
    const idx = cards.findIndex(c => c.id === id);
    if (idx !== -1) {
      cards[idx] = { ...cards[idx], ...updates };
      localStorage.setItem(this.KEYS.CARDS, JSON.stringify(cards));
    }
    return cards[idx];
  },

  // ---- Transactions ----
  getTransactions(cardId) {
    const all = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '{}');
    return all[cardId] || [];
  },

  addTransaction(cardId, tx) {
    const all = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '{}');
    if (!all[cardId]) all[cardId] = [];
    tx.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    tx.timestamp = new Date().toISOString();
    all[cardId].unshift(tx);
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(all));

    // Update card balance
    const card = this.getCard(cardId);
    if (card) {
      let newBalance = parseFloat(card.balance) || 0;
      if (tx.type === 'expense') {
        newBalance -= parseFloat(tx.amount);
      } else {
        newBalance += parseFloat(tx.amount);
      }
      this.updateCard(cardId, { balance: newBalance });
    }
    return tx;
  },

  deleteTransaction(cardId, txId) {
    const all = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '{}');
    if (!all[cardId]) return;
    const tx = all[cardId].find(t => t.id === txId);
    if (!tx) return;

    all[cardId] = all[cardId].filter(t => t.id !== txId);
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(all));

    // Reverse balance
    const card = this.getCard(cardId);
    if (card) {
      let newBalance = parseFloat(card.balance) || 0;
      if (tx.type === 'expense') {
        newBalance += parseFloat(tx.amount);
      } else {
        newBalance -= parseFloat(tx.amount);
      }
      this.updateCard(cardId, { balance: newBalance });
    }
  },

  // Get transactions for a specific date
  getTransactionsByDate(cardId, dateStr) {
    return this.getTransactions(cardId).filter(tx => tx.date === dateStr);
  },

  // Get all dates that have transactions
  getTransactionDates(cardId) {
    const txs = this.getTransactions(cardId);
    const dates = [...new Set(txs.map(t => t.date))];
    return dates.sort((a, b) => b.localeCompare(a));
  },

  // ---- Cashback ----
  getCashbacks(cardId) {
    const all = JSON.parse(localStorage.getItem(this.KEYS.CASHBACKS) || '{}');
    return all[cardId] || [];
  },

  addCashback(cardId, cb) {
    const all = JSON.parse(localStorage.getItem(this.KEYS.CASHBACKS) || '{}');
    if (!all[cardId]) all[cardId] = [];
    cb.id = Date.now() + '_cb_' + Math.random().toString(36).substr(2, 9);
    cb.timestamp = new Date().toISOString();
    all[cardId].unshift(cb);
    localStorage.setItem(this.KEYS.CASHBACKS, JSON.stringify(all));

    // Update card cashback
    const card = this.getCard(cardId);
    if (card) {
      let newCashback = parseFloat(card.cashback) || 0;
      if (cb.type === 'out') {
        newCashback -= parseFloat(cb.amount);
      } else {
        newCashback += parseFloat(cb.amount);
      }
      this.updateCard(cardId, { cashback: newCashback });
    }
    return cb;
  },

  deleteCashback(cardId, cbId) {
    const all = JSON.parse(localStorage.getItem(this.KEYS.CASHBACKS) || '{}');
    if (!all[cardId]) return;
    const cb = all[cardId].find(c => c.id === cbId);
    if (!cb) return;

    all[cardId] = all[cardId].filter(c => c.id !== cbId);
    localStorage.setItem(this.KEYS.CASHBACKS, JSON.stringify(all));

    const card = this.getCard(cardId);
    if (card) {
      let newCashback = parseFloat(card.cashback) || 0;
      if (cb.type === 'out') {
        newCashback += parseFloat(cb.amount);
      } else {
        newCashback -= parseFloat(cb.amount);
      }
      this.updateCard(cardId, { cashback: newCashback });
    }
  },

  // ---- Total Balance (all non-admin cards) ----
  getTotalBalance() {
    return this.getCards()
      .filter(c => !c.isAdmin)
      .reduce((sum, c) => sum + (parseFloat(c.balance) || 0), 0);
  },

  // Format currency
  formatMoney(amount) {
    return parseFloat(amount || 0).toFixed(2) + ' ₼';
  }
};
