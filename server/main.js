import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';

export const Obs = new Mongo.Collection('obs');
export default Obs;
Obs.rawCollection().createIndex({ coordinates: '2dsphere' });
Obs.rawCollection().createIndex({ stationId: 1 }, { unique: 1 });
Obs.rawCollection().createIndex({ date: 1 });

// zero-pad a two digit integer
const zeroPad = function(n) {
  return (n > 9 ? '' : '0') + n;
};

// format output date string
const formatDate = function(d) {
  return `${zeroPad(d.getUTCDate())}/${zeroPad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}, ${zeroPad(d.getUTCHours())}:${zeroPad(d.getUTCMinutes())}`;
};

// format output time string
const formatTime = function(d) {
  return `${zeroPad(d.getUTCHours())}:${zeroPad(d.getUTCMinutes())}`;
};

Meteor.methods({

  // synchronous last observations GET call
  fetchLatestObsToCollection() {
    const self = this;
    check(arguments, [Match.Any]);
    self.latestObsResponse = {
      message: '',
    };
    const response = HTTP.get('https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt');
    if (response) {
      if (response.statusCode === 200) {
        // parse content
        const particles = [];
        const stationObs = [];
        const lines = response.content.split('\n');
        lines.forEach(function(item) {
          const tabs = item.split(/\s+/);
          particles.push([tabs[0], tabs[1], tabs[2], tabs[3], tabs[4], tabs[5],
            tabs[6], tabs[7], tabs[8], tabs[9], tabs[10], tabs[11], tabs[12],
            tabs[13], tabs[14], tabs[15], tabs[16], tabs[17], tabs[18],
            tabs[19], tabs[20], tabs[21]]);
        });
        for (let i = 2; i < particles.length - 1; i += 1) {
          const obj = {};
          for (let j = 0; j < particles[0].length; j += 1) {
            obj[particles[0][j]] = particles[i][j];
          }
          stationObs.push(obj);
        }

        // store latest obs to collection 'Obs'
        for (let k = 0; k < stationObs.length - 1; k += 1) {
          Obs.upsert({ stationId: stationObs[k]['#STN'] }, {
            stationId: stationObs[k]['#STN'],
            coordinates: [parseFloat(stationObs[k].LON), parseFloat(stationObs[k].LAT)],
            date: new Date(`${stationObs[k].YYYY}-${stationObs[k].MM}-${stationObs[k].DD}T${stationObs[k].hh}:${stationObs[k].mm}:00`),
            WSPD: stationObs[k].WSPD,
            GST: stationObs[k].GST,
            WVHT: stationObs[k].WVHT,
            DPD: stationObs[k].DPD,
            APD: stationObs[k].APD,
            MWD: stationObs[k].MWD,
            PRES: stationObs[k].PRES,
            PTDY: stationObs[k].PTDY,
            ATMP: stationObs[k].ATMP,
            WTMP: stationObs[k].WTMP,
            DEWP: stationObs[k].DEWP,
            VIS: stationObs[k].VIS,
            TIDE: stationObs[k].TIDE,
          });
        }
      } else {
        self.latestObsResponse.message = `NDBC latest observations: NDBC Server Error: ${response.statusCode}`;
      }
    } else {
      self.latestObsResponse.message = 'Error performing NDBC latest observations request.';
    }

    // fill return object
    const d = new Date(response.headers.date);
    self.latestObsResponse.message = `Data obtained from NDBC server: ${formatDate(d)} (UTC)`;
    return self.latestObsResponse;
  },

  // find  observations within radius in collection for user display
  displayNearObs(queryLocationInput) {
    check(queryLocationInput, {
      lon: Number,
      lat: Number,
      rad: Number,
    });

    const d = new Date();

    d.setHours(d.getHours() - 3);

    const results = Obs.find({
      coordinates: { $near: { $geometry: { type: 'Point', coordinates: [queryLocationInput.lon, queryLocationInput.lat] }, $maxDistance: queryLocationInput.rad * 1609.344 } },
      date: { $gte: d },
    }).fetch();

    results.forEach(function(currentValue, index, arr) {
      arr[index].date = formatTime(arr[index].date);
    });
    return results;
  },
});
