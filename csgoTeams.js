var makeSlug = require('./util/makeSlug');
var variables = require('./util/variables'); //variables used in local script.
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret.json');
var players_list = [];
var json = {};
var teams = [];
var teams_sh = [];
var i = 0;
var data1 = {};
var teams_redis='';
var redis = require("redis");
var  redisIp = variables.connection.redisIp;
var csgoTeams = variables.connection.redisClusterCSGO;

var ggsCSGO = variables.connection.ggsCSGO;

var db = redis.createClient(6379, redisIp);

db.auth(/*variables.connection.redisPass,*/ () => {
    
});
function players(player) {

    json = {
        teamname: player.teamname,
        nickname: player.nickname,
        shortname: player.shortname,
        name: player.name,
        seat: player.seat,
        steamid : player.steamid,
        country : player.country,
        dob: player.dob,
        weapon : player.weapon


    }

    players_list[i] = json
    i++;
}
async function accessSpreadsheet() {

    const doc = new GoogleSpreadsheet(ggsCSGO);  //aceess the data from specific gss
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
    const sheet = info.worksheets[1]; //access data from first sheet in gss document and save in sheet variable

    const rows = await promisify(sheet.getRows)({
        offset: 1
    })

    rows.forEach(row => {
        players(row);
    });

    for (let i = 0; i < players_list.length; i++) {

        teams.push(players_list[i].teamname); //create an array with team names 
        teams_sh.push(players_list[i].shortname);
    }
    let teams_ = [...new Set(teams)];//create an array with team names appear once
    let team_short = [...new Set(teams_sh)];//create an array with team shortnames appear once
    //console.log(teams_);
    //console.log(team_short);
    //console.log(players_list);
    //console.log(playerS);
    function data_structure() {    //data structure is called to insert the data about all players in the same team

        for (let i = 0; i < players_list.length; i++) {

            if (players_list[i].teamname == data1.team_name) {

                var key = makeSlug.makeSlug(players_list[i].nickname);  //set the value of object key to player nickename
                 
                player_curent = {     

                    [key]: {

                        nickname: players_list[i].nickname,
                        name: players_list[i].name,
                        seat: players_list[i].seat,
                        steamid : players_list[i].steamid,
                         country : players_list[i].country,
                         dob: players_list[i].dob,
                         weapon : players_list[i].weapon
                       // someData: `someDataAboutPlayer ${players_list[i].nickname}`

                    }
                }
                Object.assign(data1.players, player_curent);
            }
        }
        return data1.players;
    }

    db.select(csgoTeams, function(err,res){

    for (let i = 0; i < teams_.length; i++) {

        data1.team_name = teams_[i];
        data1.short_name = team_short[i];
        data1.players = {};
        
        data1.players = data_structure();    //call daca_structure to insert data of all players in the same team
        teams_redis = JSON.stringify(data1); //Object to string to send to redis-
        db.set(`teamCSGO:${makeSlug.makeSlug(data1.team_name)}`, teams_redis);  //set team_name as key and insert data 
        //console.log(teams_redis);
       // console.log(data1.team);
    }
    console.log(`data inserted in redis...`);
    
   
});
  
}

accessSpreadsheet();