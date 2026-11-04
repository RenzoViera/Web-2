import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class ProgresoLeccion extends Model {}

ProgresoLeccion.init(
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
    completada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fechaCompletada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ProgresoLeccion',
    tableName: 'progresos_lecciones',
    indexes: [
      {
        unique: true,
        fields: ['usuarioId', 'leccionId'],
        name: 'progresos_usuario_leccion_unique',
      },
    ],
  },
);
