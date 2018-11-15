import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Meteor.startup(() => {
    const Obs = new Mongo.Collection('obs');
    Obs.rawCollection().createIndex({'coordinates': '2dsphere'});
    Obs.rawCollection().createIndex({'stationId':1}, {unique: 1});
    
    Meteor.methods({
        
      //synchronous last observations GET call
	  fetchLatestObsToCollection: function () {
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
                lines.map(function(item){
                  var tabs = item.split(/\s+/);
                  particles.push([tabs[0], tabs[1],tabs[2],tabs[3],tabs[4],tabs[5],tabs[6],tabs[7],tabs[8],tabs[9],tabs[10],tabs[11],tabs[12],tabs[13],tabs[14],tabs[15],tabs[16],tabs[17],tabs[18],tabs[19],tabs[20],tabs[21]]);
                });
                for (var i=2; i<particles.length-1; i++) {
                    var obj = {};
                    for(var j=0; j<particles[0].length; j++) {
                        obj[particles[0][j]] = particles[i][j];
                    }
                    stationObs.push(obj);
                }
                
                // store latest obs to collection 'Obs'
                for (var k=0; k<stationObs.length-1; k++) {
                    //console.log('<'+ stationObs[k].YYYY + '-' + stationObs[k].MM + '-' + stationObs[k].DD + 'T' + stationObs[k].hh + ':' + stationObs[k].mm + ':00Z>');
                    Obs.upsert({'stationId': stationObs[k]['#STN']},{
                        'stationId': stationObs[k]['#STN'],
                        'lat':  stationObs[k].LAT,
                        'lon':  stationObs[k].LON,
                        'coordinates': [parseFloat(stationObs[k].LON), parseFloat(stationObs[k].LAT)],
                        'date': Date('<'+ stationObs[k].YYYY + '-' + stationObs[k].MM + '-' + stationObs[k].DD + 'T' + stationObs[k].hh + ':' + stationObs[k].mm + ':00Z>'),
                        'WSPD': stationObs[k].WSPD,
                        'GST':  stationObs[k].GST,
                        'WVHT': stationObs[k].WVHT,
                        'DPD':  stationObs[k].DPD,
                        'APD':  stationObs[k].APD,
                        'MWD':  stationObs[k].MWD,
                        'PRES': stationObs[k].PRES,
                        'PTDY': stationObs[k].PTDY,
                        'ATMP': stationObs[k].ATMP,
                        'WTMP': stationObs[k].WTMP,
                        'DEWP': stationObs[k].DEWP,
                        'VIS':  stationObs[k].VIS,
                        'TIDE': stationObs[k].TIDE,
                    });
                }
		    } else {
		        self.latestObsResponse.message = 'NDBC latest observations: NDBC Server Error: ' + response.statusCode;
		    }
	    } else {
	        self.latestObsResponse.message = 'Error performing NDBC latest observations request.';
	    }
	    
        // fill return object
        self.latestObsResponse.message = 'Data obtained from NDBC server: ' + response.headers.date;
        console.log(self.latestObsResponse);
    	return self.latestObsResponse;
	  },
	  
      //find  observations within radius in collection for user display
      displayNearObs: function (queryLocationInput) {
	    console.log('on server, displayNearObs called');
          console.log(queryLocationInput);
          var results = Obs.find({ "coordinates": { $near: { $geometry: { "type": "Point", "coordinates": [ queryLocationInput.lon, queryLocationInput.lat ] }, $maxDistance: queryLocationInput.rad*1609.344 } } }).fetch();
          return results;
      },
   });
});
