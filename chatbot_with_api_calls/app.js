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
  request = require('superagent'),
  encodeURL = require('urlencode'),
  SEM3 = require('semantics3-node'),
  parser = require('xml2json'),
  _ = require('lodash'),
  crypto = require("crypto"),
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
  VERSION_DATE = process.env.VERSION_DATE,
  BASE_SEARCH_URL = process.env.BASE_SEARCH_URL,
  OPERATION_NAME = process.env.OPERATION_NAME,
  SERVICE_VERSION = process.env.SERVICE_VERSION,
  SECURITY_APPNAME = process.env.SECURITY_APPNAME,
  GLOBAL_ID = process.env.GLOBAL_ID,
  RESPONSE_DATA_FORMAT = process.env.RESPONSE_DATA_FORMAT,
  PAGE_PAGINATION = process.env.PAGE_PAGINATION,
  SEM3_KEY = process.env.SEM3_KEY,
  SEM3_SECRET = process.env.SEM3_SECRET,
  SEM3_SERVICE = SEM3(SEM3_KEY, SEM3_SECRET),
  AWS_API_KEY = process.env.AWS_API_KEY,
  AWS_ASSOCIATE_ID = process.env.AWS_ASSOCIATE_ID,
  AWS_SECRET = process.env.AWS_SECRET;
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

let chatContext;
//=============================================================================
/**
 * helper functions
 */
//=============================================================================
/*function executeSearch(ITEM) {
  console.log(`search item: ${ITEM}`);*/
  /*return new Promise((resolve, reject) => {
    return setTimeout((item) => {
      return resolve([`Search item after 2 secs: ${ITEM}`]);
    }, 2000, ITEM);
  });*/
  /*const promiseArray = [searchEbay(ITEM), searchAmazon(ITEM), searchSemantics3(ITEM)];
  return Promise.all(promiseArray)
    .then(data => {
      const
        enrichedQuery = generateUniqStr(data),
        ebay = data[0],
        amazon = data[1],
        semantics3 = data[2];
      return [
      'Ebay resp: ' + ebay,
        'Amazon resp:' + amazon,
        'Semantics3 resp: ' + semantics3,
        'Your enriched query: '+ ITEM +' '+ enrichedQuery
      ];
    })
    .catch(err => err);
}*/

function executeSearch(ITEM) {
  console.log(`search item: ${ITEM}`);
  const promiseArray = [searchAmazon(ITEM), searchSemantics3(ITEM)];
  return Promise.all(promiseArray)
    .then(data => {
      const
        enrichedQuery = generateUniqStr(data),
        amazon = data[0],
        semantics3 = data[1];
      return [
        'Amazon resp:' + amazon,
        'Semantics3 resp: ' + semantics3,
        'Your enriched query: '+ ITEM +' '+ enrichedQuery
      ];
    })
    .catch(err => err);
}

function talkToBot(data) {
  let
    user_input,
    bot_output;
  if(!data) {
    user_input = {};
  } else {
    console.log(`input data: ${data.trim()}`);
    user_input = {
      input: {
        text: data.trim()
      }
    };
    if(chatContext) {
      console.log('existing context');
      console.log(chatContext);
      user_input.context = chatContext;
    }
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
      if(resp.output.action == 'give_feedback') {
        console.log(resp);
        console.log('\n');
        chatContext = resp.context;
        const item = resp.input.text.split(' ').pop();
        //return resolve(`It seems you want: ${item}`);
        return resolve(executeSearch(item));
      }
      if(resp.output.text.length != 0) {
        console.log(resp);
        console.log('\n');
        console.log(resp.output.text);
        chatContext = resp.context;
        return resolve(resp.output.text);
      }
    });
  });
}

function searchEbay(item) {
  let ebaySearchURL = BASE_SEARCH_URL +'?OPERATION-NAME='+ OPERATION_NAME
    +'&SERVICE-VERSION='+ SERVICE_VERSION
    +'&SECURITY-APPNAME='+ SECURITY_APPNAME
    +'&GLOBAL-ID='+ GLOBAL_ID
    +'&RESPONSE-DATA-FORMAT=' + RESPONSE_DATA_FORMAT
    +'&REST-PAYLOAD';
  ebaySearchURL += '&keywords=' + encodeURL(item) +'&paginationInput.entriesPerPage=' + PAGE_PAGINATION;
  return new Promise((resolve, reject) => {
    request
      .get(ebaySearchURL)
      .end(function (err, resp) {
        if(err) {
          console.log('ebay error...');
          console.error(err);
          return reject(err);
        } else {
          console.log('ebay response body');
          if(resp.body.errorMessage) {
            console.log(resp.body.errorMessage.error[0]);
          }
          if(resp.body.findItemsByKeywordsResponse) {
            console.log(resp.body.findItemsByKeywordsResponse.errorMessage.error[0]);
          }
          console.log(resp.body);
          console.log('resp');
          console.log(resp.text);
          const data = JSON.parse(resp.text);
          return resolve(data.findItemsByKeywordsResponse[0].searchResult[0].item[0].primaryCategory[0].categoryName[0]);
        }
      });
  });
}

function searchAmazon(item) {
  const
    endpoint = 'webservices.amazon.co.uk',
    uri = '/onca/xml',
    TIME_STAMP = new Date().toISOString();
  let params = [
      "Service=AWSECommerceService",
      "Operation=ItemSearch",
      "AWSAccessKeyId=" + AWS_API_KEY,
      "AssociateTag=" + AWS_ASSOCIATE_ID,
      "SearchIndex=All",
      "Keywords=" + item,
      "ResponseGroup=ItemAttributes"
    ];
  params.push("Timestamp=" + TIME_STAMP);
  params.sort();
  const encodedParams = params.map(param => {
    const paramArray = param.split('=');
    paramArray[1] = encodeURL(paramArray[1]);
    return paramArray.join('=');
  });
  const
    CANONICAL_STR = encodedParams.join('&'),
    SIGNABLE_STR = "GET\n" + endpoint + "\n" + uri + "\n" + CANONICAL_STR,
    SIGNATURE = crypto.createHmac("sha256", AWS_SECRET).update(SIGNABLE_STR).digest("base64"),
    SIGNED_URL = 'http://' + endpoint + uri +'?'+ CANONICAL_STR +'&Signature='+ encodeURL(SIGNATURE);
  console.log(`SIGNED_URL: ${SIGNED_URL}`);
  return new Promise((resolve, reject) => {
    request
      .get(SIGNED_URL)
      .end(function (err, resp) {
        if(err) {
          console.log(err);
          return reject(err);
        } else {
          const
            jsonResp = parser.toJson(resp.text),
            jsonObj = JSON.parse(jsonResp);
          console.log('JSON Obj:');
          console.log(jsonObj);
          console.log('jsonObj.ItemSearchResponse.Items.Item[0].ItemAttributes');
          console.log(jsonObj.ItemSearchResponse.Items.Item[0].ItemAttributes);
          const
            BRAND = jsonObj.ItemSearchResponse.Items.Item[0].ItemAttributes.Brand,
            PRODUCT_GROUP = jsonObj.ItemSearchResponse.Items.Item[0].ItemAttributes.ProductGroup,
            PRODUCT_TYPE = jsonObj.ItemSearchResponse.Items.Item[0].ItemAttributes.ProductTypeName;
          return resolve(BRAND +' '+ PRODUCT_GROUP +' '+ PRODUCT_TYPE);
        }
      });
  });
}

function searchSemantics3(item) {
  const
    endpoint = 'products',
    method = 'GET',
    queryObj = {search: ''};
  queryObj.search = item;
  const queryObjStr = JSON.stringify(queryObj);
  return new Promise((resolve, reject) => {
    return SEM3_SERVICE.run_query(endpoint, queryObjStr, method, (err, products) => {
      if(err) {
        console.error(err);
        return reject(err);
      } else {
        console.log('products:');
        console.log(products);
        const
          productsObj = JSON.parse(products),
          sampleItem = productsObj.results[0],
          brand = sampleItem.brand,
          category = sampleItem.category;
        return resolve(brand +' '+ category);
      }
    });
  });
}

function generateUniqStr(data) {
  const
    dataStr = data.join(' '),
    dataArr = dataStr.split(' '),
    uniqArr = _.uniq(dataArr),
    finalStr = uniqArr.join(' ');
  return finalStr;
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

app.post('/userInput', (req, res) => {
  const userInputData = req.body.data.input;
  console.log('data from user...');
  console.log(userInputData);
  return talkToBot(userInputData)
    .then(data => res.status(200).json({data: data}))
    .catch(err => {
      console.error(err);
      return res.status(500).json({err: err})
    });
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
