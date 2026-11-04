import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Leccion extends Model {}

Leccion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    cursoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cursos',
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
    contenido: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM('contenido', 'cuestionario'),
      allowNull: false,
      defaultValue: 'contenido',
      validate: {
        isIn: [['contenido', 'cuestionario']],
      },
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    modelName: 'Leccion',
    tableName: 'lecciones',
    scopes: {
      porOrden: {
        order: [['orden', 'ASC']],
      },
    },
  },
);
