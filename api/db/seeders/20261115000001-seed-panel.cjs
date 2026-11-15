'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

    // 1. Usuarios adicionales (segundo instructor y tercer estudiante)
    await queryInterface.bulkInsert(
      'usuarios',
      [
        {
          nombre: 'Carlos Docente',
          email: 'instructor2@miniaula.com',
          passwordHash: defaultPasswordHash,
          rol: 'instructor',
          createdAt: now,
          updatedAt: now,
        },
        {
          nombre: 'Lucas Programador',
          email: 'estudiante3@miniaula.com',
          passwordHash: defaultPasswordHash,
          rol: 'estudiante',
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: ['id', 'email'] },
    );

    // Obtener IDs existentes
    const [usuariosRows] = await queryInterface.sequelize.query(
      `SELECT id, email, rol FROM usuarios WHERE email IN ('instructor@miniaula.com', 'estudiante1@miniaula.com', 'estudiante2@miniaula.com', 'estudiante3@miniaula.com')`,
    );
    const usuarioMap = new Map(usuariosRows.map((u) => [u.email, u.id]));

    const instructor1Id = usuarioMap.get('instructor@miniaula.com');
    const estudiante1Id = usuarioMap.get('estudiante1@miniaula.com');
    const estudiante2Id = usuarioMap.get('estudiante2@miniaula.com');
    const estudiante3Id = usuarioMap.get('estudiante3@miniaula.com');

    // Obtener el curso 1 publicado existente
    const [cursosRows] = await queryInterface.sequelize.query(
      `SELECT id, titulo FROM cursos WHERE "instructorId" = ${instructor1Id} AND estado = 'publicado' LIMIT 1`,
    );
    const curso1Id = cursosRows[0]?.id;

    if (!curso1Id) return;

    // Obtener lecciones del curso 1
    const [leccionesRows] = await queryInterface.sequelize.query(
      `SELECT id, orden, tipo FROM lecciones WHERE "cursoId" = ${curso1Id} ORDER BY orden ASC`,
    );
    const leccion1Id = leccionesRows[0]?.id;
    const leccion2Id = leccionesRows[1]?.id;
    const leccionQuizId = leccionesRows[2]?.id;

    // 2. Nuevo curso publicado para el instructor 1 con lecciones
    const nuevoCurso = await queryInterface.bulkInsert(
      'cursos',
      [
        {
          instructorId: instructor1Id,
          titulo: 'Backend Profesional con Node.js y Express',
          descripcion: 'Aprende a diseñar y construir APIs REST robustas y escalables con Node.js, Express y bases de datos relacionales.',
          categoria: 'Backend',
          nivel: 'intermedio',
          estado: 'publicado',
          imagenUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: ['id'] },
    );
    const curso3Id = nuevoCurso[0]?.id;

    if (curso3Id) {
      const leccionesC3 = await queryInterface.bulkInsert(
        'lecciones',
        [
          {
            cursoId: curso3Id,
            titulo: 'Arquitectura en capas y Express 5',
            contenido: 'Estructuración limpia de proyectos backend divididos en rutas, controladores, servicios y repositorios.',
            tipo: 'contenido',
            orden: 1,
            createdAt: now,
            updatedAt: now,
          },
          {
            cursoId: curso3Id,
            titulo: 'Manejo centralizado de errores y middlewares',
            contenido: 'Implementación de middlewares de autenticación JWT y manejador global de excepciones.',
            tipo: 'contenido',
            orden: 2,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { returning: ['id'] },
      );

      // Inscribir a estudiante 3 en el curso 3
      if (estudiante3Id) {
        await queryInterface.bulkInsert('inscripciones', [
          {
            usuarioId: estudiante3Id,
            cursoId: curso3Id,
            completado: false,
            createdAt: now,
            updatedAt: now,
          },
        ]);
        if (leccionesC3[0]?.id) {
          await queryInterface.bulkInsert('progresos_lecciones', [
            {
              usuarioId: estudiante3Id,
              leccionId: leccionesC3[0].id,
              completada: true,
              fechaCompletada: now,
              createdAt: now,
              updatedAt: now,
            },
          ]);
        }
      }
    }

    // 3. Inscribir a estudiante 2 en el curso 1
    if (estudiante2Id && curso1Id) {
      await queryInterface.bulkInsert('inscripciones', [
        {
          usuarioId: estudiante2Id,
          cursoId: curso1Id,
          completado: false,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    // 4. Completar lecciones y cuestionarios del curso 1 para datos del panel
    // Juan (estudiante 1): completa lección 2 y aprueba cuestionario 3 -> completa el curso!
    if (estudiante1Id && leccion2Id && leccionQuizId) {
      await queryInterface.bulkInsert('progresos_lecciones', [
        {
          usuarioId: estudiante1Id,
          leccionId: leccion2Id,
          completada: true,
          fechaCompletada: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          usuarioId: estudiante1Id,
          leccionId: leccionQuizId,
          completada: true,
          fechaCompletada: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await queryInterface.bulkInsert('intentos_cuestionarios', [
        {
          usuarioId: estudiante1Id,
          leccionId: leccionQuizId,
          puntaje: 100,
          aprobado: true,
          respuestas: JSON.stringify([
            { preguntaId: 1, indice: 0 },
            { preguntaId: 2, indice: 1 },
          ]),
          numeroIntento: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await queryInterface.sequelize.query(
        `UPDATE inscripciones SET completado = true WHERE "usuarioId" = ${estudiante1Id} AND "cursoId" = ${curso1Id}`,
      );
    }

    // Maria (estudiante 2): completa lección 1 y 2, y rinde intento fallido en lección 3
    if (estudiante2Id && leccion1Id && leccion2Id && leccionQuizId) {
      await queryInterface.bulkInsert('progresos_lecciones', [
        {
          usuarioId: estudiante2Id,
          leccionId: leccion1Id,
          completada: true,
          fechaCompletada: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          usuarioId: estudiante2Id,
          leccionId: leccion2Id,
          completada: true,
          fechaCompletada: now,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await queryInterface.bulkInsert('intentos_cuestionarios', [
        {
          usuarioId: estudiante2Id,
          leccionId: leccionQuizId,
          puntaje: 50,
          aprobado: false,
          respuestas: JSON.stringify([
            { preguntaId: 1, indice: 0 },
            { preguntaId: 2, indice: 0 },
          ]),
          numeroIntento: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM usuarios WHERE email IN ('instructor2@miniaula.com', 'estudiante3@miniaula.com')`,
    );
  },
};
