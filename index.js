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

/**
 * @async
 * @function
 * @param {Object} params
 * @param {string} params.chemicalBulletinNumber - The string should have a length of 6 
 * @param {string} params.year - Like 2019, 2018, etc
 * @param {Object} options
 * @param {Function} options.parser Custom parse defined by the user
 * @return {ChemicalBoletin} All the information of the chemical bulletin parsed into an object
 */
const getChemicalBulletins = ({ chemicalBulletinNumber, year, options = {} }) => 
	new Promise((resolve, reject) => {
		request({ url: cookieURI }, (cookieError) => {
			if (cookieError) {
				reject(cookieError);
			} else {
				request.post({
					url: baseURI,
					form: {
						...basicFormStructure,
						num_bolQuim: chemicalBulletinNumber,
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
			}
		});
	});

module.exports = getChemicalBulletins;
