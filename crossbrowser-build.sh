#! /bin/bash

CHROME_DIST="dist-chrome"
CHROME_DIST_ZIP="untrig-chrome.zip"
FIREFOX_DIST="dist-firefox"
FIREFOX_DIST_ZIP="untrig-firefox.zip"

# Scatter files depending on browser
rm -rfdv "$FIREFOX_DIST"
cp -rv "$CHROME_DIST" "$FIREFOX_DIST"
rm -v "$FIREFOX_DIST"/manifest-chrome.json "$FIREFOX_DIST"/backgroundChrome.js
mv -v "$FIREFOX_DIST"/manifest-firefox.json "$FIREFOX_DIST"/manifest.json
mv -v "$FIREFOX_DIST"/backgroundFirefox.js "$FIREFOX_DIST"/background.js

rm -v "$CHROME_DIST"/{manifest-firefox.json,backgroundFirefox.js,contentScriptNetflixPlaybackController.js}
mv -v "$CHROME_DIST"/manifest-chrome.json "$CHROME_DIST"/manifest.json
mv -v "$CHROME_DIST"/backgroundChrome.js "$CHROME_DIST"/background.js

# copy dist folders to windows filesystem
WINDOWS_PATH="shared_research_drive/Research/Startup_Ideas/Online_Graphic_Scenes_Database/FrontendComponents/browsers-extensions"
echo "removing dist folders from windows path ..."
rm -rvfd "$HOME"/"$WINDOWS_PATH"/{"$CHROME_DIST","$FIREFOX_DIST"}

pushd "$CHROME_DIST"
zip -r "$CHROME_DIST_ZIP" *
popd
cp -rv "$CHROME_DIST" "$HOME"/"$WINDOWS_PATH"

pushd "$FIREFOX_DIST"
zip -r "$FIREFOX_DIST_ZIP" *
popd
cp -rv "$FIREFOX_DIST" "$HOME"/"$WINDOWS_PATH"
