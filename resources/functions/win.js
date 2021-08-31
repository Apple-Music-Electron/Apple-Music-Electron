const {app, Menu, nativeTheme, Notification} = require("electron");
const nativeImage = require('electron').nativeImage
const {checkUpdates} = require("./update");
const {join} = require("path");
const {Analytics} = require("./sentry");
Analytics.init()

const trayIconDir = (nativeTheme.shouldUseDarkColors ? join(__dirname, `../icons/media/light/`) : join(__dirname, `../icons/media/dark/`));
const Images = {
    next: nativeImage.createFromPath(join(trayIconDir, `next.png`)).resize({width: 32, height: 32}),
    nextInactive: nativeImage.createFromPath(join(trayIconDir, `next-inactive.png`)).resize({width: 32, height: 32}),

    pause: nativeImage.createFromPath(join(trayIconDir, `pause.png`)).resize({width: 32, height: 32}),
    pauseInactive: nativeImage.createFromPath(join(trayIconDir, `pause-inactive.png`)).resize({width: 32, height: 32}),

    play: nativeImage.createFromPath(join(trayIconDir, `play.png`)).resize({width: 32, height: 32}),
    playInactive: nativeImage.createFromPath(join(trayIconDir, `play-inactive.png`)).resize({width: 32, height: 32}),

    previous: nativeImage.createFromPath(join(trayIconDir, `previous.png`)).resize({width: 32, height: 32}),
    previousInactive: nativeImage.createFromPath(join(trayIconDir, `previous-inactive.png`)).resize({width: 32, height: 32}),
}

module.exports = {

    SetContextMenu: function (visibility) {

        if (visibility) {
            app.tray.setContextMenu(Menu.buildFromTemplate([
                {
                    label: 'Check for Updates',
                    click: function () {
                        checkUpdates(true)
                    }
                },
                {
                    label: 'Minimize to Tray',
                    click: function () {
                        if (typeof app.win.hide === 'function') {
                            app.win.hide();
                        }
                    }
                },
                {
                    label: 'Quit',
                    click: function () {
                        app.isQuiting = true
                        app.quit();
                    }
                }
            ]));
        } else {
            app.tray.setContextMenu(Menu.buildFromTemplate([
                {
                    label: 'Check for Updates',
                    click: function () {
                        checkUpdates(true)
                    }
                },
                {
                    label: 'Show Apple Music',
                    click: function () {
                        if (typeof app.win.show === 'function') {
                            app.win.show();
                        }
                    }
                },
                {
                    label: 'Quit',
                    click: function () {
                        app.isQuiting = true
                        app.quit();
                    }
                }
            ]));
        }
        return true

    },

    SetTaskList: function () {
        if (process.platform !== "win32") return;

        app.setUserTasks([
            {
                program: process.execPath,
                arguments: '--force-quit',
                iconPath: process.execPath,
                iconIndex: 0,
                title: 'Quit Apple Music'
            }
        ]);
        return true
    },

    SetThumbarButtons: function (state) {
        if (process.platform !== "win32") return;

        let array;
        switch (state) {

            // Paused
            case false:
            case "paused":
                console.log('[setThumbarButtons] Thumbar has been set to false/paused.')
                array = [
                    {
                        tooltip: 'Previous',
                        icon: Images.previous,
                        click() {
                            if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Previous song button clicked.') }
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").catch((err) => console.error(err))
                        }
                    },
                    {
                        tooltip: 'Play',
                        icon: Images.play,
                        click() {
                            if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Play song button clicked.') }

                            app.win.webContents.executeJavaScript("MusicKit.getInstance().play()").catch((err) => console.error(err))
                        }
                    },
                    {
                        tooltip: 'Next',
                        icon: Images.next,
                        click() {
                            if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Pause song button clicked.') }
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").catch((err) => console.error(err))
                        }
                    }
                ];
                break;

            // Inactive
            default:
            case "inactive":
                if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Thumbar has been set to default/inactive.') }
                array = [
                    {
                        tooltip: 'Previous',
                        icon: Images.previousInactive,
                        flags: ["disabled"]
                    },
                    {
                        tooltip: 'Play',
                        icon: Images.playInactive,
                        flags: ["disabled"]
                    },
                    {
                        tooltip: 'Next',
                        icon: Images.nextInactive,
                        flags: ["disabled"]
                    }
                ];
                break;

            // Playing
            case true:
            case "playing":
                if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Thumbar has been set to true/playing.') }
                array = [
                    {
                        tooltip: 'Previous',
                        icon: Images.previous,
                        click() {
                            if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Previous song button clicked.') }
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").catch((err) => console.error(err))
                        }
                    },
                    {
                        tooltip: 'Pause',
                        icon: Images.pause,
                        click() {
                            if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Play song button clicked.') }
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().pause()").catch((err) => console.error(err))
                        }
                    },
                    {
                        tooltip: 'Next',
                        icon: Images.next,
                        click() {
                            if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Pause song button clicked.') }
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").catch((err) => console.error(err))
                        }
                    }
                ]
                break;
        }

        console.log((app.win.setThumbarButtons(array) ? '[setThumbarButtons] Thumbar Buttons Set.' : '[setThumbarButtons] Thumbar Buttons Failed to be set.'))
    },

    SetTrayTooltip: function (attributes) {
        if (!app.preferences.value('general.trayTooltipSongName').includes(true)) return;

        if (app.preferences.value('advanced.verboseLogging').includes(true)) {
            console.log(`[UpdateTooltip] Updating Tooltip for ${attributes.name} to ${attributes.status}`)
        }

        if (attributes.status === true) {
            app.tray.setToolTip(`Playing ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
        } else {
            app.tray.setToolTip(`Paused ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
        }
    },

    CreateNotification: function (attributes) {
        if (!Notification.isSupported() || !(app.preferences.value('general.playbackNotifications').includes(true) || app.preferences.value('general.playbackNotifications').includes('minimized'))) return;

        if (app.preferences.value('general.playbackNotifications').includes("minimized") && !(!app.win.isVisible() || app.win.isMinimized())) {
            return;
        }

        if (app.preferences.value('advanced.verboseLogging').includes(true)) {
            console.log(`[CreateNotification] Notification Generating | Function Parameters: SongName: ${attributes.name} | Artist: ${attributes.artistName} | Album: ${attributes.albumName}`)
        }

        if (app.ipc.existingNotification) {
            console.log("[CreateNotification] Existing Notification Found - Removing. ")
            app.ipc.existingNotification.close()
            app.ipc.existingNotification = false
        }

        const NOTIFICATION_OBJECT = {
            title: attributes.name,
            body: `${attributes.artistName} - ${attributes.albumName}`,
            silent: true,
            icon: join(__dirname, '../icons/icon.png'),
            actions: []
        }

        if (process.platform === "darwin") {
            NOTIFICATION_OBJECT.actions = {
                actions: [{
                    type: 'button',
                    text: 'Skip'
                }]
            }
        }

        app.ipc.existingNotification = new Notification(NOTIFICATION_OBJECT)
        app.ipc.existingNotification.show()

        if (process.platform === "darwin") {
            app.ipc.existingNotification.addListener('action', (_event) => {
                app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[CreateNotification] skipToNextItem"))
            });
        }
    }
}