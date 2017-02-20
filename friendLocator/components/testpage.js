
import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Navigator
} from 'react-native';

//import MapView from 'react-native-maps';

globals = require('./globals')
import SearchBar from './searchbar.js';
import NavBar from './navbar.js';

export default class TestPage extends Component {
    constructor(props) {
        super(props);
        this.style = StyleSheet.create({
            container: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F5FCFF',
            },
            text: {
                fontSize: 20,
                textAlign: 'center',
                margin: 10,
            },
            searchbar: {
                position: 'absolute',
                top: 60,
                left: 150,
            },
            navbar: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
            },
        });
    }

    routeTo(sceneId) {
        this.props.nav.replace({id: sceneId});
    }

    /*
    <MapView
                    initialRegion={{
                        latitude: 37.78825,
                        longitude: -122.4324,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                />
                */

    render() {
        return (
            <View style={this.style.container}>
                <View style={this.style.navbar}>
                    <NavBar/>
                </View>
                <View style={this.style.searchbar}>
                    <SearchBar/>
                </View>
                
            </View>
        );
    }

}

