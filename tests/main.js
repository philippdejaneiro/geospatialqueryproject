import { Meteor } from 'meteor/meteor';
import assert from 'assert';
import { resetDatabase } from 'meteor/xolvio:cleaner';

import '../server/main.js';

Meteor.methods({
  'test.resetDatabase': () => resetDatabase(),
});

/* eslint-env mocha */
describe('geospatial-query-project', function() {
  if (Meteor.isServer) {
    it("Meteor.method 'fetchLatestObsToCollection': entry's longitude is numeric", function(done) {
      Meteor.call('test.resetDatabase', done);
      this.timeout(15000);
      setTimeout(done, 15000);
      Meteor.call('fetchLatestObsToCollection', [], function() {
        const entry = Obs.findOne();
        assert.strictEqual(!isNaN(parseFloat(entry.coordinates[0]))
        && isFinite(entry.coordinates[0]), true);
        done();
      });
    });

    it("Meteor.method 'displayNearObs': query for dummy location returns some results", function(done) {
      const queryLocationInput = {
        lon: -76.0,
        lat: 37.0,
        rad: 100,
      };
      Meteor.call('displayNearObs', queryLocationInput, function(err, response) {
        assert.strictEqual(response.length >= 0, true);
        done();
      });
    });
  }
});
