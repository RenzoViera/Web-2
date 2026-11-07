'use strict';

/*
 * Índices en FKs que ningún índice existente cubría (REGLAS B.21): en Postgres las FKs no se indexan
 * solas y un índice compuesto solo sirve para filtrar por su primera columna. Los usan los listados
 * por instructor, los conteos de inscritos por curso, el panel por lección y los ON DELETE CASCADE.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex('cursos', ['instructorId'], { name: 'cursos_instructor_id', transaction });
      await queryInterface.addIndex('inscripciones', ['cursoId'], { name: 'inscripciones_curso_id', transaction });
      await queryInterface.addIndex('progresos_lecciones', ['leccionId'], {
        name: 'progresos_lecciones_leccion_id',
        transaction,
      });
      await queryInterface.addIndex('intentos_cuestionarios', ['leccionId'], {
        name: 'intentos_cuestionarios_leccion_id',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('intentos_cuestionarios', 'intentos_cuestionarios_leccion_id', { transaction });
      await queryInterface.removeIndex('progresos_lecciones', 'progresos_lecciones_leccion_id', { transaction });
      await queryInterface.removeIndex('inscripciones', 'inscripciones_curso_id', { transaction });
      await queryInterface.removeIndex('cursos', 'cursos_instructor_id', { transaction });
    });
  },
};
