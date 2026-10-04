// MongoDB Shell Script for Assignment 2
use collegeDatabase;

// Insert
db.student_records.insertMany([
  { rollId: "23CM101", studentName: "Ravi Kumar", dept: "CSE-AIML", currentYear: 3, score: 85, mail: "ravi@example.com" },
  { rollId: "23CM102", studentName: "Priya Sharma", dept: "CSE", currentYear: 3, score: 92, mail: "priya@example.com" },
  { rollId: "23CM103", studentName: "Ananya Verma", dept: "IT", currentYear: 2, score: 78, mail: "ananya@example.com" },
  { rollId: "23CM104", studentName: "Kiran Patel", dept: "ECE", currentYear: 4, score: 45, mail: "kiran@example.com" },
  { rollId: "23CM105", studentName: "Suresh Reddy", dept: "CSE-AIML", currentYear: 3, score: 68, mail: "suresh@example.com" },
  { rollId: "23CM106", studentName: "Sneha Nair", dept: "CSE", currentYear: 2, score: 88, mail: "sneha@example.com" },
  { rollId: "23CM107", studentName: "Ramesh Rao", dept: "CSE", currentYear: 3, score: 95, mail: "ramesh@example.com" },
  { rollId: "23CM108", studentName: "Vikram Das", dept: "IT", currentYear: 1, score: 48, mail: "vikram@example.com" }
]);

print("\n[All Students]");
db.student_records.find().pretty();

print("\n[CSE-AIML Branch]");
db.student_records.find({ dept: "CSE-AIML" }).pretty();

print("\n[Score > 75]");
db.student_records.find({ score: { $gt: 75 } }).pretty();

print("\n[Search RollId 23CM101]");
db.student_records.findOne({ rollId: "23CM101" });

print("\n[Year 3 & Score >= 80]");
db.student_records.find({ currentYear: 3, score: { $gte: 80 } }).pretty();

print("\n[Update 23CM101 Score]");
db.student_records.updateOne({ rollId: "23CM101" }, { $set: { score: 92 } });

print("\n[Update 23CM103 Email]");
db.student_records.updateOne({ rollId: "23CM103" }, { $set: { mail: "ananya.official@example.com" } });

print("\n[Delete 23CM105]");
db.student_records.deleteOne({ rollId: "23CM105" });

print("\n[Sort by Score Descending]");
db.student_records.find().sort({ score: -1 }).pretty();

print("\n[Create Unique Index]");
db.student_records.createIndex({ rollId: 1 }, { unique: true });

print("\n[Index Performance Stats]");
db.student_records.find({ rollId: "23CM107" }).explain("executionStats");
