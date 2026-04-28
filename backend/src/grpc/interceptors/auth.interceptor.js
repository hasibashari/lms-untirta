import grpc from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import logger from '../../config/logger.js';

// Daftar method gRPC yang TIDAK memerlukan autentikasi.
const PUBLIC_METHODS = [];

/**
 * Server-side interceptor untuk validasi JWT pada setiap gRPC call.
 *
 * Berdasarkan source grpc-js v1.14.x (server-interceptors.js):
 * - responder.start(next) → dipanggil dengan 1 parameter (next callback)
 * - Metadata incoming dibaca di listener.onReceiveMetadata(metadata, next)
 * - Untuk reject → panggil call.sendStatus() dan jangan panggil next()
 *
 * @param {object} methodDefinition - Definisi method (path, dll)
 * @param {grpc.ServerInterceptingCallInterface} call - Object call dari grpc-js
 * @returns {grpc.ServerInterceptingCall}
 */
export const grpcAuthInterceptor = (methodDefinition, call) => {
  const methodPath = methodDefinition.path || '';
  const methodName = methodPath.split('/').pop() || '';

  return new grpc.ServerInterceptingCall(call, {
    // start(next) dipanggil saat call dimulai
    // next harus dipanggil agar listener bisa terdaftar
    start(next) {
      // Teruskan dengan listener yang membaca metadata
      next({
        // onReceiveMetadata dipanggil saat metadata diterima dari client
        onReceiveMetadata(metadata, mdNext) {
          // Skip auth untuk public methods
          if (PUBLIC_METHODS.includes(methodName)) {
            return mdNext(metadata);
          }

          // Baca authorization dari metadata
          const authValues = metadata.get('authorization');

          if (!authValues || authValues.length === 0) {
            return call.sendStatus({
              code: grpc.status.UNAUTHENTICATED,
              details: 'Token tidak ditemukan. Sertakan header authorization: Bearer <token>',
              metadata: new grpc.Metadata(),
            });
          }

          const authHeader = authValues[0];
          const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            logger.info({ method: methodName, userId: decoded.userId }, 'gRPC auth passed');
            // Lanjutkan ke handler
            mdNext(metadata);
          } catch (err) {
            logger.error({
              method: methodName,
              errName: err.name,
              errMsg: err.message,
            }, 'gRPC auth FAILED');
            const isExpired = err.name === 'TokenExpiredError';
            return call.sendStatus({
              code: grpc.status.UNAUTHENTICATED,
              details: isExpired ? 'Token telah kadaluwarsa' : 'Token tidak valid',
              metadata: new grpc.Metadata(),
            });
          }
        },
      });
    },
  });
};
