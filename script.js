// Aura Tracker: client logic using Firebase Firestore (v8 namespaced SDK)

document.addEventListener('DOMContentLoaded', function () {
  // Your Firebase config (as provided)
  const firebaseConfig = {
    apiKey: "AIzaSyDJII8KmgZhmguzjpgMSoyLA00FvZjJ_dw",
    authDomain: "aura-tracker-844af.firebaseapp.com",
    projectId: "aura-tracker-844af",
    storageBucket: "aura-tracker-844af.firebasestorage.app",
    messagingSenderId: "464015663995",
    appId: "1:464015663995:web:a2400982d2bdd9862f53de",
    measurementId: "G-K7PPGJT1YF"
  };

  // Initialize Firebase
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    // ignore "already exists" errors during hot reload
    if (!/already exists/i.test(err.message)) {
      console.error('Firebase init failed:', err);
    }
  }

  // Firestore handle
  let db;
  try {
    db = firebase.firestore();
  } catch (err) {
    console.error('Firestore unavailable:', err);
    return;
  }

  // Elements
  const auraForm = document.getElementById('aura-form');
  const targetSelect = document.getElementById('target');
  const operationSelect = document.getElementById('operation');
  const amountInput = document.getElementById('amount');
  const reasonInput = document.getElementById('reason');
  const leaderboardBody = document.querySelector('#leaderboard tbody');
  const transactionsList = document.getElementById('transactions');

  // Submit → write a transaction doc
  auraForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = targetSelect.value;
    const multiplier = parseInt(operationSelect.value, 10);
    const amount = Math.max(1, parseInt(amountInput.value || '1', 10));
    const reason = reasonInput.value.trim();
    if (!reason) return;

    const value = multiplier * amount;

    try {
      await db.collection('transactions').add({
        user,
        value,
        reason,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      amountInput.value = '1';
      reasonInput.value = '';
    } catch (err) {
      console.error('Error writing transaction:', err);
      alert('Failed to save. Please try again.');
    }
  });

  // Render leaderboard
  function renderLeaderboard(snapshot) {
    const totals = { 'C/Buo': 0, 'C/Bell': 0, 'C/Bautista': 0 };
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.user in totals) totals[data.user] += data.value || 0;
    });

    const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    leaderboardBody.innerHTML = '';
    rows.forEach(([name, total]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${name}</td><td>${total}</td>`;
      leaderboardBody.appendChild(tr);
    });
  }

  // Render recent transactions (latest 20)
  function renderTransactions(snapshot) {
    const docs = snapshot.docs.slice().sort((a, b) => {
      const ta = a.data().timestamp?.toMillis() || 0;
      const tb = b.data().timestamp?.toMillis() || 0;
      return tb - ta;
    }).slice(0, 20);

    transactionsList.innerHTML = '';
    docs.forEach((d) => {
      const { user, value, reason, timestamp } = d.data();
      const dateStr = timestamp ? new Date(timestamp.toMillis()).toLocaleString() : '';
      const sign = value > 0 ? '+' : '';
      const li = document.createElement('li');
      li.textContent = `${dateStr} ${user}: ${sign}${value} (${reason})`;
      transactionsList.appendChild(li);
    });
  }

  // Live updates
  db.collection('transactions').onSnapshot(
    (snap) => {
      renderLeaderboard(snap);
      renderTransactions(snap);
    },
    (err) => console.error('onSnapshot error:', err)
  );
});
