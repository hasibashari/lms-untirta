/**
 * Parse pagination query params and return Prisma-compatible skip/take + meta builder.
 *
 * @param {object} query - Express req.query
 * @param {object} [options]
 * @param {number} [options.defaultLimit=20] - Default page size
 * @param {number} [options.maxLimit=100] - Maximum allowed page size
 * @returns {{ skip: number, take: number, meta: (total: number) => object }}
 *
 * Usage in service:
 *   const { skip, take, meta } = paginate(query);
 *   const [items, total] = await Promise.all([
 *     prisma.model.findMany({ ...filters, skip, take }),
 *     prisma.model.count({ ...filters }),
 *   ]);
 *   return { data: items, pagination: meta(total) };
 */
export const paginate = (query, options = {}) => {
  const { defaultLimit = 20, maxLimit = 100 } = options;

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    meta: (total) => ({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }),
  };
};
