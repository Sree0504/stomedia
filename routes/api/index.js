const express= require('express');
const app = express();
// internal module imports
app.use('/users',  require('./users'));
app.use('/posts', require('./posts'));
app.use('/profile', require('./profile'))
app.use('/auth', require('./auth'));

module.exports = app;



