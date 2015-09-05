var https = require('https');
var WebSocket = require('ws');
var path = require('path');
var _ = require('lodash');
var levenshtein = require('fast-levenshtein');
var assert = require('assert')

var Slack = require('slack-node')

apiToken = ''

var fix_text = function fix_text(old_txt, replace_txt) {
    tokens = old_txt.split(/\W+/g)
    best_token = tokens[0]
    best_dist = levenshtein.get(best_token, replace_txt)
    for (var index in tokens){
        new_token = tokens[index]
        new_dist = levenshtein.get(new_token, replace_txt)
        if (best_dist >= new_dist){
            best_dist = new_dist;
            best_token = new_token;
        }
    }
    var n = old_txt.lastIndexOf(best_token);
    var str = old_txt.slice(0, n) + old_txt.slice(n).replace(best_token, replace_txt);
    return str
}

var tokenCache = {
    get : function get (user_id) {
        // return 'slack token'
    },
}

slack = new Slack(apiToken);
    // fyi: {token: 'xoxp-3604086599-3604086605-9315737184-cdc7a8'}

var get_old_text = function get_old_text(token, data, callback) {
    if (data.channel.slice(0, 1) == 'D'){
        slack.api('im.history', {'token':token, channel:data.channel, latest:data.ts}, function(err, response) {
            for (var index in response.messages) {
                msg = response.messages[index]
                if (msg.user == data.user) {
                    callback(token, msg, data);
                    return;
                }
            }
        });
    } else if (data.channel.slice(0) == 'C') {
        slack.api('channel.history', {'token':token, channel:data.channel, latest:data.ts}, function(err, response) {
            for (var msg in response.messages) {
                if (msg.user == data.user) {
                    callback(token, msg, data);
                    return;
                }
            }
        });
    }
}

var aftercall = function(token, old_msg, data){
    text = fix_text(old_msg.text, data.text.slice(0,-1));
    slack.api('chat.update', {'token': token, ts: old_msg.ts, 'channel': data.channel, 'text' : text}, function (err, response) {} );
    slack.api('chat.delete', {'token': token, ts: data.ts, 'channel': data.channel}, function (err, response) {} );
}

slack.api("rtm.start", {token: tokenCache.get(''), simple_latest:1, no_unreads:1}, function(err, response) {
    var ws = new WebSocket(response.url)
    ws.on('message', function(data, flags) {
        data = JSON.parse(data)
        if (data.type == 'message') {
            if (/^\w+\*$/.test(data.text)){
                token = tokenCache.get(data.user);
                channel = data.channel;
                ts = data.ts;
                old_msg = get_old_text(token, data, aftercall);
            }
        }
    });
});
