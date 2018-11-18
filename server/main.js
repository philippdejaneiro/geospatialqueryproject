import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Obs = new Mongo.Collection('obs');
Obs.rawCollection().createIndex({ 'coordinates': '2dsphere' });
Obs.rawCollection().createIndex({ 'stationId': 1 }, { unique: 1 });
Obs.rawCollection().createIndex({ 'date': 1 });

Meteor.methods({

    //synchronous last observations GET call
    fetchLatestObsToCollection: function() {
        var self = this;
        console.log('on server, fetchLatestObsToCollection called');
        self.latestObsResponse = {
            message: '',
        };
        var response = HTTP.get('https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt');
        if (response) {
            if (response.statusCode == 200) {

                // parse content
                var particles = [];
                var stationObs = [];
                var lines = response.content.split('\n');
                lines.map(function(item) {
                    var tabs = item.split(/\s+/);
                    particles.push([tabs[0], tabs[1], tabs[2], tabs[3], tabs[4], tabs[5], tabs[6], tabs[7], tabs[8], tabs[9], tabs[10], tabs[11], tabs[12], tabs[13], tabs[14], tabs[15], tabs[16], tabs[17], tabs[18], tabs[19], tabs[20], tabs[21]]);
                });
                for (var i = 2; i < particles.length - 1; i++) {
                    var obj = {};
                    for (var j = 0; j < particles[0].length; j++) {
                        obj[particles[0][j]] = particles[i][j];
                    }
                    stationObs.push(obj);
                }

                // store latest obs to collection 'Obs'
                for (var k = 0; k < stationObs.length - 1; k++) {
                    Obs.upsert({ 'stationId': stationObs[k]['#STN'] }, {
                        'stationId': stationObs[k]['#STN'],
                        'coordinates': [parseFloat(stationObs[k].LON), parseFloat(stationObs[k].LAT)],
                        'date': new Date(stationObs[k].YYYY + '-' + stationObs[k].MM + '-' + stationObs[k].DD + 'T' + stationObs[k].hh + ':' + stationObs[k].mm + ':00'),
                        'WSPD': stationObs[k].WSPD,
                        'GST': stationObs[k].GST,
                        'WVHT': stationObs[k].WVHT,
                        'DPD': stationObs[k].DPD,
                        'APD': stationObs[k].APD,
                        'MWD': stationObs[k].MWD,
                        'PRES': stationObs[k].PRES,
                        'PTDY': stationObs[k].PTDY,
                        'ATMP': stationObs[k].ATMP,
                        'WTMP': stationObs[k].WTMP,
                        'DEWP': stationObs[k].DEWP,
                        'VIS': stationObs[k].VIS,
                        'TIDE': stationObs[k].TIDE,
                    });
                }
            }
            else {
                self.latestObsResponse.message = 'NDBC latest observations: NDBC Server Error: ' + response.statusCode;
            }
        }
        else {
            self.latestObsResponse.message = 'Error performing NDBC latest observations request.';
        }

        // fill return object
        var d = new Date(response.headers.date);
        self.latestObsResponse.message = 'Data obtained from NDBC server: ' + formatDate(d) + ' (UTC)';
        console.log(self.latestObsResponse);
        return self.latestObsResponse;
    },

    //find  observations within radius in collection for user display
    displayNearObs: function(queryLocationInput) {
        console.log('on server, displayNearObs called');
        if (queryLocationInput.lon & queryLocationInput.lat & queryLocationInput.rad) {
            var d = new Date();
            d.setHours(d.getHours() - 3);
            console.log(queryLocationInput);
            var results = Obs.find({
                "coordinates": { $near: { $geometry: { "type": "Point", "coordinates": [queryLocationInput.lon, queryLocationInput.lat] }, $maxDistance: queryLocationInput.rad * 1609.344 } },
                "date": { $gte: d }
            }).fetch();
            results.forEach(function(currentValue, index, arr) {
                arr[index].date = formatTime(arr[index].date);
            });
            return results;
        }
        return [];
    },
});

var formatDate = function(d) {
    return zeroPad(d.getUTCDate()) + '/' + zeroPad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ', ' + zeroPad(d.getUTCHours()) + ':' + zeroPad(d.getUTCMinutes());
}

var formatTime = function(d) {
    return zeroPad(d.getUTCHours()) + ':' + zeroPad(d.getUTCMinutes());
}

// zero-pad a two digit integer
var zeroPad = function(n) {
    return (n > 9 ? '' : '0') + n;
}
