var makeSlug = require('./util/makeSlug');
var variables = require('./util/variables'); //variables used in local script.
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret.json');
var redis = require("redis");
var redisIp = variables.connection.redisIp;
var quakePlayers = variables.connection.redisClusterQuake;
var quakePlayer = '';
var redis_players = '';
var quake_players = [];
var playercount = 0;
var ggsQuake = variables.connection.ggsQuake;
var i = 0;
var db = redis.createClient(6379, redisIp);
db.auth(/*variables.connection.redisPass,*/() => {

});
function players(player) {

    quakePlayer = {
        nickname: player.nickname,
        playerKey: makeSlug.makeSlug(player.nickname),
        organization: player.organization,
        flag: player.flag,
        firstname: player.firstname,
        lastname: player.lastname,
        entityID: player.entityid,
        region: player.region

    }
    quake_players[i] = quakePlayer;
    i++;
    playercount = i;

}
async function accessSpreadsheet() {

    const doc = new GoogleSpreadsheet(ggsQuake);  //aceess the data from specific gss
    await promisify(doc.useServiceAccountAuth)(creds);
    const info = await promisify(doc.getInfo)();
    const sheet = info.worksheets[2]; //access data from first sheet in gss document and save in sheet variable

    const rows = await promisify(sheet.getRows)({
        offset: 1
    })
   rows.forEach(row => {
    

        players(row);

        //console.log(row);
    });

    for (let i = 0; i < playercount; i++) {
        
        db.select(quakePlayers, function (err, res) {

            redis_players = JSON.stringify(quake_players[i]);
            db.set(`players:${makeSlug.makeSlug(quake_players[i].nickname)}`, redis_players);

            // if(quake_players[i].region == "Americas") {

            // db.set(`playerNA:${makeSlug.makeSlug(quake_players[i].nickname)}`, redis_players);  //set team_name as key and insert data 
            // }
            // else {
            //     db.set(`playerEU:${makeSlug.makeSlug(quake_players[i].nickname)}`, redis_players);
            // }
        });
    }

}



accessSpreadsheet();
