var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var async = require('async');

PORT = process.env.PORT || 8080;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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

//Placeholders
var countryQueryMatches = [];
var currentTesterId = "";
var currentTesterScore = 0;
var testerScore = {};
var testerScoreArray = [];
var deviceArray = [];
var testerOrder = [];
var prioritizedTestersJsonArray = [];

function getCountryMatches(country, callback) {
	var countryLength = country.length
	var testerCount = 0;
	var countryCount = 0;
	var totalTesterObjectCount = 0;
	
	if (country[0] === "ALL") {
		TesterObjects.find(function (err, testerObject) {
			if (err) return handleError(err);
			testerObject.forEach(function(item) {
				countryQueryMatches.push(item);
			})
			callback(null, countryQueryMatches)
		})
	} else {
		country.forEach(function(country) {
			TesterObjects.find({ "country": country }, function (err, testerObject) {
				totalTesterObjectCount += testerObject.length
				countryCount += 1;
				if (err) return handleError(err);
				testerObject.forEach(function(item) {
					countryQueryMatches.push(item);
					testerCount += 1;
					if (testerCount === totalTesterObjectCount && countryCount === countryLength) {
						callback(null, countryQueryMatches)
					}
				})
			})
		})
	}
}

function assignScore(testers, callback) {
	if (deviceArray[0] === "ALL") {
		deviceArray = ["iPhone_4", "iPhone_4S", "iPhone_5", "Galaxy_S3", "Galaxy_S4", 
									"Nexus_4", "Droid_Razor", "Droid_DNA", "HTC_One", "iPhone_3"]
	}
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
	var keys = Object.keys(testerScores);
	keys.sort(function(a, b) { 
		return testerScore[b] - testerScore[a] });
	callback(null, keys)
}

const getTesterFromDatabase = function(tester, callback) {
	TesterObjects.find({ "testerId": tester }, function (err, testerObject) {
		prioritizedTestersJsonArray.push(testerObject[0])
		callback(null)
	})
}

function sendTesterDataToBrowser(testerIds, callback) {
	count = 0;
	async.eachSeries(testerIds, getTesterFromDatabase, function(err) {
    if (err) {
      console.log('An error occurred!');
      console.log(err);
      return;
    }
    callback(null, prioritizedTestersJsonArray);
  })

}

app.post('/', function(req, res, next) {

	//Rest placeholders
	countryQueryMatches = [];
	currentTesterId = "";
	currentTesterScore = 0;
	testerScore = {};
	testerScoreArray = [];
	deviceArray = [];
	prioritizedTestersJsonArray = [];


	requestBody = req.body
	deviceArray = requestBody.device
	var genericErrorMessage = "An error has occurred. Please try again."

	getCountryMatches(requestBody.country, function(err, data) {
		if (err) {
        res.send( [{ "error": "error" }, { "message": "Error contacting the database. Please try again." }] );
        return;
    } else {
    	assignScore(data, function(err, data) {
    		if (err) {
        		res.send( [{ "error": "error" }, { "message": genericErrorMessage }] );
        		return;
    		} else {
    			sortTesters(data, function(err, data) {
    				if (err) {
        				res.send( [{ "error": "error" }, { "message": genericErrorMessage }] );
        				return;
    				} else {
    					sendTesterDataToBrowser(data, function(err, data) {
    						if (err) {
		        				res.send( [ { "error": "error" }, { "message": genericErrorMessage }] );
		        				return;
		    				} else {
		    					res.send(data);
		    					res.end();
		    				}
    					})
    				}
    			})
    		}
    	})
    }
	})
})

app.listen(PORT, function () {
    console.log('Listening');
});