import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Sanitizador único de preguntas para estudiantes o público.
 * Elimina el campo sensible `indiceCorrecto`.
 * @param {object|Pregunta} pregunta
 * @returns {object|null}
 */
export function toPublicPregunta(pregunta) {
  if (!pregunta) return null;
  const raw = typeof pregunta.toJSON === 'function' ? pregunta.toJSON() : { ...pregunta };
  delete raw.indiceCorrecto;
  return raw;
}

export class Pregunta extends Model {
  toPublic() {
    return toPublicPregunta(this);
  }
}

Pregunta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    leccionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lecciones',
        key: 'id',
      },
    },
    enunciado: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    opciones: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidOptions(value) {
          if (!Array.isArray(value) || value.length < 2) {
            throw new Error('Las opciones deben ser un array con al menos 2 elementos');
          }
        },
      },
    },
    indiceCorrecto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    explicacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Pregunta',
    tableName: 'preguntas',
    scopes: {
      publico: {
        attributes: { exclude: ['indiceCorrecto'] },
      },
    },
  },
);
