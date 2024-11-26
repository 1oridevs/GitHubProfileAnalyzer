const express = require('express');
const cors = require('cors');
const githubRoutes = require('./routes/github');

const app = express();

// Middleware
app.use(cors()); // Allow all origins
app.use(express.json());
// Routes
app.use('/api/github', githubRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
