import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const userClientMock = {
  CreateUserByAdmin: jest.fn(),
  GetAllUsers: jest.fn(),
  GetUserById: jest.fn(),
  UpdateUser: jest.fn(),
  DeleteUser: jest.fn(),
  UpdateDospemStatus: jest.fn(),
  AssignAdvisor: jest.fn(),
  BulkAssignAdvisor: jest.fn(),
  GetAdvisorSummary: jest.fn(),
  GetAdvisorStudents: jest.fn(),
  GetAdminStats: jest.fn(),
};

const sendSuccessMock = jest.fn();
const sendErrorMock = jest.fn();

jest.unstable_mockModule('../../src/grpc/clients/user.client.js', () => ({
  default: userClientMock,
}));
jest.unstable_mockModule('../../src/utils/response.js', () => ({
  sendSuccess: sendSuccessMock,
  sendError: sendErrorMock,
}));

const {
  createUser,
  getAllUsers,
  getUserById,
  updateDospemStatus,
  assignAdvisor,
  bulkAssignAdvisor,
  getAdvisorSummary,
  getAdvisorStudents,
  getAdminStats,
} = await import('../../src/modules/user/user.controller.js');

describe('user.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendSuccessMock.mockReturnValue(undefined);
    sendErrorMock.mockReturnValue(undefined);
  });

  it('createUser: should return 201 on success', async () => {
    const created = { id: 'u1', email: 'new@test.com' };
    userClientMock.CreateUserByAdmin.mockImplementation((payload, callback) => callback(null, created));

    await createUser({ body: { email: 'new@test.com' } }, {});

    expect(userClientMock.CreateUserByAdmin).toHaveBeenCalledWith({ email: 'new@test.com' }, expect.any(Function));
    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 201, data: created }));
  });

  it('createUser: should map gRPC error to HTTP', async () => {
    const err = { code: 6, details: 'Email sudah terdaftar' };
    userClientMock.CreateUserByAdmin.mockImplementation((payload, callback) => callback(err));

    await createUser({ body: {} }, {});

    expect(sendErrorMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 409, message: 'Email sudah terdaftar' }));
  });

  it('getAllUsers: should reject invalid role', async () => {
    const req = { query: { role: 'UNKNOWN' } };

    await getAllUsers(req, {});

    expect(sendErrorMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 400 }));
    expect(userClientMock.GetAllUsers).not.toHaveBeenCalled();
  });

  it('getAllUsers: should map role and isDospem=true', async () => {
    const req = { query: { role: 'DOSEN', isDospem: 'true', skip: '0', take: '10' } };
    userClientMock.GetAllUsers.mockImplementation((payload, callback) => callback(null, { data: [{ id: 'u1' }], pagination: { total: 1 } }));

    await getAllUsers(req, {});

    expect(userClientMock.GetAllUsers).toHaveBeenCalledWith(
      { role: 'DOSEN', isDospem: true, skip: 0, take: 10 },
      expect.any(Function)
    );
    expect(sendSuccessMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        statusCode: 200,
        message: 'Daftar dosen berhasil diambil',
        pagination: { total: 1 },
      })
    );
  });

  it('getAllUsers: should map isDospem=false and default message', async () => {
    const req = { query: { isDospem: 'false' } };
    userClientMock.GetAllUsers.mockImplementation((payload, callback) => callback(null, { data: [], pagination: undefined }));

    await getAllUsers(req, {});

    expect(userClientMock.GetAllUsers).toHaveBeenCalledWith(
      { role: undefined, isDospem: false, skip: undefined, take: undefined },
      expect.any(Function)
    );
    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ message: 'Daftar seluruh user berhasil diambil' }));
  });

  it('getUserById: should return 404 when not found', async () => {
    userClientMock.GetUserById.mockImplementation((payload, callback) => callback({ code: 5, details: 'User tidak ditemukan' }));

    await getUserById({ params: { id: 'missing' } }, {});

    expect(sendErrorMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 404 }));
  });

  it('getUserById: should return detail when found', async () => {
    const user = { id: 'u1' };
    userClientMock.GetUserById.mockImplementation((payload, callback) => callback(null, user));

    await getUserById({ params: { id: 'u1' } }, {});

    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 200, data: user }));
  });

  it('updateDospemStatus: should send assign message when true', async () => {
    const result = { id: 'd1', isDospem: true };
    userClientMock.UpdateDospemStatus.mockImplementation((payload, callback) => callback(null, result));

    await updateDospemStatus({ params: { id: 'd1' }, body: { isDospem: true } }, {});

    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ message: 'Berhasil menetapkan sebagai Dosen Pembimbing' }));
  });

  it('updateDospemStatus: should send revoke message when false', async () => {
    const result = { id: 'd1', isDospem: false };
    userClientMock.UpdateDospemStatus.mockImplementation((payload, callback) => callback(null, result));

    await updateDospemStatus({ params: { id: 'd1' }, body: { isDospem: false } }, {});

    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ message: 'Status Dosen Pembimbing dicabut' }));
  });

  it('assignAdvisor: should send assign and unassign messages', async () => {
    userClientMock.AssignAdvisor.mockImplementationOnce((payload, callback) => callback(null, { id: 'm1', advisorId: 'd1' }));
    await assignAdvisor({ params: { id: 'm1' }, body: { advisorId: 'd1' } }, {});
    expect(sendSuccessMock).toHaveBeenLastCalledWith({}, expect.objectContaining({ message: 'Dosen Pembimbing berhasil di-assign' }));

    userClientMock.AssignAdvisor.mockImplementationOnce((payload, callback) => callback(null, { id: 'm1', advisorId: null }));
    await assignAdvisor({ params: { id: 'm1' }, body: { advisorId: null } }, {});
    expect(sendSuccessMock).toHaveBeenLastCalledWith({}, expect.objectContaining({ message: 'Dosen Pembimbing berhasil di-unassign' }));
  });

  it('bulkAssignAdvisor: should forward service message', async () => {
    const result = { message: 'Bulk selesai', updated: 2 };
    userClientMock.BulkAssignAdvisor.mockImplementation((payload, callback) => callback(null, result));

    await bulkAssignAdvisor({ body: { studentIds: ['a'], advisorId: 'd1' } }, {});

    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ message: 'Bulk selesai', data: result }));
  });

  it('getAdvisorSummary/getAdvisorStudents/getAdminStats: should return 200', async () => {
    userClientMock.GetAdvisorSummary.mockImplementation((payload, callback) => callback(null, { data: [{ id: 'd1' }] }));
    userClientMock.GetAdvisorStudents.mockImplementation((payload, callback) => callback(null, [{ id: 'm1' }]));
    userClientMock.GetAdminStats.mockImplementation((payload, callback) => callback(null, { totalUsers: 10 }));

    await getAdvisorSummary({}, {});
    await getAdvisorStudents({ params: { dosenId: 'd1' } }, {});
    await getAdminStats({}, {});

    expect(sendSuccessMock).toHaveBeenNthCalledWith(1, {}, expect.objectContaining({ statusCode: 200 }));
    expect(sendSuccessMock).toHaveBeenNthCalledWith(2, {}, expect.objectContaining({ statusCode: 200 }));
    expect(sendSuccessMock).toHaveBeenNthCalledWith(3, {}, expect.objectContaining({ statusCode: 200 }));
  });

  it('should map errors for remaining handlers', async () => {
    const err = { code: 3, details: 'fail' };
    userClientMock.GetAllUsers.mockImplementation((payload, callback) => callback(err));
    await getAllUsers({ query: {} }, {});

    userClientMock.GetUserById.mockImplementation((payload, callback) => callback(err));
    await getUserById({ params: { id: 'u1' } }, {});

    userClientMock.UpdateDospemStatus.mockImplementation((payload, callback) => callback(err));
    await updateDospemStatus({ params: { id: 'd1' }, body: { isDospem: true } }, {});

    userClientMock.AssignAdvisor.mockImplementation((payload, callback) => callback(err));
    await assignAdvisor({ params: { id: 'm1' }, body: { advisorId: 'd1' } }, {});

    userClientMock.BulkAssignAdvisor.mockImplementation((payload, callback) => callback(err));
    await bulkAssignAdvisor({ body: { studentIds: ['m1'], advisorId: 'd1' } }, {});

    userClientMock.GetAdvisorSummary.mockImplementation((payload, callback) => callback(err));
    await getAdvisorSummary({}, {});

    userClientMock.GetAdvisorStudents.mockImplementation((payload, callback) => callback(err));
    await getAdvisorStudents({ params: { dosenId: 'd1' } }, {});

    userClientMock.GetAdminStats.mockImplementation((payload, callback) => callback(err));
    await getAdminStats({}, {});

    expect(sendErrorMock).toHaveBeenCalledTimes(8);
  });
});
