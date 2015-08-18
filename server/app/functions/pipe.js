// dependencies
var _ = require('lodash');
var Q = require('q');
var mongoose = require('mongoose');

// load in filter functions
var filterBank = require('./filterBank');

// takes a filter and applies it to the input object's arrays (expects an object of arrays)
function pipeSingleArr(input, filterName, parameters) {
	// get associated function
	var func = filterBank.singleArray[filterName];
	// apply filter to each array in the input object
	var keys = Object.keys(input);
	keys.forEach(function(key) {
		// if the function takes more params, add them to the parameter array
		var paramsArr = [input[key]];
		if (parameters) paramsArr = paramsArr.concat(parameters);
		// pass each array as parameter to associated filter function
		input[key] = func.apply(null, paramsArr);
	});
	// return modified input data object
	return input;
}

// filter is applied to each input object as a whole, not the object's arrays individually
function pipeSingleObj(input, filterName, parameters) {
	// get associated function
	var func = filterBank.singleObj[filterName];
	// apply filter to the input object
	var paramsArr = [input].concat(parameters);
	return func.apply(null, paramsArr);
}

// takes a filter and applies it to an array of objects (an array of objects of arrays)
//   each object is transformed into an array of all its inner arrays concatenated together
function pipeMultiArr(inputArr, filterName, parameters) {
	// merge each object's arrays and add each to an array of such arrays
	var combinedArr = inputArr.reduce(function(accum, inputObj) {
		//// for intersection of values between objects (ie routes)
		var combinedInputs = Object.keys(inputObj).reduce(function(innerAccum, key) {
			return innerAccum.concat(inputObj[key]);
		}, []);
		accum.push(combinedInputs);
		return accum;
	}, []);

	// if the function takes more params, add them to the parameter array
	if (parameters) combinedArr = combinedArr.concat(parameters);
	// pass combined array as parameter to associated filter function
	var output = filterBank.multiArray[filterName].apply(null, combinedArr);

	// return modified input data object
	return output;
}

// takes a filter and applies it to an array of objects (an array of objects of arrays)
function pipeMultiObj(inputArr, filterName, parameters) {
	// if the function takes more params, add them to the parameter array
	var paramsArr = [inputArr].concat(parameters);
	// pass combined array as parameter to associated filter function
	// and return the output
	return filterBank.multiObj[filterName].apply(null, paramsArr);
}

// choose how to apply filter to the input data and return the transformed data
function applyPipe(inputData, filter, parameters) {
	var name = filter.name;
	// if filter is applied to each array in each input object
	if (_.has(filterBank.singleArray, name)) {
		// apply the filter to each input in the input array
		return inputData.map(function(input) {
			// each filter can have any number of parameters, so use apply
			var args = [input].concat(name, filter.parameters);
			return pipeSingleArr.apply(null, args);
		});
	}
	// if filter expects a single input object at a time
	else if (_.has(filterBank.singleObj, name)) {
		// apply the filter to each input in the input array
		return inputData.map(function(input) {
			// each filter can have any number of parameters, so use apply
			var args = [input].concat(name, filter.parameters);
			return pipeSingleObj.apply(null, args);
		});
	}
	// if filter is applied to an array of objects with no transformations
	else if (_.has(filterBank.multiObj, name)) {
		return pipeMultiObj(inputData, name);
	}
	// if filter expects an array of input objects and is applied to transformed arrays
	else {
		// apply the filter to the total input array
		return pipeMultiArr(inputData, name);
	}
}

// iterate through and apply all filters, returning transformed data
function pipeline(inputData, filters) {
	// apply each filter to the input data
	filters.forEach(function(filter) {
		inputData = applyPipe(inputData, filter);
	});
	return inputData;
}

// applies a series of pipes to a pipe's input, and returns the output
function getPipeData(pipe) {

	// load models for population
	var Pipe = mongoose.model('Pipe');
	var Route = mongoose.model('Route');
	var Filter = mongoose.model('Filter');

	// fire off promises for the inputs' data
	// find them in the db first - pipes only hold reference to their inputs
	var inputRoutesPromises = pipe.inputs.routes.map(function(route) {
		return Route.findById(route).exec().then(function(populatedRoute) {
			return populatedRoute.getCrawlData();
		});
	});
	var inputPipesPromises = pipe.inputs.pipes.map(function(pipe) {
		return Pipe.findById(pipe).then(function(populatedPipe) {
			return populatedPipe.getPipeData();
		});
	});

	// populate all the filters
	var filterPromises = pipe.filters.map(function(filterId) {
		return Filter.findById(filterId);
	});
	// save populated filters for later (can't attach them to mongo obj for some reason)
	var populatedFilters;

	// wait for filters (crawling is happening in background)
	return Q.all(filterPromises)
		.then(function(filters) {
			// save the populated filters
			populatedFilters = filters;
			// wait for all the crawling data to come back
			return Q.all(inputRoutesPromises.concat(inputPipesPromises));
		})
		.then(function(inputData) {
			// flatten the data (pipes return array of objects, but routes only return objects)
			inputData = _.flatten(inputData);
			// apply each filter to each input
			return pipeline(inputData, populatedFilters);
		})
		.then(function(pipedData) {
			// interleave or merge if necessary
			if (pipe.outputFormat === 'interleave') {
				return filterBank.interleave(pipedData);
			} else if (pipe.outputFormat === 'merge') {
				return filterBank.merge(pipedData);
			}
			return pipedData;
		})
		.catch(function(err) {
			console.log('caught this error in generateOutput');
			console.error(err);
			throw err;
		});
}

// exports
module.exports = getPipeData;