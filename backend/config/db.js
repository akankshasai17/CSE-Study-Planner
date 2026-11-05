const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

let mongodProcess = null;

// Function to auto-spawn local mongod if installed on the host system
const startLocalMongo = async () => {
  const possiblePaths = [
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
  ];

  const mongodPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!mongodPath) return false;

  const dataDir = path.resolve(__dirname, '..', 'data', 'db');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  console.log(`🚀 Auto-starting local MongoDB instance (${mongodPath})...`);
  try {
    mongodProcess = spawn(
      mongodPath,
      ['--dbpath', dataDir, '--bind_ip', '127.0.0.1', '--port', '27017'],
      { detached: false, stdio: 'ignore' }
    );

    mongodProcess.unref();

    const cleanup = () => {
      if (mongodProcess) {
        try { mongodProcess.kill(); } catch {}
      }
    };

    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', () => { cleanup(); process.exit(); });

    // Wait 2.5s for mongod to accept socket connections
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return true;
  } catch (err) {
    console.warn(`Failed to auto-spawn local mongod: ${err.message}`);
    return false;
  }
};

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/cse_study_planner';

  // 1. If primaryUri is configured with real credentials (not dummy placeholder)
  if (
    primaryUri &&
    !primaryUri.includes('student_admin:secure_password@cluster0.mongodb.net') &&
    !primaryUri.includes('<db_password>')
  ) {
    try {
      console.log('📡 Connecting to configured MongoDB Atlas cluster...');
      const conn = await mongoose.connect(primaryUri, {
        dbName: 'cse_study_planner',
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`⚠️ Primary MongoDB connection failed: ${error.message}. Trying local fallback...`);
    }
  }

  // 2. Try connecting to local MongoDB (if already running)
  try {
    console.log('🔄 Connecting to local MongoDB (mongodb://127.0.0.1:27017/cse_study_planner)...');
    const conn = await mongoose.connect(localUri, {
      dbName: 'cse_study_planner',
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`✅ Connected to local MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (localError) {
    console.log('⏳ Local MongoDB not yet running. Attempting auto-start...');
  }

  // 3. Auto-start local mongod if binary is installed
  const started = await startLocalMongo();
  if (started) {
    try {
      const conn = await mongoose.connect(localUri, {
        dbName: 'cse_study_planner',
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ Local MongoDB started and connected: ${conn.connection.host}`);
      return conn;
    } catch (startErr) {
      console.warn(`⚠️ Could not connect to auto-started local MongoDB: ${startErr.message}`);
    }
  }

  console.warn('⚠️ MongoDB connection could not be established.');
  console.warn('👉 Please configure your MongoDB Atlas URI in backend/.env:');
  console.warn('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cse_study_planner');
};

module.exports = connectDB;
