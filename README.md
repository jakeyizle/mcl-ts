The idea behind this project is to go over all of your SSBM slippi replay files and get the conversions (as defined by slippi-js, basically combos). These are stored in a sqlite database, which we can search from. You can assign conversions to playlists, and then play them and record them (using OBS or dolphin frame dump and eventually upload them to gfycat). There are several settings that need to be set.

PLATFORMS:

    Windows (see releases)

Versioning:

    Expect every release to contain breaking changes for the foreseeable future

Security:

    No

How to use:

    Application Workflow:
        Go to settings, set Replay Path (for replay loading). Set Iso/Playback path if you want to be able to play clips. Set recording options if you want to be able to record playlists.
        Go to Home - this will start the replay loading process
        Go to playlists and create playlists (you can't create them on the search page yet)
        Go to search - here you can search for combos, watch them, and add them to playlists
        Go to playlists - here you can order the combos, play the entire playlist, and play&record the entire playlist
    Settings:
        Replay Path - Select the folder where your Slippi replays are stored (usually like Documents\Slippi)
        SSBM ISO Path - Select your SSBM ISO - any ISO that works with Slippi will work (ex: Animelee, Crystal, Diet)
        Playback Dolphin Path - Open Slippi Launcher -> Settings -> Dolphin Settings -> Playback -> Open Containing Folder -> Use that Dolphin.exe. This is a special Dolphin for playing back replays
        Recording Path - where you want recordings to be saved
        Preroll frames - This will start combos earlier, so "30" would start the combo 30 frames before it actually begins
        Postroll frames - This will extend the end of the combo, so "45" would include 45 frames after the end of the combo
        obsPassword/obsPort - OBS Websocket settings found in OBS -> Tools -> WebSockets Server Settings. BOTH must be set to use OBS recordings (see below)
        Recording method - Dolphin framedump or OBS (see below)
    Recordings:
        There are 2 methods to recording, each with their own pros/cons:
        Dolphin framedump
            PROS:
                Recordings should always be at 60fps
                Can control resolution by opening Playback Dolphin -> Graphics -> Enhancements (Set desired resolution), then -> Advanced (Full Resolution Frame Dumps)
            CONS:
                Slow, based on what you set the resolution to
                No audio at all at the moment
        OBS Websocket - you must install OBS, then OBS Websocket, then set the OBS password and port. You must have started OBS before you record
            PROS:
                Much faster
                Has game audio (game music can be disabled by opening Playback Dolphin -> Right click your SSBM ISO -> Properties -> Gecko Codes -> Optional: Game Music OFF
            CONS:
                If your replay stutters, the recording will stutter
                Will record audio from other sources on your computer

TODO (no particular order):

    Add option for gfycat uploading
    Add option for recordings of playlists to be split into different files
    More search options (search based on moves in conversion, etc)
        AFTER/BEFORE date
    Better table display (configurable columns?)
        after page 2 stuff starts to get cut off
        create playlists in dropdown in table
    Game/converion stat breakdown
        Form to select Player and get stats?
        Show stats over time
    Analysis of playlists to predict/suggest additions
    Make the code consisent and look sane
    Webpack/PROD babel build of code
    Conversion-level preroll/postroll overrides in playlists
    Add loading icon to long operations

ISSUES:

    Need database migration system, currently have to delete DB everytime
        Electron update!
    Load up is very slow
    First search call is slow
        Must be an indexing thing - only happens on very first call
    React components getting out of hand
