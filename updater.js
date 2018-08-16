var https = require('https');

var auth_key = "APIKEY";
var email = "EMAIL";
var checkDuration = 5; // In minutes
var listZones = false; // Get zones and their dns record ids

var ids = [{
    "zone": "1be9d9c8480b00a37fd617cc6154ba41",
    "id": "dcf319ee90108b224d6c855bb90f9965",
    "proxy": false,
}, {
    "zone": "d3a5249bb49aa0e3c770b58a1737507b",
    "id": "ba1ae9659229da63170bd015e07a29ec",
    "proxy": true,
}, {
    "zone": "3cf13da0c52de94317ffa3d6d0c66b5f",
    "id": "54d70873993b0570789153caf6fd187c",
    "proxy": true,
}, ];

var tempIP;
var headers = {
    'X-Auth-Email': email,
    'X-Auth-Key': auth_key,
    'Content-Type': 'application/json',
};

// Get Zones
var zones = [];
if (listZones) {
    get("", false, function (zoneResult) {
        for (var i = 0; i < zoneResult.length; i++) {
            // Get DNS records
            if (zoneResult[i] != undefined) {
                getRecords(zoneResult, i)
            }
        }
    });
}

// Get dns records
async function getRecords(zoneResult, i) {
    get(zoneResult[i]["id"] + "/dns_records/", false, function (dnsResult) {
        //console.log(dnsResult)
        if (dnsResult != null && dnsResult.length != undefined) {
            for (var li = 0; li < dnsResult.length; li++) {
                var dns_records = [];
                if (dnsResult[li] != undefined && dnsResult[li]["id"] != undefined) {
                    dns_records.push(JSON.stringify({
                        "type": dnsResult[li]["type"],
                        //"content": dnsResult[li]["content"],
                        "id": dnsResult[li]["id"]
                    }));
                    if (li === dnsResult.length - 1) {
                        zones.push({
                            "name": zoneResult[i]["name"],
                            "id": zoneResult[i]["id"],
                            "dns_records": dns_records
                        })
                        if (i === zoneResult.length - 1) {
                            console.log(zones)
                        }
                    }
                }
            }
        } else if (dnsResult != undefined) {
            //console.log(dnsResult["name"], dnsResult["id"])
            zones.push({
                "name": zoneResult[i]["name"],
                "id": zoneResult[i]["id"],
                "dns_records": {
                    "name": dnsResult["name"],
                    "id": dnsResult["id"]
                }
            })
        }
    });
}

// Get IP from ipify.org and update every x seconds
setInterval(function () {
    get("https://api.ipify.org/?format=json", true, function (ip) {
        if (tempIP == undefined || tempIP !== ip) {
            for (var i = 0; i < ids.length; i++) {
                dns_update(ip, ids[i]["zone"], ids[i]["id"], ids[i]["proxy"]);
            }
        }
    });
}, 1000 * checkDuration * 60)

// Update DNS entry
function dns_update(ip, zoneid, id, proxy) {
    var body = JSON.stringify({
        "type": "A",
        "name": "@",
        "content": ip,
        "ttl": 1,
        "proxied": proxy
    });
    var options = {
        host: 'api.cloudflare.com',
        port: 443,
        path: '/client/v4/zones/' + zoneid + "/dns_records/" + id,
        method: "PUT",
        headers: headers,
    };
    var post = https.request(options, function (res) {
        res.on('data', function (d) {
            var result = JSON.parse(d);
            if (!result["success"]) {
                log("Error:", d);
            } else {
                log(tempIP + " => " + ip);
                tempIP = ip;
                log("IP updated successfully");
            }
        });
    });
    post.write(body);
    post.end();
    post.on('error', function (e) {
        console.error(e);
    });
}

function log(str) {
    console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ": ", str)
}

function get(path, ip, callback) {
    if (!ip) {
        var host = "api.cloudflare.com";
        var p = '/client/v4/zones/' + path;
        var h = headers;
    } else {
        var host = "api.ipify.org";
        var p = '/?format=json';
        var h = null;
    }
    var options = {
        host: host,
        port: 443,
        path: p,
        method: "GET",
        headers: h,
    };
    var req = https.get(options, function (res) {
        var bodyChunks = [];
        res.on('data', function (chunk) {
            bodyChunks.push(chunk);
        }).on('end', function () {
            if (!ip) {
                var body = JSON.parse(Buffer.concat(bodyChunks) + "")["result"];
                callback(body);
            } else {
                var body = JSON.parse(Buffer.concat(bodyChunks) + "")["ip"];
                callback(body);
            }
        })
    });
    req.on('error', function (e) {
        console.log('ERROR: ' + e.message);
    });
}
