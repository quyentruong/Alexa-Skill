'use strict';
var Alexa = require('alexa-sdk');

var APP_ID = undefined; //OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var SKILL_NAME = 'Education Facts';

/**
 * Array containing education facts.
 */
var FACTS = [
    "30 years ago, America was the leader in quantity and quality of high school diplomas. Today, our nation is ranked 36th in the world.",
    "1.3 million high school students don't graduate on time yearly. States with highest rates (80-89%) are Wisconsin, Iowa, Vermont, Pennsylvania and New Jersey. States with lowest (less than 60%) are Nevada, New Mexico, Louisiana, Georgia and S. Carolina.",
    "97% of low-income students rely on school for internet access, but 40 million students do not have high-speed Internet in school.",
    "If the 1.3 million dropouts from the Class of 2010 had graduated, the nation would have seen $337 billion more in earnings over the course of the students’ lifetimes.",
    "A 3rd grade student who reads at the appropriate reading level compared to a 3rd grade student who does not is 4 times more likely to graduate by age 19. Furthermore, a student living in poverty is 13 times less likely to graduate on time.",
    "Teacher quality is one of the most significant factors related to student achievement. In the U.S., 14% of new teachers resign by the end of their first year, 33% leave within their first 3 years, and almost 50% leave by their 5th year.",
    "In the workplace, 85% of current jobs and 90% of new jobs require some or more college or post-secondary education.",
    "Roughly half of the students who enter a 4-year school will receive a bachelor’s degree within 6 years.",
    "In schools made up of 75% or more low-income students, there are 3 times the number of out-of-field teachers than in wealthier school districts.",
    "High schools are not preparing students with the skills and knowledge necessary to excel after graduation. Only 1 in 4 high school students graduate college-ready in the 4 core subjects of English, Reading, Math and Science.",
    "As of 2012, 31 million primary-school pupils worldwide dropped out of school. An additional 32 million repeated a grade.",
    "In the sub-Saharan, 11.07 million children leave school before completing their primary education. In South and West Asia, that number reaches 13.54 million.",
    "According to UNESCO, 61 million primary school-age children were not enrolled in school in 2010. Of these children, 47% were never expected to enter school, 26% attended school but left, and the remaining 27% are expected to attend school in the future.",
    "Children living in a rural environment are twice as likely to be out of school than urban children. Additionally, children from the wealthiest 20% of the population are 4 times more likely to be in school than the poorest 20%.",
    "In developing, low-income countries, every additional year of education can increase a person’s future income by an average of 10%.",
    "Women who are less educated are having more children, on average 2.5 children, over the course of their lifetime when compared to more educated women, on average 1.7 children.",
    "53% of the world’s out-of-school children are girls and 2/3 of the illiterate people in the world are women.",
    "Education empowers women to make healthy decisions about their lives. For example, women in Mali with a secondary level education or higher have an average of 3 children, while those with no education have an average of 7.",
    "The youth literacy rates in South America and Europe are among the highest with 90-100% literacy. The African continent, however, has areas with less than 50% literacy among children ages 18 and under."
];

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetNewFactIntent': function () {
        this.emit('GetFact');
    },
    'GetFact': function () {
        // Get a random education fact from the education facts list
        var factIndex = Math.floor(Math.random() * FACTS.length);
        var randomFact = FACTS[factIndex];

        // Create speech output
        var speechOutput = "Here's your fact: " + randomFact;

        this.emit(':tellWithCard', speechOutput, SKILL_NAME, randomFact)
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = "You can say tell me a education fact, or, you can say exit... What can I help you with?";
        var reprompt = "What can I help you with?";
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Goodbye!');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Goodbye!');
    }
};