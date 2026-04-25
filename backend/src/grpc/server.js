import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

import { userService } from '../modules/user/user.grpc-service.js';
import { courseService } from '../modules/course/course.grpc-service.js';
import { academicService } from '../modules/academic/academic.grpc-service.js';
import classServiceImpl from '../modules/class/class.grpc-service.js';
import submissionServiceImpl from '../modules/submission/submission.grpc-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../../proto/user.proto');
const COURSE_PROTO_PATH = path.resolve(__dirname, '../../proto/course.proto');
const ACADEMIC_PROTO_PATH = path.resolve(__dirname, '../../proto/academic.proto');
const CLASS_PROTO_PATH = path.resolve(__dirname, '../../proto/class.proto');
const SUBMISSION_PROTO_PATH = path.resolve(__dirname, '../../proto/submission.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const coursePackageDefinition = protoLoader.loadSync(COURSE_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const academicPackageDefinition = protoLoader.loadSync(ACADEMIC_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const courseProtoDescriptor = grpc.loadPackageDefinition(coursePackageDefinition);
const academicProtoDescriptor = grpc.loadPackageDefinition(academicPackageDefinition);

const classPackageDefinition = protoLoader.loadSync(CLASS_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const classProtoDescriptor = grpc.loadPackageDefinition(classPackageDefinition);

const submissionPackageDefinition = protoLoader.loadSync(SUBMISSION_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const submissionProtoDescriptor = grpc.loadPackageDefinition(submissionPackageDefinition);

export const startGrpcServer = () => {
  const server = new grpc.Server();

  server.addService(protoDescriptor.user.UserService.service, userService);
  server.addService(courseProtoDescriptor.course.CourseService.service, courseService);
  server.addService(academicProtoDescriptor.academic.AcademicService.service, academicService);
  server.addService(classProtoDescriptor.classPackage.ClassService.service, classServiceImpl);
  server.addService(submissionProtoDescriptor.submissionPackage.SubmissionService.service, submissionServiceImpl);

  // In a real microservice environment, the port might come from an env var
  const PORT = process.env.GRPC_PORT || 50051;
  const BIND_ADDRESS = `0.0.0.0:${PORT}`;

  server.bindAsync(BIND_ADDRESS, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      logger.error('Failed to bind gRPC server:', error);
      return;
    }
    logger.info(`gRPC Internal Server running at http://${BIND_ADDRESS}`);
  });

  return server;
};
