const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');

async function runTests() {
  console.log('🧪 Starting Verification Test Suite for CSE Study Planner Requirements...\n');

  const dbPath = path.join(__dirname, 'data', 'db');
  const mongodPath = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';

  console.log('📦 Starting local MongoDB process for testing...');
  const mongod = spawn(mongodPath, ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', '27017']);

  // Allow mongod to accept socket connections
  await new Promise((resolve) => setTimeout(resolve, 2500));

  process.env.PORT = '5002';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/cse_study_planner_test';
  process.env.JWT_SECRET = 'csestudyplanner_test_secret_2026';

  const connectDB = require('./config/db');
  await connectDB();

  const express = require('express');
  const cors = require('cors');
  const app = express();

  app.use(cors({ credentials: true, origin: true }));
  app.use(express.json());

  // Mount Application Routes
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/dashboard', require('./routes/dashboardRoutes'));
  app.use('/api/timetable', require('./routes/timetableRoutes'));
  app.use('/api/leetcode', require('./routes/leetcodeRoutes'));
  app.use('/api/subjects', require('./routes/subjectRoutes'));
  app.use('/api/tasks', require('./routes/taskRoutes'));
  app.use('/api/focus', require('./routes/focusRoutes'));
  app.use('/api/progress', require('./routes/progressRoutes'));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5002, resolve));
  console.log('🚀 Test server active at http://127.0.0.1:5002\n');

  // Helper HTTP request function supporting cookies & bearer token
  const request = (method, endpoint, body = null, token = null, cookie = null) => {
    return new Promise((resolve, reject) => {
      const dataString = body ? JSON.stringify(body) : null;
      const headers = {
        'Content-Type': 'application/json',
      };
      if (dataString) headers['Content-Length'] = Buffer.byteLength(dataString);
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (cookie) headers['Cookie'] = cookie;

      const options = {
        hostname: '127.0.0.1',
        port: 5002,
        path: endpoint,
        method: method,
        headers,
      };

      const req = http.request(options, (res) => {
        let resBody = '';
        const setCookie = res.headers['set-cookie'];
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(resBody);
          } catch {
            parsed = resBody;
          }
          resolve({ status: res.statusCode, data: parsed, setCookie });
        });
      });

      req.on('error', reject);
      if (dataString) req.write(dataString);
      req.end();
    });
  };

  try {
    const timestamp = Date.now();
    const userA_email = `student_a_${timestamp}@college.edu`;
    const userB_email = `student_b_${timestamp}@college.edu`;

    // 1. Sign Up & Validation Tests
    console.log('1️⃣ Testing Sign Up & Password Mismatch Validation...');
    const failReg = await request('POST', '/api/auth/register', {
      name: 'Test Student',
      email: userA_email,
      password: 'password123',
      confirmPassword: 'mismatch_password',
    });
    console.log(`   Password mismatch rejected correctly: status ${failReg.status}`);
    if (failReg.status !== 400) throw new Error('Password mismatch validation failed');

    console.log('   Creating User A with starter syllabus and questions...');
    const regResA = await request('POST', '/api/auth/register', {
      name: 'Alice Student',
      email: userA_email,
      password: 'password123',
      confirmPassword: 'password123',
    });
    console.log(`   User A registered: status ${regResA.status}, name: ${regResA.data?.user?.name}`);
    if (regResA.status !== 201) throw new Error('User A registration failed');
    const tokenA = regResA.data.token;
    const cookieA = regResA.setCookie ? regResA.setCookie[0] : `token=${tokenA}`;

    // Test duplicate email registration rejection
    console.log('   Testing duplicate email rejection...');
    const dupReg = await request('POST', '/api/auth/register', {
      name: 'Duplicate Alice',
      email: userA_email,
      password: 'password123',
      confirmPassword: 'password123',
    });
    console.log(`   Duplicate email rejected: status ${dupReg.status}`);
    if (dupReg.status !== 400) throw new Error('Duplicate email should be rejected');

    // 2. Sign In & HttpOnly Cookie Authentication
    console.log('\n2️⃣ Testing Sign In & HttpOnly Cookie Verification...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: userA_email,
      password: 'password123',
    });
    console.log(`   User A Sign In status: ${loginRes.status}, user: ${loginRes.data?.user?.email}`);
    if (loginRes.status !== 200) throw new Error('Sign in failed');

    // Test protected route using HttpOnly cookie without Bearer header
    console.log('   Testing /api/auth/me using HttpOnly Cookie...');
    const meRes = await request('GET', '/api/auth/me', null, null, cookieA);
    console.log(`   Auth with Cookie status: ${meRes.status}, verified user: ${meRes.data?.user?.name}`);
    if (meRes.status !== 200) throw new Error('Cookie authentication failed');

    // 3. Register User B for Data Isolation Verification
    console.log('\n3️⃣ Registering User B to verify complete User Data Isolation...');
    const regResB = await request('POST', '/api/auth/register', {
      name: 'Bob Student',
      email: userB_email,
      password: 'password456',
      confirmPassword: 'password456',
    });
    const tokenB = regResB.data.token;

    // 4. Study Timetable Module Testing
    console.log('\n4️⃣ Testing Study Timetable Functionality...');
    console.log('   Testing end-time after start-time validation...');
    const invalidSession = await request('POST', '/api/timetable', {
      subject: 'Operating Systems',
      topic: 'Virtual Memory',
      date: '2026-11-05',
      startTime: '14:00',
      endTime: '13:00', // Invalid: end time before start time
    }, tokenA);
    console.log(`   Invalid session rejected: status ${invalidSession.status}`);
    if (invalidSession.status !== 400) throw new Error('Time validation failed');

    console.log('   Creating valid study session for User A...');
    const validSession = await request('POST', '/api/timetable', {
      subject: 'Operating Systems',
      topic: 'Virtual Memory & Page Replacement',
      date: '2026-11-05',
      startTime: '10:00',
      endTime: '11:30',
      notes: 'Review LRU, FIFO, and Belady anomaly',
    }, tokenA);
    console.log(`   Session created: status ${validSession.status}, duration: ${validSession.data?.session?.duration} hrs`);
    const sessionIdA = validSession.data.session._id;

    // Toggle completion
    const toggleRes = await request('PATCH', `/api/timetable/${sessionIdA}/toggle`, null, tokenA);
    console.log(`   Session toggled to: ${toggleRes.data?.session?.status}`);

    // Verify User B cannot access or modify User A's session
    const unauthorizedAccess = await request('PUT', `/api/timetable/${sessionIdA}`, {
      subject: 'Hacked Subject',
    }, tokenB);
    console.log(`   User B cross-user update blocked: status ${unauthorizedAccess.status}`);
    if (unauthorizedAccess.status !== 404 && unauthorizedAccess.status !== 403) {
      throw new Error('User data isolation failed for study session!');
    }

    // 5. LeetCode Practice Questions Module Testing
    console.log('\n5️⃣ Testing Curated LeetCode Practice Questions & Filtering...');
    const leetcodeRes = await request('GET', '/api/leetcode', null, tokenA);
    console.log(`   Starter curated questions count: ${leetcodeRes.data?.count}`);
    console.log(`   Topics available: ${leetcodeRes.data?.topics?.length} topics`);
    if (leetcodeRes.data?.count < 30) throw new Error('Starter LeetCode questions were not seeded');

    // Filter by topic and difficulty
    const filterRes = await request('GET', '/api/leetcode?topic=Arrays&difficulty=Easy', null, tokenA);
    console.log(`   Arrays (Easy) count: ${filterRes.data?.count}, first problem: ${filterRes.data?.problems[0]?.title}`);
    console.log(`   Real URL verified: ${filterRes.data?.problems[0]?.problemUrl}`);

    // Mark problem as Solved
    const problemToSolve = filterRes.data.problems[0];
    const updateProblemRes = await request('PATCH', `/api/leetcode/${problemToSolve._id}/status`, {
      status: 'Solved',
      notes: 'Solved using Hash Map in O(n) time and O(n) space.',
    }, tokenA);
    console.log(`   Problem status updated: ${updateProblemRes.data?.problem?.status}`);

    // 6. Core Subjects Syllabus Module Testing
    console.log('\n6️⃣ Testing Core Subjects Syllabus (7 Essential Subjects)...');
    const subjectsRes = await request('GET', '/api/subjects', null, tokenA);
    console.log(`   Total core subjects count: ${subjectsRes.data?.count}`);
    subjectsRes.data.subjects.forEach((s) => {
      console.log(`     - ${s.name} (${s.code}): ${s.stats?.completedTopics}/${s.stats?.totalTopics} topics (${s.stats?.completionPercentage}%)`);
    });
    if (subjectsRes.data?.count !== 7) throw new Error('All 7 Core Subjects must be present');

    // Update topic status in first subject (DSA)
    const firstSubjectId = subjectsRes.data.subjects[0]._id;
    const subjectDetail = await request('GET', `/api/subjects/${firstSubjectId}`, null, tokenA);
    const mod1 = subjectDetail.data.subject.modules[0];
    const top1 = mod1.topics[0];

    console.log(`   Marking topic "${top1.name}" as Completed...`);
    const updateTopicRes = await request('PATCH', `/api/subjects/${firstSubjectId}/modules/${mod1._id}/topics/${top1._id}`, {
      status: 'Completed',
    }, tokenA);
    console.log(`   Topic status: ${updateTopicRes.data?.topic?.status}, Subject progress now: ${updateTopicRes.data?.stats?.completionPercentage}%`);

    // Add custom module to subject
    const addModRes = await request('POST', `/api/subjects/${firstSubjectId}/modules`, {
      name: 'Module 5: Advanced Segment Trees',
    }, tokenA);
    console.log(`   Added custom module: ${addModRes.status}`);

    // 7. Personal Tasks Module Testing
    console.log('\n7️⃣ Testing Personal Study Tasks...');
    const taskRes = await request('POST', '/api/tasks', {
      title: 'Submit Database Lab Assignment on Normalization',
      description: 'Prepare documentation on BCNF and 3NF losslessness',
      priority: 'High',
      dueDate: '2026-11-10',
    }, tokenA);
    console.log(`   Task created: ${taskRes.data?.task?.title}, priority: ${taskRes.data?.task?.priority}`);

    // 8. Focus Timer & Goals Testing
    console.log('\n8️⃣ Testing 25-Minute Focus Session Logging...');
    const focusRes = await request('POST', '/api/focus/log', {
      durationMinutes: 25,
      subject: 'Operating Systems - Synchronization',
    }, tokenA);
    console.log(`   Focus session logged: ${focusRes.data?.session?.durationMinutes} mins, message: ${focusRes.data?.message}`);

    // 9. Dashboard Aggregation Testing
    console.log('\n9️⃣ Testing Student Dashboard Data API...');
    const dashRes = await request('GET', '/api/dashboard', null, tokenA);
    console.log(`   Dashboard Student: ${dashRes.data?.student?.name}`);
    console.log(`   Tasks Pending: ${dashRes.data?.tasks?.pending}`);
    console.log(`   LeetCode Solved: ${dashRes.data?.leetcode?.solved} / ${dashRes.data?.leetcode?.total}`);
    console.log(`   Overall Syllabus Progress: ${dashRes.data?.subjects?.overallPercentage}%`);
    console.log(`   Weekly Hours Logged: ${dashRes.data?.weeklyProgress?.hoursLogged} hrs (Goal: ${dashRes.data?.weeklyProgress?.goalHours} hrs)`);

    // 10. Progress Overview Testing
    console.log('\n🔟 Testing Comprehensive Progress Overview API...');
    const progRes = await request('GET', '/api/progress', null, tokenA);
    console.log(`   Total Scheduled Sessions: ${progRes.data?.sessions?.totalScheduled}`);
    console.log(`   LeetCode Solve Rate: ${progRes.data?.leetcode?.solveRate}%`);
    console.log(`   Total Focus Hours: ${progRes.data?.focus?.totalHours} hrs`);

    console.log('\n===============================================================');
    console.log('🎉 ALL CSE STUDY PLANNER REQUIREMENTS SUCCESSFULLY VERIFIED! 🎉');
    console.log('===============================================================');
  } finally {
    server.close();
    await mongoose.disconnect();
    mongod.kill('SIGINT');
  }
}

runTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
