const express = require('express');
const app = express();
const port = 3000;

// creating a simple array of 5 students data
const studentsData = [
    { id: 1, name: 'Rohit', course: 'B.Tech' },
    { id: 2, name: 'Manoj', course: 'B.Tech' },
    { id: 3, name: 'Somya', course: 'B.Tech' },
    { id: 4, name: 'Charishma', course: 'B.Tech' },
    { id: 5, name: 'Ravi', course: 'B.Tech' }
];

// home route
app.get('/', (req, res) => {
    res.send('<h1>Welcome to Student Server API</h1><p>Navigate to /students or /about</p>');
});

// students route giving json response
app.get('/students', (req, res) => {
    res.json({ success: true, count: studentsData.length, data: studentsData });
});

// about route
app.get('/about', (req, res) => {
    res.send('<h3>About This App</h3><p>This is a basic Express server serving student records.</p>');
});

// running the server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port} ...`);
});