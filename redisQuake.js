var makeSlug = require('./util/makeSlug');
var variables = require('./util/variables'); //variables used in local script.
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret.json');
var redis = require("redis");
var i=0;
var BanPick=[];
var i=0;
var maps= [];
var champions =[];
var objects =[];
var x=0;
var z=0;
const gssQuake = variables.connection.gssQuake;
var  redisIp = variables.connection.redisIp;

var db = redis.createClient(6379, redisIp);
db.auth(/*variables.connection.redisPass,*/ () => {

});



function data(info) {

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


    const doc = new GoogleSpreadsheet(gssQuake);  //aceess the data from specific gss
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
   // console.log(info);
    
    const sheet = info.worksheets[0]; 
    //console.log(sheet);//access data from first sheet in gss document and save in sheet variable
      
    const rows = await promisify(sheet.getRows)({
        offset: 0
    })
  

   // console.log(rows);
    rows_length = rows.length;
    
    for(let i=0;i<rows_length;i++) {
       data(rows[i]);
       
       //console.log(rows[i]);
    }

    console.log(rows.length);
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

        var data_to_redis = {
            champions  : champions,
            maps : maps
        }


    console.log(data_to_redis);
    
    // db.select(5, function(err,res) {
    //     redis = JSON.stringify(data_to_redis);;
    //     db.set('quake:veto',redis);
    // })

      
}
accessSpreadsheet();
