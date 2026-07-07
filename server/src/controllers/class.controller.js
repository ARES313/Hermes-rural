const db = require('../database/db');

const getAllClasses = (req, res) => {
  const query = `
    SELECT c.*, u.full_name as teacher_name 
    FROM classes c
    INNER JOIN users u ON c.teacher_id = u.id
    ORDER BY c.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener clases:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener las clases',
        error: err.message
      });
    }
    
    res.json({
      ok: true,
      count: rows.length,
      classes: rows
    });
  });
};

const getClassById = (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT c.*, u.full_name as teacher_name 
    FROM classes c
    INNER JOIN users u ON c.teacher_id = u.id
    WHERE c.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error al obtener clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al obtener la clase',
        error: err.message
      });
    }
    
    if (!row) {
      return res.status(404).json({
        ok: false,
        message: 'Clase no encontrada'
      });
    }
    
    res.json({
      ok: true,
      class: row
    });
  });
};

const createClass = (req, res) => {
  const { name, description, teacher_id, school_year, status } = req.body;
  
  if (!name || !teacher_id) {
    return res.status(400).json({
      ok: false,
      message: 'Los campos name y teacher_id son obligatorios'
    });
  }
  
  const query = `
    INSERT INTO classes (name, description, teacher_id, school_year, status)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const statusValue = status || 'active';
  const schoolYearValue = school_year || null;
  
  db.run(query, [name, description || null, teacher_id, schoolYearValue, statusValue], function(err) {
    if (err) {
      console.error('Error al crear clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al crear la clase',
        error: err.message
      });
    }
    
    db.get(`SELECT c.*, u.full_name as teacher_name FROM classes c INNER JOIN users u ON c.teacher_id = u.id WHERE c.id = ?`, [this.lastID], (err, row) => {
      if (err) {
        return res.status(201).json({
          ok: true,
          message: 'Clase creada exitosamente',
          classId: this.lastID
        });
      }
      
      res.status(201).json({
        ok: true,
        message: 'Clase creada exitosamente',
        class: row
      });
    });
  });
};

const updateClass = (req, res) => {
  const { id } = req.params;
  const { name, description, teacher_id, school_year, status } = req.body;
  
  db.get('SELECT * FROM classes WHERE id = ?', [id], (err, classExists) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al actualizar la clase',
        error: err.message
      });
    }
    
    if (!classExists) {
      return res.status(404).json({
        ok: false,
        message: 'Clase no encontrada'
      });
    }
    
    let updates = [];
    let values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (teacher_id !== undefined) {
      updates.push('teacher_id = ?');
      values.push(teacher_id);
    }
    if (school_year !== undefined) {
      updates.push('school_year = ?');
      values.push(school_year);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'No hay campos para actualizar'
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `UPDATE classes SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
      if (err) {
        console.error('Error al actualizar clase:', err.message);
        return res.status(500).json({
          ok: false,
          message: 'Error al actualizar la clase',
          error: err.message
        });
      }
      
      db.get(`SELECT c.*, u.full_name as teacher_name FROM classes c INNER JOIN users u ON c.teacher_id = u.id WHERE c.id = ?`, [id], (err, row) => {
        res.json({
          ok: true,
          message: 'Clase actualizada exitosamente',
          class: row
        });
      });
    });
  });
};

const deleteClass = (req, res) => {
  const { id } = req.params;
  const { hard_delete } = req.query;
  
  db.get('SELECT * FROM classes WHERE id = ?', [id], (err, classExists) => {
    if (err) {
      console.error('Error al verificar clase:', err.message);
      return res.status(500).json({
        ok: false,
        message: 'Error al eliminar la clase',
        error: err.message
      });
    }
    
    if (!classExists) {
      return res.status(404).json({
        ok: false,
        message: 'Clase no encontrada'
      });
    }
    
    if (hard_delete === 'true') {
      db.run('DELETE FROM classes WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error al eliminar clase:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al eliminar la clase',
            error: err.message
          });
        }
        
        res.json({
          ok: true,
          message: 'Clase eliminada permanentemente'
        });
      });
    } else {
      db.run('UPDATE classes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['inactive', id], function(err) {
        if (err) {
          console.error('Error al desactivar clase:', err.message);
          return res.status(500).json({
            ok: false,
            message: 'Error al desactivar la clase',
            error: err.message
          });
        }
        
        res.json({
          ok: true,
          message: 'Clase desactivada exitosamente'
        });
      });
    }
  });
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};