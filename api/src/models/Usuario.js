import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';

export class Usuario extends Model {
  /**
   * Compara una contraseña en texto plano contra el hash del usuario.
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  async validarPassword(password) {
    if (!this.passwordHash) {
      return false;
    }
    return bcrypt.compare(password, this.passwordHash);
  }
}

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
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
    scopes: {
      conPassword: {
        attributes: { include: ['passwordHash'] },
      },
    },
  },
);
