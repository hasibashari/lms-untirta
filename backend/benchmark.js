import express from 'express';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, './benchmark.proto');

// --- REST SETUP ---
const app = express();
app.use(express.json());

app.post('/ping', (req, res) => {
  res.json({ message: req.body.message });
});

let restServer;

// --- gRPC SETUP ---
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const benchmarkProto = grpc.loadPackageDefinition(packageDefinition).benchmark;

const grpcServer = new grpc.Server();
grpcServer.addService(benchmarkProto.BenchmarkService.service, {
  Ping: (call, callback) => {
    callback(null, { message: call.request.message });
  },
});

// --- BENCHMARK RUNNER ---
const NUM_REQUESTS = 10000;
const CONCURRENCY = 100;

const runRestBenchmark = async () => {
  console.log(`Starting REST benchmark with ${NUM_REQUESTS} requests...`);
  const startTime = Date.now();
  
  let completed = 0;
  
  return new Promise((resolve) => {
    const makeRequest = async () => {
      while (completed < NUM_REQUESTS) {
        completed++;
        await fetch('http://localhost:4000/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'hello' })
        }).then(res => res.json());
      }
    };
    
    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(makeRequest());
    }
    
    Promise.all(workers).then(() => {
      const duration = Date.now() - startTime;
      console.log(`REST Benchmark finished in ${duration} ms (${(NUM_REQUESTS / (duration / 1000)).toFixed(2)} req/sec)`);
      resolve(duration);
    });
  });
};

const runGrpcBenchmark = async (client) => {
  console.log(`Starting gRPC benchmark with ${NUM_REQUESTS} requests...`);
  const startTime = Date.now();
  
  let completed = 0;
  
  return new Promise((resolve) => {
    const makeRequest = () => {
      return new Promise((res) => {
        client.Ping({ message: 'hello' }, (err, response) => {
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
      console.log(`gRPC Benchmark finished in ${duration} ms (${(NUM_REQUESTS / (duration / 1000)).toFixed(2)} req/sec)`);
      resolve(duration);
    });
  });
};

const run = async () => {
  // Start REST server
  await new Promise(resolve => {
    restServer = app.listen(4000, resolve);
  });
  console.log('REST server listening on port 4000');

  // Start gRPC server
  await new Promise((resolve, reject) => {
    grpcServer.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (err, port) => {
      if (err) return reject(err);
      console.log('gRPC server listening on port 50052');
      resolve();
    });
  });

  // Create gRPC client
  const client = new benchmarkProto.BenchmarkService('localhost:50052', grpc.credentials.createInsecure());

  // Warmup
  console.log('Warming up...');
  for(let i = 0; i < 100; i++) {
     await fetch('http://localhost:4000/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'hello' }) }).catch(()=>{});
     await new Promise(res => client.Ping({ message: 'hello' }, res));
  }

  // Run Benchmark
  console.log('--- Benchmark Results ---');
  await runRestBenchmark();
  await runGrpcBenchmark(client);

  // Shutdown
  console.log('Shutting down...');
  restServer.close();
  grpcServer.forceShutdown();
};

run().catch(console.error);
