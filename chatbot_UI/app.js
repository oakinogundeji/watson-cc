'use strict';
require('dotenv').config();
//=============================================================================
/**
 * dependencies
 */
//=============================================================================
const
  express = require('express'),
  bParser = require('body-parser'),
  http = require('http'),
  path = require('path'),
  app = express(),
  server = http.createServer(app);
//=============================================================================
/**
 * variables
 */
//=============================================================================
const
  PORT = process.env.PORT,
  ENV = process.env.NODE_ENV || 'development',
  USERNAME = process.env.WATSON_USERNAME,
  PASSWORD = process.env.WATSON_PASSWORD,
  WORKSPACE_ID = process.env.WORKSPACE_ID,
  VERSION_DATE = process.env.VERSION_DATE;
//=============================================================================
/**
 * config
 */
//=============================================================================
if(ENV != 'production') {
  app.use(require('morgan')('dev'));
  require('clarify');
}
//=============================================================================
/**
 * middleware pipeline
 */
//=============================================================================
app.use(bParser.json());
app.use(bParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public/assets')));
//=============================================================================
/**
 * routes
 */
//=============================================================================
app.get('/test', (req, res) => {
  return res.status(200).
    send('<marquee><h1>Yaaaay... it works!!!</h1></marquee>');
});
//=============================================================================
/**
 * bind server to port
 */
//=============================================================================
server.listen(PORT, () => {
  console.log(`Chatbot UI Server up on port:${server.address().port} in ${ENV} mode`);
});
//=============================================================================
