// Offline build entry (replaces browser.js.j2): asset pack served
// same-origin at /assetpack/, no auth server, no analytics.
const store = require('@/../webapp/localstore.js')

window.webAppAppVersion = "2.5.7-android"
window.webAppAssetPackHref = document.location.origin + "/assetpack/"
window.webAppAuthServerUrl = "" // offline build: no auth server
// External mod support removed - only supporting imods now
window.webAppIModsDir = "../src/imods/"

window.webAppOpinionatedDefaults = {
  showAddressBar: false,
  mspaMode: true,
  ruffleFallback: true,
  useTabbedBrowsing: false,
  modListEnabled: []
}

window.webAppOpinionatedModDefaults = {
  "oddities": {
    "readmeta": false,
    "no2009": true,
    "calliope": true
  },
  "tuhc-commentary": {"show_author": true},
  "tuhc-readmspa": {"transcripts": true, "nominor": true, "alttext": true}
}

window.webAppModJs = {
  'fallback.js': require('@/../webapp/mod_fallback.js'),

  _bolin: import('../src/imods/_bolin.js'),
  _hqAudio: import('../src/imods/_hqAudio.js'),
  _pxsTavros: import('../src/imods/_pxsTavros.js'),
  _replaybound: import('../src/imods/_replaybound/mod.js'),
  _secret: import('../src/imods/_secret/mod.js'),
  _soluslunes: import('../src/imods/_soluslunes.js'),
  _twoToThree: import('../src/imods/_twoToThree/mod.js'),
  _unpeachy: import('../src/imods/_unpeachy.js'),
  serveropts: lockmod({
    title: "Offline build customization layer",
    author: "GiovanH",
    modVersion: .1,
    vueHooks: [
      {
        matchName: "credits",
        data: {
          archiveCredits($super) {
            // Requested removal on the web version
            return $super.filter((obj) => (obj.name !== 'MrCheeze'));
          }
        }
      },
      {
        matchName: "skaianet",
        mounted() {
          (async () => {
            this.cursedText = {
              "/archive/skaianet/FORBIDDEN_ENTRIES/01-1863-Calamity.txt": (await import("!raw-loader!../src/data/forbidden_entries/01-1863-Calamity.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/02-1864-Centralia.txt": (await import("!raw-loader!../src/data/forbidden_entries/02-1864-Centralia.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/03-1873-TrainRobbery.txt": (await import("!raw-loader!../src/data/forbidden_entries/03-1873-TrainRobbery.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/04-1876-RIPJamesBros.txt": (await import("!raw-loader!../src/data/forbidden_entries/04-1876-RIPJamesBros.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/05-1881-Crocker.txt": (await import("!raw-loader!../src/data/forbidden_entries/05-1881-Crocker.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/06-1889-Skaianet.txt": (await import("!raw-loader!../src/data/forbidden_entries/06-1889-Skaianet.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/07-1895-Einstein.txt": (await import("!raw-loader!../src/data/forbidden_entries/07-1895-Einstein.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/08-1896-FredKarnosArmy.txt": (await import("!raw-loader!../src/data/forbidden_entries/08-1896-FredKarnosArmy.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/09-1903-PatentOffice.txt": (await import("!raw-loader!../src/data/forbidden_entries/09-1903-PatentOffice.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/10-1910-JaneAndJake.txt": (await import("!raw-loader!../src/data/forbidden_entries/10-1910-JaneAndJake.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/11-1923-JakeLeaves.txt": (await import("!raw-loader!../src/data/forbidden_entries/11-1923-JakeLeaves.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/12-1926-RIPHoudini.txt": (await import("!raw-loader!../src/data/forbidden_entries/12-1926-RIPHoudini.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/13-1927-PuttingPantsOnPhilip.txt": (await import("!raw-loader!../src/data/forbidden_entries/13-1927-PuttingPantsOnPhilip.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/14-1931-JakeReturns.txt": (await import("!raw-loader!../src/data/forbidden_entries/14-1931-JakeReturns.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/15-1933-HitlersPromotion.txt": (await import("!raw-loader!../src/data/forbidden_entries/15-1933-HitlersPromotion.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/16-1942-AnnDunham.txt": (await import("!raw-loader!../src/data/forbidden_entries/16-1942-AnnDunham.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/17-1945-WWII.txt": (await import("!raw-loader!../src/data/forbidden_entries/17-1945-WWII.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/18-1955-RIPEinstein.txt": (await import("!raw-loader!../src/data/forbidden_entries/18-1955-RIPEinstein.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/19-1957-RIPHardy.txt": (await import("!raw-loader!../src/data/forbidden_entries/19-1957-RIPHardy.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/20-1961-NextPhase.txt": (await import("!raw-loader!../src/data/forbidden_entries/20-1961-NextPhase.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/21-1964-TheFieriClones.txt": (await import("!raw-loader!../src/data/forbidden_entries/21-1964-TheFieriClones.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/22-1965-LaurelsLastStand.txt": (await import("!raw-loader!../src/data/forbidden_entries/22-1965-LaurelsLastStand.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/23-1965-2009-SkipToTheEnd.txt": (await import("!raw-loader!../src/data/forbidden_entries/23-1965-2009-SkipToTheEnd.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/24-1863-1965-PostScratchTimeline.txt": (await import("!raw-loader!../src/data/forbidden_entries/24-1863-1965-PostScratchTimeline.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/25-1965-HarryAdoptsFieriAgain.txt": (await import("!raw-loader!../src/data/forbidden_entries/25-1965-HarryAdoptsFieriAgain.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/26-1977-ChaplinsLastStand.txt": (await import("!raw-loader!../src/data/forbidden_entries/26-1977-ChaplinsLastStand.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/27-1989-ICP.txt": (await import("!raw-loader!../src/data/forbidden_entries/27-1989-ICP.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/28-1996-JaneAndJake.txt": (await import("!raw-loader!../src/data/forbidden_entries/28-1996-JaneAndJake.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/29-2008-Obama.txt": (await import("!raw-loader!../src/data/forbidden_entries/29-2008-Obama.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/30-2011-Rebranding.txt": (await import("!raw-loader!../src/data/forbidden_entries/30-2011-Rebranding.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/31-2016-Trump.txt": (await import("!raw-loader!../src/data/forbidden_entries/31-2016-Trump.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/32-2024-TheDoubleJuggaloPresidency.txt": (await import("!raw-loader!../src/data/forbidden_entries/32-2024-TheDoubleJuggaloPresidency.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/33-2029-Apophis.txt": (await import("!raw-loader!../src/data/forbidden_entries/33-2029-Apophis.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/34-2050-Flooding.txt": (await import("!raw-loader!../src/data/forbidden_entries/34-2050-Flooding.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/35-2040-2424-PreparingAlterniaC.txt": (await import("!raw-loader!../src/data/forbidden_entries/35-2040-2424-PreparingAlterniaC.txt")).default,
              "/archive/skaianet/FORBIDDEN_ENTRIES/36-RIPHIC.txt": (await import("!raw-loader!../src/data/forbidden_entries/36-RIPHIC.txt")).default,
            }
          })();
        }
      }
    ]
  })
}

window.webAppModTrees = require('../build/webAppModTrees.json')

async function getArchiveData() {

  // NB webpack require mandates full literal strings here, no paramterization.
  const imports = {
    version: import('../src/data/version.json'),
    mspa: import('../src/data/mspa.json'),
    social: import('../src/data/social.json'),
    news: import('../src/data/news.json'),
    music: import('../src/data/music.json'),
    comics: import('../src/data/comics.json'),
    extras: import('../src/data/extras.json'),
    tweaks: import('../src/data/tweaks.json'),
  }

  const modules = Object.fromEntries(
    (await Promise.all(
      Object.entries(imports)
      .map(async ([name, promise]) => [name, (await promise).default])
    ))
  )

  const {version, ...otherModules} = modules;
  return {
    tweaks: {},
    ...version,
    ...otherModules,
    audioData: {},
    flags: {},
    mspfa: {}
  }
}

// End configuration
window.isWebApp = true

window.localstore = store

if (!Array.prototype.toReversed) {
  const toReversed = require('array.prototype.toreversed');
  var shimmed = toReversed.shim();
}

function lockmod(modjs) { // hoisted
  modjs._internal = true
  modjs.hidden = true
  return modjs
}

if (!store.has("mods")) {
  store.set("mods", window.webAppOpinionatedModDefaults)
}

// seed mod flags into the localstore before mods.js evaluates
try {
  const persisted = JSON.parse(localStorage.getItem("tuhcLocalData") || "{}")
  const s = persisted.settings || {}
  const modFlagDefaults = {
    jsFlashes: true,
    hqAudio: false,
    bolin: true,
    soluslunes: true,
    unpeachy: true,
    pxsTavros: true,
    ruffleFallback: true,
    newReader: { current: "001901", limit: "001902" }
  }
  for (const k in modFlagDefaults) {
    store.set("settings." + k, (k in s) ? s[k] : modFlagDefaults[k])
  }
} catch (e) {
  console.error("Failed to seed mod settings:", e)
}

const Mods = require("../src/mods.js").default

async function loadArchiveData() {
  // We have to de-module the data into raw json so it's not mutable, otherwise the content doesn't reset on reload.
  console.time("getArchiveData")
  const archive_data_modules = await getArchiveData()
  console.timeEnd("getArchiveData")

  console.time("data copy")
  const data = JSON.parse(JSON.stringify(archive_data_modules))
  console.timeEnd("data copy")

  data.tweaks.tzPasswordPages = Object.values(data.mspa.story)
    .filter(v => v.flag.includes('TZPASSWORD'))
    .map(v => v.pageId)

  // Sanity checks
  const required_keys = ['mspa', 'social', 'news', 'music', 'comics', 'extras']
  required_keys.forEach(key => {
    if (!data[key]) throw new Error("Archive object missing required key", key)
  })

  return data
}

const fakeIpc = require('./fakeIpc.js')

fakeIpc.on('RELOAD_ARCHIVE_DATA', (event) => {
  fakeIpc.send('SET_LOAD_STATE', "LOADING")
  try {
    loadArchiveData().then(data => {
      fakeIpc.send('ARCHIVE_UPDATE', data)
    })
  } catch (e) {
    fakeIpc.send('SET_LOAD_STATE', "ERROR")
  }
})

require('../src/main')
