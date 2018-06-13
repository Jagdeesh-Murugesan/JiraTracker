'use strict';

const Alexa = require('alexa-sdk');
const request = require('request');
const config = require('./config');

let boardMap = new Map();
let projectMap =  new Map();
let projBoardMap = new Map();
let projCurrSprintMap = new Map();
const APP_ID = 'amzn1.ask.skill.dab53072-cf43-491e-9510-4e10f1fdfa6a'; // TODO replace with your app ID (OPTIONAL).

const languageStrings = {
    'en': {
        translation: {        
            SKILL_NAME: 'Jira Tracker',
            WELCOME_MESSAGE: "Welcome to %s. Now, what can I help you with?",
            WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',

            HELP_MESSAGE: "You can ask questions such as, what\'s the status, or, you can say exit...Now, what can I help you with?",
            HELP_REPROMPT: "You can say things like, what\'s the status, or you can say exit...Now, what can I help you with?",
            STOP_MESSAGE: 'Goodbye!'
        },
    },
    'en-US': {
        translation: {
            SKILL_NAME: 'Jira Tracker',
            WELCOME_MESSAGE: "Welcome to %s. You can ask a question like, what\'s the status of a Project? ... Now, what can I help you with?",
            WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',

            HELP_MESSAGE: "You can ask questions such as, what\'s the status, or, you can say exit...Now, what can I help you with?",
            HELP_REPROMPT: "You can say things like, what\'s the status, or you can say exit...Now, what can I help you with?",
            STOP_MESSAGE: 'Goodbye!'

        },
    },
};

const handlers = {
   
       //Use LaunchRequest, instead of NewSession if you want to use the one-shot model
    // Alexa, ask [my-skill-invocation-name] to (do something)...
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        
        request({
            url: config.boardUrl,
            method: "GET",
            json: true,
            body: {
                "maxResults": config.maxResults
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body) => {
            if (error) {
                console.log('Error ' + error);
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady');
            } else {                          
                 
                for (let i in body.values) {                 
                    let portFolName = body.values[i].name ;             
                    boardMap.set(body.values[i].name.toUpperCase(),body.values[i].id);  
                    console.log(' BoardNm key '+body.values[i].name.toUpperCase()+' boardId Val ' + boardMap.get(body.values[i].name.toUpperCase()));                                  
                    //TODO see if a single url suffices it.. like projects
                    let jiraUrl = config.boardUrl +"/"+boardMap.get(body.values[i].name.toUpperCase())+"/project";
                   
                    request({
                        url: jiraUrl,
                        method: "GET",
                        json: true,
                        body: {
                            "maxResults": config.maxResults
                        },
                        headers: {
                            "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                            "Accept": "application/json"
                        }
                    }, (error, res, body) => {
                        if (error) {
                            console.log('Error ' + error);
                            speechRes = 'Received error response from Jira';
                            this.response.speak(speechRes);
                            this.emit(':responseReady');
                        } else {
                                                                                  
                            for (let i in body.values) { 
                                let projName = body.values[i].name;
                                projectMap.set(body.values[i].name.toUpperCase(),body.values[i].key);                       
                                projBoardMap.set(body.values[i].name.toUpperCase(),boardMap.get(portFolName.toUpperCase()));
                                console.log(' projectMap.key '+body.values[i].name.toUpperCase()+' projectMap.Val ' + projectMap.get(body.values[i].name.toUpperCase()));                                  
                                console.log(' projBoardMap.key '+body.values[i].name.toUpperCase()+' projBoardMap.Val ' + projBoardMap.get(body.values[i].name.toUpperCase()));                                  

                                let sprintUrl = config.boardUrl +"/"+projBoardMap.get(body.values[i].name.toUpperCase())+"/sprint";
                                request({
                                    url: sprintUrl,
                                    method: "GET",
                                    json: true,
                                    body: {
                                        "maxResults": config.maxResults
                                    },
                                    headers: {
                                        "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                                        "Accept": "application/json"
                                    }
                                }, (error, res, body) => {
                                    if (error) {
                                        console.log('Error ' + error);
                                        speechRes = 'Received error response from Jira';
                                        this.response.speak(speechRes);
                                        this.emit(':responseReady');
                                    } else {                         
                                        let activeSpNm ;
                                        console.log('projName '+projName);
                                        for (let i in body.values) {                                                
                                           if(body.values[i].state=='active'){
                                                activeSpNm = body.values[i].name;
                                                projCurrSprintMap.set(projName.toUpperCase(),activeSpNm);
                                                console.log(' projCurrSprintMap.key '+projName.toUpperCase()+' projCurrSprintMap.Val' + projCurrSprintMap.get(projName.toUpperCase()));                                  
                                            }
                                        }                                              
                                    }
                                }); 
                            }                                                    
                        }
                    }); 
                  
                }                                                       
            }
        }); 

        this.response.speak(this.attributes.speechOutput);
        this.emit(':responseReady');
    },
    'Get_portfolio_Details': function(){
        let speechRes;
        request({
            url: config.boardUrl,
            method: "GET",
            json: true,
            body: {
                "maxResults": config.maxResults
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body) => {
            if (error) {
                console.log('Error ' + error);
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady');
            } else {
               let portFols = "";
               let port_count=0;
               let portValues = body.values;  
                for (let i in portValues) { 
                    port_count++;
                    if(portValues.length == 1){
                        portFols = body.values[i].name;                       
                    }               
                    else if(port_count == portValues.length){
                        portFols = portFols+" and "+ body.values[i].name;                       
                    }
                    else{                    
                        portFols = portFols +" "+ body.values[i].name +",";                       
                    }
                }
                
                if(portValues.length == 1){
                    speechRes = "There is "+port_count+" portfolio present . It is "+portFols
                }
                else{
                    speechRes = "There are "+port_count+" portfolios present . They are "+portFols
                }
                  

                this.response.speak(speechRes);
                this.emit(':responseReady');
            }
        });      

    },
    'Get_Projects': function () {
        
        let speechRes;
        let portFolName = this.event.request.intent.slots.portfolioName.value;
        this.attributes.speechOutput = "Can you tell again the Portfolio Name";
        this.attributes.repromptSpeech = "Sorry i didnt hear any Portfolio Name";
        if(portFolName== undefined || portFolName==null || portFolName=="None")
        {
            this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
            this.emit(':responseReady');
        }
        let jiraUrl = config.boardUrl +"/"+boardMap.get(portFolName.toUpperCase())+"/project";
        console.log('Inside project portfolio '+jiraUrl +' portFolName '+portFolName);
        request({
            url: jiraUrl,
            method: "GET",
            json: true,
            body: {
                "maxResults": config.maxResults
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body) => {
            if (error) {
                console.log('Error ' + error);
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady');
            } else {
               let projects = "";
               let port_count=0;
               let projectVals = body.values;  
                for (let i in projectVals) {                    
                    port_count++;
                    if(projectVals.length == 1){
                        projects = body.values[i].name;                        
                    }               
                    else if(port_count == projectVals.length){
                        projects = projects+" and "+ body.values[i].name;                       
                    }
                    else{                    
                        projects = projects +" "+ body.values[i].name +",";                                             
                    }
                }
                
                if(projectVals.length == 1){
                    speechRes = "There is "+port_count+" project present . It is "+projects
                }
                else{
                    speechRes = "There are "+port_count+" projects present . They are "+projects
                }
                  
                this.attributes.speechOutput = speechRes;
                this.response.speak(this.attributes.speechOutput);
                this.emit(':responseReady');
            }
        });      

       
    },
    'Get_Rel_Details': function () {
        //TODO
        let speechRes;
        let projName = this.event.request.intent.slots.projectName.value;
        this.attributes.speechOutput = "Can you tell again the Project Name";
        this.attributes.repromptSpeech = "Sorry i didnt hear any Project Name";
        if(projName== undefined || projName==null || projName=="None")
        {
            this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
            this.emit(':responseReady');
        }
     
        var consUrl = config.rootContextUrl+"/projects/1.0/project/";
        
        consUrl = consUrl+projectMap.get(projName.toUpperCase())+"/release/allversions";
        console.log("Inside GetRelease details::"+consUrl +' projName '+projName);

        request({
            url: consUrl,
            method: "GET",
            json: true,
            body: {
                "maxResults": config.maxResults
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body) => {
            if (error) {
                console.log('Error ' + error);
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady');
            } else {
                let completedRels = 0
                let activeRel ;
                let relDt;
                let totalRel = body.length;
                for (let i in body) { 
                    if (!body[i].name.includes("Version")) {

                        if (body[i].released == true) {
                            completedRels = completedRels + 1;
                        }
                        else if (body[i].released == false) {
                            activeRel = body[i].name;
                            relDt = body[i].releaseDate.iso;
                        }
                    }
                }
                speechRes =  "<p>"+projName+" has "+totalRel+" Releases, out of which, "+ completedRels+" is completed. The current Release is "+activeRel+", and its release date is "+ relDt+" </p>";
                this.response.speak(speechRes);
                this.emit(':responseReady');
            }
        });       
    },
    'Get_Spt_Details': function () {
       
       let speechRes;
       let projName = this.event.request.intent.slots.projectName.value;

        this.attributes.speechOutput = "Can you tell again the Project Name";
        this.attributes.repromptSpeech = "Sorry i didnt hear any Project Name";
        if(projName== undefined || projName==null || projName=="None")
        {
            this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
            this.emit(':responseReady');
        }

       let sprintUrl = config.boardUrl +"/"+projBoardMap.get(projName.toUpperCase())+"/sprint";
       console.log('Get_Spt_Details ' + sprintUrl +' projName '+projName);
        request({
            url: sprintUrl,
            method: "GET",
            json: true,
            body: {
                "maxResults": config.maxResults
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body) => {
            if (error) {
                console.log('Error ' + error);
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady');
            } else {
                let completedSps = 0
                let activeSpNm ;
              
                for (let i in body.values) {
                    if (!body.values[i].name.includes("Sample")) {
                        if (body.values[i].state == 'closed') {
                            completedSps = completedSps + 1;
                        }
                        else if (body.values[i].state == 'active') {
                            activeSpNm = body.values[i].name;
                        }
                    }
                }
                speechRes =  "<p>"
                +projName+" has overall "+completedSps+" Sprints completed. The current active sprint is "+activeSpNm+" </p>";
                this.response.speak(speechRes);
                this.emit(':responseReady');
            }
        });
       
    },
    'Get_Issues_Details': function(){
        let projName = this.event.request.intent.slots.projectName.value;
        let projKey;
        let sprintNm;
        this.attributes.speechOutput = "Can you tell again the Project Name";
        this.attributes.repromptSpeech = "Sorry i didnt hear any Project Name";
        if(projName== undefined || projName==null || projName=="None")
        {
            this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
            this.emit(':responseReady');
        }

        sprintNm = projCurrSprintMap.get(projName.toUpperCase());                
        
        let speechRes;
        let jql = "project="+projName;
        console.log('Get_Issues_Details '+jql)
        request({
            url: config.endpoint,
            method: "POST",
            json: true,
            body: {
                "jql": jql,
                "maxResults": config.maxResults
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body)=> {
            if (error) {
                console.log('Error ' + error);                
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady'); 
            } else {
                
                let doneCnt=0;
                let notDoneCnt=0;
                let issuesCount=0;
                let completionPercentage=0;
                let strProjectStatus = "";
                for (var i in body.issues){ 
                                      
                    if (body.issues[i].fields.status.name == "Done"
                        && body.issues[i].fields.issuetype.name != "Sub-task" && body.issues[i].fields.customfield_10004!=null
                        && body.issues[i].fields.customfield_10004[0].includes(sprintNm)) {
                                                                                                       
                            doneCnt = doneCnt+1; 
                    } 
                }
                for (var j in body.issues){
                    
                    if(body.issues[j].fields.status.name != "Done"
                        && body.issues[j].fields.issuetype.name != "Sub-task" && body.issues[j].fields.customfield_10004!=null
                        && body.issues[j].fields.customfield_10004[0].includes(sprintNm)){                            
                            notDoneCnt = notDoneCnt+1;
                    }
                }

                issuesCount = notDoneCnt+doneCnt;
                completionPercentage = (doneCnt/issuesCount)*100;
                console.log('completionPercentage --> '+completionPercentage);
                if(completionPercentage>=80){
                    strProjectStatus = "Green";
                }else if (completionPercentage>=60 && completionPercentage<80) {
                    strProjectStatus = "Amber";
                } else {
                    strProjectStatus = "Red";
                }        

                speechRes =  "<p>"+projName+" project's current sprint is in <break time='0.2s'/>"+ strProjectStatus +" zone.</p>" ;
                if(doneCnt == issuesCount){
                    speechRes = speechRes + "<p> All " + doneCnt +" out of "+issuesCount+" user stories are completed.</p>";
                }else if(notDoneCnt == issuesCount){
                    speechRes = speechRes + "<p> All " + notDoneCnt +" out of "+issuesCount+" user stories are yet to be completed.</p>";
                }else{
                    speechRes = speechRes + "<p>" + doneCnt +" out of "+issuesCount+" user stories are completed <break time='0.01s'/>and "+
                    notDoneCnt +" out of "+issuesCount+" user stories are yet to be completed."+ "</p>";
                }

                this.response.speak(speechRes);
                this.emit(':responseReady');  
            }
        });
       

    },

    'Get_Incomplete_Details': function(){
        let projName = this.event.request.intent.slots.projectName.value;
        let projKey;
        let sprintNm;
        this.attributes.speechOutput = "Can you tell again the Project Name";
        this.attributes.repromptSpeech = "Sorry i didnt hear any Project Name";
        if(projName== undefined || projName==null || projName=="None")
        {
            this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
            this.emit(':responseReady');
        }

        sprintNm = projCurrSprintMap.get(projName.toUpperCase());                
        
        let speechRes;
        let jql = "project="+projName;
        console.log('Get_Incomplete_Details '+jql)
        request({
            url: config.endpoint,
            method: "POST",
            json: true,
            body: {
                "jql": jql,
                "maxResults": config.maxResults
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body)=> {
            if (error) {
                console.log('Error ' + error);                
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady'); 
            } else {                            
                let incompletedStories = "";
             
                for (var j in body.issues){
                    
                    if(body.issues[j].fields.status.name != "Done"
                        && body.issues[j].fields.issuetype.name != "Sub-task" && body.issues[j].fields.customfield_10004!=null
                        && body.issues[j].fields.customfield_10004[0].includes(sprintNm)){       
                            incompletedStories = incompletedStories +" "+ body.issues[j].key;                                            

                    }
                }

          
                speechRes =  "<p>Incomplete user stories in "+projName+" are  <break time='0.2s'/>"+ incompletedStories +" <break time='0.1s'/></p>" ;
                
                this.response.speak(speechRes);
                this.emit(':responseReady');  
            }
        });
       

    },

    'Get_Developer_Details': function(){
        let userStoryId = this.event.request.intent.slots.userStory.value;
        this.attributes.speechOutput = "Can you tell again the Task ID";
        this.attributes.repromptSpeech = "Sorry i didnt hear any Task ID";

        if (userStoryId == undefined || userStoryId == null || userStoryId == "None") {
            this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
            this.emit(':responseReady');
        }
        let projKey;
        let sprintNm;
        
        console.log("User story "+userStoryId);
        console.log("User story "+userStoryId.replace(" ",'-'));
        let userStory = userStoryId.replace(" ",'-');
       
        
        let speechRes;
        let jql = "key="+userStory;
        console.log('Get_Developer_Details '+jql)
        request({
            url: config.endpoint,
            method: "POST",
            json: true,
            body: {
                "jql": jql,
                "maxResults": config.maxResults
            },
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body)=> {
            if (error) {
                console.log('Error ' + error);                
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady'); 
            } else {
                if (body.issues[0].fields.assignee != null) {
                    speechRes = "<p>Developer assigned to  " + userStory + " is   <break time='0.2s'/>" + body.issues[0].fields.assignee.name + " </p>";
                }
                else if (body.issues[0].fields.assignee == null || body.issues[0].fields.assignee == undefined){
                    speechRes = "<p> There is no developer assigned to "+userStory+" </p>"
                }
                
                this.response.speak(speechRes);
                this.emit(':responseReady');  
            }
        });
       

    },
    'Update_Priority': function(){
        let userStoryId = this.event.request.intent.slots.userStory.value;
        let priorityLvl = this.event.request.intent.slots.priorityLvl.value;
        console.log('Update_Priority '+userStoryId+' priorityLvl '+priorityLvl);
        let repeatSpeech = "Can you tell again the Task ID";
        this.attributes.repromptSpeech = "Sorry i didnt hear any Task ID";
        if (userStoryId == undefined || userStoryId == null || userStoryId == "None") {
            this.response.speak(repeatSpeech).listen(this.attributes.repromptSpeech);
            this.emit(':responseReady');
        }
        if(priorityLvl == undefined || priorityLvl == null || priorityLvl == "None") {
            repeatSpeech = "Can you tell again the Priority Level.";
            this.response.speak(repeatSpeech).listen(this.attributes.repromptSpeech);
            this.emit(':responseReady');
        }
        let projKey;
        let sprintNm;                      
        let speechRes;        
        let userStory = userStoryId.replace(" ",'-');
        console.log('Update_Priority priorityLvl '+priorityLvl);
        let lvl = priorityLvl.charAt(0).toUpperCase() + priorityLvl.slice(1).toLowerCase();
        let consUrl = config.rootContextUrl+"/api/2/issue/"+userStory
        console.log('Update_Priority '+userStory+' priorityLvl '+lvl);
        request({
            
            url: consUrl,
            method: "PUT",
            json: true,
            body:{"update":{"priority":[{"set":{"name":lvl}}]}},
            headers: {
                "Authorization": "Basic " + (new Buffer(config.username + ":" + config.password)).toString("base64"),
                "Accept": "application/json"
            }
        }, (error, res, body)=> {
            if (error) {
                console.log('Error ' + error);                
                speechRes = 'Received error response from Jira';
                this.response.speak(speechRes);
                this.emit(':responseReady'); 
            } else {

                speechRes =  "<p> Updated the priority of "+ userStory+" to "+ lvl+" </p>" ;
                
                this.response.speak(speechRes);
                this.emit(':responseReady');  
            }
        });
       

    },
  
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'AMAZON.RepeatIntent': function () {
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended: ${this.event.request.reason}`);
    },
    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};