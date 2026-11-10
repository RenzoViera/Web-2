'use strict';
/*
 * Paso 05: campos del editor de lecciones que faltaban respecto del plan.
 * - videoUrl: solo lecciones de contenido (la vista del estudiante, paso 07, lo embebe).
 * - notaMinima: solo cuestionarios (0-100); el paso 08 la usa para aprobar.
 * Los cuestionarios ya existentes quedan con 70, el default del plan.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'lecciones',
        'videoUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'lecciones',
        'notaMinima',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );
      await queryInterface.bulkUpdate('lecciones', { notaMinima: 70 }, { tipo: 'cuestionario' }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('lecciones', 'notaMinima', { transaction });
      await queryInterface.removeColumn('lecciones', 'videoUrl', { transaction });
    });
  },
};
