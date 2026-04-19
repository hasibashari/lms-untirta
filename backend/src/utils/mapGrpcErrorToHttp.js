import grpc from '@grpc/grpc-js';

/**
 * Maps a gRPC status code to the corresponding HTTP status code.
 * @param {number} code - gRPC status code.
 * @returns {number} HTTP status code.
 */
export const mapGrpcErrorToHttp = (code) => {
  switch (code) {
    case grpc.status.OK:
      return 200;
    case grpc.status.INVALID_ARGUMENT:
    case grpc.status.FAILED_PRECONDITION:
    case grpc.status.OUT_OF_RANGE:
      return 400;
    case grpc.status.UNAUTHENTICATED:
      return 401;
    case grpc.status.PERMISSION_DENIED:
      return 403;
    case grpc.status.NOT_FOUND:
      return 404;
    case grpc.status.ALREADY_EXISTS:
      return 409;
    case grpc.status.RESOURCE_EXHAUSTED:
      return 429;
    case grpc.status.UNIMPLEMENTED:
      return 501;
    case grpc.status.UNAVAILABLE:
      return 503;
    case grpc.status.DEADLINE_EXCEEDED:
      return 504;
    default:
      return 500;
  }
};
