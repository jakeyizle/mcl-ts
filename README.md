The idea behind this project is to be able to search your combos and make/record several combos back-to-back (a playlist).
Currently this supports only native Dolphin recording

PLATFORMS:

    Windows/Osx/Ubunutu
    I have only tested the windows release 

Versioning:

    Updating should work

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
        Playback Dolphin Path - Open Slippi Launcher -> Settings -> Dolphin Settings -> Playback -> Open Containing Folder -> Use that Dolphin.exe. This is a special Dolphin for playing replays.
        Recording Path - where you want recordings to be saved
        Preroll frames - This will start combos earlier, so "30" would start the combo 30 frames before it actually begins
        Postroll frames - This will extend the end of the combo, so "45" would include 45 frames after the end of the combo
    Recordings:
        OBS is no longer supported because I'm lazy.
        You should open your playback dolphin GFX settings up the bitrate A LOT

TODO (no particular order):

    Add option for gfycat uploading
    Add option for recordings of playlists to be split into different files
    More search options
        AFTER/BEFORE date
        True Combo?
        DidKill take into account ragequits
    Create playlists in dropdown in table
    Game/converion stat breakdown
        Form to select Player and get stats?
        Show stats over time
    Analysis of playlists to predict/suggest additions
    Make the code consisent and look sane    
    Conversion-level preroll/postroll overrides in playlists
    Add loading icon to long operations

ISSUES:

    Need database migration system, currently have to delete DB everytime
        Electron update!    
    First search call is slow
        Not an index issue - it's a cold start issue
    React components getting out of hand
