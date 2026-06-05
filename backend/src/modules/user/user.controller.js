import userClient from '../../grpc/clients/user.client.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import grpc from '@grpc/grpc-js';
import util from 'util';
import { createGrpcMetadata } from '../../grpc/helpers/metadata.helper.js';
import cache from '../../utils/cache.js';

// Controller untuk user yang bertindak sebagai layer HTTP -> gRPC client.
// Tugas utama: memanggil client gRPC, memetakan error gRPC ke HTTP,
// dan mengembalikan response yang konsisten ke client REST.

// Promisify method gRPC agar bisa dipanggil dengan async/await
const grpcCreateUserByAdmin = util.promisify(userClient.CreateUserByAdmin).bind(userClient);
const grpcGetAllUsers = util.promisify(userClient.GetAllUsers).bind(userClient);
const grpcGetUserById = util.promisify(userClient.GetUserById).bind(userClient);
const grpcUpdateUser = util.promisify(userClient.UpdateUser).bind(userClient);
const grpcDeleteUser = util.promisify(userClient.DeleteUser).bind(userClient);
const grpcUpdateDospemStatus = util.promisify(userClient.UpdateDospemStatus).bind(userClient);
const grpcAssignAdvisor = util.promisify(userClient.AssignAdvisor).bind(userClient);
const grpcBulkAssignAdvisor = util.promisify(userClient.BulkAssignAdvisor).bind(userClient);
const grpcGetAdvisorSummary = util.promisify(userClient.GetAdvisorSummary).bind(userClient);
const grpcGetAdvisorStudents = util.promisify(userClient.GetAdvisorStudents).bind(userClient);
const grpcGetAdminStats = util.promisify(userClient.GetAdminStats).bind(userClient);

// Pemetaan error gRPC ke status HTTP agar client REST mendapatkan kode yang sesuai
const mapGrpcErrorToHttp = (res, error) => {
  let statusCode = 500;
  if (error.code === grpc.status.NOT_FOUND) statusCode = 404;
  else if (error.code === grpc.status.ALREADY_EXISTS) statusCode = 409;
  else if (error.code === grpc.status.INVALID_ARGUMENT) statusCode = 400;
  else if (error.code === grpc.status.UNAUTHENTICATED) statusCode = 401;
  else if (error.code === grpc.status.PERMISSION_DENIED) statusCode = 403;

  return sendError(res, {
    statusCode,
    message: error.details || error.message || 'Internal server error',
  });
};

export const createUser = async (req, res) => {
  try {
    const meta = createGrpcMetadata(req);
    const newUser = await grpcCreateUserByAdmin(req.body, meta);
    sendSuccess(res, { statusCode: 201, message: 'User berhasil dibuat', data: newUser });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, isDospem, page, limit } = req.query;

    // Validasi query param role jika ada
    if (role && !['DOSEN', 'MAHASISWA', 'ADMIN'].includes(role)) {
      return sendError(res, { statusCode: 400, message: 'Invalid role. Use DOSEN, MAHASISWA, or ADMIN' });
    }

    // Normalisasi payload untuk gRPC: hanya kirim field yang ada
    const requestPayload = {
      role: role || undefined,
      isDospem: isDospem === 'true' ? true : isDospem === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined
    };

    const meta = createGrpcMetadata(req);
    const response = await grpcGetAllUsers(requestPayload, meta);

    const roleMessages = {
      DOSEN: 'Daftar dosen berhasil diambil',
      MAHASISWA: 'Daftar mahasiswa berhasil diambil',
      ADMIN: 'Daftar admin berhasil diambil',
    };
    const message = role ? roleMessages[role] : 'Daftar seluruh user berhasil diambil';

    sendSuccess(res, { statusCode: 200, message, data: response.data, pagination: response.pagination });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return sendError(res, { statusCode: 400, message: 'Format ID tidak valid' });
    }
    const meta = createGrpcMetadata(req);
    const user = await grpcGetUserById({ id }, meta);
    sendSuccess(res, { statusCode: 200, message: 'Berhasil mengambil detail user', data: user });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = createGrpcMetadata(req);
    const updatedUser = await grpcUpdateUser({ id, ...req.body }, meta);
    await cache.invalidate(`user:profile:${id}`);
    sendSuccess(res, { statusCode: 200, message: 'Berhasil mengubah user', data: updatedUser });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = createGrpcMetadata(req);
    const deletedUser = await grpcDeleteUser({ id }, meta);
    sendSuccess(res, { statusCode: 200, message: 'Berhasil menghapus user', data: deletedUser });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const { name, email, password, nim } = req.body;
    const meta = createGrpcMetadata(req);
    const updatedUser = await grpcUpdateUser({ id, name, email, password, nim }, meta);
    await cache.invalidate(`user:profile:${id}`);
    sendSuccess(res, { statusCode: 200, message: 'Profil berhasil diperbarui', data: updatedUser });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const getProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const meta = createGrpcMetadata(req);
    const user = await grpcGetUserById({ id }, meta);
    sendSuccess(res, { statusCode: 200, message: 'Berhasil mengambil profil user', data: user });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

// ======================== DOSPEM MANAGEMENT ========================

export const updateDospemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDospem } = req.body;
    const meta = createGrpcMetadata(req);
    const result = await grpcUpdateDospemStatus({ id, isDospem }, meta);
    sendSuccess(res, {
      statusCode: 200,
      message: isDospem ? 'Berhasil menetapkan sebagai Dosen Pembimbing' : 'Status Dosen Pembimbing dicabut',
      data: result,
    });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const assignAdvisor = async (req, res) => {
  try {
    const { id } = req.params;
    const { advisorId } = req.body;
    const meta = createGrpcMetadata(req);
    const result = await grpcAssignAdvisor({ studentId: id, advisorId }, meta);
    sendSuccess(res, {
      statusCode: 200,
      message: advisorId ? 'Dosen Pembimbing berhasil di-assign' : 'Dosen Pembimbing berhasil di-unassign',
      data: result,
    });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const bulkAssignAdvisor = async (req, res) => {
  try {
    const { studentIds, advisorId } = req.body;
    const meta = createGrpcMetadata(req);
    const result = await grpcBulkAssignAdvisor({ studentIds, advisorId }, meta);
    sendSuccess(res, { statusCode: 200, message: result.message, data: result });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const getAdvisorSummary = async (req, res) => {
  try {
    const meta = createGrpcMetadata(req);
    const result = await grpcGetAdvisorSummary({}, meta);
    sendSuccess(res, { statusCode: 200, message: 'Daftar Dosen Pembimbing berhasil diambil', data: result.data });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const getAdvisorStudents = async (req, res) => {
  try {
    const { dosenId } = req.params;
    const meta = createGrpcMetadata(req);
    const result = await grpcGetAdvisorStudents({ advisorId: dosenId }, meta);
    sendSuccess(res, { statusCode: 200, message: 'Daftar mahasiswa bimbingan berhasil diambil', data: result });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const meta = createGrpcMetadata(req);
    const stats = await grpcGetAdminStats({}, meta);
    sendSuccess(res, { statusCode: 200, message: 'Statistik dashboard berhasil diambil', data: stats });
  } catch (error) {
    return mapGrpcErrorToHttp(res, error);
  }
};