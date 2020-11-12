/**
 * Holds the state of debug mode. True means we should debug the page.
 */
var debug = false;
var hasAPIs = chrome.webRequest;
updateBrowserAction();
// Ga.js is officially served from two domains: www.g-a.com and ssl.g-a.com for
// http and https respectively. Other files are just served from single domain.
var GA_HTTP = 'http://www.google-analytics.com/ga.js';
var GA_HTTPS = 'https://ssl.google-analytics.com/ga.js';
var DC_HTTP = '*://stats.g.doubleclick.net/dc.js';
var UA_HTTP = '*://www.google-analytics.com/analytics.js';
var GTAG_HTTP = '*://www.googletagmanager.com/gtag/js*';
var GA_HTTP_D = 'http://www.google-analytics.com/u/ga_debug.js';
var GA_HTTPS_D = 'https://ssl.google-analytics.com/u/ga_debug.js';
var DC_HTTP_D = '://stats.g.doubleclick.net/dc_debug.js';
var UA_HTTP_D = '://www.google-analytics.com/analytics_debug.js';
var COOKIE_HEADER = 'Cookie';
var GTAG_DEBUG_COOKIE = 'gtm_debug';
var GTAG_DEBUG_COOKIE_VALUE = 'LOG=x';
/**
 * Responds to clicks on the extension's icon. Toggles debug mode.
 */
chrome.browserAction.onClicked.addListener(
    function(tab) {
        debug = !debug;
        updateBrowserAction();
        chrome.tabs.update(tab.id, {
            url: tab.url,
            selected: tab.selected
        }, null);
        hasAPIs && chrome.webRequest.handlerBehaviorChanged();
    }
);
/**
 * Updates the browser action (tool bar icon) to reflect the current state.
 */
function updateBrowserAction() {
    chrome.browserAction.setTitle({
        title: debug ? 'GA Debug: ON' : 'GA Debug: OFF'
    });
    chrome.browserAction.setIcon({
        path: debug ? {
            '16': 'icon-on-16.png',
            '32': 'icon-on-32.png'
        } : {
            '16': 'icon-off-16.png',
            '32': 'icon-off-32.png'
        }
    });
    chrome.browserAction.setBadgeText({
        text: debug ? 'ON' : ''
    });
}
hasAPIs && chrome.webRequest.onBeforeRequest.addListener(function(details) {
    if (debug) {
        const u = details.url;
        const p = u.substr(0, u.indexOf(':'));
        if (u == GA_HTTP) {
            return {
                redirectUrl: GA_HTTP_D
            };
        } else if (u == GA_HTTPS) {
            return {
                redirectUrl: GA_HTTPS_D
            };
        } else if (u.indexOf('dc.js') > 0) {
            return {
                redirectUrl: p + DC_HTTP_D
            };
        } else if (u.indexOf('analytics.js') > 0) {
            return {
                redirectUrl: p + UA_HTTP_D
            };
        } else if (u.indexOf('/gtag/js') > 0 && u.indexOf('dbg=') < 0) {
            const separator = (u.indexOf('?') > 0) ? '&' : '?';
            return {
                redirectUrl: u + separator + 'dbg=' + generateCacheBuster()
            };
        }
    }
}, {
    urls: [GA_HTTP, GA_HTTPS, DC_HTTP, UA_HTTP, GTAG_HTTP]
}, ['blocking']);
hasAPIs && chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    if (debug) {
        // Look for existing Cookie header.
        let cookieHeader;
        const headersToSend = [];
        for (let h of details.requestHeaders) {
            if (h.name.toLowerCase() === COOKIE_HEADER) {
                cookieHeader = h;
            } else {
                headersToSend.push(h);
            }
        }
        if (cookieHeader) {
            // Update existing header.
            cookieHeader.value = addOrReplaceCookie(
                cookieHeader.value, GTAG_DEBUG_COOKIE, GTAG_DEBUG_COOKIE_VALUE);
        } else {
            // Add a cookie header to the request.
            cookieHeader = {
                name: COOKIE_HEADER,
                value: GTAG_DEBUG_COOKIE + '=' + GTAG_DEBUG_COOKIE_VALUE
            };
        }
        headersToSend.push(cookieHeader);
        // Return the updated headers.
        return {
            requestHeaders: headersToSend
        };
    }
}, {
    urls: [GTAG_HTTP]
}, ['blocking', 'requestHeaders', 'extraHeaders']);
/**
 * Searches the given cookie string for a cookie named cookieName.  If found,
 * replaces the cookie's value with cookieValue.  Otherwise, appends a new
 * cookie with the name and value.
 *
 * @param {string} cookieString
 * @param {string} cookieName
 * @param {string} cookieValue
 * @return {string} The modified cookie string.
 */
function addOrReplaceCookie(cookieString, cookieName, cookieValue) {
    // Matches an entire cookie string that contains the named cookie.
    // Matching group 1: The cookie string preceding named cookie.
    // Matching group 2: The current value of the named cookie, including the
    // leading '='.
    // Matching group 3: The cookie string after the named cookie.
    let cookieMatcher =
        new RegExp('^(.*;\\s*)?' + cookieName + '\\s*(=[^;]*)?(\\s*;.*)?$');
    let cookieStrParts = cookieMatcher.exec(cookieString);
    if (cookieStrParts === null) {
        return (cookieString ? cookieString + ';' : '') + cookieName + '=' +
            cookieValue;
    } else {
        return (cookieStrParts[1] ? cookieStrParts[1] : '') + cookieName + '=' +
            cookieValue + (cookieStrParts[3] ? cookieStrParts[3] : '');
    }
}
/**
 * Generates a randomized cache buster.
 *
 * @return {number} The random cache buster.
 */
function generateCacheBuster() {
    return Math.floor(Math.random() * 10000);
}
