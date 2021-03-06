var jsdom = require('node-jsdom');
var Q = require('q');
var _ = require('lodash');

// go to the url, get the what matches the data's selectors, and paginate as necessary
function getSelectors(url, data, paginationArr) {
	// return a promise for the jsdom data - it's asynchronous
	var deferred = Q.defer();

	// jsdom provides access to the window object
	jsdom.env({
		url: url,
		done: function(err, window) {
				// handle errors
				if (err) return deferred.reject(err);

				// window.document is used frequently, save it to a variable
				var document = window.document;
				// loop through each data (contains selector, name, etc.
				var output = data.reduce(function(accum, datum) {
					var selected;

					// if attr is specified, get that attribute from each selected element
					var attribute = datum.attr;
					if (attribute) {
						selected = Array.prototype.slice.call(document.querySelectorAll(datum.selector));
						accum[datum.name] = selected.map(function(elem) {
							return elem.getAttribute(attribute);
						});
					}
					// otherwise default behavior (get text)
					else {
						selected = Array.prototype.slice.call(document.querySelectorAll(datum.selector));
						accum[datum.name] = selected.map(function(elem) {
							return elem.textContent;
						});
					}		 
					// if an index is specified, only keep that index
					if (datum.index && selected.length) {
						accum[datum.name] = accum[datum.name][datum.index];
					}
					// pass accumulation of data to next iteration of reduce
					return accum;
				}, {});

				// pagination
				var nextLinks = [];
				// collect the pagination links (add them to queue)
				paginationArr.forEach(function(paginationObj) {
					// check to see if the depth has been reached
					if (paginationObj.depth <= 0) return;
					// find the pagination link by it's selector
					var link = document.querySelectorAll(paginationObj.link);
					// if no element was selected, quit the process, and set depth to 0
					if (!link.length) return paginationObj.depth = 0;
					// if no index is given take the first node
					if (typeof paginationObj.index === 'undefined') link = link[0];
					else link = link[paginationObj.index];
					// get the links href
					link = link.getAttribute('href');
					// add to queue of links
					nextLinks.push(link);
					// subtract one from the depth (to prevent infinite pagination)
					paginationObj.depth -= 1;
				});

				var promiseArray = [];
				// see if there are more links
				if (nextLinks.length) {
					promiseArray = nextLinks.map(function(link, idx) {
						return getSelectors(link, data, [paginationArr[idx]]);
					});
				}
				// return the output too
				promiseArray.unshift(output);

				// return the resolved data from each pagination
				deferred.resolve(Q.all(promiseArray));
			}
		});

	return deferred.promise;
}

// given html and data, return an output of all the selected elements
// pagination - click each pagination link and add it to a queue
function crawl(url, data, paginationArr) {
	// fire off the first promise - starts a pagination chain
	return getSelectors(url, data, paginationArr)
		.then(function(crawledData) {
			console.log('the crawled data', crawledData.length);
			// the crawledData comes back in a nested array, flatten it
			crawledData = _.flattenDeep(crawledData);
			// also join the crawledData into one object (only for pagination)
			if (!paginationArr.length) return crawledData;
			// get keys from one object (same for all)
			var keys = Object.keys(crawledData[0]);
			// have a property for each unique key
			var mergedPaginationObj = keys.reduce(function(accum, key) {
				accum[key] = [];
				return accum;
			}, {});
			// add each page's crawledData for each key to the aggregated object's array for that key
			crawledData.forEach(function(datum) {
				keys.forEach(function(key) {
					mergedPaginationObj[key] = mergedPaginationObj[key].concat(datum[key]);
				});
			});
			// return the merged pagination object
			return [mergedPaginationObj];
		})
		.catch(function(err) {
			console.log('there was an error', err.message);
			// console.log(err);
			return err;
		});
}

function getCrawlData(route) {
	return crawl(route.url, route.data, route.pagination);
}

// exports
module.exports = getCrawlData;
