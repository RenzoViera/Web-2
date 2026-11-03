export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 9;
export const MAX_LIMIT = 50;

const toPositiveInt = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

/**
 * @param {{ page?: unknown, limit?: unknown }} [query]
 * @returns {{ page: number, limit: number, offset: number }}
 */
export const getPagination = (query = {}) => {
  const page = toPositiveInt(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
};

/**
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 */
export const buildMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

/**
 * Respuesta estándar de listados: { data, meta }.
 * @param {Array<unknown>} rows
 * @param {number} total
 * @param {{ page: number, limit: number }} pagination
 */
export const buildPaginatedResponse = (rows, total, { page, limit }) => ({
  data: rows,
  meta: buildMeta(total, page, limit),
});
