const claimRequest = require('claimRequest');
const createRegex = require('createRegex');
const decodeUriComponent = require('decodeUriComponent');
const getRemoteAddress = require('getRemoteAddress');
const getRequestBody = require('getRequestBody');
const getRequestHeader = require('getRequestHeader');
const getRequestMethod = require('getRequestMethod');
const getRequestPath = require('getRequestPath');
const getRequestQueryString = require('getRequestQueryString');
const getTimestampMillis = require('getTimestampMillis');
const JSON = require('JSON');
const logToConsole = require('logToConsole');
const Object = require('Object');
const parseUrl = require('parseUrl');
const runContainer = require('runContainer');
const returnResponse = require('returnResponse');
const sendHttpGet = require('sendHttpGet');
const setResponseBody = require('setResponseBody');
const setResponseHeader = require('setResponseHeader');
const setResponseStatus = require('setResponseStatus');
const templateDataStorage = require('templateDataStorage');

const CACHE_MAX_TIME_MS = 43200000;
const CDN_PATH = 'https://' + data.instanceName + '.piwik.pro' + getRequestPath();
const COMMON_EVENT_KEYS_IN_PIWIK = ['event_name', '_id', 'cip', 'lang', 'url', 'urlref', 'res', 'ua', 'uid', 'revenue'];
const DEFAULT_EVENT_NAME = 'piwik';
const EVENT_PREFIX = 'x-pp-';
const JSON_FIELDS = ['cvar', '_cvar', 'search_cats', 'ec_products'];
const LOG_PREFIX = '[ppms_client] ';
const REQUEST_METHOD = getRequestMethod();
const REQUEST_ORIGIN = getRequestHeader('origin') || (!!getRequestHeader('referer') && parseUrl(getRequestHeader('referer')).origin) || null;
const REQUEST_PATH = getRequestPath();
const STORED_JS_NAME = (REQUEST_PATH === '/ppas.js' ? 'ppas_js' : 'ppms_js');
const STORED_HEADERS_NAME = STORED_JS_NAME + '_headers';
const STORED_TIMEOUT_NAME = STORED_JS_NAME + '_timeout';
const VALID_REQUEST_METHODS = ['GET', 'POST'];

/**
 * Helper to log messages with the Piwik PRO prefix
 *
 * @param {String} msg - the message to be logged.
 */
const log = msg => {
  logToConsole(LOG_PREFIX + msg);
};

/**
 * Validates the request origin against the list of allowed origins.
 *
 * @returns {Boolean} Whether the origin is valid or not.
 */
const validateOrigin = () => {
  return data.allowedOrigins === '*' || data.allowedOrigins.split(',').map(origin => origin.trim()).indexOf(REQUEST_ORIGIN) > -1;
};

/** 
 * Returns an object with top-level undefined/null keys removed.
 *
 * @param {Object} obj - the object to be cleaned.
 */
const cleanObject = (obj) => {
  let target = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] != null) target[k] = obj[k];
  });
  return target;
};

/**
 * Returns the path to the ppms.js file.
 */
const getPpmsFilePath = () => {
  return '/ppms.js';
};

/**
 * Returns the path to the ppas.js file.
 */
const getPpasFilePath = () => {
  return '/ppas.js';
};

/**
 * Returns the path to the ppms.php endpoint.
 */
const getPpmsEndpointPath = () => {
  return '/ppms.php';
};

/**
 * Returns the path to the piwik.php endpoint.
 */
const getPiwikEndpointPath = () => {
  return '/piwik.php';
};

/** 
 * Merges the two objects together by preferencing obj2.
 *
 * @param {Object} obj - the object to which the second object is merged.
 * @param {Object} obj2 - the object that is merged with the first object.
 * @returns {Object} The merged object.
 */
const mergeObj = (obj, obj2) => {
  for (let key in obj2) {
    if (obj2.hasOwnProperty(key)) obj[key] = obj2[key];
  }
  return obj;
};

/** 
 * Converts a URL request string into an object with values decoded.
 *
 * @param {String} requestString - the request string that needs to be parsed.
 * @returns {Object} Object with each request parameter corresponding to a key.
 */
const requestStringToObj = (requestString) => {
  return requestString.split('&').reduce((acc, cur) => {
    const pair = cur.split('=');
    acc[pair[0]] = decodeUriComponent(pair[1]);
    return acc;
  }, {});
};

/** 
 * Generates an event_name value based on the contents of the Piwik PRO request.
 *
 * @param {Object} requestData - the request data.
 * @returns {Object} The requestData object with the event_name property populated.
 */
const generateEventName = (requestData) => {
  if (requestData.event_name) {
    return requestData;
  } else if (requestData.idgoal && requestData.idgoal !== 0) {
    requestData.event_name = 'goal_conversion';
  } else if (requestData.ping) {
    requestData.event_name = 'ping';
  } else if (requestData.c_i) {
    requestData.event_name = 'content_interaction';
  } else if (requestData.c_n) {
    requestData.event_name = 'content_impression';
  } else if (requestData.e_t) {
    requestData.event_name = requestData.e_t;
  } else if (requestData.e_c) {
    requestData.event_name = requestData.e_c;
  } else if (requestData.search) {
    requestData.event_name = 'search';
  } else if (requestData.link) {
    requestData.event_name = 'click';
  } else if (requestData.download) {
    requestData.event_name = 'file_download';
  } else if (requestData.action_name) {
    requestData.event_name = 'page_view';
  }  else {
    requestData.event_name = DEFAULT_EVENT_NAME;
  }
  return requestData;
};

/** 
 * Maps the requestData object to both a common event schema as well as Piwik-specific keys.
 *
 * @param {Object} requestData - the request data.
 * @returns {Object} A merged object with both common event data and Piwik-specific data.
 */
const mapToEventSchema = (requestData) => {
  const sourceUrl = parseUrl(requestData.url) || {};
  // Common event data from https://developers.google.com/tag-platform/tag-manager/server-side/common-event-data
  const commonEventData = {
    event_name: requestData.event_name,
    client_id: requestData._id,
    ip_override: requestData.cip || getRemoteAddress(),
    language: requestData.lang || getRequestHeader('Accept-Language'),
    page_hostname: sourceUrl.hostname,
    page_location: requestData.url,
    page_path: sourceUrl.pathname,
    page_referrer: requestData.urlref,
    screen_resolution: requestData.res,
    user_agent: requestData.ua || getRequestHeader('User-Agent'),
    user_id: requestData.uid,
    value: requestData.revenue
  };
  // All the rest of the keys can be assumed to be Piwik-specific
  const piwikData = Object.keys(requestData)
    .filter(key => COMMON_EVENT_KEYS_IN_PIWIK.indexOf(key) === -1)
    .reduce((acc, cur) => {
      // If the value is JSON, parse it into the event data object
      acc[EVENT_PREFIX + cur] = JSON_FIELDS.indexOf(cur) > -1 ? JSON.parse(requestData[cur]) : requestData[cur];
      return acc;
    }, {});
  return mergeObj(commonEventData, piwikData);
};

/**
 * Sets the response body, headers, and status before returning it.
 */
const sendCDNResponse = (body, headers, statusCode) => {
  setResponseStatus(statusCode);
  setResponseBody(body);
  for (const key in headers) {
    setResponseHeader(key, headers[key]);
  }
  returnResponse();
};

// Check if request is for a file
if (REQUEST_PATH === getPpmsFilePath() || REQUEST_PATH === getPpasFilePath()) {
  if (!data.serveJs) {
    log('Request for JS file ignored – request serving not enabled in Client.');
    return;
  }
  if (!validateOrigin()) {
    log('Request originated from invalid origin');
    return;
  }
  // Claim the request
  claimRequest();
  log(REQUEST_PATH + ' request claimed');
  const now = getTimestampMillis();
  const storageExpireTime = now - CACHE_MAX_TIME_MS;
  const storedJsBody = templateDataStorage.getItemCopy(STORED_JS_NAME);
  const storedHeaders = templateDataStorage.getItemCopy(STORED_HEADERS_NAME);
  const storedTimeout = templateDataStorage.getItemCopy(STORED_TIMEOUT_NAME);
  if (!storedJsBody || storedTimeout < storageExpireTime) {
    log('No cache hit or cache expired, fetching ' + REQUEST_PATH + ' over the network.');
    sendHttpGet(CDN_PATH, {timeout: 1500})
      .then(result => {
        if (result.statusCode === 200) {
          templateDataStorage.setItemCopy(STORED_JS_NAME, result.body);
          templateDataStorage.setItemCopy(STORED_HEADERS_NAME, result.headers);
          templateDataStorage.setItemCopy(STORED_TIMEOUT_NAME, now);
        }
        sendCDNResponse(result.body, result.headers, result.statusCode);
      });
  } else {
    log('Cache hit successful, fetching ' + REQUEST_PATH + ' from SGTM storage.');
    sendCDNResponse(
      storedJsBody,
      storedHeaders,
      200
    );
  }
}
  
// Check if request is a Piwik PRO event
if ((REQUEST_PATH === getPpmsEndpointPath() || REQUEST_PATH === getPiwikEndpointPath()) && 
    VALID_REQUEST_METHODS.indexOf(REQUEST_METHOD) > -1) {
  // Claim the request
  claimRequest();
  log(REQUEST_PATH + ' request claimed');
  
  const requestString = REQUEST_METHOD === 'GET' ? getRequestQueryString() : getRequestBody();
  let requestData = requestStringToObj(requestString);
  requestData = generateEventName(requestData);
  requestData = mapToEventSchema(requestData);
  requestData = cleanObject(requestData);

  runContainer(requestData, () => returnResponse());
}