require('dotenv').config();
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const db = require('./db');
const initializeWebSocket = require('./websocket');

const { authenticateToken, authorize } = require('./auth');
const createRouter = require('./routes');

const app = express();
const server = http.createServer(app);
const io = initializeWebSocket(server);
app.set('io', io);

app.use(cookieParser());
app.use(express.json());

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Caches for status and transactions
const knownStatus = {};
const knownTransactionIds = new Set();
// Cache transactions keyed by EndtoEndID_Cob.
const knownTransactions = {};

// Helper function to check if only the status changed.
function isOnlyStatusChanged(oldRow, newRow) {
  const oldCopy = { ...oldRow };
  const newCopy = { ...newRow };
  delete oldCopy.Status_Transf;
  delete newCopy.Status_Transf;
  return (
    JSON.stringify(oldCopy) === JSON.stringify(newCopy) &&
    oldRow.Status_Transf !== newRow.Status_Transf
  );
}

// Initialize caches with correct column mappings
(async function initializeCaches() {
  try {
    // Initialize knownStatus
    const [statusRows] = await db.query('SELECT maquina, status FROM Status_Maquinas');
    statusRows.forEach((row) => {
      knownStatus[row.maquina] = row.status;
    });
    console.log('Initialized knownStatus with current DB values.');

    // Initialize knownTransactionIds and knownTransactions using EndtoEndID_Cob as key
    const [transactionRows] = await db.query('SELECT * FROM Transacoes');
    transactionRows.forEach((row) => {
      knownTransactionIds.add(row.EndtoEndID_Cob);
      knownTransactions[row.EndtoEndID_Cob] = row;
    });
    console.log('Initialized knownTransactionIds and knownTransactions with current DB values.');
  } catch (err) {
    console.error('Error initializing caches:', err);
  }
})();

// Polling function for Status_Maquinas
function pollStatusChanges() {
  setInterval(async () => {
    try {
      const [rows] = await db.query('SELECT maquina, status FROM Status_Maquinas');

      rows.forEach(({ maquina, status }) => {
        if (knownStatus[maquina] !== status) {
          console.log(`[POLLER] Machine ${maquina} status changed from ${knownStatus[maquina]} to ${status}`);
          knownStatus[maquina] = status;
          io.emit('status_changed', { maquina, status });
        }
      });

      // Remove machines no longer in DB
      Object.keys(knownStatus).forEach((cachedMaquina) => {
        const stillExists = rows.some((row) => row.maquina === cachedMaquina);
        if (!stillExists) {
          console.log(`[POLLER] Machine ${cachedMaquina} was removed from DB.`);
          delete knownStatus[cachedMaquina];
        }
      });
    } catch (err) {
      console.error('Error polling status changes:', err);
    }
  }, 3000);
}

// Polling function for Transacoes (new, updated, and removed transactions)
function pollTransactionIds() {
  setInterval(async () => {
    try {
      // Fetch full details for all transactions
      const [rows] = await db.query('SELECT * FROM Transacoes');
      const currentIds = new Set();

      rows.forEach((row) => {
        const id = row.EndtoEndID_Cob;
        currentIds.add(id);

        if (!knownTransactions[id]) {
          // New transaction
          console.log(`[POLLER] New transaction detected: ID ${id}`);
          knownTransactionIds.add(id);
          knownTransactions[id] = row;
          io.emit('new_transacao', row);
        } else {
          const cachedRow = knownTransactions[id];
          if (isOnlyStatusChanged(cachedRow, row)) {
            // Only the status changed.
            console.log(`[POLLER] Transaction status updated: ID ${id}, from ${cachedRow.Status_Transf} to ${row.Status_Transf}`);
            knownTransactions[id] = row;
            io.emit('transacao_status_updated', row);
          } else if (JSON.stringify(cachedRow) !== JSON.stringify(row)) {
            // Some other field (or fields in addition to status) changed.
            console.log(`[POLLER] Transaction updated: ID ${id}`);
            knownTransactions[id] = row;
            io.emit('transacoes_updated', row);
          }
        }
      });

      // Detect removed transactions
      Object.keys(knownTransactions).forEach((id) => {
        if (!currentIds.has(id)) {
          console.log(`[POLLER] Transaction ID ${id} was removed from DB.`);
          delete knownTransactions[id];
          knownTransactionIds.delete(id);
          io.emit('transacao_removed', { id });
        }
      });
    } catch (err) {
      console.error('Error polling transaction IDs:', err);
    }
  }, 3000);
}

// Start polling
pollStatusChanges();
pollTransactionIds();

// Setup routes
const router = createRouter(io);
app.use('/', router);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
