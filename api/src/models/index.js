import { sequelize } from '../config/database.js';
import { Usuario } from './Usuario.js';
import { Curso } from './Curso.js';
import { Leccion } from './Leccion.js';
import { Pregunta, toPublicPregunta } from './Pregunta.js';
import { Inscripcion } from './Inscripcion.js';
import { ProgresoLeccion } from './ProgresoLeccion.js';
import { IntentoCuestionario } from './IntentoCuestionario.js';

// --- Asociaciones ---

// Usuario (Instructor) <-> Curso
Usuario.hasMany(Curso, {
  foreignKey: 'instructorId',
  as: 'cursos',
  onDelete: 'RESTRICT',
});
Curso.belongsTo(Usuario, {
  foreignKey: 'instructorId',
  as: 'instructor',
});

// Curso <-> Leccion
Curso.hasMany(Leccion, {
  foreignKey: 'cursoId',
  as: 'lecciones',
  onDelete: 'CASCADE',
});
Leccion.belongsTo(Curso, {
  foreignKey: 'cursoId',
  as: 'curso',
});

// Leccion <-> Pregunta
Leccion.hasMany(Pregunta, {
  foreignKey: 'leccionId',
  as: 'preguntas',
  onDelete: 'CASCADE',
});
Pregunta.belongsTo(Leccion, {
  foreignKey: 'leccionId',
  as: 'leccion',
});

// Usuario (Estudiante) <-> Inscripcion <-> Curso
Usuario.hasMany(Inscripcion, {
  foreignKey: 'usuarioId',
  as: 'inscripciones',
  onDelete: 'CASCADE',
});
Inscripcion.belongsTo(Usuario, {
  foreignKey: 'usuarioId',
  as: 'estudiante',
});

Curso.hasMany(Inscripcion, {
  foreignKey: 'cursoId',
  as: 'inscripciones',
  onDelete: 'CASCADE',
});
Inscripcion.belongsTo(Curso, {
  foreignKey: 'cursoId',
  as: 'curso',
});

// Usuario <-> ProgresoLeccion <-> Leccion
Usuario.hasMany(ProgresoLeccion, {
  foreignKey: 'usuarioId',
  as: 'progresos',
  onDelete: 'CASCADE',
});
ProgresoLeccion.belongsTo(Usuario, {
  foreignKey: 'usuarioId',
  as: 'estudiante',
});

Leccion.hasMany(ProgresoLeccion, {
  foreignKey: 'leccionId',
  as: 'progresos',
  onDelete: 'CASCADE',
});
ProgresoLeccion.belongsTo(Leccion, {
  foreignKey: 'leccionId',
  as: 'leccion',
});

// Usuario <-> IntentoCuestionario <-> Leccion
Usuario.hasMany(IntentoCuestionario, {
  foreignKey: 'usuarioId',
  as: 'intentos',
  onDelete: 'CASCADE',
});
IntentoCuestionario.belongsTo(Usuario, {
  foreignKey: 'usuarioId',
  as: 'estudiante',
});

Leccion.hasMany(IntentoCuestionario, {
  foreignKey: 'leccionId',
  as: 'intentos',
  onDelete: 'CASCADE',
});
IntentoCuestionario.belongsTo(Leccion, {
  foreignKey: 'leccionId',
  as: 'leccion',
});

export {
  sequelize,
  Usuario,
  Curso,
  Leccion,
  Pregunta,
  Inscripcion,
  ProgresoLeccion,
  IntentoCuestionario,
  toPublicPregunta,
};
