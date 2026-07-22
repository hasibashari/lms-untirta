import fs from 'fs';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, './proto/user.proto');

// Konfigurasi gRPC Client
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;
const grpcClient = new userProto.UserService(
  'localhost:50051', 
  grpc.credentials.createInsecure(), 
  {
    'grpc.use_local_subchannel_pool': 1,
    'grpc.keepalive_time_ms': 120000,
    'grpc.http2.min_time_between_pings_ms': 120000,
    'grpc.keepalive_timeout_ms': 20000,
  }
);

const NUM_REQUESTS = 10000;
const CONCURRENCY = 100;

const runRestBenchmark = async (headers) => {
  console.log(`\nMemulai benchmark REST API (/api/users/stats) dengan ${NUM_REQUESTS} requests...`);
  const startTime = Date.now();
  
  let completed = 0;
  
  return new Promise((resolve) => {
    const makeRequest = async () => {
      while (completed < NUM_REQUESTS) {
        completed++;
        await fetch('http://localhost:3000/api/users/stats', {
          method: 'GET',
          headers
        }).then(res => res.json()).catch(() => {}); // catch error misal server mati
      }
    };
    
    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(makeRequest());
    }
    
    Promise.all(workers).then(() => {
      const duration = Date.now() - startTime;
      console.log(`✅ REST Benchmark selesai dalam ${duration} ms (${(NUM_REQUESTS / (duration / 1000)).toFixed(2)} req/sec)`);
      resolve(duration);
    });
  });
};

const runGrpcBenchmark = async (grpcMetadata) => {
  console.log(`\nMemulai benchmark gRPC (UserService.GetAdminStats) dengan ${NUM_REQUESTS} requests...`);
  const startTime = Date.now();
  
  let completed = 0;
  
  return new Promise((resolve) => {
    const makeRequest = () => {
      return new Promise((res) => {
        grpcClient.GetAdminStats({}, grpcMetadata, (err, response) => {
          res();
        });
      });
    };

    const runWorker = async () => {
        while(completed < NUM_REQUESTS) {
            completed++;
            await makeRequest();
        }
    }
    
    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(runWorker());
    }
    
    Promise.all(workers).then(() => {
      const duration = Date.now() - startTime;
      console.log(`✅ gRPC Benchmark selesai dalam ${duration} ms (${(NUM_REQUESTS / (duration / 1000)).toFixed(2)} req/sec)`);
      resolve(duration);
    });
  });
};

const run = async () => {
  console.log('Pastikan server utama LMS sudah berjalan (npm run dev)!');
  
  console.log('Mencari Admin di database untuk generate token...');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('❌ ERROR: Tidak ada user Admin di database. Silakan jalankan seeder terlebih dahulu.');
    process.exit(1);
  }
  
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  const adminToken = jwt.sign(
    { userId: admin.id, role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const grpcMetadata = new grpc.Metadata();
  grpcMetadata.add('authorization', `Bearer ${adminToken}`);
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  console.log('Menyiapkan pemanasan (warming up) agar koneksi ke DB siap...');
  
  try {
     // Cek apakah server nyala
     const testRest = await fetch('http://localhost:3000/api/users/stats', { method: 'GET', headers });
     if (!testRest.ok) throw new Error(`REST Endpoint gagal diakses (Status: ${testRest.status})`);
  } catch (error) {
     console.error('❌ ERROR: Server REST tidak dapat dijangkau. Pastikan server nyala di port 3000! Error:', error.message);
     process.exit(1);
  }

  for(let i = 0; i < 50; i++) {
     await fetch('http://localhost:3000/api/users/stats', { method: 'GET', headers }).catch(()=>{});
     await new Promise(res => grpcClient.GetAdminStats({}, grpcMetadata, res));
  }

  console.log('--- Hasil Benchmark Endpoint Asli ---');
  const restDuration = await runRestBenchmark(headers);
  const grpcDuration = await runGrpcBenchmark(grpcMetadata);
  await prisma.$disconnect();

  // Hitung Metrik Hasil
  const restRps = (NUM_REQUESTS / (restDuration / 1000)).toFixed(2);
  const grpcRps = (NUM_REQUESTS / (grpcDuration / 1000)).toFixed(2);
  const restAvgLatency = (restDuration / NUM_REQUESTS).toFixed(4);
  const grpcAvgLatency = (grpcDuration / NUM_REQUESTS).toFixed(4);
  const speedup = (restDuration / grpcDuration).toFixed(2);
  const timestamp = new Date().toISOString();

  // Buat folder result jika belum ada
  const resultDir = path.resolve(__dirname, 'result');
  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }

  // 1. Format JSON
  const jsonResult = {
    timestamp,
    numRequests: NUM_REQUESTS,
    concurrency: CONCURRENCY,
    results: {
      rest: {
        durationMs: restDuration,
        requestsPerSec: parseFloat(restRps),
        avgLatencyMs: parseFloat(restAvgLatency)
      },
      grpc: {
        durationMs: grpcDuration,
        requestsPerSec: parseFloat(grpcRps),
        avgLatencyMs: parseFloat(grpcAvgLatency)
      }
    },
    summary: {
      fasterProtocol: grpcDuration < restDuration ? 'gRPC' : 'REST',
      speedupFactor: parseFloat(speedup)
    }
  };
  const jsonPath = path.join(resultDir, 'benchmark_result.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonResult, null, 2), 'utf-8');

  // 2. Format CSV
  const csvContent = [
    'Protocol,NumRequests,Concurrency,DurationMs,RequestsPerSec,AvgLatencyMs',
    `REST,${NUM_REQUESTS},${CONCURRENCY},${restDuration},${restRps},${restAvgLatency}`,
    `gRPC,${NUM_REQUESTS},${CONCURRENCY},${grpcDuration},${grpcRps},${grpcAvgLatency}`
  ].join('\n');
  const csvPath = path.join(resultDir, 'benchmark_result.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');

  // 3. Format TXT
  const txtContent = `==================================================
           LMS UNTIRTA BENCHMARK RESULT
==================================================
Date/Time      : ${new Date().toLocaleString()}
Total Requests : ${NUM_REQUESTS}
Concurrency    : ${CONCURRENCY}

1. REST API (/api/users/stats)
   - Duration      : ${restDuration} ms
   - Throughput    : ${restRps} req/sec
   - Avg Latency   : ${restAvgLatency} ms/req

2. gRPC (UserService.GetAdminStats)
   - Duration      : ${grpcDuration} ms
   - Throughput    : ${grpcRps} req/sec
   - Avg Latency   : ${grpcAvgLatency} ms/req

--------------------------------------------------
Summary: ${grpcDuration < restDuration ? 'gRPC' : 'REST'} is ${speedup}x faster than ${grpcDuration < restDuration ? 'REST API' : 'gRPC'}.
==================================================
`;
  const txtPath = path.join(resultDir, 'benchmark_result.txt');
  fs.writeFileSync(txtPath, txtContent, 'utf-8');

  console.log(`\n📁 Hasil benchmark berhasil disimpan di folder: ${resultDir}`);
  console.log(` - JSON : ${jsonPath}`);
  console.log(` - CSV  : ${csvPath}`);
  console.log(` - TXT  : ${txtPath}`);
};

run().catch(console.error);
