import { SlippiGame } from "@slippi/slippi-js";
const db = require('better-sqlite3')('melee.db');
const {
  v4: uuidv4
} = require('uuid');
import { ipcRenderer } from 'electron';

//load files into database
ipcRenderer.on('startLoad', async (event, message) => {
    console.log(message);
    (async () => {
        let {
            start,
            range,
            files
        } = message;
        let end = start + range;

        const insertGame = db.prepare("INSERT OR IGNORE INTO GAMES (name, path) VALUES (@name, @path)");
        const insertConversion = db.prepare("INSERT OR IGNORE INTO conversions (damagePerFrame, moveString, zeroToDeath, startAt, moveCount, id, filepath, playerIndex,opponentIndex,startFrame,endFrame,startPercent,currentPercent,endPercent,didKill,openingType,attackingPlayer,defendingPlayer,attackingCharacter,defendingCharacter,stage,percent,time) VALUES (@damagePerFrame, @moveString, @zeroToDeath, @startAt, @moveCount, @id, @filePath, @playerIndex,@opponentIndex,@startFrame,@endFrame,@startPercent,@currentPercent,@endPercent,@didKill,@openingType,@attackingPlayer,@defendingPlayer,@attackingCharacter,@defendingCharacter,@stage,@percent,@time)")
        const insertMove = db.prepare("INSERT OR IGNORE INTO MOVES (inverseMoveIndex, conversionId,moveId,frame,hitCount,damage, moveIndex) VALUES (@inverseMoveIndex, @conversionId,@moveId,@frame,@hitCount,@damage, @moveIndex)");
        const insertError = db.prepare("INSERT OR IGNORE INTO errorGame (name, path, reason) VALUES (@name, @path, @reason)");
        let currentFile: any;
        for (let i = start; i < end; i++) {
            try {
                currentFile = files[i];
                const game = new SlippiGame(files[i].path);
                const settings = game.getSettings();
                const metadata = game.getMetadata();

                let conversions = game.getStats()!.conversions;
                let moves = [];
                for (let j = 0; j < conversions.length; j++) {
                    //-123 is start of game
                    let defendingIndex = conversions[j].playerIndex
                    let attackingIndex = invertPlayerIndex(conversions[j].playerIndex);
                    conversions[j].startFrame = conversions[j].startFrame || -123;
                    conversions[j].endFrame = conversions[j].endFrame || game.getLatestFrame()!.frame;
                    conversions[j].filePath = files[i].path;
                    conversions[j].attackingPlayer = metadata.players[attackingIndex].names.code ?? '';
                    conversions[j].defendingPlayer = metadata.players[defendingIndex].names.code;
                    conversions[j].attackingCharacter = settings.players[attackingIndex].characterId;
                    conversions[j].defendingCharacter = settings.players[defendingIndex].characterId;
                    conversions[j].stage = settings.stageId;
                    conversions[j].percent = Math.round((conversions[j].currentPercent - conversions[j].startPercent) * 100) / 100;
                    conversions[j].time = Math.round((conversions[j].endFrame - conversions[j].startFrame) * 100) / 100;
                    conversions[j].damagePerFrame = Math.round((conversions[j].percent / conversions[j].time) * 100) / 100;
                    conversions[j].opponentIndex = defendingIndex;
                    conversions[j].didKill = conversions[j].didKill ? 1 : 0;
                    conversions[j].id = uuidv4();
                    conversions[j].moveCount = conversions[j].moves.length;
                    for (let k = 0; k < conversions[j].moves.length; k++) {
                        conversions[j].moves[k].conversionId = conversions[j].id;
                        conversions[j].moves[k].moveIndex = k;
                        //this makes searching at the end of combos possible
                        conversions[j].moves[k].inverseMoveIndex = conversions[j].moves.length - (k + 1)
                    }
                    //otherwise all conversions in a game have same startAt date
                    conversions[j].startAt = metadata.startAt + `${conversions[j].startFrame}F`;
                    conversions[j].zeroToDeath = conversions[j].startPercent === 0 && conversions[j].didKill == 1 ? 1 : 0;
                    //changing string from 10,12,13 to ,10,12,13, prevents weird search issues
                    //LIKE %0,1% will return the above. By adding commas we can do LIKE %,0,1,%
                    conversions[j].moveString = ',' + conversions[j].moves.map(move => move.moveId).join(',') + ',';
                    //copy by value
                    moves = moves.concat(conversions[j].moves);
                }
                insertGame.run(files[i]);

                const insertManyConversions = db.transaction((data) => {
                    for (const obj of data) insertConversion.run(obj);
                });
                insertManyConversions(conversions);

                //moves has to go after conversions cause foreign key is defined
                const insertManyMoves = db.transaction((data) => {
                    for (const obj of data) insertMove.run(obj);
                });
                insertManyMoves(moves);
            } catch (e) {
                console.log(e);
                if (currentFile) {
                    currentFile.reason = e.message || e;
                    insertError.run(currentFile);
                }
            }
            finally {
                ipcRenderer.invoke('gameLoad');
            }
        }
    })().finally(() => {
        ipcRenderer.invoke('finish');
    });
});

function invertPlayerIndex(index) {
    return index == 0 ? 1 : 0;
}

//search for conversions in database
//{ prepQuery, queryObject }
ipcRenderer.on('search', async (event, message) => {
    let start = Date.now();
    try {
        let { query, queryObject } = message;
        let prepQuery = db.prepare(query);
        let searchConversions = queryObject ? prepQuery.all(queryObject) : prepQuery.all();
        ipcRenderer.send('searchFinish', searchConversions);
        }   catch (e) {}
        finally {
            console.log(Date.now() - start)
        }
});

//make typescript stfu
declare module '@slippi/slippi-js' {
  interface ConversionType {
    filePath: string,
    attackingPlayer: string,
    defendingPlayer: string,
    attackingCharacter: number,
    defendingCharacter: number,
    stage: number,
    percent: number,
    time: number,
    damagePerFrame: number
    opponentIndex: number,
    //sqlite hates true/false
    didKill: number,


  }
}
