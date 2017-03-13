
import React, { Component } from 'react';
import {
    StyleSheet,
        Text,
        View,
        Navigator,
        Button,
        Image,
        ListView,
        TouchableHighlight,
} from 'react-native';

import NavBar from './navbar.js';
globals = require('./globals')


const logOut = () => {
    globals.user = '';
    globals.token = '';

    //app user info
    globals.pass = '';
    globals.friendslist = [];
    globals.dump()

    setTimeout ( () => {

        globals.routeTo('SignInPage')
    }, 500)


    
}

export default class UserPage extends Component {
    
    constructor(props) {
        super(props);
        this.ds = new ListView.DataSource(
            {rowHasChanged: (r1,r2) => r1 !== r2}
        );
        this.state = {
            data: globals.friendslist,
        }
        this.style = StyleSheet.create({
            container: {
                flex: 1,
                flexDirection: 'column', 
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F5FCFF',
            },
            text: {
                fontSize: 20,
                textAlign: 'center',
                marginBottom: 20,
                marginTop: 100,
            },
            button: {
                position: 'absolute',
                top: 50,
                left: 120,
                right: 150,
            },
            listcontainer: {
                flex: 1,
            },
            row: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            },
            rowtext: {
                fontSize: 15,
                textAlign: 'center',
                marginTop: 5,
                marginBottom: 5,
            },
            navbar: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
            },
            circle: {
                height: 200,
                width: 200,
                justifyContent: 'center',
                borderRadius: 100,
                backgroundColor: '#F5FCFF',
                marginTop: 30,
                marginBottom: 20,
            },

        });
    }

     highlightAction(friend) {
        //route to user profile of notification (ie your friend)
        //this.routeTo()
        globals.userpage = friend
        setTimeout ( () => {

        globals.routeTo('FriendPage')
    }, 500)

    }



    render() {
        return (
                <View style={this.style.container}>
                    <Text style = {this.style.text}>
                        {globals.user}
                    </Text>
                    <Image style={this.style.circle}
                           source={require('./assets/stock_prof_pic.jpg')}/>

                    <Button style = {this.style.button}
                            onPress={logOut}
                            title='Log Out'/>
                    <Text style = {this.style.rowtext}>
                        Friends:
                    </Text>

                    <View style={this.style.listcontainer}>
                        <ListView
                            dataSource={this.ds.cloneWithRows(this.state.data)}
                            renderRow={(row) => 
                                <View style={this.style.row}>
                                    <TouchableHighlight 
                                        onPress={() => this.highlightAction(row)}
                                        underlayColor='#dcdcdc'>
                                    
                                        <Text style={this.style.rowtext}>
                                            {row}
                                        </Text>
                                    </TouchableHighlight>
                                </View>
                            }
                            enableEmptySections={true}
                        />
                    </View>    
                
                    <View style={this.style.navbar}>
                        <NavBar/>
                    </View>
                </View>
               );
    }

}
