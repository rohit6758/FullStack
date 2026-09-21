const express = require('express');
const app = express();
const PORT = 3000;

// creating my own logger middleware to track requests
const customLogger = (req, res, next) => {
    const timeNow = new Date().toLocaleTimeString();
    // logging method and url for every hit
    console.log(`[ROHIT_LOG] ${timeNow} -> Method: ${req.method} | Path: ${req.url}`);
    
    // next is very imp to pass control to actual route
    next(); 
};

// applying to all routes globally
app.use(customLogger);

// test routes
app.get('/', (req, res) => {
    res.send('<h2>Middleware Demo Home</h2><p>Check your console to see the log!</p>');
});

app.get('/test', (req, res) => {
    res.send('<h2>Test Page</h2><p>Middleware also ran here.</p>');
});

// start server listening
app.listen(PORT, () => {
    console.log(`App running at http://localhost:${PORT}`);
});