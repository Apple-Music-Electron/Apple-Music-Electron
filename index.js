require('v8-compile-cache');
const {app, BrowserWindow, Tray, Menu} = require('electron')
const glasstron = require('glasstron');
const electron = require('electron');
const path = require('path')
const isReachable = require("is-reachable");
const nativeTheme = electron.nativeTheme;
const client = require('discord-rich-presence')('749317071145533440');
let isQuiting
let isMaximized
electron.app.commandLine.appendSwitch("enable-transparent-visuals");

// Set proper cache folder
app.setPath("userData", path.join(app.getPath("cache"), app.name))

// Optional Features
const customtitlebar = true // NOTE: Enables a custom macOS-isk titlebar instead of your respected platforms titlebars. Enable frame manually if disabled. (true by default)
const discordrpc = true // NOTE: Removes all Discord RPC when disabled. (true by default)
const showalbum = true // NOTE: Removes Album Name from Discord RPC when disabled (true by default)
const sitedetection = false // NOTE: Checks sites on startup if online when enabled. (false by default. can slow down start up performance)
const showscrollbars = false // NOTE: Shows scrollbars on page when enabled. (false by default)
const removeapplelogo = true // NOTE: Removes Apple Logo when enabled. (true by default)
const forcedarkmode = false // NOTE: Really only useful for Linux machines that don't support css dark mode. (false by default)
const sexytransparencymode = false // NOTE: kind of a CSS experiment that uses Glasstron as its blur renderer.
const closebuttonminimize = false // NOTE: means when you press the close button it minimizes the app instead of quiting.
// For those not familiar with javascript in anyway shape or form just change things from false to true or vice versa. Compile accordingly.

if (sexytransparencymode === true) {
  electron.app.commandLine.appendSwitch("enable-transparent-visuals");
}

function createWindow () {
  // Uncomment below if using sexytransparencymode and remove the old one.
  // const win = new glasstron.BrowserWindow({
  const win = new BrowserWindow({
    icon: path.join(__dirname, './assets/icon.png'),
    width: 1024,
    height: 600,
    minWidth: 300,
    minHeight: 300,
    frame: !customtitlebar,
    title: "Apple Music",
    // Enables DRM
    webPreferences: {
      plugins: true,
      preload: path.join(__dirname, './assets/MusicKitInterop.js'),
      allowRunningInsecureContent: true,
      contextIsolation: false,
      sandbox: true
    }
  })
  if (sexytransparencymode === true) {
    win.blurType = "blurbehind";
    win.setBlur(true);
  }


  // Hide toolbar tooltips / bar
  win.setMenuBarVisibility(false);


  // Function to Load the Website if its reachable.
  async function BetaAvailable() {
    const web = await isReachable('https://beta.music.apple.com')
    if (web) {
      appleMusicUrl = 'https://beta.music.apple.com';
    } else {
      appleMusicUrl = 'https://music.apple.com';
    }
  }

  // Skips the check if sitedetection is turned off.
  if (sitedetection) {
      BetaAvailable()
  } else {
      appleMusicUrl = 'https://music.apple.com';
  }

  win.loadURL(appleMusicUrl);

  win.on('page-title-updated', function (e) {
    e.preventDefault()
  });

  // hide app instead of quitting
  win.on('close', function (event) {
    event.preventDefault();
    if (!isQuiting && closebuttonminimize) {
        win.hide();
    } else if (!isQuiting && !closebuttonminimize) {
        app.isQuiting = true;
        app.quit();
    }
    event.returnValue = false;
  });

  // Hide iTunes prompt and other external buttons by Apple. Ensure deletion.  OPTIONAL: Create Draggable div to act as title bar. Create close, min, and max buttons. (OSX style since this is *Apple* Music)
  win.webContents.on('did-stop-loading', function () {
    win.webContents.executeJavaScript("const openitunes = document.getElementsByClassName('web-navigation__native-upsell'); while (openitunes.length > 0) openitunes[0].remove();");
    win.webContents.executeJavaScript("while (openitunes.length > 0) openitunes[0].remove();");
    win.webContents.executeJavaScript("console.log(\"Removed upsell.\")")
    if (sexytransparencymode === true) {
      win.webContents.executeJavaScript("document.getElementsByTagName('body')[0].style = 'background-color: rgb(25 24 24 / 84%) !important;';")
      win.webContents.executeJavaScript("document.getElementsByClassName('web-chrome')[0].style = 'top: 32px; background-color: #2d2d2d40; backdrop-filter: saturate(0%) blur(25px);';")
    }
    if (removeapplelogo === true) {
      win.webContents.executeJavaScript("const applelogo = document.getElementsByClassName('web-navigation__header web-navigation__header--logo'); while (applelogo.length > 0) applelogo[0].remove();");
      win.webContents.executeJavaScript("while (applelogo.length > 0) applelogo[0].remove();");
      win.webContents.executeJavaScript("document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.gridArea = \"auto\";")
      win.webContents.executeJavaScript("console.log(\"Removed Apple Logo successfully.\")")
    }
    if (customtitlebar === true) {
      win.webContents.executeJavaScript("if(document.getElementsByClassName('web-navigation')[0] && !(document.getElementsByClassName('web-navigation')[0].style.height == 'calc(100vh - 32px)')){ let dragDiv = document.createElement('div'); dragDiv.style.width = '100%'; dragDiv.style.height = '32px'; dragDiv.style.position = 'absolute'; dragDiv.style.top = dragDiv.style.left = 0; dragDiv.style.webkitAppRegion = 'drag'; document.body.appendChild(dragDiv); var closeButton = document.createElement('span'); document.getElementsByClassName('web-navigation')[0].style.height = 'calc(100vh - 32px)'; document.getElementsByClassName('web-navigation')[0].style.bottom = 0; document.getElementsByClassName('web-navigation')[0].style.position = 'absolute'; document.getElementsByClassName('web-chrome')[0].style.top = '32px'; var minimizeButton = document.createElement('span'); var maximizeButton = document.createElement('span'); document.getElementsByClassName('web-navigation')[0].style.height = 'calc(100vh - 32px)'; closeButton.style = 'height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag; '; minimizeButton.style = 'height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;'; maximizeButton.style = 'height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;'; closeButton.onclick= window.close; minimizeButton.onclick = ()=>{ipcRenderer.send('minimize')}; maximizeButton.onclick = ()=>{ipcRenderer.send('maximize')}; dragDiv.appendChild(closeButton); dragDiv.appendChild(minimizeButton); dragDiv.appendChild(maximizeButton); closeButton.onmouseenter = ()=>{closeButton.style.filter = 'brightness(50%)'}; minimizeButton.onmouseenter = ()=>{minimizeButton.style.filter = 'brightness(50%)'}; maximizeButton.onmouseenter = ()=>{maximizeButton.style.filter = 'brightness(50%)'}; closeButton.onmouseleave = ()=>{closeButton.style.filter = 'brightness(100%)'}; minimizeButton.onmouseleave = ()=>{minimizeButton.style.filter = 'brightness(100%)'}; maximizeButton.onmouseleave = ()=>{maximizeButton.style.filter = 'brightness(100%)'};}")
      win.webContents.executeJavaScript("console.log(\"Enabled custom titlebar.\")")
    }
  });

  // Fix those ugly scrollbars and also execute MusicKitInterop.
  win.webContents.once('did-stop-loading', async () => {
    if (showscrollbars === false) {
      await win.webContents.insertCSS('::-webkit-scrollbar { display: none; }')
    }
    await win.webContents.executeJavaScript('MusicKitInterop.init()')
  })

  // create system tray icon
  if (process.platform === 'win32') var trayIcon = new Tray(path.join(__dirname, './assets/icon.ico'))
  else trayIcon = new Tray(path.join(__dirname, './assets/icon.png'))

  // right click menu to quit and show app
  const ClosedContextMenu = Menu.buildFromTemplate([
    {
        label: 'Show Apple Music', click: function () {
            win.show();
        }
    },
    {
        label: 'Quit', click: function () {
            app.isQuiting = true;
            app.quit();
        }
    }
  ]);

  const OpenContextMenu = Menu.buildFromTemplate([
      {
          label: 'Minimize to Tray', click: function () {
              win.hide();
          }
      },
      {
          label: 'Quit', click: function () {
              app.isQuiting = true;
              app.quit();
          }
      }
  ]);
  trayIcon.setContextMenu(OpenContextMenu);

  // restore app on normal click
  trayIcon.on('click', () => {
    win.show()
  })

  win.on('hide', function (e) {
    trayIcon.setContextMenu(ClosedContextMenu);
  })

  win.on('show', function (e) {
      trayIcon.setContextMenu(OpenContextMenu);
  })

  // listen for minimize event
  electron.ipcMain.on('minimize', () => {
    win.minimize()
  })

  // listen for maximize event and perform restore/maximize depending on window state
  electron.ipcMain.on('maximize', () => {
    if (isMaximized) {
      win.restore()
      isMaximized = false
    } else {
      win.maximize()
      isMaximized = true
    }
  })

  // Insert Jarek Toros amazing work with MusicKit and Mpris (https://github.com/JarekToro/Apple-Music-Mpris/) (NOTE: Mpris is not enabled in this branch. See mpris-enabled)!
  electron.ipcMain.on('mediaItemStateDidChange', (item, a) => {
    updateMetaData(a)
    updateTooltip(a)
  })

  async function updateTooltip(attributes) {

    // Update tooltip when audio is playing.
    win.webContents.on('media-started-playing', () => {
      const tooltip = `Playing ${attributes.name} - ${attributes.albumName} by ${attributes.artistName}`;
      trayIcon.setToolTip(tooltip);
    })

    // Update tooltip when audio is paused
    win.webContents.on('media-paused', () => {
      const tooltip = `Paused ${attributes.name} on ${attributes.albumName} by ${attributes.artistName}`;
      trayIcon.setToolTip(tooltip)
    })

    // Start tooltip with idle name
    const tooltip = `Nothing's playing right now`;
    trayIcon.setToolTip(tooltip);
  }

  async function updateMetaData(attributes) {
    var discordrpcdetails
    var songlengthstring = Math.round(attributes.durationInMillis + Date.now());
    var songlength = Number(songlengthstring);
    if (showalbum === true) {
      discordrpcdetails = `${attributes.albumName} - ${attributes.artistName}`;
    } else {
      discordrpcdetails = `${attributes.artistName}`;
    }

    if (discordrpc === true) {
      win.webContents.on('media-started-playing', () => {
        client.updatePresence({
          state: discordrpcdetails,
          details: `${attributes.name}`,
          startTimestamp: Date.now(),
          endTimestamp: songlength,
          largeImageKey: 'apple',
          smallImageKey: 'play',
          instance: true,
        });
      });
      win.webContents.on('media-paused', () => {
        if (attributes.status === false) {
          client.updatePresence({
            state: "(Paused)",
            details: `${attributes.name}`,
            startTimestamp: Date.now(),
            endTimestamp: Date.now(),
            largeImageKey: 'apple',
            smallImageKey: 'pause',
            instance: true,
          });
        }
      });
    }
  }
}

// This argument is for Linux operating systems that dont support the CSS theme preference.
if (forcedarkmode === true) {
  nativeTheme.themeSource = 'dark';
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

app.on('window-all-closed', () => {
    app.quit()
})

app.on('before-quit', function () {
  isQuiting = true;
});
