import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../proto/class.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const classProto = grpc.loadPackageDefinition(packageDefinition).classPackage;

// Menggunakan variable environment atau default localhost
const grpcOptions = {
  'grpc.max_receive_message_length': 1024 * 1024 * 100, // 100 MB
  'grpc.max_send_message_length': 1024 * 1024 * 100, // 100 MB
};

const classClient = new classProto.ClassService(
  process.env.CLASS_GRPC_URL || 'localhost:50051',
  grpc.credentials.createInsecure(),
  grpcOptions
);

export default classClient;
