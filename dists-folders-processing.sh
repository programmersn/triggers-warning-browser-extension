#! /bin/bash

CHROME_DIST="dist-chrome"
FIREFOX_DIST="dist-firefox"

# Inject browser_specific_setting key in firefox's dist manifest as it is required

[[ -d "$FIREFOX_DIST" ]] && rm -rvfd "$FIREFOX_DIST"
[[ -d "$CHROME_DIST" ]] && cp -r "$CHROME_DIST" "$FIREFOX_DIST"

sed -i '/\"name\":.*/i \\t\"browser_specific_settings\": {\"gecko\": {\"id\": \"addon@example.com\"}},' "$FIREFOX_DIST"/manifest.json 

# Convert chrome's dist manifest towards V3
#manifestConverter="$HOME"/extension-manifest-converter/emc.py

#python "$manifestConverter" "$CHROME_DIST"

# copy dist folders to windows filesystem
rm -rvfd "$HOME"/shared_research_drive/Research/Startup_Ideas/Trigger_Warnings_System/FrontendComponents/browsers-extensions/{"$CHROME_DIST", "$FIREFOX_DIST"}

cp -r "$CHROME_DIST" "$HOME"/shared_research_drive/Research/Startup_Ideas/Trigger_Warnings_System/FrontendComponents/browsers-extensions/
cp -r "$FIREFOX_DIST" "$HOME"/shared_research_drive/Research/Startup_Ideas/Trigger_Warnings_System/FrontendComponents/browsers-extensions/

# clean
#rm -rvfd "$CHROME_DIST"_delete