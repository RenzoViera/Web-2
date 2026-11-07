import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Usuario extends Model {}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('estudiante', 'instructor'),
      allowNull: false,
      defaultValue: 'estudiante',
      validate: {
        isIn: [['estudiante', 'instructor']],
      },
    },
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    // Red de seguridad: los repositorios piden columnas explícitas (con `attributes` explícito no aplica).
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
  },
);
