import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const sendErrorMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.unstable_mockModule('../../src/utils/response.js', () => ({
  sendError: sendErrorMock,
}));

jest.unstable_mockModule('../../src/config/logger.js', () => ({
  default: {
    error: loggerErrorMock,
  },
}));

const { handleError } = await import('../../src/utils/errorHandler.js');

describe('handleError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendErrorMock.mockReturnValue(undefined);
  });

  it('should forward known AppError-style error', () => {
    const error = {
      statusCode: 409,
      message: 'Duplicate email',
      code: 'USER_EXISTS',
      details: { email: 'a@test.com' },
    };

    handleError({}, error);

    expect(sendErrorMock).toHaveBeenCalledWith({}, {
      statusCode: 409,
      message: 'Duplicate email',
      code: 'USER_EXISTS',
      details: { email: 'a@test.com' },
    });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('should hide unknown errors behind 500 and log detail', () => {
    const error = new Error('DB connection lost');

    handleError({}, error);

    expect(loggerErrorMock).toHaveBeenCalledWith({ err: error }, 'Unhandled error in controller');
    expect(sendErrorMock).toHaveBeenCalledWith({}, {
      statusCode: 500,
      message: 'Terjadi kesalahan pada server',
    });
  });
});
