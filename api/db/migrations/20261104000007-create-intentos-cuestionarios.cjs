'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('intentos_cuestionarios', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      leccionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lecciones',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      puntaje: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      aprobado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      respuestas: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      numeroIntento: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('intentos_cuestionarios', ['usuarioId', 'leccionId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('intentos_cuestionarios');
  },
};
