import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../../../proto/academic.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const academicService = protoDescriptor.academic.AcademicService;

// Use environment variable or fallback to localhost
const target = process.env.ACADEMIC_GRPC_URL || '127.0.0.1:50051';

const academicClient = new academicService(target, grpc.credentials.createInsecure());

export default academicClient;
