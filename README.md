# chemical-bulletins
Unofficial package for make request to SUNAT public information about chemical bulletins

## Methods

### getChemicalBulletin({ bulletinNumber: string, year: string }, options) => ChemicalBulletin 

### getChemicalBulletins([{ bulletinNumber: string, year: string }], options) => ChemicalBulletin[]

For both methods the formatting for the bulletinNumber should be 'XXXXXX' where each X could be a value between 0 and 9 and it must have a length of 6.
e.g. '000001', '000101', etc.

And for the year it should be 'YYYY', e.g. '2019', '2018', etc.

## Options

The options object could receive any of the following keys, they're optional.

```
  {
		parser: (body: HTMLObject) => any, Defines a custom parser
	}
```

