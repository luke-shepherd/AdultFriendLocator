
import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    ListView,
    TouchableHighlight,
    Navigator
} from 'react-native';

globals = require('./globals')

export default class SearchBar extends Component {
    constructor(props) {
        super(props);
        this.ds = new ListView.DataSource(
            {rowHasChanged: (r1, r2) => r1 !== r2}
        )
        this.state = {
            text: '',
            results: [],
        }
        this.style = StyleSheet.create({
            container: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F5FCFF',
            },
            inputbox: {
                height: 60,
                width: 300,
                fontSize: 20,
            },
            rowtext: {
                fontSize: 20,
                textAlign: 'center',
                marginTop: 20,
                marginBottom: 5,
            }
        });
    }

    onTextUpdate(query) {
        this.setState({text: query})
        
        var url = globals.base_url + 'api/search'
        var obj = globals.constructPacket({
            user: globals.user,
            lookup: query,})
        var success = globals.sendPacket(obj, url,
            () => {
                console.log('[*] search success')
            })

        if (!success) {
            this.setState({results: ['no results']})
        } 
        else {
            this.setState({results: globals.searchresults})
            //add to list
            //var temp = this.state.results
            //temp.push(query)
            //this.setState({results: temp})
        }
    }
    
    buttonAction(user) {
        //this.routeTo('Userpage')
        console.log('[*] pressed: ' + user)
    }

    render() {
        return (
            <View style={this.style.container}>
                <TextInput
                    style={this.style.inputbox}
                    onChangeText={(text) => this.onTextUpdate(text)}
                />
                <ListView
                    dataSource={this.ds.cloneWithRows(this.state.results)}
                    renderRow={(row) => 
                        <TouchableHighlight 
                            onPress={() => this.buttonAction(row)}
                            underlayColor='#dcdcdc'
                        >
                            <Text style={this.style.rowtext}>
                                {row}
                            </Text>
                        </TouchableHighlight>
                    }
                    enableEmptySections={true}
                />
            </View>
        );
    }

}

