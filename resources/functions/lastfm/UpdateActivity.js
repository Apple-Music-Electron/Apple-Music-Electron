exports.UpdateLFMActivity = function (attributes) {
    if (!app.config.lastfmEnabled.includes(true)) return;

    console.log(`[UpdateLFMActivity] Scrobbling LastFM`)
    var {scrobble} = require("../lastfm/scrobbleSong");

    if (attributes.status === true && app.config.quick.lastfmEnabled.includes(true)) {
        scrobble(attributes)
    }
}

