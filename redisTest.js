var makeSlug = require('./util/makeSlug');
var variables = require('./util/variables'); //variables used in local script.
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret.json');
var redis = require("redis");
var i = 0;
var BanPick = [];
var i = 0;
var maps = [];
var champions = [];
var objects = [];
var x = 0;
var z = 0;
var date;
var process1=[];
var counter;
var obiect;
var player1;
var player2;
const gssQuakeTest = variables.connection.gssQuakeTest;
var redisIp = variables.connection.redisIp;
var match_data;

var db = redis.createClient(6379, redisIp);
db.auth(/*variables.connection.redisPass,*/() => {

});



function data(info) {

    json = {
        step: info.step,
        process: info.process,
        p1action: info.p1action,
        p2action: info.p2action,
        p1: info.p1,
        p2: info.p2,
        processSplit: ''


    }
    BanPick[counter] = json;
        // console.log(json);
       counter++; 
}
function match(match_info) {
     match_data = match_info.step;
}


async function accessSpreadsheet() {


    const doc = new GoogleSpreadsheet(gssQuakeTest);  //aceess the data from specific gss
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
    for (let xz = 0; xz < 5; xz++) {
        counter =0;
        BanPick= [];
        const sheet = info.worksheets[xz]; //access data from first sheet in gss document and save in sheet variable
        const rows = await promisify(sheet.getRows)({
            offset: 0
        })
        //console.log(rows)
        rows_length = rows.length;
        console.log(rows[0]);
        for (let i = 0; i < rows_length-1; i++) {
            data(rows[i]);
            //console.log(rows[i]);
            

        }

        match(rows[rows_length-1]);

        
        
        //return 0;
       // console.log(`sheet${xz}`);
        // console.log(BanPick);
        
        for (let i = 0; i < rows_length-1; i++) {
            
             process1 = (BanPick[i].process).split(' ');
            //console.log(process[0]);
            if (process1[0] == "Ban") {
                BanPick[i].process = "banned";
                BanPick[i].processSplit = process1[1];

            } else {
                BanPick[i].process = "picked";
                BanPick[i].processSplit = process1[1];
            }

        }
        // console.log(BanPick);
        //  console.log(`sheet${xz}`)

        //  console.log(date);
        //console.log(`sheet${xz}`);
        
         player1=BanPick[0].p1;
         player2=BanPick[0].p2;   
           
        for (let i = 0; i < rows_length-1; i++) {

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
        
        //console.log(objects);
        
        maps = [];
        champions = [];

    
    
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].ban == "Map") {
            obiect = {
                playerKey: objects[i].playerKey,
                type: objects[i].type,
                mapName: makeSlug.makeSlug(objects[i].name)
            }
            maps.push(obiect);
            //console.log("Mapa"+obiect);
        }
        else {
            obiect = {
                playerKey: objects[i].playerKey,
                type: objects[i].type,
                champName: makeSlug.makeSlug(objects[i].name)
            }
            champions.push(obiect)
            //console.log("Champ"+obiect);
        }
    }

    var data_to_redis = {
        match : match_data,
        champions: champions,
        maps: maps
    }


     console.log(data_to_redis);
    // console.log(xz);


    db.select(15, function(err,res) {
        redis = JSON.stringify(data_to_redis);;
        db.set(`quake:${player1}-${player2}`,redis);
    })
}

}
accessSpreadsheet();
