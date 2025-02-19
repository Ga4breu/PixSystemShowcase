const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = require('./db');
const { authenticateToken, authorize } = require('./auth');

function createRouter(io) {
  const router = express.Router();
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const [results] = await db.query(
        'SELECT * FROM users WHERE username = ?',
        [username.trim()]
      );
      if (results.length > 0) {
        const user = results[0];
        const storedHash = user.password.replace(/^\$2y\$/i, '$2a$');
        const match = await bcrypt.compare(password.trim(), storedHash);
        if (match) {
          const token = jwt.sign(
            { id: user.id, username: user.username, nivel: user.nivel },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
          res.cookie('authToken', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: 24*60*60*1000,
            path: '/',
          });

          io.emit('user_logged_in', { username: user.username, id: user.id });
          return res.json({ success: true });
        } else {
          return res.status(401).json({ success: false, message: 'Incorrect username or password' });
        }
      } else {
        return res.status(401).json({ success: false, message: 'Incorrect username or password' });
      }
    } catch (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  router.get('/check-auth', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ authenticated: false, message: 'Not authenticated' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      const [results] = await db.query(
        'SELECT email, phone, father_account FROM users WHERE id = ?',
        [userId]
      );

      if (results.length === 0) {
        return res.status(404).json({ authenticated: false, message: 'User not found' });
      }

      const userInfo = {
        id: decoded.id,
        username: decoded.username,
        nivel: decoded.nivel,
        email: results[0].email,
        phone: results[0].phone,
        father_account: results[0].father_account,
      };

      return res.status(200).json({ authenticated: true, user: userInfo });
    } catch (err) {
      console.error('Error verifying token or fetching user data:', err);
      return res.status(403).json({ authenticated: false, message: 'Invalid token' });
    }
  });

  router.post('/logout', (req, res) => {
    res.clearCookie('authToken', { path: '/' });
    return res.json({ success: true, message: 'Logged out successfully' });
  });

  router.get('/status', authenticateToken, authorize([0, 1, 2]), async (req, res) => {
    try {
      const userNivel = req.user.nivel;
      let query;
      let params = [];

      if (userNivel === 0 || userNivel === 1) {
        query = 'SELECT * FROM Status_Maquinas';
      } else if (userNivel === 2) {
        query = `
          SELECT *
          FROM Status_Maquinas
          WHERE maquina IN (
            SELECT maquina FROM Maquinas WHERE cliente = ?
          )
        `;
        params.push(req.user.username);
      }
      const [results] = await db.query(query, params);
      return res.json(results);
    } catch (err) {
      console.error('Error fetching Status_Maquinas:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  router.put(
    '/status/:maquinaId',
    authenticateToken,
    authorize([0, 1, 2]),
    async (req, res) => {
      const { maquinaId } = req.params;
      const { newStatus } = req.body;
      console.log('--- PUT /status/:maquinaId CALLED ---');
      console.log('Params maquinaId:', maquinaId);
      console.log('Body newStatus:', newStatus);

      try {
        if (![0, 1, 2].includes(newStatus)) {
          return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const [updateResult] = await db.query(
          'UPDATE Status_Maquinas SET status = ? WHERE maquina = ?',
          [newStatus, maquinaId]
        );

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Machine not found' });
        }

        const [updatedRow] = await db.query(
          'SELECT * FROM Status_Maquinas WHERE maquina = ?',
          [maquinaId]
        );

        if (!updatedRow || updatedRow.length === 0) {
          return res.status(404).json({ success: false, message: 'Machine not found after update' });
        }

        io.emit('status_changed', updatedRow[0]);
        console.log(
          `Emitted 'status_changed' event for maquina: ${maquinaId} with status ${newStatus}`
        );

        return res.json({ success: true, message: 'Status updated successfully' });
      } catch (err) {
        console.error('Error updating status:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
    }
  );

  router.get('/maquinas', authenticateToken, async (req, res) => {
    try {
      const userNivel = req.user.nivel;
      const username = req.user.username;
      let results;
  
      if (userNivel === 0) {
        // Nivel 0: Access to all machines
        [results] = await db.query('SELECT * FROM Maquinas');
      } else if (userNivel === 1) {
        // Nivel 1: Only access machines where the user is either 'proprietario' or 'cliente'
        [results] = await db.query(
          'SELECT * FROM Maquinas WHERE proprietario = ? OR cliente = ?',
          [username, username]
        );
      } else if (userNivel === 2) {
        // Nivel 2: Only access machines where the user is 'cliente'
        [results] = await db.query(
          'SELECT * FROM Maquinas WHERE cliente = ?',
          [username]
        );
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      return res.json(results);
    } catch (err) {
      console.error('Error fetching Maquinas:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  

  router.get('/transacoes', authenticateToken, async (req, res) => {
    try {
      const { maquina, dataInicio, dataFim } = req.query;
      const userNivel = req.user.nivel;
      let query;
      let params = [];

      if (userNivel === 0 || userNivel === 1) {
        query = 'SELECT * FROM Transacoes WHERE 1=1';
      } else if (userNivel === 2) {
        const username = req.user.username;
        query = `
          SELECT *
          FROM Transacoes
          WHERE Reference_id_Transf = (
            SELECT id FROM users WHERE username = ?
          )
        `;
        params.push(username);
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (maquina) {
        query += ' AND Maquina = ?';
        params.push(maquina);
      }
      if (dataInicio && dataFim) {
        query += ' AND Horario_Cob BETWEEN ? AND ?';
        params.push(dataInicio, dataFim);
      }

      const [results] = await db.query(query, params);
      return res.json(results);
    } catch (err) {
      console.error('Error fetching Transacoes:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  router.post('/transacoes', authenticateToken, async (req, res) => {
    try {
      const { maquina, valor, descricao } = req.body;
      const userId = req.user.id;

      if (!maquina || !valor || !descricao) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const [result] = await db.query(
        'INSERT INTO Transacoes (Maquina, Valor_Transf, Descricao_Transf, Reference_id_Transf) VALUES (?, ?, ?, ?)',
        [maquina, valor, descricao, userId]
      );

      const newTransaction = {
        ID_Transf: result.insertId,
        Maquina: maquina,
        Valor_Transf: valor,
        Descricao_Transf: descricao,
        Reference_id_Transf: userId,
        Horario_Cob: new Date(),
      };

      res.status(201).json(newTransaction);

      io.emit('new_transacao', newTransaction);
      console.log(`Emitted 'new_transacao' for transaction ${newTransaction.ID_Transf}`);
    } catch (err) {
      console.error('Error adding Transacao:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  router.put(
    '/transacoes/:transacaoId',
    authenticateToken,
    authorize([0, 1, 2]),
    async (req, res) => {
      const { transacaoId } = req.params;
      const { maquina, valor, descricao } = req.body;

      try {
        if (!maquina || !valor || !descricao) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const [updateResult] = await db.query(
          'UPDATE Transacoes SET Maquina = ?, Valor_Transf = ?, Descricao_Transf = ? WHERE ID_Transf = ?',
          [maquina, valor, descricao, transacaoId]
        );

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const [updatedTransacao] = await db.query(
          'SELECT * FROM Transacoes WHERE ID_Transf = ?',
          [transacaoId]
        );

        io.emit('transacoes_updated', updatedTransacao[0]);
        console.log(`Emitted 'transacoes_updated' for transaction ${transacaoId}`);

        return res
          .status(200)
          .json({ success: true, message: 'Transaction updated successfully' });
      } catch (err) {
        console.error('Error updating Transacao:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
    }
  );

  router.get('/users', authenticateToken, authorize([0, 1]), async (req, res) => {
    try {
      const [results] = await db.query('SELECT * FROM users');
      return res.json(results);
    } catch (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  return router;
}

module.exports = createRouter;
