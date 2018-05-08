/**
 * Holds the state of debug mode. True means we should debug the page.
 */
var debug = false;
var hasAPIs = chrome.webRequest;

// Ga.js is officially served from two domains: www.g-a.com and ssl.g-a.com for
// http and https respectively. Other files are just served from single domain.
var GA_HTTP = 'http://www.google-analytics.com/ga.js';
var GA_HTTPS = 'https://ssl.google-analytics.com/ga.js';
var DC_HTTP = '*://stats.g.doubleclick.net/dc.js';
var UA_HTTP = '*://www.google-analytics.com/analytics.js';

var GA_HTTP_D = 'http://www.google-analytics.com/u/ga_debug.js';
var GA_HTTPS_D = 'https://ssl.google-analytics.com/u/ga_debug.js';
var DC_HTTP_D = '://stats.g.doubleclick.net/dc_debug.js';
var UA_HTTP_D = '://www.google-analytics.com/analytics_debug.js';

/**
 * Responds to clicks on the extension's icon. Toggles debug mode.
 */
chrome.browserAction.onClicked.addListener(
  function(tab) {
    debug = !debug;
    chrome.browserAction.setTitle({
      title: debug ? 'GA Debug: ON' : 'GA Debug: OFF'
    });
    chrome.browserAction.setIcon({
      path: debug ? 'icon-on.png' : 'icon-off.png'
    });
    chrome.browserAction.setBadgeText({
      text: debug ? 'ON' : ''
    });
    chrome.tabs.update(tab.id, {url: tab.url}, null);
      hasAPIs && chrome.webRequest.handlerBehaviorChanged();
  }
);

hasAPIs && chrome.webRequest.onBeforeRequest.addListener(function(details) {
  if (debug) {
    var u = details.url;
    var p = u.substr(0, u.indexOf(':'));

    if (u == GA_HTTP) return {redirectUrl: GA_HTTP_D};
    else if (u == GA_HTTPS) return {redirectUrl: GA_HTTPS_D};
    else if (u.indexOf('dc.js') > 0) return {redirectUrl: p + DC_HTTP_D};
    else if (u.indexOf('analytics.js') > 0) return {redirectUrl: p + UA_HTTP_D};
  }}, {urls: [GA_HTTP, GA_HTTPS, DC_HTTP, UA_HTTP]}, ['blocking']);
