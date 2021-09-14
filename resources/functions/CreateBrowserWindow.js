const {app, BrowserWindow, nativeTheme} = require('electron')
const {join} = require('path')
const os = require('os')
const fs = require('fs')
const {Analytics} = require("./sentry");
let win;
Analytics.init()

const BrowserWindowCreation = {

    fetchTransparencyColor: function (fileName) {
        console.log(`[fetchTransparencyColor] Fetching color from ${fileName}`)
        const hex_codes = []
        fileName = join(app.userThemesPath, `${fileName.toLowerCase()}.css`)

        if (fs.existsSync(fileName)) {
            const file = fs.readFileSync(fileName, "utf8");
            file.split(/\r?\n/).forEach((line) => {
                if (line.includes("--transparency")) {
                    hex_codes.push(line.match(/[a-f0-9]{8}/gi)); // Fetches all the hex codes
                }
            })
        }

        if (hex_codes.length === 1) {
            return `#${hex_codes[0]}`
        } else if (hex_codes.length === 2) { // This is a shitty way of doing things but I'm not gonna search for it
            if (nativeTheme.themeSource === 'dark') {
                return `#${hex_codes[0]}` // Returns the first hex code found in the file (usually in the dark mode area)
            } else {
                return `#${hex_codes[1]}`
            }
        } else {
            return false
        }
    },

    isVibrancySupported: function () {
        // Windows 10 or greater
        return (
            process.platform === 'win32' &&
            parseInt(os.release().split('.')[0]) >= 10
        )
    },

    fetchAcrylicTheme: function () {
        let acrylicTheme;
        if (app.preferences.value('visual.theme') && app.preferences.value('visual.theme') !== "default") {
            acrylicTheme = BrowserWindowCreation.fetchTransparencyColor(app.preferences.value('visual.theme'))
        } else if (app.preferences.value('visual.theme') === "default") {
            acrylicTheme = (nativeTheme.shouldUseDarkColors ? '#0f0f0f10' : '#ffffff10')
        }

        if (!acrylicTheme) { // If no transparency color can be found in the theme file or the theme isn't default
            acrylicTheme = (nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
        }

        return acrylicTheme
    },

    fetchTransparencyOptions: function () {
        let transparencyOptions, transparencyTheme;

        // Set the Transparency Options
        if (app.preferences.value('visual.transparencyEffect') && app.preferences.value('visual.transparencyEffect') !== 'disabled' && process.platform !== "linux") {
            console.log('[fetchTransparencyOptions] Fetching Transparency Options')

            // If a Custom Theme is being used
            if (app.preferences.value('visual.transparencyTheme') === 'appearance-based') {
                transparencyTheme = BrowserWindowCreation.fetchAcrylicTheme()
            } else {
                transparencyTheme = app.preferences.value('visual.transparencyTheme');
            }

            transparencyOptions = {
                theme: transparencyTheme,
                effect: app.preferences.value('visual.transparencyEffect'),
                debug: app.preferences.value('advanced.devTools') !== '',
            }

            if (BrowserWindowCreation.isVibrancySupported()) {
                if (app.preferences.value('visual.transparencyEffect') === 'acrylic') {
                    transparencyOptions.disableOnBlur = !!app.preferences.value('visual.transparencyDisableBlur').includes(true);
                }
            } else {
                if (app.preferences.value('visual.transparencyEffect') === 'acrylic') {
                    app.preferences.value('visual.transparencyEffect', 'blur')
                    transparencyOptions.effect = 'blur'
                }
            }

            if (app.preferences.value('visual.transparencyMaximumRefreshRate')) {
                transparencyOptions.useCustomWindowRefreshMethod = true
                transparencyOptions.maximumRefreshRate = app.preferences.value('visual.transparencyMaximumRefreshRate')
            }

            app.transparency = true
        } else {
            app.transparency = false
            return false
        }

        console.log(`[fetchTransparencyOptions] Returning: ${JSON.stringify(transparencyOptions)}`)
        return transparencyOptions
    },

    CreateBrowserWindow: function () {
        console.log('[CreateBrowserWindow] Initializing Browser Window Creation.')

        const options = {
            icon: join(__dirname, `../icons/icon.ico`),
            width: 1024,
            height: 600,
            minWidth: (app.preferences.value('visual.frameType').includes('mac') ? (app.preferences.value('visual.streamerMode').includes(true) ? 400 : 300) : (app.preferences.value('visual.streamerMode').includes(true) ? 400 : 300)),
            minHeight: (app.preferences.value('visual.frameType').includes('mac') ? (app.preferences.value('visual.streamerMode').includes(true) ? 55 : 300) : (app.preferences.value('visual.streamerMode').includes(true) ? 115 : 300)),
            frame: (app.preferences.value('visual.frameType').includes('mac') ? false : true),
            title: "Apple Music",
            useContentSize: true,
            resizable: true,
            // Enables DRM
            webPreferences: {
                plugins: true,
                preload: join(__dirname, '../js/MusicKitInterop.js'),
                allowRunningInsecureContent: true,
                nodeIntegration: false,
                nodeIntegrationInWorker: false,
                contextIsolation: false,
                webSecurity: true,
                sandbox: false,
                nativeWindowOpen: true
            }
        };

        if (process.platform === 'darwin' && !app.preferences.value('visual.frameType').includes('mac')) { // macOS Frame
            options.titleBarStyle = 'hidden'
            options.titleBarOverlay = true
            options.frame = true
            app.preferences.value('visual.removeUpsell', [true]);
            app.preferences.value('visual.removeAppleLogo', [true]);
        }

        const transparencyOptions = BrowserWindowCreation.fetchTransparencyOptions()

        // BrowserWindow Creation
        if (app.transparency && transparencyOptions) {
            if (process.platform === "darwin") { // Create using electron's setVibrancy function
                console.log('[CreateBrowserWindow] Creating BrowserWindow with electron vibrancy.')
                options.vibrancy = 'fullscreen-ui'
                win = new BrowserWindow(options)
            } else { // Create using Acrylic Window
                console.log(`[CreateBrowserWindow] Creating Acrylic BrowserWindow.`)
                const acrylicWindow = require("electron-acrylic-window");
                win = new acrylicWindow.BrowserWindow(options)
                console.log(`[CreateBrowserWindow] Settings transparency options to ${JSON.stringify(transparencyOptions)}`)
                win.setVibrancy(transparencyOptions)
            }
        } else { // With transparency disabled
            console.log('[CreateBrowserWindow] Creating BrowserWindow.')
            win = new BrowserWindow(options);
            win.setBackgroundColor = '#1f1f1f00'
        }

        win.setTrafficLightPosition && win.setTrafficLightPosition({
            x: 20,
            y: 20
        })

        // alwaysOnTop
        if (!app.preferences.value('advanced.alwaysOnTop').includes(true)) {
            win.setAlwaysOnTop(false)
        } else {
            win.setAlwaysOnTop(true)
        }

        if (!app.preferences.value('advanced.menuBarVisible').includes(true)) win.setMenuBarVisibility(false); // Hide that nasty menu bar
        if (app.preferences.value('advanced.devTools') !== 'built-in') win.setMenu(null); // Disables DevTools
        if (app.preferences.value('advanced.devTools') === 'detached') win.webContents.openDevTools({mode: 'detach'}); // Enables Detached DevTools

        // Detect if the application has been opened with --minimized
        if (app.commandLine.hasSwitch('minimized')) {
            console.log("[Apple-Music-Electron] Application opened with --minimized");
            if (typeof win.minimize === 'function') {
                win.minimize();
            }
        }

        // Detect if the application has been opened with --hidden
        if (app.commandLine.hasSwitch('hidden')) {
            console.log("[Apple-Music-Electron] Application opened with --hidden");
            if (typeof win.hide === 'function') {
                win.hide();
                app.funcs.SetContextMenu()
            }
        }

        // Checks if transparency is turned on to show window (work around for thumbar issues)
        if (app.transparency) {
            win.show()
        }

        return win
    },

}

module.exports = BrowserWindowCreation