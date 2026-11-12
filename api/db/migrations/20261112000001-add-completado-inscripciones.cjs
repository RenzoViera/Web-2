'use strict';
/*
 * Paso 07: columna `completado` en `inscripciones` (REGLAS B.14, docs/api/modelo-datos.md).
 * Marca automáticamente como completadas las inscripciones existentes que ya tengan todas sus lecciones aprobadas/completadas.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'inscripciones',
        'completado',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );

      await queryInterface.addIndex('inscripciones', ['cursoId', 'completado'], {
        name: 'inscripciones_curso_completado_idx',
        transaction,
      });

      await queryInterface.sequelize.query(
        `UPDATE inscripciones i
            SET completado = true
          WHERE EXISTS (
                  SELECT 1 FROM lecciones l WHERE l."cursoId" = i."cursoId"
                )
            AND NOT EXISTS (
                  SELECT 1
                    FROM lecciones l
                    LEFT JOIN progresos_lecciones p
                      ON p."leccionId" = l.id AND p."usuarioId" = i."usuarioId" AND p.completada
                   WHERE l."cursoId" = i."cursoId"
                     AND p.id IS NULL
                )`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('inscripciones', 'inscripciones_curso_completado_idx', { transaction });
      await queryInterface.removeColumn('inscripciones', 'completado', { transaction });
    });
  },
};
