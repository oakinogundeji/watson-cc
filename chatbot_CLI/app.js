'use strict';
require('dotenv').config();
if(process.env.NODE_ENV != 'production') {
  require('clarify');
}
//=============================================================================
/**
 * dependencies
 */
//=============================================================================
const ConversationV1 = require('watson-developer-cloud/conversation/v1');
//=============================================================================
/**
 * module variables
 */
//=============================================================================
const
  USERNAME = process.env.WATSON_USERNAME,
  PASSWORD = process.env.WATSON_PASSWORD,
  WORKSPACE_ID = process.env.WORKSPACE_ID,
  VERSION_DATE = process.env.VERSION_DATE;
//=============================================================================
//=============================================================================
/**
 * helper functions
 */
//=============================================================================
function responseHandler(err, resp) {
  if(err) {
    return console.error(err);
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
    console.log(`response from Watson convo:`);
    console.log(resp);
    console.log(resp.output.text[0]);
  }
}
//=============================================================================
/**
 * instantiate ChatBot
 */
//=============================================================================
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
 * handle ChatBot
 */
//=============================================================================
ChatBot.message({}, responseHandler);
//=============================================================================
