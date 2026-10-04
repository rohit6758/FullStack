const { MongoClient } = require('mongodb');

// basic connection setup
const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);
const db_name = 'collegeDatabase';

async function run() {
  try {
    await client.connect();
    console.log('--- Successfully connected to MongoDB ---');

    const db = client.db(db_name);
    const studentsCol = db.collection('student_records');

    // Insert records
    const records = [
      { rollId: "23CM101", studentName: "Ravi Kumar", dept: "CSE-AIML", currentYear: 3, score: 85, mail: "ravi@example.com" },
      { rollId: "23CM102", studentName: "Priya Sharma", dept: "CSE", currentYear: 3, score: 92, mail: "priya@example.com" },
      { rollId: "23CM103", studentName: "Ananya Verma", dept: "IT", currentYear: 2, score: 78, mail: "ananya@example.com" },
      { rollId: "23CM104", studentName: "Kiran Patel", dept: "ECE", currentYear: 4, score: 45, mail: "kiran@example.com" },
      { rollId: "23CM105", studentName: "Suresh Reddy", dept: "CSE-AIML", currentYear: 3, score: 68, mail: "suresh@example.com" },
      { rollId: "23CM106", studentName: "Sneha Nair", dept: "CSE", currentYear: 2, score: 88, mail: "sneha@example.com" },
      { rollId: "23CM107", studentName: "Ramesh Rao", dept: "CSE", currentYear: 3, score: 95, mail: "ramesh@example.com" }
    ];

    await studentsCol.insertMany(records);
    console.log('--> Inserted all student records.');

    // Display all
    console.log('\n[All Records]');
    console.log(await studentsCol.find().toArray());

    // CSE-AIML only
    console.log('\n[CSE-AIML Students]');
    console.log(await studentsCol.find({ dept: "CSE-AIML" }).toArray());

    // Score > 75
    console.log('\n[Score > 75]');
    console.log(await studentsCol.find({ score: { $gt: 75 } }).toArray());

    // Search by Roll
    console.log('\n[Search by Roll: 23CM101]');
    console.log(await studentsCol.findOne({ rollId: "23CM101" }));

    // Year = 3 and Score >= 80
    console.log('\n[Year 3 and Score >= 80]');
    console.log(await studentsCol.find({ currentYear: 3, score: { $gte: 80 } }).toArray());

    // Updates
    await studentsCol.updateOne({ rollId: "23CM101" }, { $set: { score: 92 } });
    console.log('\n--> Updated score for 23CM101');

    await studentsCol.updateOne({ rollId: "23CM103" }, { $set: { mail: "ananya.official@example.com" } });
    console.log('--> Updated email for 23CM103');

    // Delete
    await studentsCol.deleteOne({ rollId: "23CM105" });
    console.log('--> Deleted record for 23CM105');

    // Sort descending
    console.log('\n[Sorted by Score Descending]');
    console.log(await studentsCol.find().sort({ score: -1 }).toArray());

    // Index
    await studentsCol.createIndex({ rollId: 1 }, { unique: true });
    console.log('\n--> Created index on rollId');

    // Execution Stats
    const executionData = await studentsCol.find({ rollId: "23CM107" }).explain("executionStats");
    console.log('\n[Index Execution Stage]:', executionData.queryPlanner.winningPlan.stage);

  } catch (error) {
    console.error('Error occurred:', error.message);
  } finally {
    await client.close();
    console.log('\n--- MongoDB Connection Closed ---');
  }
}

run();
