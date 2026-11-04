import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class IntentoCuestionario extends Model {}

IntentoCuestionario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id',
      },
    },
    leccionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lecciones',
        key: 'id',
      },
    },
    puntaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    aprobado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    respuestas: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    numeroIntento: {
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
    modelName: 'IntentoCuestionario',
    tableName: 'intentos_cuestionarios',
  },
);
