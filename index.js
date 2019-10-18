const requestBase = require('request');
const parse = require('node-html-parser').parse;
const request = requestBase.defaults({jar: true});

const basicFormStructure = {
	accion: 'consDetBQ',
	tipo_busqueda: 'BQ',
	cod_aduana: '118',
	cod_regimen: '10',
	anno: '',
	num_dua: '',
	num_bolQuim: '',
};
const baseURI = 'http://www.aduanet.gob.pe/cl-ad-itbq/bqS01Alias';
const cookieURI = 'http://www.aduanet.gob.pe/cl-ad-itbq/bqS01Alias?accion=consultaBoletinQuimico';
const chemicalTitles = ['customAgency', 'customEmployee', 'chemicalInform', 'complementaryInformation'];

/**
 * @typedef {Object} ChemicalBolletinCell
 * @property {string} title
 * @property {string} value
 */

/**
 * @typedef {Object} ChemicalBoletin
 * @property {ChemicalBolletinCell[]} customAgency
 * @property {ChemicalBolletinCell[]} customEmployee
 * @property {ChemicalBolletinCell[]} chemicalInform
 * @property {ChemicalBolletinCell[]} complementaryInformation
 */

/**
 * @typedef {Object} OptionsParams
 * @property {function} parser - A custom parser for the returned html body
 *
 */

/*
 * @typedef {Object} SearchedBulletin
 * @property {string} bulletinNumber - The bulleting searched, the string should have a length of 6 characters
 * @property {string} year - Like 2019, 2018, etc
 *
 *
	* */

const areParamsEmpty = params => params.bulletinNumber && params.year;


/**
 * Default parser of the returned body
 * @function
 * @param {HTMLObject} table
 * @returns {ChemicalBolletinCell[]}
 *
 */
const parseTable = table => Object.values(
	table.querySelectorAll('.gamma')
		.reduce(
			(acc, cell, index) => {
				const key = parseInt(index / 2, 10);

				return index % 2
				? { ...acc, [key]: { ...acc[key], value: cell.structuredText }}
				: { ...acc, [key]: { title: cell.structuredText }}
			}, {}
		)
);

const parseBody = body => {
	const root = parse(body);
	const tables = root.querySelectorAll('.form-table table [cellpadding="2"]');
	const parsedBody = tables.reduce(
		(acc, table, index) => (
			{
				...acc,
				[chemicalTitles[index]]: parseTable(table)
			}
		), {});

	return parsedBody;
}

const requestChemicalBulletin = (
	{ bulletinNumber, year },
	options = {}
) =>
	new Promise((resolve, reject) => {
		request.post({
			url: baseURI,
			form: {
				...basicFormStructure,
				num_bolQuim: bulletinNumber,
				anno: year,
			},
		}, (searchError, _, body) => {
			if (searchError) {
				reject(searchError);
			} else {
				const parser = options.parser || parseBody;
				const parsedBody = parser(body);

				resolve({ body: parsedBody });
			}
		});
	});

/**
 * @function
 * @param {SearchedBulletin} params
 * @param {OptionsParams} options
 * @return {Promise} A Promise of all the information of the chemical bulletin parsed into an object
 */
const getChemicalBulletin = (params = {}, options = {}) => {
	if (areParamsEmpty(params)) {
		throw Error('Yoy need to provide at least a bulletin number and a search year');
	}

	return new Promise((resolve, reject) => {
		request({ url: cookieURI }, (cookieError) => {
			if (cookieError) {
				reject(cookieError);
			} else {
				resolve(requestChemicalBulletin(params, options));
			}
		});
	});
}

/**
 * @function
 * @param {SearchedBulletin[]} searchedBulletins
 * @param {OptionsParams} options
 * @return {Promise} A Promise of all of the chemical bulletins parsed into an object
 */
const getChemicalBulletins = (searchedBulletins, options) => {
	if(searchedBulletins.length < 1) {
		throw Error('You need to search for at least one bulletin');
	}
	const filteredElements = searchedBulletins.filter(elem => areParamsEmpty(elem));

	if (filteredElements.length < 1) {
		throw Error('You need to search for at least one valid bulletin');
	}

	return new Promise((resolve, reject) => {
		request({ url: cookieURI }, (cookieError) => {
			if (cookieError) {
				reject(cookieError);
			} else {
				resolve(Promise.all(filteredElements.map(elem => requestChemicalBulletin(elem, options))));
			}
		});
	});
}

module.exports = {
	getChemicalBulletin,
	getChemicalBulletins,
};
