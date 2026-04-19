import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../../../proto/course.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// The client points to the internal gRPC port.
// In production, this might point to a completely different docker container IP/hostname.
const GRPC_URL = process.env.COURSE_GRPC_URL || '127.0.0.1:50051';

const courseClient = new protoDescriptor.course.CourseService(
  GRPC_URL,
  grpc.credentials.createInsecure()
);

export default courseClient;
