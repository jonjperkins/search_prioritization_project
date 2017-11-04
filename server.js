var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//const request = require('request');
//var qs = require('qs');


PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

var mongoDB = 'mongodb://jonperkins:apasswordineveruse@ds241895.mlab.com:41895/testdbjon001';
mongoose.connect(mongoDB, {
  useMongoClient: true
});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var testerObjectsSchema = new Schema({ 	testerId: Number, firstName: String, lastName: String, country: String, 
										lastLogin: Date, iPhone_4: Number, iPhone_4S: Number, iPhone_5: Number, 
										Galaxy_S3: Number, Galaxy_S4: Number, Nexus_4: Number, Droid_Razor: Number, 
										Droid_DNA: Number, HTC_One: Number, iPhone_3: Number}, { collection : 'tester_objects' }); 

var TesterObjects = mongoose.model('TesterObjects', testerObjectsSchema);


var countryQueryMatches = [];
var currentTesterId = "";
var currentTesterScore = 0;
var testerScore = {};
var testerScoreArray = [];
var deviceArray = ["iPhone_3", "iPhone_5"];
var countryArray = ["US", "JP"]
var prioritizedTestersJsonArray = [];

function getCountryMatches(country, callback) {
	TesterObjects.find({ "country": country }, function (err, testerObject) {
		if (err) return handleError(err);
		testerObject.forEach(function(item) {
			countryQueryMatches.push(item);
		})
		callback(null, countryQueryMatches)
	})
}

function assignScore(testers, callback) {
	testers.forEach(function(tester) {
		currentTesterId = tester.testerId
		deviceArray.forEach(function(device) {
			currentTesterScore += tester[device]
		})
		testerScore[currentTesterId] = currentTesterScore
		currentTesterScore = 0;
	})
	callback(null, testerScore)
}

function sortTesters(testerScores, callback) {
	let keys = Object.keys(testerScores);
	keys.sort(function(a, b) { return testerScores[b] - testerScores[a] });
	callback(null, keys)
}

function sendTesterDataToBrowser(testerIds, callback) {
	count = 0;
	testerIds.forEach(function (testerId) {
		TesterObjects.find({ "testerId": testerId }, function (err, testerObject) {
			prioritizedTestersJsonArray.push(testerObject[0]);
			// this is correct //console.log("array thus far: " + prioritizedTestersJsonArray)
			count +=1;
			if (count === testerIds.length) {
				//console.log("right before callback: " + prioritizedTestersJsonArray)
				//console.log(prioritizedTestersJsonArray)
				callback(null, prioritizedTestersJsonArray)
			}
		})
	})
}

getCountryMatches("JP", function(err, data) {
	if (err) {
        console.log('error');
        return;
    } else {
    	assignScore(data, function(err, data) {
    		if (err) {
        		console.log('error');
        		return;
    		} else {
    			sortTesters(data, function(err, data) {
    				if (err) {
        				console.log('error');
        				return;
    				} else {
    					console.log("sorted testers right before submit to browser: " + data)
    					sendTesterDataToBrowser(data, function(err, data) {
    						if (err) {
		        				console.log('error');
		        				return;
		    				} else {
		    					console.log(data)
		    					// res.send(data);
		    					// res.end();
		    				}
    					})
    				}
    			})
    		}
    	})
    }
})




// app.post('/', function(req, res, next) {
//   var request_url = req.body.get_url;
//   var username = req.body.username;
//   var api_key = req.body.api_key;

//   request(request_url, function (error, response, body) {
//       var fields = []
//       var regex = /<input[\s\S]*?name="(.*?)"/g
//     var item
//     while (item = regex.exec(body))
//       fields.push(item[1]);
//       fields = fields.join(',');
//       res.send(fields);
//   });
  
// });

app.listen(PORT, function () {
    console.log('Listening');
});