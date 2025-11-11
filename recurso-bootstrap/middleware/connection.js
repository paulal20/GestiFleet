const db = require('../data/db'); 

async function getConnection(req, res, next) {
  try {
    const connection = await db.getConnection();

    req.db = connection;

    const release = () => {
      try {
        connection.release();
      } catch (e) {
        console.error('Error al liberar conexión:', e);
      }
    };

    res.on('finish', release);
    res.on('close', release);

    next();
  } catch (err) {
    console.error('Error obteniendo conexión del pool:', err);
    next(err);
  }
}

module.exports = getConnection;
