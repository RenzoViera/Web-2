import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Inscripcion extends Model {}

Inscripcion.init(
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
    cursoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cursos',
        key: 'id',
      },
    },
    completado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Inscripcion',
    tableName: 'inscripciones',
    indexes: [
      {
        unique: true,
        fields: ['usuarioId', 'cursoId'],
        name: 'inscripciones_usuario_curso_unique',
      },
      {
        fields: ['cursoId', 'completado'],
        name: 'inscripciones_curso_completado_idx',
      },
    ],
  },
);
