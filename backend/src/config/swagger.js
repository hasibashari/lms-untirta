import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LMS Untirta API',
      version: '1.0.0',
      description: 'Learning Management System API — Universitas Sultan Ageng Tirtayasa',
      contact: {
        name: 'LMS Untirta Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: '{protocol}://{host}',
        description: 'Custom server',
        variables: {
          protocol: { default: 'https', enum: ['http', 'https'] },
          host: { default: 'localhost:3000' },
        },
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & profile' },
      { name: 'Users', description: 'User management (Admin)' },
      { name: 'Courses', description: 'Course catalogue & enrollment' },
      { name: 'Classes', description: 'Class offerings per semester' },
      { name: 'KRS', description: 'Kartu Rencana Studi' },
      { name: 'Grades', description: 'Final grade management' },
      { name: 'Transcript', description: 'Academic transcript & study results' },
      { name: 'Academic Semesters', description: 'Semester lifecycle management' },
      { name: 'Materials', description: 'Course materials' },
      { name: 'Assignments', description: 'Assignments & submissions' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from POST /api/auth/login',
        },
      },
      schemas: {
        // ─── Reusable Response Wrappers ───
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation error' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        // ─── Domain Models ───
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            nim: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['ADMIN', 'DOSEN', 'MAHASISWA'] },
            isDospem: { type: 'boolean' },
            advisorId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            code: { type: 'string', example: 'IF-101' },
            semester: { type: 'integer', nullable: true, minimum: 1, maximum: 8 },
            sks: { type: 'integer', example: 3 },
            teacherId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            courseId: { type: 'string', format: 'uuid' },
            lecturerId: { type: 'string', format: 'uuid' },
            academicSemesterId: { type: 'string', format: 'uuid' },
            section: { type: 'string', example: 'A' },
            schedule: { type: 'string', nullable: true },
            room: { type: 'string', nullable: true },
            capacity: { type: 'integer', example: 40 },
            isEnrollmentOpen: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        KrsEnrollment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            note: { type: 'string', nullable: true },
            revisionCount: { type: 'integer' },
            submittedAt: { type: 'string', format: 'date-time', nullable: true },
            approvedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AcademicSemester: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            academicYear: { type: 'string', example: '2025/2026' },
            semesterType: { type: 'string', enum: ['GANJIL', 'GENAP'] },
            status: { type: 'string', enum: ['DRAFT', 'OPEN', 'CLOSED'] },
            maxSks: { type: 'integer', example: 24 },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        FinalGrade: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
            academicSemesterId: { type: 'string', format: 'uuid' },
            lecturerId: { type: 'string', format: 'uuid' },
            letterGrade: { type: 'string', enum: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E'] },
            gradePoint: { type: 'number', example: 4.0 },
            numericScore: { type: 'number', nullable: true },
            status: { type: 'string', enum: ['DRAFT', 'FINALIZED'] },
            note: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Material: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string', nullable: true },
            fileUrl: { type: 'string', nullable: true },
            videoUrl: { type: 'string', nullable: true },
            order: { type: 'integer' },
            isPublished: { type: 'boolean' },
            courseId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Assignment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            dueDate: { type: 'string', format: 'date-time' },
            courseId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Submission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fileUrl: { type: 'string', nullable: true },
            note: { type: 'string', nullable: true },
            grade: { type: 'number', nullable: true },
            feedback: { type: 'string', nullable: true },
            submittedAt: { type: 'string', format: 'date-time' },
            assignmentId: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
          },
        },
      },
      // ─── Reusable Parameters ───
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number',
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Items per page',
        },
        UuidIdParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Resource UUID',
        },
      },
      // ─── Reusable Responses ───
      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Token tidak valid atau sudah expired' },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient role permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Akses ditolak' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Data tidak ditemukan' },
            },
          },
        },
        ValidationFailed: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js'],
}

export const swaggerSpec = swaggerJsdoc(options)