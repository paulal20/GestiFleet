const db = require('../data/db'); 

function getConnection(req, res, next) {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error obteniendo conexión del pool:', err);
      return next(err);
    }

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
  });
}

module.exports = getConnection;