
import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ListView,
    TouchableHighlight,
    Button,
    Navigator
} from 'react-native';

import NavBar from './navbar.js';
globals = require('./globals')

export default class NotifPage extends Component {
    constructor(props) {
        super(props);
        this.ds = new ListView.DataSource(
            {rowHasChanged: (r1,r2) => r1 !== r2}
        )
        this.state = {
            data: globals.notifications.concat(globals.pending).concat(globals.requests),
            ntext: 'no notifications :('
        }

        this.style = StyleSheet.create({
            container: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F5FCFF',
            },
            listcontainer: {
                flex: 1,
                top: 60,
            },
            row: {
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            },
            rowtext: {
                fontSize: 15,
                textAlign: 'center',
                marginTop: 20,
                marginBottom: 5,
            },
            navbar: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
            },
            ntext: {
                flex:1,
                position: 'absolute',
                top: 300,
                left: 100,
                fontSize: 20,
            },
        });
    }

    componentDidMount() {
        //do nothing special
        

    }

    highlightAction(notif) {
        console.log('[*] pressed: ' + notif)
        //route to user profile of notification (ie your friend)
        //this.routeTo()
    }

    buttonAction(notif, action) {
        if (action == 'decline') {
            //remove notification from global variable
            //wait for acknowledge response to perform action

            //remove row from list
            var temp = this.state.data
            var index = temp.indexOf(notif)
            temp.splice(index)
            //this.setState({data: temp})

            var url = globals.base_url + 'api/declineFriend'
            var obj = globals.constructPacket({username: globals.user, friend: notif})
            var success = globals.sendPacket(obj, url, 
                () => {
                    console.log('[+] sucess declined friend: ' + notif)
                })
        }
        else {
            //remove notification from global variable
            //var obj = constructPacket()
            //var success = sendPacket(obj)
            //wait for acknowledge response to perform action

            //'api/acceptFriend'

            console.log('[*] accepted: ' + notif)
            //remove row from list
            var temp = this.state.data
            var index = temp.indexOf(notif)
            temp.splice(index)
            //this.setState({data: temp})

            var url = globals.base_url + 'api/acceptFriend'
            var obj = globals.constructPacket({username: globals.user, friend: notif})
            var success = globals.sendPacket(obj, url, 
                () => {
                    console.log('[+] success accepted friend: ' + notif)
                    globals.friendslist.append(notif)
                })
        }
    }

    render() {
        return (
            <View style={this.style.container}>
                <View style={this.style.navbar}>
                    <NavBar/>
                </View>
                <View style={this.style.listcontainer}>
                    <ListView
                        dataSource={this.ds.cloneWithRows(this.state.data)}
                        renderRow={(row) => 
                            <View style={this.style.row}>
                            <TouchableHighlight 
                                onPress={() => this.highlightAction(row)}
                                underlayColor='#dcdcdc'
                            >
                            <Text style={this.style.rowtext}>
                                {row}
                            </Text>
                            </TouchableHighlight>
                            <Button
                                onPress={() => this.buttonAction(row, 'accept')}
                                title={'accept'}
                                color='#841584'
                            />
                            <Button
                                onPress={() => this.buttonAction(row, 'decline')}
                                title={'decline'}
                                color='#841584'
                            />
                            </View>
                        }
                        enableEmptySections={true}
                    />
                </View>
                <Text style={this.style.ntext}>
                    {this.state.data.length == 0 ? this.state.ntext : ''}
                </Text>
            </View>
        );
    }

}

