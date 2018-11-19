import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Geolocation } from 'meteor/mdg:geolocation';

import './main.html';

Template.info.onCreated(function infoOnCreated() {
  Session.set('latestObsResponseMessage', 'obtaining data...');
  Meteor.call('fetchLatestObsToCollection', [], function(err, response) {
    if (err) {
      Session.set('latestObsResponseMessage', err.message);
      return;
    }
    Session.set('latestObsResponseMessage', response.message);
  });
});

Template.info.helpers({
  obsImportMessage() {
    return Session.get('latestObsResponseMessage');
  },
});

Template.queryLocation.events({
  'submit form'(event) {
    event.preventDefault();

    const queryLocationInput = {
      lon: parseFloat(event.target.lon.value),
      lat: parseFloat(event.target.lat.value),
      rad: parseFloat(event.target.rad.value),
    };

    Meteor.call('displayNearObs', queryLocationInput, function(err, response) {
      if (err) {
        Session.set('nearObservationsQueryStatus', err.message);
        return;
      }
      Session.set('nearObservations', response);
      Session.set('nearObservationsQueryStatus', `Found ${response.length} results.`);
    });
  },

  'click .geolocate' () {
    const myLocation = new ReactiveVar();
    Tracker.autorun(function(computation) {
      myLocation.set(Geolocation.latLng());
      if (myLocation.get()) {
        computation.stop();
        $('input[name="lon"]').val(Math.round(myLocation.curValue.lng * 10) / 10);
        $('input[name="lat"]').val(Math.round(myLocation.curValue.lat * 10) / 10);
      }
    });
  },


  'click .dummylocate' () {
    $('input[name="lon"]').val(-76.0);
    $('input[name="lat"]').val(37.0);
    $('input[name="rad"]').val(100);
  },
});

Template.observationList.onCreated(function queryLocationCreated() {
  // set reactive session variable to initial state
  Session.set('nearObservations', null);
  Session.set('nearObservationsQueryStatus', 'Hit "Query Observations in Radius" button to obtain results.');
});

Template.observationList.helpers({

  observationTitles() {
    return [
      'stationId',
      'longitude / deg',
      'latitude / deg',
      'observation time (UTC)',
      'WSPD / kts',
      'GST / kts',
      'WVHT / ft',
      'DPD / s',
      'APD / s',
      'MWD',
      'PRES / in',
      'PTDY / in',
      'ATMP / °F',
      'WTMP / °F',
      'DEWP / °F',
      'VIS / nmi',
      'TIDE / ft',
    ];
  },

  nearObservations() {
    return Session.get('nearObservations');
  },

  nearObservationsQueryStatus() {
    return Session.get('nearObservationsQueryStatus');
  },

});
