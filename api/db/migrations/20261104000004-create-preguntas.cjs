'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('preguntas', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      enunciado: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      opciones: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      indiceCorrecto: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      explicacion: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('preguntas', ['leccionId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('preguntas');
  },
};
