'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cursos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      instructorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      titulo: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      categoria: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      nivel: {
        type: Sequelize.ENUM('principiante', 'intermedio', 'avanzado'),
        allowNull: false,
        defaultValue: 'principiante',
      },
      estado: {
        type: Sequelize.ENUM('borrador', 'publicado', 'archivado'),
        allowNull: false,
        defaultValue: 'borrador',
      },
      imagenUrl: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex('cursos', ['categoria']);
    await queryInterface.addIndex('cursos', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cursos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_cursos_nivel";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_cursos_estado";');
  },
};
