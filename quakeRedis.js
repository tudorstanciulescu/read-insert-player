
var variables = require('./util/variables'); //variables used in local script.
var makeSlug = require('./util/makeSlug');
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret.json');
var redis = require("redis");
const { resolve } = require('path');
var meciuri = [7, 25, 43, 61, 79, 97, 115];
var json;
var inf;
var objects = [];
var BanPick = [];
var player1;
var player2;
var toornamentArray = [];
var player_data = [];
var row_data_to_redis = [];
var x = 0;
var redisIp = variables.connection.redisIp;
var aaaaa;



var db = redis.createClient(6379, redisIp);

db.auth('YfjcjkULNVVQdqaLYMK6gFxv7M6VmGt9zxctNCbfHku42xZju64CdfAkSgYQWT4v');
// db.auth(variables.connection.redisPass,() => {
// });
// db.select(redisDB);
async function accessSpreadsheet() {

    const doc = new GoogleSpreadsheet('1nHmmw2NYNfV_VFAxacpn2M3kz6pIWCtgsTC2gAllM2o');
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
    const docTitle = info.title;
    const sheet = info.worksheets[0]; //access data from first sheet in gss document and save in sheet variable
    const rows = await promisify(sheet.getRows)({
        offset: 0
    })
    console.log(`Document Title: ${docTitle}`);
    console.log(`Sheet Title: ${sheet.title}`);
    console.log(`${docTitle} spreadsheet URL: https://docs.google.com/spreadsheets/d/1nHmmw2NYNfV_VFAxacpn2M3kz6pIWCtgsTC2gAllM2o/edit#gid=640917880`)
    console.log(`Rows count in sheet: ${rows.length}`);
    for (let i = 0; i < meciuri.length; i++) {
        player1 = 0;
        player2 = 0;
        BanPick = [];
        inf = 0;
        match_data = rows[meciuri[i]].match;

        for (j = meciuri[i]; j < (meciuri[i] + 18); j++) {
            tabel = 0;
            if (j > meciuri[i] + 1) {
                json = {
                    step: rows[j].match,
                    process: rows[j].p1,
                    p1action: rows[j].p2,
                    p1: rows[j].timecest,
                    p2: rows[j]._ciyn3,
                    p2action: rows[j].p2action

                }
                BanPick[inf] = json;
                inf++;
            }
        }

        for (let i = 0; i < BanPick.length; i++) {
            process1 = (BanPick[i].process).split(' ');
            if (process1[0] == "Ban") {
                BanPick[i].process = "banned";
                BanPick[i].processSplit = process1[1];

            } else {
                BanPick[i].process = "picked";
                BanPick[i].processSplit = process1[1];
            }
        }
        for (let i = 0; i < BanPick.length; i++) {
            if (BanPick[i].p1action != '') {
                date = {
                    playerKey: BanPick[i].p1,
                    type: BanPick[i].process,
                    ban: BanPick[i].processSplit,
                    name: BanPick[i].p1action

                }
            }
            else {
                date = {
                    playerKey: BanPick[i].p2,
                    type: BanPick[i].process,
                    ban: BanPick[i].processSplit,
                    name: BanPick[i].p2action

                }
            }
            objects[i] = date;
        }
        maps = [];
        champions = [];
        player1 = BanPick[i].p1;
        player2 = BanPick[i].p2;
        // console.log(player1);
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].ban == "Map") {
                obiect = {
                    playerKey: objects[i].playerKey,
                    type: objects[i].type,
                    mapName: makeSlug.makeSlug(objects[i].name)
                }
                maps.push(obiect);

            }
            else {
                obiect = {
                    playerKey: objects[i].playerKey,
                    type: objects[i].type,
                    champName: makeSlug.makeSlug(objects[i].name)
                }
                champions.push(obiect)

            }
        }

        maps[(maps.length) - 1].playerKey = "remaining";
         if (champions[0].champName != '') {
            //if veto data              
            var data_to_redis = {
                match_data: match_data,
                players: [],
                champions: champions,
                maps: maps

            }
         

            row_data_to_redis[x] = {
                player2: player2,
                player1: player1,
                data_to_redis: data_to_redis
            };

            x++;
   

        }

    }

    

    for(let i=0;i<row_data_to_redis.length;i++) {
        if(row_data_to_redis[i].data_to_redis.champions[0].playerKey != makeSlug.makeSlug(player1)) {

            row_data_to_redis[i].player1 = row_data_to_redis[i].data_to_redis.champions[0].playerKey;
            row_data_to_redis[i].player2 = row_data_to_redis[i].data_to_redis.champions[1].playerKey;

        }
    }
    


    function getPlayerRedis() {
        return new Promise((resolve, reject) => {
            db.select(13, function (err, ree) {
                for (let i = 0; i < row_data_to_redis.length; i++) {
                    ['player1', 'player2'].forEach(playerNo => {
                        db.get(`players:${row_data_to_redis[i][playerNo]}`, function (err, obbObj) {
                            let obb = JSON.parse(obbObj);

                        //   console.log(obb);
                            player_data.push(obb);
                            
                            resolve(player_data)
                            // console.log(player_data);
                        })
                    })
                    
                }
            })
        })
    }

    function getTournamentRedis() {
        return new Promise((resolve, reject) => {
            db.select(13, function (err, res) {
                ["Americas", "Europe"].forEach(toornament => {
                    db.get(`toornamentData:Americas`, function (err, obj) {
                        let tournamentData = JSON.parse(obj);
                        //console.log(tournamentData);

                        toornamentArray.push(tournamentData);
                        resolve(toornamentArray)

                    });
                })
            })
        })
    }

    async function mainFunction() {
         let toornamentData = await getTournamentRedis();
        let playersData = await getPlayerRedis();
        //console.log(toornamentData);

        var toornament = [];
        for(let i=0;i<toornamentData.length;i++) {
            for(let j=0;j<toornamentData[i].length;j++){
                toornament.push(toornamentData[i][j]);
            }
        }
   

        for (let i = 0; i < row_data_to_redis.length; i++) {
            //console.log(row_data_to_redis[i].player1,row_data_to_redis[i].player2);
            for (j = 0; j < playersData.length; j++) {
                // console.log(playersData[j].nickname);
                if (row_data_to_redis[i].player1 == makeSlug.makeSlug(playersData[j].nickname)) {
                    row_data_to_redis[i].data_to_redis.players.push(playersData[j]);
                    //console.log(`Player 1 veto : ${row_data_to_redis[i].player1} == Player 1 redis: ${playersData[j].nickname}`);
                    //console.log(` Gasit la ${i} si la ${j} `);
                }
                if (row_data_to_redis[i].player2 == makeSlug.makeSlug(playersData[j].nickname)) {
                    row_data_to_redis[i].data_to_redis.players.push(playersData[j]);
                    // console.log(`Player 2 veto : ${row_data_to_redis[i].player2} == Player 2 redis: ${playersData[j].nickname}`);
                    // console.log(` Gasit la ${i} si la ${j} `);
                }
            }
        }


        for(let i=0;i<row_data_to_redis.length;i++) {
            console.log(row_data_to_redis[i].data_to_redis);
        }

        Obj_to_redis = {};
        var toSendObj = {}; 
        
        for (let i = 0; i < row_data_to_redis.length; i++) {
            Obj_to_redis = {};
            
             toSendObj = {
                "payload": {
                    "html": "quake/picks_and_bans",
                    "htmlAction": "init",
                    "action": "getHtml",
                    "data": {}
                },
                "endpoint": "mainHtml"
            }
            
            rowData = row_data_to_redis[i].data_to_redis
            toSendObj.payload.data = rowData;
            toSendObj.payload.data.title = "picks and bans";
            Obj_to_redis = JSON.stringify(toSendObj);
                
           db.set(`veto_w_11:${row_data_to_redis[i].player1}_${row_data_to_redis[i].player2}`, Obj_to_redis);
            

        }
      
    }
    mainFunction()

}

accessSpreadsheet();





