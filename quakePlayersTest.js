
var variables = require('./util/variables'); //variables used in local script.
var makeSlug = require('./util/makeSlug');
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret.json');
var redis = require("redis");
const Redis = require('ioredis');
const { resolve, parse } = require('path');
var meciuri = [7, 25, 43, 61, 79, 97, 115];
var json;
var inf;
var objects = [];
var BanPick = [];
var player11 = [];
var player22 = [];
var player1;
var player2;
var toornamentArray = [];
var player_data = [];
var obb;
var row_data_to_redis = [];
var x = 0;
var redisIp = variables.connection.redisIp;
var redisDB = variables.connection.redisDBquake;

var match_redis=[];
const client = new Redis(6379);

function connectRedis() {
    client.on('connect', () => {
        console.log("Connected to REDIS Database.");
    });

    // selected desired db
    client.select(13);
}

connectRedis();


// var db = redis.createClient(6379, redisIp);

// db.on('connect', function() {
//     console.log('connected on ' + redisIp);
//     db.select(13);
// });

// redisClients[clientName] = redis.createClient(6379, redisClients[clientName]);
// db.auth('YfjcjkULNVVQdqaLYMK6gFxv7M6VmGt9zxctNCbfHku42xZju64CdfAkSgYQWT4v');


// db.auth(variables.connection.redisPass,() => {
// });
// db.select(redisDB);

async function accessSpreadsheet() {

    const doc = new GoogleSpreadsheet('17bkfOIfBCOfaXY7eM3acg-unJprTbSX6UJIHlP0LrTk');
    //const doc = new GoogleSpreadsheet('1c4yHhbEdXbuYUdQzkeGDnOBssjptRRZIuQhNCUSdXJI');  //aceess the data from specific gss
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
    const docTitle = info.title;
    const sheet = info.worksheets[0]; //access data from first sheet in gss document and save in sheet variable
    const rows = await promisify(sheet.getRows)({
        offset: 0
    })
    console.log(`Document Title: ${docTitle}`);
    console.log(`Sheet Title: ${sheet.title}`);
    console.log(`${docTitle} spreadsheet URL: https://docs.google.com/spreadsheets/d/1c4yHhbEdXbuYUdQzkeGDnOBssjptRRZIuQhNCUSdXJI/edit#gid=0`)
    console.log(`Rows count in sheet: ${rows.length}`);
    // console.log(rows);
    //console.log(rows[1]);

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
                //console.log(json);
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
        //console.log(maps[maps.length-1].playerKey);


        if (champions[0].champName != '') {
            //if veto data              
            var data_to_redis = {
                match_data: match_data,
                players: [],
                champions: champions,
                maps: maps

            }
            //console.log(player1," ",player2);        
            //console.log(data_to_redis);
            // player11[i]=player1;
            // player22[i]=player2;

            row_data_to_redis[x] = {
                player2: player2,
                player1: player1,
                data_to_redis: data_to_redis
            };

            x++;
            // db.select(13, function(err,res) {
            //     redis = JSON.stringify(data_to_redis);
            //     db.set(`veto_w_10:${player11[i]}_${player22[i]}`,redis);
            //                                  })



        }

    }


    async function getPlayerRedis() {        
        const detailedPlayers = [];

        async function getDetailedPlayers(pName) {
            const redisPlayer = await client.get(`players:${pName}`);
            const parsedRedisPlayer = JSON.parse(redisPlayer);
            detailedPlayers.push(parsedRedisPlayer)
        }

        await Promise.all(Object.keys(row_data_to_redis).forEach(cheie => {
            ['player1', 'player2'].forEach(playerNo => {
                // console.log(row_data_to_redis[cheie][playerNo]);
                getDetailedPlayers(row_data_to_redis[cheie][playerNo]);
            })
        }));

        // console.log(detailedPlayers);

        return detailedPlayers;

    }

    // async function getPlayerRedis() {        
    //     const detailedPlayers = [];

    //     function getDetailedPlayers(pName) {
    //         db.get(`players:${pName}`, async function(err, obbBj) {
    //             let obb = await JSON.parse(obbBj);
    //             // console.log(obb);
    //             detailedPlayers.push(obb);
                
    //         });
    //     }

    //     // await Promise.all
    //     // console.log(row_data_to_redis);
    //     // console.log("aa");

    //     await Promise.all(Object.keys(row_data_to_redis).forEach(cheie => {
    //         ['player1', 'player2'].forEach(playerNo => {
    //             // console.log(row_data_to_redis[cheie][playerNo]);
    //             getDetailedPlayers(row_data_to_redis[cheie][playerNo]);
    //         })
    //     }));

    //     return detailedPlayers;

    // }

    // function getPlayerRedis() {
    //     return new Promise((resolve, reject) => {
    //         db.select(13, function (err, ree) {
    //             for (let i = 0; i < row_data_to_redis.length; i++) {
    //                 ['player1', 'player2'].forEach(playerNo => {
    //                     db.get(`players:${row_data_to_redis[i][playerNo]}`, function (err, obbObj) {
    //                         let obb = JSON.parse(obbObj);

    //                     //   console.log(obb);
    //                         player_data.push(obb);
                            
    //                         resolve(player_data)
    //                         // console.log(player_data);
    //                     })
    //                 })
                    
    //             }
    //         })
    //     })
    // }


    // function getPlayerRedis() {
    //     return new Promise((resolve, reject) => {
    //         db.select(13, function (err, ree) {
    //             for (let i = 0; i < row_data_to_redis.length; i++) {
    //                 ['player1', 'player2'].forEach(playerNo => {
    //                     db.get(`players:${row_data_to_redis[i][playerNo]}`, function (err, obbObj) {
    //                         let obb = JSON.parse(obbObj);

    //                     //   console.log(obb);
    //                         player_data.push(obb);
                            
    //                         resolve(player_data)
    //                         // console.log(player_data);
    //                     })
    //                 })
                    
    //             }
    //         })
    //     })
    // }

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

    // getTournamentRedis();


    // getPlayerRedis()
    // getPlayerRedis().then((player) => {
    //  console.log(player) 
    // })

    async function mainFunction() {
        // let toornamentData = await getTournamentRedis();

        let playersData = await getPlayerRedis();
       // console.log(playersData);
       
        for (let i = 0; i < row_data_to_redis.length; i++) { 
        //    console.log(row_data_to_redis[i].player1);
        //    console.log(row_data_to_redis[i].player2)
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
           
            db.set(`veto_w_13:${row_data_to_redis[i].player1}_${row_data_to_redis[i].player2}`, Obj_to_redis);
            

        }
      

        

        for(let i=0;i<row_data_to_redis.length;i++) {

           

            Obj_to_redis = JSON.stringify(match_redis[i]);
           //console.log(match_redis[i]);

            // db.select(13, function (err, res) {
              
            //         console.log(Obj_to_redis);
            //          db.set(`veto_w_13:${row_data_to_redis[i].player1}_${row_data_to_redis[i].player2}`, Obj_to_redis);
            //     })

        }





    }
    // mainFunction()
    





    

    // console.log(player_data)

    // for (let i = 0; i < row_data_to_redis.length; i++) {
    // db.select(13, function (err, ree) {
    //     return new Promise((resolve, reject) => {
    //         db.get(`players:${row_data_to_redis[i].player1}`, function (err, obbObj) {

    //             obb = JSON.parse(obbObj);

    //             console.log(obb);

    //             player_data.push(obb);
    //         })
    //         resolve(player_data)
    //     })
    // })





    // db.select(13, function (err, ree) {
    //     db.get(`players:${row_data_to_redis[i].player2}`, function (err, obbObj) {

    //         obb = JSON.parse(obbObj);
    //         console.log(obb);

    //         player_data.push(obb);
    //     })

    // })

    // };

    // console.log(player_data);









    let finalPlayers = await getPlayerRedis();
    console.log(finalPlayers);
}


accessSpreadsheet();



