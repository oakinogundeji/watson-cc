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
  ConversationV1 = require('watson-developer-cloud/conversation/v1'),
  Promise = require('bluebird'),
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

const ChatBot = new ConversationV1({
  username: USERNAME,
  password: PASSWORD,
  path: {
    workspace_id: WORKSPACE_ID
  },
  version_date: VERSION_DATE
});
//=============================================================================
/**
 * helper functions
 */
//=============================================================================
function talkToBot(data) {
  let
    user_input,
    bot_output;
  if(!data) {
    user_input = {};
  } else {
    user_input = {
      input: {
        text: data.trim()
      }
    };
  }
  return new Promise((resolve, reject) => {
    return ChatBot.message(user_input, (err, resp) => {
      if(err) {
        console.error(err);
        return reject(err);
      }
      if(resp.intents.length > 0) {
        resp.intents.forEach(intent => {
          console.log('detected intent: ');
          console.log(intent);
        });
      }
      if(resp.entities.length > 0) {
        resp.entities.forEach(entity => {
          console.log('detected entity: ');
          console.log(entity);
        });
      }
      if(resp.output.text.length != 0) {
        console.log(resp);
        console.log('\n');
        console.log(resp.output.text[0] +' ...');
        return resolve(resp.output.text[0]);
      }
    });
  });
}
//=============================================================================
/**
 * middleware pipeline
 */
//=============================================================================
app.use(bParser.json());
app.use(bParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
//=============================================================================
/**
 * routes
 */
//=============================================================================
app.get('/test', (req, res) => {
  return res.status(200).
    send('<marquee><h1>Yaaaay... it works!!!</h1></marquee>');
});

app.get('/', (req, res) => {
    const options = {
        root: __dirname,
        dotfiles: 'deny'
    };
    return res.sendFile('index.html', options, err => {
        if(err) {
            console.error(`Couldn't send index.html`);
            return res.status(500).json({error: err});
        } else {
            return console.log('Index.html sent');
        }
    });
});

app.get('/welcome', (req, res) => {
  return talkToBot(null)
    .then(data => res.status(200).json({data: data}))
    .catch(err => res.status(500).json({err: err}));
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
