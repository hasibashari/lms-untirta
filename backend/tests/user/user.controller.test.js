import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceMock = {
  createUserByAdmin: jest.fn(),
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  updateDospemStatus: jest.fn(),
  assignAdvisor: jest.fn(),
  bulkAssignAdvisor: jest.fn(),
  getAdvisorSummary: jest.fn(),
  getAdvisorStudents: jest.fn(),
  getAdminStats: jest.fn(),
};

const sendSuccessMock = jest.fn();
const sendErrorMock = jest.fn();
const handleErrorMock = jest.fn();

jest.unstable_mockModule('../../src/modules/user/user.service.js', () => serviceMock);
jest.unstable_mockModule('../../src/utils/response.js', () => ({
  sendSuccess: sendSuccessMock,
  sendError: sendErrorMock,
}));
jest.unstable_mockModule('../../src/utils/errorHandler.js', () => ({
  handleError: handleErrorMock,
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
    handleErrorMock.mockReturnValue(undefined);
  });

  it('createUser: should return 201 on success', async () => {
    const created = { id: 'u1', email: 'new@test.com' };
    serviceMock.createUserByAdmin.mockResolvedValue(created);

    await createUser({ body: { email: 'new@test.com' } }, {});

    expect(serviceMock.createUserByAdmin).toHaveBeenCalledWith({ email: 'new@test.com' });
    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 201, data: created }));
  });

  it('createUser: should delegate error handling', async () => {
    const err = new Error('boom');
    serviceMock.createUserByAdmin.mockRejectedValue(err);

    await createUser({ body: {} }, {});

    expect(handleErrorMock).toHaveBeenCalledWith({}, err);
  });

  it('getAllUsers: should reject invalid role', async () => {
    const req = { query: { role: 'UNKNOWN' } };

    await getAllUsers(req, {});

    expect(sendErrorMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 400 }));
    expect(serviceMock.getAllUsers).not.toHaveBeenCalled();
  });

  it('getAllUsers: should map role and isDospem=true', async () => {
    const req = { query: { role: 'DOSEN', isDospem: 'true', page: '1' } };
    serviceMock.getAllUsers.mockResolvedValue({ data: [{ id: 'u1' }], pagination: { total: 1 } });

    await getAllUsers(req, {});

    expect(serviceMock.getAllUsers).toHaveBeenCalledWith('DOSEN', true, req.query);
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
    serviceMock.getAllUsers.mockResolvedValue({ data: [], pagination: undefined });

    await getAllUsers(req, {});

    expect(serviceMock.getAllUsers).toHaveBeenCalledWith(undefined, false, req.query);
    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ message: 'Daftar seluruh user berhasil diambil' }));
  });

  it('getUserById: should return 404 when not found', async () => {
    serviceMock.getUserById.mockResolvedValue(null);

    await getUserById({ params: { id: 'missing' } }, {});

    expect(sendErrorMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 404 }));
  });

  it('getUserById: should return detail when found', async () => {
    const user = { id: 'u1' };
    serviceMock.getUserById.mockResolvedValue(user);

    await getUserById({ params: { id: 'u1' } }, {});

    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ statusCode: 200, data: user }));
  });

  it('updateDospemStatus: should send assign message when true', async () => {
    const result = { id: 'd1', isDospem: true };
    serviceMock.updateDospemStatus.mockResolvedValue(result);

    await updateDospemStatus({ params: { id: 'd1' }, body: { isDospem: true } }, {});

    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ message: 'Berhasil menetapkan sebagai Dosen Pembimbing' }));
  });

  it('updateDospemStatus: should send revoke message when false', async () => {
    const result = { id: 'd1', isDospem: false };
    serviceMock.updateDospemStatus.mockResolvedValue(result);

    await updateDospemStatus({ params: { id: 'd1' }, body: { isDospem: false } }, {});

    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ message: 'Status Dosen Pembimbing dicabut' }));
  });

  it('assignAdvisor: should send assign and unassign messages', async () => {
    serviceMock.assignAdvisor.mockResolvedValue({ id: 'm1', advisorId: 'd1' });
    await assignAdvisor({ params: { id: 'm1' }, body: { advisorId: 'd1' } }, {});
    expect(sendSuccessMock).toHaveBeenLastCalledWith({}, expect.objectContaining({ message: 'Dosen Pembimbing berhasil di-assign' }));

    serviceMock.assignAdvisor.mockResolvedValue({ id: 'm1', advisorId: null });
    await assignAdvisor({ params: { id: 'm1' }, body: { advisorId: null } }, {});
    expect(sendSuccessMock).toHaveBeenLastCalledWith({}, expect.objectContaining({ message: 'Dosen Pembimbing berhasil di-unassign' }));
  });

  it('bulkAssignAdvisor: should forward service message', async () => {
    const result = { message: 'Bulk selesai', updated: 2 };
    serviceMock.bulkAssignAdvisor.mockResolvedValue(result);

    await bulkAssignAdvisor({ body: { studentIds: ['a'], advisorId: 'd1' } }, {});

    expect(sendSuccessMock).toHaveBeenCalledWith({}, expect.objectContaining({ message: 'Bulk selesai', data: result }));
  });

  it('getAdvisorSummary/getAdvisorStudents/getAdminStats: should return 200', async () => {
    serviceMock.getAdvisorSummary.mockResolvedValue([{ id: 'd1' }]);
    serviceMock.getAdvisorStudents.mockResolvedValue([{ id: 'm1' }]);
    serviceMock.getAdminStats.mockResolvedValue({ totalUsers: 10 });

    await getAdvisorSummary({}, {});
    await getAdvisorStudents({ params: { dosenId: 'd1' } }, {});
    await getAdminStats({}, {});

    expect(sendSuccessMock).toHaveBeenNthCalledWith(1, {}, expect.objectContaining({ statusCode: 200 }));
    expect(sendSuccessMock).toHaveBeenNthCalledWith(2, {}, expect.objectContaining({ statusCode: 200 }));
    expect(sendSuccessMock).toHaveBeenNthCalledWith(3, {}, expect.objectContaining({ statusCode: 200 }));
  });

  it('should delegate errors for remaining handlers', async () => {
    const err = new Error('fail');
    serviceMock.getAllUsers.mockRejectedValue(err);
    await getAllUsers({ query: {} }, {});

    serviceMock.getUserById.mockRejectedValue(err);
    await getUserById({ params: { id: 'u1' } }, {});

    serviceMock.updateDospemStatus.mockRejectedValue(err);
    await updateDospemStatus({ params: { id: 'd1' }, body: { isDospem: true } }, {});

    serviceMock.assignAdvisor.mockRejectedValue(err);
    await assignAdvisor({ params: { id: 'm1' }, body: { advisorId: 'd1' } }, {});

    serviceMock.bulkAssignAdvisor.mockRejectedValue(err);
    await bulkAssignAdvisor({ body: { studentIds: ['m1'], advisorId: 'd1' } }, {});

    serviceMock.getAdvisorSummary.mockRejectedValue(err);
    await getAdvisorSummary({}, {});

    serviceMock.getAdvisorStudents.mockRejectedValue(err);
    await getAdvisorStudents({ params: { dosenId: 'd1' } }, {});

    serviceMock.getAdminStats.mockRejectedValue(err);
    await getAdminStats({}, {});

    expect(handleErrorMock).toHaveBeenCalledTimes(8);
  });
});
