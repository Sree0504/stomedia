const express = require('express');
const app = express();
const connectDB = require('./config/db');
const routes = require("./routes/api/index")
const PORT = process.env.PORT || 5000;

connectDB();
app.use(express.json({extended: false}));
app.use('/api', routes);
app.get('/',(req, res) => {
	res.send('hello world');
});

app.listen(PORT, () => console.log(`server started on port ${PORT}`));
