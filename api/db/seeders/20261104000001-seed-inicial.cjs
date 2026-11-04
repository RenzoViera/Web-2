'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

    // 1. Usuarios
    const usuarios = await queryInterface.bulkInsert(
      'usuarios',
      [
        {
          nombre: 'Instructor Principal',
          email: 'instructor@miniaula.com',
          passwordHash: defaultPasswordHash,
          rol: 'instructor',
          createdAt: now,
          updatedAt: now,
        },
        {
          nombre: 'Juan Estudiante',
          email: 'estudiante1@miniaula.com',
          passwordHash: defaultPasswordHash,
          rol: 'estudiante',
          createdAt: now,
          updatedAt: now,
        },
        {
          nombre: 'Maria Aprendiz',
          email: 'estudiante2@miniaula.com',
          passwordHash: defaultPasswordHash,
          rol: 'estudiante',
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: ['id'] },
    );

    const instructorId = usuarios[0]?.id || 1;
    const estudiante1Id = usuarios[1]?.id || 2;

    // 2. Cursos
    const cursos = await queryInterface.bulkInsert(
      'cursos',
      [
        {
          instructorId,
          titulo: 'Introducción a JavaScript Moderno',
          descripcion: 'Aprende los fundamentos del lenguaje JavaScript moderno (ES6+) y sus mejores prácticas.',
          categoria: 'Programación',
          nivel: 'principiante',
          estado: 'publicado',
          imagenUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a',
          createdAt: now,
          updatedAt: now,
        },
        {
          instructorId,
          titulo: 'Desarrollo Frontend con React y Tailwind CSS',
          descripcion: 'Construye aplicaciones web modernas y reactivas paso a paso.',
          categoria: 'Desarrollo Web',
          nivel: 'intermedio',
          estado: 'borrador',
          imagenUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: ['id'] },
    );

    const cursoPublicadoId = cursos[0]?.id || 1;

    // 3. Lecciones para el curso publicado
    const lecciones = await queryInterface.bulkInsert(
      'lecciones',
      [
        {
          cursoId: cursoPublicadoId,
          titulo: 'Variables y tipos de datos en ES6+',
          contenido: 'En esta lección aprenderás las diferencias entre let, const y var, así como los tipos de datos primitivos en JavaScript.',
          tipo: 'contenido',
          orden: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          cursoId: cursoPublicadoId,
          titulo: 'Funciones de flecha y desestructuración',
          contenido: 'Explicación detallada de la sintaxis concisa de arrow functions y la desestructuración de objetos y arrays.',
          tipo: 'contenido',
          orden: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          cursoId: cursoPublicadoId,
          titulo: 'Evaluación del Módulo 1',
          contenido: 'Cuestionario de opción múltiple para validar los conocimientos adquiridos en el módulo.',
          tipo: 'cuestionario',
          orden: 3,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { returning: ['id'] },
    );

    const leccion1Id = lecciones[0]?.id || 1;
    const leccionCuestionarioId = lecciones[2]?.id || 3;

    // 4. Preguntas para el cuestionario
    await queryInterface.bulkInsert('preguntas', [
      {
        leccionId: leccionCuestionarioId,
        enunciado: '¿Cuál de las siguientes declaraciones previene la reasignación de una variable?',
        opciones: JSON.stringify(['const', 'let', 'var', 'function']),
        indiceCorrecto: 0,
        explicacion: 'const crea una variable cuyo identificador no puede ser reasignado.',
        createdAt: now,
        updatedAt: now,
      },
      {
        leccionId: leccionCuestionarioId,
        enunciado: '¿Qué valor devuelve la expresión typeof null en JavaScript?',
        opciones: JSON.stringify(['null', 'object', 'undefined', 'boolean']),
        indiceCorrecto: 1,
        explicacion: 'En JavaScript typeof null históricamente retorna "object".',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // 5. Inscripción inicial
    await queryInterface.bulkInsert('inscripciones', [
      {
        usuarioId: estudiante1Id,
        cursoId: cursoPublicadoId,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // 6. Progreso inicial
    await queryInterface.bulkInsert('progresos_lecciones', [
      {
        usuarioId: estudiante1Id,
        leccionId: leccion1Id,
        completada: true,
        fechaCompletada: now,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('progresos_lecciones', null, {});
    await queryInterface.bulkDelete('inscripciones', null, {});
    await queryInterface.bulkDelete('preguntas', null, {});
    await queryInterface.bulkDelete('lecciones', null, {});
    await queryInterface.bulkDelete('cursos', null, {});
    await queryInterface.bulkDelete('usuarios', null, {});
  },
};
