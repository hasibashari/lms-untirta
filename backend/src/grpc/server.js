import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import { grpcAuthInterceptor } from './interceptors/auth.interceptor.js';

import * as userService from '../modules/user/user.grpc-service.js';
import * as courseService from '../modules/course/course.grpc-service.js';
import * as academicService from '../modules/academic/academic.grpc-service.js';
import * as classServiceImpl from '../modules/class/class.grpc-service.js';
import * as submissionServiceImpl from '../modules/submission/submission.grpc-service.js';

// File ini bertanggung jawab untuk memuat file .proto, mendaftarkan implementasi
// service gRPC, dan melakukan binding pada port internal. Digunakan untuk
// komunikasi antar-proses/layanan di dalam infrastruktur aplikasi.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path ke file proto — tiap file mendefinisikan kontrak service yang bersesuaian
const PROTO_PATH = path.resolve(__dirname, '../../proto/user.proto');
const COURSE_PROTO_PATH = path.resolve(__dirname, '../../proto/course.proto');
const ACADEMIC_PROTO_PATH = path.resolve(__dirname, '../../proto/academic.proto');
const CLASS_PROTO_PATH = path.resolve(__dirname, '../../proto/class.proto');
const SUBMISSION_PROTO_PATH = path.resolve(__dirname, '../../proto/submission.proto');

// Opsi pemuatan proto: konversi ke tipe JS yang ramah (mis. longs -> String)
const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

const packageDefinition = protoLoader.loadSync(PROTO_PATH, loaderOptions);
const coursePackageDefinition = protoLoader.loadSync(COURSE_PROTO_PATH, loaderOptions);
const academicPackageDefinition = protoLoader.loadSync(ACADEMIC_PROTO_PATH, loaderOptions);
const classPackageDefinition = protoLoader.loadSync(CLASS_PROTO_PATH, loaderOptions);
const submissionPackageDefinition = protoLoader.loadSync(SUBMISSION_PROTO_PATH, loaderOptions);

// Konversi package definition ke descriptor yang dipakai oleh grpc-js
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const courseProtoDescriptor = grpc.loadPackageDefinition(coursePackageDefinition);
const academicProtoDescriptor = grpc.loadPackageDefinition(academicPackageDefinition);
const classProtoDescriptor = grpc.loadPackageDefinition(classPackageDefinition);
const submissionProtoDescriptor = grpc.loadPackageDefinition(submissionPackageDefinition);

// Mulai server gRPC dan daftarkan service handlers yang diimplementasikan modul-modul
export const startGrpcServer = () => {
  // Daftarkan interceptor auth agar setiap gRPC call divalidasi JWT-nya.
  // Ini adalah Defense in Depth: auth dilakukan di REST layer (untuk client HTTP)
  // dan di gRPC layer (untuk akses langsung ke port 50051, misal via Postman/tools).
  const server = new grpc.Server({
    interceptors: [grpcAuthInterceptor],
  });

  // Registrasi service: nama service sesuai definisi di .proto
  server.addService(protoDescriptor.user.UserService.service, userService);
  server.addService(courseProtoDescriptor.course.CourseService.service, courseService);
  server.addService(academicProtoDescriptor.academic.AcademicService.service, academicService);
  server.addService(classProtoDescriptor.classPackage.ClassService.service, classServiceImpl);
  server.addService(submissionProtoDescriptor.submissionPackage.SubmissionService.service, submissionServiceImpl);

  // Port untuk binding gRPC internal. Untuk development gunakan default 50051.
  // Binding ke 0.0.0.0 agar kompatibel dengan Docker network dan semua environment.
  // Keamanan dijaga oleh: JWT auth interceptor + Docker network/firewall isolation.
  const PORT = process.env.GRPC_PORT || 50051;
  const BIND_ADDRESS = `0.0.0.0:${PORT}`;

  // bindAsync melakukan binding socket; menggunakan insecure credentials karena
  // auth sudah dilakukan di REST layer sebelum gRPC dipanggil (monolith pattern).
  // Jika migrasi ke microservices, pertimbangkan mTLS atau shared-secret.
  server.bindAsync(BIND_ADDRESS, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      logger.error('Failed to bind gRPC server:', error);
      return;
    }
    // Setelah bind, server biasanya perlu dipanggil `server.start()` untuk aktif.
    // Kode ini hanya melakukan logging; jika diperlukan, panggil `server.start()` di sini.
    logger.info(`gRPC Internal Server running at http://${BIND_ADDRESS}`);
  });

  return server;
};
