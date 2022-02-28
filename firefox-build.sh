#! /bin/bash

CHROME_DIST="dist-chrome"
FIREFOX_DIST="dist-firefox"

[[ -d "$FIREFOX_DIST" ]] && rm -rfd "$FIREFOX_DIST"
[[ -d "$CHROME_DIST" ]] && cp -r "$CHROME_DIST" "$FIREFOX_DIST"

sed -i '/\"name\":.*/i \\t\"browser_specific_settings\": {\"gecko\": {\"id\": \"addon@example.com\"}},' "$FIREFOX_DIST"/manifest.json 