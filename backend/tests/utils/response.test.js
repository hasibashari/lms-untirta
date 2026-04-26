import { describe, expect, it, jest } from '@jest/globals';
import { sendError, sendSuccess } from '../../src/utils/response.js';

const makeRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

describe('response utils', () => {
  it('sendSuccess: should include base shape and data', () => {
    const { status, json } = makeRes();
    const res = { status };

    sendSuccess(res, { statusCode: 201, message: 'created', data: { id: 1 } });

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ success: true, message: 'created', data: { id: 1 } });
  });

  it('sendSuccess: should omit null data and include pagination/meta', () => {
    const { status, json } = makeRes();
    const res = { status };

    sendSuccess(res, {
      message: 'ok',
      data: null,
      pagination: { total: 1 },
      _meta: { traceId: 't1' },
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'ok',
      pagination: { total: 1 },
      _meta: { traceId: 't1' },
    });
  });

  it('sendError: should include optional fields when provided', () => {
    const { status, json } = makeRes();
    const res = { status };

    sendError(res, {
      statusCode: 422,
      message: 'validation failed',
      errors: [{ path: 'email', message: 'invalid' }],
      code: 'VALIDATION_ERROR',
      details: { source: 'zod' },
    });

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'validation failed',
      errors: [{ path: 'email', message: 'invalid' }],
      code: 'VALIDATION_ERROR',
      details: { source: 'zod' },
    });
  });

  it('sendError: should return minimal shape by default', () => {
    const { status, json } = makeRes();
    const res = { status };

    sendError(res, { message: 'boom' });

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ success: false, message: 'boom' });
  });
});
