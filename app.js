var http = require('http')
var fs = require('fs')
var assert = require('assert')
var url = require('url')

function get(siteUrl, cb) {
    console.log(siteUrl)
//    siteUrl = url.parse(siteUrl)
//    client = http.createClient(80, siteUrl.hostname)
//    request = client.request('GET', siteUrl.pathname, {'host': siteUrl.hostname})
    client = http.createClient(80, 'clients.mindbodyonline.com')
    request = client.request('GET', '/', {'host': 'clients.mindbodyonline.com'})
    request.end()
    request.on('response', function(response) {
        var body = ''
        response.setEncoding('utf8')
        response.on('data', function(chunk) {
            body += chunk
        })
        response.on('end', function() {
            cb(body)
        })
    })
}

function walkSite(siteUrl, callback) {

    var parsedSiteUrl = url.parse(siteUrl)

    console.log(parsedSiteUrl)

    get(siteUrl, function(responseString) {
        
        callback(responseString)

        var urls = parseUrls(responseString)

        if (urls.length) {

            urls.forEach(function(childUrl) {

                var parsedChildUrl = url.parse(childUrl)

                if (parsedChildUrl.hostname) {
                    if (parsedChildUrl.hostname === parsedSiteUrl.hostname) {
                        walkSite(childUrl.hostname, callback)
                    } 
                } else {
                    walkSite(parsedSiteUrl.hostname + '/' + parsedChildUrl.href, callback)
                }

            })

        }

    })

}

walkSite('http://clients.mindbodyonline.com/', function(htmlString) {
    console.log('success ' + htmlString.length)
})

var parseUrls = function(htmlString) {
    
    var path = /(href|src|HREF|SRC)\=\"?[a-zA-Z0-9\?\&\%\/\.\-\_\,\'\#\=\:]*\"?/g
    
    var urlAttributes = htmlString.match(path)
        
    var urls = []

    urlAttributes.forEach(function(url) {
        
        var cleanedUrl = url.replace(/"/g, '').substr((url.match(/src|SRC/) ? 4 : 5), url.length)

        urls.push(cleanedUrl)

    })

    return urls

}

// ------------ seperate me

var testParseUrls = function () {
    // find all urls
    var localhostSource = fs.readFileSync('localhost.html', 'utf8')

    var urls = parseUrls(localhostSource)

    // assert with the answer too
    assert.deepEqual(urls, [ '/favicon.ico'
                             , '/favicon.ico'
                             , 'asp/default_main.asp?lan='
                             , 'asp/blank.htm'
                             , 'http://ebay.com'
                             , 'http://ebay.com/'
                             , 'http://ebay.com/route?stuff=woah&nonsense=ok'
                           ])
}
testParseUrls()