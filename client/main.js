import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session'
import { Geolocation } from 'meteor/mdg:geolocation';

import './main.html';

Template.info.onCreated(function infoOnCreated() {
  Session.set("obsImportStateStringMessage", "obtaining data...");
  Meteor.call('fetchLatestObsToCollection', [], function(err, response) {
    if (err) {
      Session.set('latestObsResponseMessage', err.message);
      console.log(err);
      return;
    }
    console.log("got latestObsResponse", response);
    Session.set("latestObsResponseMessage", response.message);
    return;
  });
});

Template.info.helpers({
  obsImportMessage() {
    return Session.get('latestObsResponseMessage');
  },
});

Template.queryLocation.events({
    'submit form': function(event){
      event.preventDefault();
      var queryLocationInput = {
        'lon': parseFloat(event.target.lon.value),
        'lat': parseFloat(event.target.lat.value),
        'rad': parseFloat(event.target.rad.value)
      }
      Meteor.call('displayNearObs', queryLocationInput, function(err, response) {
        if (err) {
          Session.set('nearObservationsQueryStatus', err.message);
          console.log(err);
          return;
        }
        console.log("got displayNearObs", response);
        Session.set("nearObservations", response);
        Session.set('nearObservationsQueryStatus', 'Found ' + response.length + ' results.');
      });
    },
    
    'click .geolocate'(event, instance) {
      var myLocation = new ReactiveVar();
      Tracker.autorun(function(computation) {
            myLocation.set(Geolocation.latLng());
            if (myLocation.get()) {
                computation.stop();
                $('input[name="lon"]').val(Math.round(myLocation.curValue.lng*10)/10);
                $('input[name="lat"]').val(Math.round(myLocation.curValue.lat*10)/10);
            }
      });
    },
    
    
    
    'click .dummylocate'(event, instance) {
      $('input[name="lon"]').val(-76.0);
      $('input[name="lat"]').val(37.0);
      $('input[name="rad"]').val(100);
    },
});

Template.observationList.onCreated(function queryLocationCreated() {
  
  // set reactive session variable to initial state
  Session.set("nearObservations", null);
  Session.set('nearObservationsQueryStatus', 'Hit "Query Observations in Radius" button to obtain results.');
});

Template.observationList.helpers({
  
  observationTitles: function () {
    return [
      'stationId',
      'longitude',
      'latitude',
      'date (UTC)',
      'WSPD',
      'GST ',
      'WVHT',
      'DPD ',
      'APD ',
      'MWD ',
      'PRES',
      'PTDY',
      'ATMP',
      'WTMP',
      'DEWP',
      'VIS ',
      'TIDE',
    ];
  },
  
  nearObservations: function () {
    return Session.get('nearObservations');
  },
  
  nearObservationsQueryStatus: function () {
    return Session.get('nearObservationsQueryStatus');
  },

});