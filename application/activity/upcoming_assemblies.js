import Colors           from '../styles/colors';
import Globals          from '../styles/globals';
import Icon             from 'react-native-vector-icons/Ionicons';
import ActivityView     from '../activity/activity_view';
import UpcomingAssembly from './upcoming_assembly';
import _                from 'underscore';
import {DEV, BASE_URL, HEADERS} from '../utilities/fixtures';

import React, {
  ScrollView,
  Component,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  NativeModules,
  MapView,
} from 'react-native';

const MAP_REGION = {};

export default class UpcomingAssemblies extends Component{
  componentDidMount(){
    if ((! this.props.allEvents.length || ! this.props.groups.length) &&
        (! this.props.fetchedAllEvents || ! this.props.fetchedGroups)
    ){
      this._fetchAllEvents();
    }
  }
  _fetchAllEvents(){
    let d = new Date();
    d.setHours(0);
    let url = `${BASE_URL}/events?{"start": {"$gt": ${JSON.stringify(d.valueOf())}}}`;
    fetch(url, {
      method: "GET",
      headers: HEADERS,
    })
    .then((response) => response.json())
    .then((data) => {
      if (DEV) {console.log('EVENTS ALL', data);}
      let allEvents = data;
      let groupIds = data.map((evt) => evt.groupId);

      let url = `${BASE_URL}/groups?{"id": {"$in": ${JSON.stringify(groupIds)}}}`
      if (DEV) {console.log('URL', url)}
      fetch(url, {
        method: "GET",
        headers: HEADERS,
      })
      .then((response) => response.json())
      .then((data) => {
        if (DEV) {console.log('DATA GROUPS', data)}
        this.props.sendData({allEvents: allEvents, groups: data});
      })
      .catch((error) => {
        if (DEV) {console.log(error)}
      }).done();
    })
    .catch((err) => {
      if (DEV) {console.log('ERR:', err);}
    }).done();
  }
  _todayEvents(events){
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let date = today.getDate();
    let todayEvents = _.filter(events, (e)=>{
      let eventDate = new Date(e.start);
      console.log('EVENT DATE', eventDate, year, month, date);
      return (
        eventDate.getMonth() == month &&
        eventDate.getDate() == date &&
        eventDate.getFullYear() == year
      );
    });
    console.log('TODAY EVENTS', todayEvents);
    return todayEvents;
  }
  _renderMap(todayEvents, mapRegion){
    return (
      <MapView
        style={Globals.map}
        region={mapRegion}
        annotations={todayEvents.map((evt) => {
          return {
            latitude: evt.location.lat ? evt.location.lat : mapRegion.latitude,
            longitude: evt.location.lng ? evt.location.lng : mapRegion.longitude
           }
        })}
      />
    );
  }
  _renderEmptyMap(){
    return (
      <View style={[Globals.map, {backgroundColor: Colors.inactive}]}></View>
    );
  }
  render(){
    if (DEV) {console.log('ALL PROPS', this.props);}
    let events = this.props.allEvents;
    let todayEvents = this._todayEvents(events);
    let mapRegion = MAP_REGION;
    if (todayEvents.length) {
      mapRegion = {
        latitude        : todayEvents[0].location.lat,
        longitude       : todayEvents[0].location.lng,
        latitudeDelta   : 0.01,
        longitudeDelta  : 0.01
      };
    }
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 80}}
        >
        <Text style={styles.bodyText}>Assemblies Near Me</Text>
        {todayEvents.length ? this._renderMap(todayEvents, mapRegion) : this._renderEmptyMap()}
        <View style={styles.notificationsContainer}>
          <Text style={styles.bodyText}>Today</Text>
          <View style={styles.break}></View>
          <View style={styles.notificationsHolder}>
          {todayEvents.map((event, idx) => {
            let {groups} = this.props;
            return (
              <UpcomingAssembly currentUser={this.props.currentUser} event={event} groups={groups} key={idx} />
            )
          })}
          </View>
        </View>
      </ScrollView>
    )
  }
}

let styles = StyleSheet.create({
  bodyText: {
    color: Colors.bodyText,
		fontSize: 16,
		paddingHorizontal: 15,
    paddingVertical: 15,
  },
  notificationsHolder:{},
  break: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 10,
  },
  notificationsContainer: {},
  container: {},
});
