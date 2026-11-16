import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/utils/cn';
import { pluralize } from '@/utils/format';

/**
 * @typedef {import('@/services/instructorService').LeccionMetricaItem} LeccionMetricaItem
 * @typedef {import('@/services/instructorService').MayorCaida} MayorCaida
 */

/**
 * Embudo del curso: estudiantes que llegaron a cada lección (barra), cuántos la completaron y cuántos están detenidos
 * en ella. Resalta la lección de mayor caída. Los números van como texto junto a cada barra (alternativa accesible).
 * @param {{
 *   lecciones: LeccionMetricaItem[],
 *   totalInscritos: number,
 *   mayorCaida: MayorCaida | null,
 * }} props
 */
export function LessonFunnel({ lecciones, totalInscritos, mayorCaida }) {
  return (
    <div className="flex flex-col gap-3">
      {mayorCaida && (
        <Alert variant="warning">
          <strong>Mayor caída:</strong>{' '}
          {pluralize(mayorCaida.estudiantes, 'estudiante se detiene', 'estudiantes se detienen')} en la lección{' '}
          {mayorCaida.orden}, «{mayorCaida.titulo}».
        </Alert>
      )}

      <ol className="flex flex-col gap-3">
        {lecciones.map((leccion) => (
          <li key={leccion.id}>
            <LessonFunnelItem
              leccion={leccion}
              totalInscritos={totalInscritos}
              destacada={leccion.id === mayorCaida?.leccionId}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * @param {{ leccion: LeccionMetricaItem, totalInscritos: number, destacada: boolean }} props
 */
function LessonFunnelItem({ leccion, totalInscritos, destacada }) {
  const esCuestionario = leccion.tipo === 'cuestionario';
  const tasaLlegada = totalInscritos > 0 ? Math.round((leccion.llegaron / totalInscritos) * 100) : 0;

  return (
    <Card padding="sm" className={cn('flex flex-col gap-4', destacada && 'ring-2 ring-warning/60')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-fg-muted">
            {leccion.orden}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold break-words text-fg">{leccion.titulo}</h3>
              <Badge variant={esCuestionario ? 'primary' : 'neutral'}>
                {esCuestionario ? 'Cuestionario' : 'Contenido'}
              </Badge>
              {destacada && <Badge variant="warning">Mayor caída</Badge>}
            </div>
            <p className="mt-1 text-xs text-fg-muted">
              {leccion.completados} {leccion.completados === 1 ? 'la completó' : 'la completaron'} ·{' '}
              {pluralize(leccion.detenidos, 'detenido', 'detenidos')} aquí
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-56 sm:shrink-0">
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>Llegaron</span>
            <span className="font-semibold text-fg">
              {leccion.llegaron} de {totalInscritos} ({tasaLlegada}%)
            </span>
          </div>
          <ProgressBar value={tasaLlegada} label={`Estudiantes que llegaron a ${leccion.titulo}`} />
        </div>
      </div>

      {esCuestionario && leccion.quizStats && (
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface-muted/40 p-3 sm:grid-cols-4">
          <QuizStat label="Nota mínima" value={`${leccion.notaMinima ?? '—'} / 100`} />
          <QuizStat label="Intentos totales" value={leccion.quizStats.totalIntentos} />
          <QuizStat label="Promedio de notas" value={`${leccion.quizStats.promedioPuntaje} / 100`} />
          <QuizStat
            label="Aprobados"
            value={`${leccion.quizStats.aprobados} de ${leccion.quizStats.totalEstudiantes} (${leccion.quizStats.tasaAprobacion}%)`}
          />
        </dl>
      )}
    </Card>
  );
}

/** @param {{ label: string, value: import('react').ReactNode }} props */
function QuizStat({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="text-sm font-semibold text-fg">{value}</dd>
    </div>
  );
}
