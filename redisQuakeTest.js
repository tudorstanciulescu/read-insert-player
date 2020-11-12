var makeSlug = require('./util/makeSlug');
var variables = require('./util/variables'); //variables used in local script.
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret.json');
var redis = require("redis");
const { resolve } = require('path');
var i=0;
var BanPick=[];
var i=0;
var maps= [];
var champions =[];
var objects =[];
var x=0;
var z=0;
var y=0;
var date = {};
var quake_veto=[];
var data_to_redis = {};
const gssQuakeTest = variables.connection.gssQuakeTest;
var  redisIp = variables.connection.redisIp;
var redisClusterQuakeTest = variables.connection.redisClusterQuakeTest;

var db = redis.createClient(6379, redisIp);
db.auth(/*variables.connection.redisPass,*/ () => {

});



async function data(info) {

    json = {
    step : info.step,
    process : info.process,
    p1action : info.p1action,
    p2action : info.p2action,
    p1 : info.p1,
    p2 : info.p2,
    processSplit : ''

    
}
  
    BanPick[i] = json,
    // console.log(json);
    i++
}


async function accessSpreadsheet() {
    BanPick = [];
    objects = [];
    date = {};
    maps = [];
    champions = [];
    obiect = [];
    obiect = {};
    process=[];
    

    const doc = new GoogleSpreadsheet(gssQuakeTest);  //aceess the data from specific gss
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
    
    for(let x=0;x<2;x++) {
    var sheet = 0;
     sheet = await info.worksheets[x];
      //access data from first sheet in gss document and save in sheet variable
    var rows =[]; 
     rows = await promisify(sheet.getRows)({
        offset: 1
    })
    
    //console.log(rows);
    
    //console.log(rows);
    //console.log(rows);
    // console.log(BanPick);
    // console.log(objects);
    // console.log(date);
    // console.log(maps);
    // console.log(champions);
    // console.log(obiect);
    // console.log(process);
    // console.log("\n\n\n\n");


    rows_length = rows.length;
    //console.log(rows);
    for(let i=0;i<rows_length;i++) {
        
        data(rows[i]); 
        
        
        
    }
    
     
    //console.log(BanPick);
    for(let i=0;i<rows_length;i++) {
        
        var process = (BanPick[i].process).split(' ');
        //console.log(process[0]);
        if(process[0] == "Ban") {
            BanPick[i].process = "banned";
            BanPick[i].processSplit = process[1];
        } else {
            BanPick[i].process = "picked";
            BanPick[i].processSplit = process[1];
        }

    }
    
   
    
    
    for(let i=0;i<rows_length;i++) {

        if(BanPick[i].p1action != '') {
            date =  {
                playerKey  : BanPick[i].p1,
                type : BanPick[i].process,
                ban : BanPick[i].processSplit,
                name : BanPick[i].p1action
                
            }
            
        }
        else {
            date = {
                playerKey :BanPick[i].p2,
                type : BanPick[i].process,
                ban : BanPick[i].processSplit,
                name : BanPick[i].p2action
                
            }
        }
        
            objects[i] = date;
           
            
    }
   
    
        
    
       // console.log(obiect);
       // console.log(objects);

        for(let i=0;i<objects.length;i++) {

            if(objects[i].ban == "Map")  {
                obiect = {
                    playerKey : objects[i].playerKey,
                    type : objects[i].type,
                    mapName : makeSlug.makeSlug(objects[i].name)
                }
                maps.push(obiect);
            }
            else {
                obiect = {
                    playerKey : objects[i].playerKey,
                    type : objects[i].type,
                    champName : makeSlug.makeSlug(objects[i].name)
                }
                champions.push(obiect)
            }
        }

        // console.log(champions);
        // console.log(maps);
         data_to_redis = {
            champions  : champions,
            maps : maps
        }

    //   quake_veto[y] = data_to_redis ; 
    //console.log(`worksheet${x}`);
      console.log(data_to_redis);
    
    // db.select(redisClusterQuakeTest, function(err,res) {
    //     redis = JSON.stringify(data_to_redis);;
    //     db.set('quake:veto',redis);
    // })
      
    }
     BanPick = [];
    objects = [];
    date = {};
    maps = [];
    champions = [];
    obiect = [];
    obiect = {};
    process=[];
}


accessSpreadsheet();

// async function async() {
//     var data_redis =  await accessSpreadsheet();
//     console.log(data_redis);
// }

