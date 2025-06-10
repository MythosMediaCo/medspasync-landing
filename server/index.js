const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../public')));

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/medspasync', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use('/api', require('./routes/demo'));
app.use('/api', require('./routes/training'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
