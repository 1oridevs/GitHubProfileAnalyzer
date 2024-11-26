const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const githubRoutes = require('./routes/github');

dotenv.config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/github', githubRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
