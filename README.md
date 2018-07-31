# [cf-dns-autoupdater](https://github.com/bostrot/cf-dns-autoupdater)
Automatic DNS updater for Cloudflare written in NodeJS. This simple script updates the DNS records of your Cloudflare Domains every now and then. It can be used with multiple domains.

# Usage

Update updater.js and add your Cloudflare API key and email. Then you can either add your zones and the corresponding dns_record ids directly to the given array or set `listZones` to true, to list all available zones and their dns records.

updater.js:

```
var auth_key = "YOUR_API_KEY";
var email = "YOUR_EMAIL";
var checkDuration = 5; // In minutes
var listZones = false; // Get zones and their dns record ids

var ids = [{
    "zone": "YOUR_ZONE_ID",
    "id": "YOUR_DNS_RECORD_ID"
}, {
    "zone": "YOUR_ZONE_ID",
    "id": "YOUR_DNS_RECORD_ID"
}, {
    "zone": "YOUR_ZONE_ID",
    "id": "YOUR_DNS_RECORD_ID"
}, ];
```

Then if you want/have it you can add it to autostart. Edit the `dnsupdater.service` to contain both your directory path and the path of updater.js. Now just enable autostart:

`sudo systemctl enable dnsupdater.service`

Start it:

`sudo systemctl start dnsupdater.service`

And check whether it through any errors:

`sudo systemctl status dnsupdater.service`

# Cloudflare API

This uses the Cloudflare API v4 https://api.cloudflare.com/ to change DNS settings for multiple domains.
