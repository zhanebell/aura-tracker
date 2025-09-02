// This script implements the client-side logic for the Aura Tracker app.
// It connects to Firebase Firestore to store transactions and renders
// the leaderboard and recent transactions in real time.

document.addEventListener('DOMContentLoaded', function () {
  // Firebase configuration for the aura-tracker project.
  // These values were provided from the Firebase console when registering
  // the web application. Including the full configuration allows
  // Firebase to initialize all services correctly.
  const firebaseConfig = {
    apiKey: "AIzaSyDJII8KmgZhmguzjpgMSoyLA00FvZjJ_dw",
    authDomain: "aura-tracker-844af.firebaseapp.com",
    projectId: "aura-tracker-844af",
    storageBucket: "aura-tracker-844af.firebasestorage.app",
    messagingSenderId: "464015663995",
    appId: "1:464015663995:web:a2400982d2bdd9862f53de",
    measurementId: "G-K7PPGJT1YF"
  };

  // Initialize Firebase only if the config has been updated.
  // Without valid configuration the app will not function correctly.
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.error('Error initializing Firebase. Have you filled out the config?', err);
  }

  // Obtain a Firestore reference.
  let db;
  try {
    db = firebase.firestore();
  } catch (err) {
    console.error('Firestore is not available. Check Firebase initialization.', err);
    return;
  }

  const auraForm = document.getElementById('aura-form');
  const targetSelect = document.getElementById('target');
  const operationSelect = document.getElementById('operation');
  const amountInput = document.getElementById('amount');
  const reasonInput = document.getElementById('reason');
  const leaderboardBody = document.querySelector('#leaderboard tbody');
  const transactionsList = document.getElementById('transactions');

  // Handle form submission: create a new transaction document in Firestore.
  auraForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = targetSelect.value;
    const multiplier = parseInt(operationSelect.value, 10);
    const amount = parseInt(amountInput.value, 10);
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
      // Clear the form for next entry.
      amountInput.value = '1';
      reasonInput.value = '';
    } catch (err) {
      console.error('Error writing transaction to Firestore:', err);
    }
  });

  /**
   * Renders the leaderboard into the HTML table body.
   * @param {firebase.firestore.QuerySnapshot} snapshot A snapshot of the transactions collection.
   */
  function renderLeaderboard(snapshot) {
    // Initialize totals for each friend.
    const totals = {
      'C/Buo': 0,
      'C/Bell': 0,
      'C/Bautista': 0,
    };
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.user in totals) {
        totals[data.user] += data.value;
      }
    });
    // Convert to array of [name, total], sort descending by total.
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    // Clear existing rows.
    leaderboardBody.innerHTML = '';
    // Populate the table body.
    entries.forEach(([name, total]) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${name}</td><td>${total}</td>`;
      leaderboardBody.appendChild(row);
    });
  }

  /**
   * Renders recent transactions as a list.
   * @param {firebase.firestore.QuerySnapshot} snapshot A snapshot of the transactions collection.
   */
  function renderTransactions(snapshot) {
    // Create an array of docs and sort by timestamp descending.
    const docs = snapshot.docs.slice();
    docs.sort((a, b) => {
      const aTime = a.data().timestamp?.toMillis() || 0;
      const bTime = b.data().timestamp?.toMillis() || 0;
      return bTime - aTime;
    });
    // Limit to last 20 entries.
    const limited = docs.slice(0, 20);
    transactionsList.innerHTML = '';
    limited.forEach((doc) => {
      const { user, value, reason, timestamp } = doc.data();
      const li = document.createElement('li');
      // Format date/time string.
      const dateStr = timestamp
        ? new Date(timestamp.toMillis()).toLocaleString()
        : '';
      const sign = value > 0 ? '+' : '';
      li.textContent = `${dateStr} ${user}: ${sign}${value} (${reason})`;
      transactionsList.appendChild(li);
    });
  }

  // Subscribe to the 'transactions' collection to update UI in real time.
  db.collection('transactions').onSnapshot(
    (snapshot) => {
      renderLeaderboard(snapshot);
      renderTransactions(snapshot);
    },
    (err) => {
      console.error('Error fetching transactions snapshot:', err);
    }
  );
});