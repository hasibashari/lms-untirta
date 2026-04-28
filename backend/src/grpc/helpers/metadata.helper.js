import grpc from '@grpc/grpc-js';

/**
 * Membuat gRPC Metadata dengan Bearer token dari Authorization header REST request.
 *
 * Digunakan oleh controller untuk meneruskan token user ke gRPC server
 * (Defense in Depth — token divalidasi di REST layer dan gRPC layer).
 *
 * @param {import('express').Request} req - Express request object (harus sudah melewati authenticateToken)
 * @returns {grpc.Metadata} Metadata gRPC dengan header authorization terisi
 *
 * @example
 * // Di controller:
 * const meta = createGrpcMetadata(req);
 * const result = await grpcGetAllUsers({}, meta);
 */
export const createGrpcMetadata = (req) => {
  const meta = new grpc.Metadata();
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    meta.add('authorization', authHeader); // Teruskan "Bearer <token>" apa adanya
  }
  return meta;
};
