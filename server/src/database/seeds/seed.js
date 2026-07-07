const bcrypt = require('bcryptjs');
const db = require('../db'); // Subir un nivel para encontrar db.js

const SALT_ROUNDS = 10;

const seedDatabase = () => {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // 1. Insertar roles
  const roles = [
    { name: 'admin', description: 'Administrador del sistema' },
    { name: 'teacher', description: 'Docente' },
    { name: 'student', description: 'Estudiante' }
  ];

  let adminRoleId, teacherRoleId, studentRoleId;

  db.serialize(() => {
    // Insertar roles
    roles.forEach((role) => {
      db.run(
        `INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)`,
        [role.name, role.description],
        function(err) {
          if (err) {
            console.error(`❌ Error insertando rol ${role.name}:`, err.message);
          } else if (this.changes > 0) {
            console.log(`✅ Rol "${role.name}" insertado correctamente`);
          } else {
            console.log(`⚠️ Rol "${role.name}" ya existe, omitiendo`);
          }
        }
      );
    });

    // Obtener IDs de roles después de insertar
    db.get(`SELECT id FROM roles WHERE name = 'admin'`, (err, row) => {
      if (err) {
        console.error('❌ Error obteniendo admin role:', err.message);
      } else if (row) {
        adminRoleId = row.id;
      }
    });

    db.get(`SELECT id FROM roles WHERE name = 'teacher'`, (err, row) => {
      if (err) {
        console.error('❌ Error obteniendo teacher role:', err.message);
      } else if (row) {
        teacherRoleId = row.id;
      }
    });

    db.get(`SELECT id FROM roles WHERE name = 'student'`, (err, row) => {
      if (err) {
        console.error('❌ Error obteniendo student role:', err.message);
      } else if (row) {
        studentRoleId = row.id;
      }
    });

    // Esperar a que se obtengan los roles antes de continuar
    setTimeout(() => {
      if (!adminRoleId || !teacherRoleId || !studentRoleId) {
        console.error('❌ No se pudieron obtener los IDs de los roles. Abortando seed.');
        db.close();
        return;
      }

      // 2. Hashear contraseñas y preparar usuarios
      const users = [
        {
          role_id: adminRoleId,
          full_name: 'Administrador General',
          email: 'admin@redes.local',
          password: 'Admin123*',
          status: 'active'
        },
        {
          role_id: teacherRoleId,
          full_name: 'Docente Prueba',
          email: 'docente@redes.local',
          password: 'Docente123*',
          status: 'active'
        },
        {
          role_id: studentRoleId,
          full_name: 'Estudiante Prueba',
          email: 'estudiante@redes.local',
          password: 'Estudiante123*',
          status: 'active'
        }
      ];

      let teacherId, studentId;

      // Insertar usuarios con hash de contraseña
      let usersProcessed = 0;
      
      users.forEach((user) => {
        const hashedPassword = bcrypt.hashSync(user.password, SALT_ROUNDS);
        
        db.run(
          `INSERT OR IGNORE INTO users (role_id, full_name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)`,
          [user.role_id, user.full_name, user.email, hashedPassword, user.status],
          function(err) {
            if (err) {
              console.error(`❌ Error insertando usuario ${user.email}:`, err.message);
            } else if (this.changes > 0) {
              console.log(`✅ Usuario "${user.full_name}" (${user.email}) insertado correctamente`);
            } else {
              console.log(`⚠️ Usuario ${user.email} ya existe, omitiendo`);
            }
            
            usersProcessed++;
            
            // Cuando todos los usuarios han sido procesados, obtener sus IDs
            if (usersProcessed === users.length) {
              // Obtener teacher ID
              db.get(`SELECT id FROM users WHERE email = 'docente@redes.local'`, (err, row) => {
                if (err) {
                  console.error('❌ Error obteniendo teacher ID:', err.message);
                  db.close();
                  return;
                }
                if (row) {
                  teacherId = row.id;
                }
                
                // Obtener student ID
                db.get(`SELECT id FROM users WHERE email = 'estudiante@redes.local'`, (err, row) => {
                  if (err) {
                    console.error('❌ Error obteniendo student ID:', err.message);
                    db.close();
                    return;
                  }
                  if (row) {
                    studentId = row.id;
                  }
                  
                  if (!teacherId || !studentId) {
                    console.error('❌ No se pudieron obtener los IDs del docente o estudiante. Abortando.');
                    db.close();
                    return;
                  }
                  
                  // 3. Insertar clase
                  db.run(
                    `INSERT OR IGNORE INTO classes (name, description, teacher_id, school_year, status) VALUES (?, ?, ?, ?, ?)`,
                    ['Redes 10A', 'Clase de prueba para desarrollo', teacherId, '2026', 'active'],
                    function(err) {
                      if (err) {
                        console.error('❌ Error insertando clase:', err.message);
                        db.close();
                        return;
                      }
                      
                      if (this.changes > 0) {
                        console.log('✅ Clase "Redes 10A" insertada correctamente');
                      } else {
                        console.log('⚠️ Clase "Redes 10A" ya existe, omitiendo');
                      }
                      
                      // Obtener class ID
                      db.get(`SELECT id FROM classes WHERE name = 'Redes 10A' AND teacher_id = ?`, [teacherId], (err, row) => {
                        if (err) {
                          console.error('❌ Error obteniendo class ID:', err.message);
                          db.close();
                          return;
                        }
                        
                        const classId = row ? row.id : null;
                        
                        if (!classId) {
                          console.error('❌ No se pudo obtener el ID de la clase. Abortando.');
                          db.close();
                          return;
                        }
                        
                        // 4. Insertar matrícula
                        db.run(
                          `INSERT OR IGNORE INTO class_enrollments (class_id, student_id, status) VALUES (?, ?, ?)`,
                          [classId, studentId, 'active'],
                          function(err) {
                            if (err) {
                              console.error('❌ Error insertando matrícula:', err.message);
                              db.close();
                              return;
                            }
                            
                            if (this.changes > 0) {
                              console.log('✅ Matrícula creada correctamente');
                            } else {
                              console.log('⚠️ Matrícula ya existe, omitiendo');
                            }
                            
                            console.log('\n✨ Seed completado exitosamente! ✨\n');
                            db.close();
                          }
                        );
                      });
                    }
                  );
                });
              });
            }
          }
        );
      });
    }, 100); // Pequeño timeout para asegurar que los roles se insertaron
  });
};

seedDatabase();