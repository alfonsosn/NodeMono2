// contains descriptions for filter functions for pipes
var filterDescriptions = {
	maxLength: 'limits length of all arrays to the specified value (defaults to 4)',
	unique: 'removes all non unique values from each array (scope limited to each array)',
	firstXElements: 'returns first X elements from each list',
	slice: 'returns all elements in each list after the given value',
	pull: 'returns an array of the pulled values (expects values)',
	pullAt: 'returns an array of the pulled values (expects indexes)',
	compact: 'removes all falsy values (falsy -> false, null, 0, \'\', undefined, NaN)',
	// should they pick which property to sort by? like for interleaved output?
	sort: 'sorts the array (given name of the sorting type, and the direction to sort in - defaults to ascending)',
	randomize: 'randomly shuffle the elements',
	union: 'returns array of all unique values between the input objects',
	//  should it be intersection b/w ALL arrays, or just objects? (ie concat all arrays in each object and then run intersection)?
	//   does the latter as of now
	intersection: 'returns array of values in all input objects',
	xor: 'not entirely sure what this does (from lodash, sort of like intersection)',
	// another strange lodash function (easy to add, so why not?)
	zip: 'another strange lodash function',
	// ** special filters - always applied last **
	interleave: 'takes an array of objects of arrays and returns array of objects with 1 property from each unique key',
	merge: 'merges all objects in the array into one object (returns the object, no array)',
};

module.exports = filterDescriptions;