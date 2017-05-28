'use strict';
var Alexa = require('alexa-sdk');
var request = require('request');
var cheerio = require("cheerio");
var moment = require('moment-timezone');

var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).
var config = {'word': '', 'date': '2017-01-01'};
var stt = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
var repeat = {};
var userid;
var languageStrings = {
    "en": {
        "translation": {
            "FACTS": ["hello", 'hi'],
            "SKILL_NAME": "Word a day",
            "GET_FACT_MESSAGE": 'Today word is $word: Spell out: $spelling: ',
            "HELP_MESSAGE": "You can say tell me a new word, spelling, pronunciation, definition, give me some examples, or, you can say stop... What can I help you with?",
            "HELP_REPROMPT": "What can I help you with?",
            "REPEAT_MESSAGE": "You can say repeat, or, you can say stop.",
            "STOP_MESSAGE": "Goodbye!"
        }
    },
    "en-US": {
        "translation": {
            "FACTS": ["hello", 'hi'],
            "SKILL_NAME": "Word a day"
        }
    },
    "en-GB": {
        "translation": {
            "FACTS": ["hello", 'hi'],
            "SKILL_NAME": "Word a day"
        }
    }
};

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // console.log(`try to read event ${JSON.stringify(event)}`);
    console.log(`try to read config ${JSON.stringify(config)}`);
    userid = event.session.user.userId.split(".")[3];
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetSpellingIntent': function () {
        var self = this;
        check(function (dict) {
            var speechOutput = `${dict.spell} <break time="1.2s"/> ${self.t("REPEAT_MESSAGE")}`;
            frepeat("GetSpellingIntent");
            self.emit(':ask', speechOutput, self.t('HELP_REPROMPT'));
        });
    },
    'PronounceIntent': function () {
        var self = this;
        check(function (dict) {
            var speechOutput = `${dict.ipa} <break time="1.2s"/> ${self.t("REPEAT_MESSAGE")}`;
            frepeat('PronounceIntent');
            self.emit(':ask', speechOutput, self.t('HELP_REPROMPT'));
        });
    },
    'DefinitionIntent': function () {
        var self = this;
        check(function (dict) {
            var def = '';
            if (dict.def.length >= 2) {
                for (var i = 0; i < dict.def.length; i++) {
                    def += `The ${stt[i]} definition is: ${dict.def[i].trim()} `;
                }
            } else {
                def += `The definition is: ${dict.def[0].trim()}`;
            }
            var speechOutput = `When it's used as ${dict.type}, ${def} <break time="1.2s"/> ${self.t("REPEAT_MESSAGE")}`;
            frepeat('DefinitionIntent');
            self.emit(':askWithCard', speechOutput, self.t('HELP_REPROMPT'), "Definition", `${dict.word}\n${dict.type}\n${dict.def.join('\n')}`);
        });
    },
    'GetExampleIntent': function () {
        var self = this;
        check(function (dict) {
            var sentenceIndex = Math.floor(Math.random() * dict.sentence.length);
            var randomSentence = dict.sentence[sentenceIndex];
            var sentenceOutput = dict.sentence[sentenceIndex].replace(dict.word, dict.ipa);
            var speechOutput = `${sentenceOutput} <break time="1.2s"/> ${self.t("REPEAT_MESSAGE")}`;
            frepeat('GetExampleIntent');
            self.emit(':askWithCard', speechOutput, self.t('HELP_REPROMPT'), "Example", randomSentence);
        });
    },
    'GetNewFactIntent': function () {
        this.emit('GetFact');
    },
    'GetFact': function () {
        var self = this;
        check(function (dict) {
            var message = `Today word is ${dict.ipa}. Spell out: ${dict.spell}. When it's used as `;
            var def = '';
            if (dict.def.length >= 2) {
                for (var i = 0; i < dict.def.length; i++) {
                    def += `The ${stt[i]} definition is: ${dict.def[i].trim()} `;
                }
            } else {
                def += `The definition is: ${dict.def[0].trim()}`;
            }
            var speechOutput = message + dict.type + ". " + def;
            self.emit(':tellWithCard', speechOutput, self.t("SKILL_NAME"), `${dict.word}\n${dict.type}\n${dict.def.join('\n')}`);
        });
    },
    'AMAZON.RepeatIntent': function () {
        if (repeat[userid] == undefined) {
            this.emit(':tell', "Not available");
        }
        this.emit(repeat[userid]);
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'Unhandled': function () {
        this.emit(':ask', this.t("HELP_MESSAGE"), this.t("HELP_REPROMPT"));
    }
};

function check(callback) {
    var now = moment().tz("America/Los_Angeles");
    if (now.isDST()) {
        console.log("DayLight Saving Time");
        now.subtract(1, 'hours');
    }
    console.log(`Time now is ${now}`);
    now = now.format('YYYY-MM-DD');
    if (moment(config.date).isBefore(now)) {
        console.log(`Check date: date in file ${config.date}, now: ${now}`);
        get_ipa_def(function (dict) {
            console.log("Access the website");
            if (config.word !== dict.word) {
                console.log("Check word");
                config = JSON.parse(JSON.stringify(dict));
                config.date = now;
            }
            callback(config);
        });
        return;
    }
    callback(config);
}

function getWordTheDay(callback) {
    var dict = {'word': '', 'spell': '', 'ipa': '', 'type': [], 'def': [], 'sentence': []};
    request("http://www.dictionary.com/wordoftheday", function (error, response, body) {
        var $ = cheerio.load(body);
        var word = ($(".definition-header").text()).trim().split(" ");
        $('.citation-context').find('blockquote').each(function () {
            dict.sentence.push($(this).text().trim().split(/\r\n|\r|\n/)[0]);
        });
        word = word[word.length - 1];
        dict.word = word;
        dict.spell = word.split('').join(`<break time="0.3s"/>`);
        callback(dict)
    });
}

function get_ipa_def(callback) {
    getWordTheDay(function (dict) {
        var uri = `http://www.dictionary.com/browse/${dict.word}`;
        request(uri, function (error, response, body) {
            var $ = cheerio.load(body);
            var ipa = ($(".pron.ipapron")).eq(0).text().trim();
            ipa = ipa.replace(/[/]/g, "").split(",")[0];
            ipa = `<phoneme alphabet="ipa" ph="${ipa}">${dict.word}</phoneme>`;
            dict.ipa = ipa;
            dict.type = ($('.luna-data-header').eq(0).text().trim());

            $('.def-list').eq(0).each(function () {
                $(this).find('.def-pbk.ce-spot').eq(0).find('.def-content').each(function () {
                    dict.def.push($(this).text().replace(/\s\s+/g, ' ').trim());
                });
            });
            callback(dict);
        });

    });
}

function frepeat(last) {
    repeat[userid] = last;
    // repeat[userid] = `${last} <break time="1.2s"/> ${self.t("REPEAT_MESSAGE")}`;
    console.log("repeat" + JSON.stringify(repeat));
}