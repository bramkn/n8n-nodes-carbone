import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	OptionsWithUri,
} from 'request';

import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import {
	CarboneApiCredentials,
} from './types';
import { listenerCount } from 'process';

//create any functions in here that will be useful within your node

//Generic API Request
export async function carboneApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const credentials = await this.getCredentials('carboneApi') as CarboneApiCredentials;
	const options: OptionsWithUri = {
		headers: {
			Authorization: `Bearer ${credentials.apiToken}`,
			'carbone-version': 4,
		},
		method,
		body,
		qs,
		uri: `${credentials.domain}/${endpoint}`,
		json: true,
		gzip: true,
		rejectUnauthorized: true,
	};
	if (Object.keys(qs).length === 0) {
		delete options.qs;
	}

	if (Object.keys(body).length === 0) {
		delete options.body;
	}
	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}

//function to load the file and make an api request with that file ( binary data not necessarily JSON)
export async function carboneFileUploadRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const credentials = await this.getCredentials('carboneApi') as CarboneApiCredentials;
	const options: OptionsWithUri = {
		headers: {
			'authorization': `bearer ${credentials.apiToken}`, //credentials.apiToken is being pulled from the carbone.credentials.ts
			'Content-Type': 'multipart/form-data',
			'carbone-version': 4,
		},
		method,
		body,
		qs,
		uri: `${credentials.domain}/${endpoint}`,
		json: true,
		gzip: true,
		rejectUnauthorized: true,
	};

	if (Object.keys(qs).length === 0) {
		delete options.qs;
	}

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}

export async function carboneFileDownloadRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const credentials = await this.getCredentials('carboneApi') as CarboneApiCredentials;
	const options: OptionsWithUri = {
		headers: {
			'authorization': `bearer ${credentials.apiToken}`, //credentials.apiToken is being pulled from the carbone.credentials.ts
			'accept': `*/*`,
			'carbone-version': 4,
		},
		method,
		body,
		qs,
		uri: `${credentials.domain}/${endpoint}`,
		json: false,
		gzip: true,
		rejectUnauthorized: true,
		encoding: null,
		//@ts-ignore
		resolveWithFullResponse: true,
	};

	if (Object.keys(qs).length === 0) {
		delete options.qs;
	}

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}