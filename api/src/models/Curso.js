import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Curso extends Model {}

Curso.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    instructorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id',
      },
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    nivel: {
      type: DataTypes.ENUM('principiante', 'intermedio', 'avanzado'),
      allowNull: false,
      defaultValue: 'principiante',
      validate: {
        isIn: [['principiante', 'intermedio', 'avanzado']],
      },
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'publicado', 'archivado'),
      allowNull: false,
      defaultValue: 'borrador',
      validate: {
        isIn: [['borrador', 'publicado', 'archivado']],
      },
    },
    imagenUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Curso',
    tableName: 'cursos',
    scopes: {
      publicados: {
        where: { estado: 'publicado' },
      },
    },
  },
);
