
import { IExecuteFunctions } from 'n8n-core';
import {
	IBinaryData,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	carboneApiRequest, carboneFileDownloadRequest, carboneFileUploadRequest
} from './GenericFunctions';


export class Carbone implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Carbone',
		name: 'carbone',
		icon: 'file:carbone.svg',
		group: ['transform'],
		version: 1,
		description: 'Node for the Carbone API',
		defaults: {
			name: 'carbone',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'carboneApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Add Template',
						value: 'addTemplate',
						description: 'Add new template',
						action: 'Add new template',
					},
					{
						name: 'Delete Template',
						value: 'deleteTemplate',
						description: 'Delete Template By ID',
						action: 'Delete template by id',
					},
					{
						name: 'Download Rendered Report',
						value: 'downloadReport',
						description: 'Download the rendered report Using the reports ID',
						action: 'Download the rendered report using the reports id',
					},
					{
						name: 'Get Template',
						value: 'getTemplate',
						description: 'Get Template By ID',
						action: 'Get template by id',
					},
					{
						name: 'Render Report',
						value: 'renderReport',
						description: 'Render reports',
						action: 'Render reports',
					},
				],
				default: 'getTemplate',

			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				description: 'ID of resource to Get, Edit, Delete or add data to',
				default: '',
				displayOptions: {
					hide: {
						operation: [
							'addTemplate',
						],
					},
				},
			},
			{
				displayName: 'Body Type',
				name: 'bodyType',
				type: 'options',
				options: [
					{
						name: 'Json',
						value: 'json',

					},
					{
						name: 'Per Field',
						value: 'perField',

					},
				],
				displayOptions: {
					show: {
						operation: [
							'renderReport',
						],
					},
				},
				default: 'json',
				description: 'Data for template to render the report',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				description: 'JSON Body containing report data',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'renderReport',
						],
						bodyType: [
							'json',
						],
					},
				},
				typeOptions: {
					rows: 10,
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: {
					show: {
						operation: [
							'addTemplate',
							'getTemplate',
							'downloadReport',
						],
					},
				},
				default: 'data',
				description: 'Name of the binary property which contains the data for the file to be uploaded. For Form-Data Multipart, they can be provided in the format: <code>"sendKey1:binaryProperty1,sendKey2:binaryProperty2</code>',
			},
			{
				displayName: 'Field Data',
				name: 'data',
				placeholder: 'Add field data',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: [
							'renderReport',
						],
						bodyType: [
							'perField',
						],
					},
				},
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Field Name',
								name: 'fieldName',
								type: 'string',
								default: '',
								description: 'Field name to include in item',
							},
							{
								displayName: 'Field Type',
								name: 'fieldType',
								type: 'options',
								default: 'string',
								description: 'Value for the field',
								options: [
									{
										name: 'String',
										value: 'string',

									},
									{
										name: 'Array',
										value: 'array',

									},
								],
							},
							{
								displayName: 'Field Value',
								name: 'fieldValue',
								type: 'string',
								default: '',
								description: 'Value for the field',
							},

						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];

		let item: INodeExecutionData;
		const operation = this.getNodeParameter('operation', 0, '') as string;
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];
				if (operation === "addTemplate") {
					const endpoint = "template";

					const qs: IDataObject = {};
					const body: IDataObject = {};


					if (item.binary === undefined) {
						throw new NodeOperationError(this.getNode(), 'No binary data exists on item!');
					}

					const binaryPropertyNameFull = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
					const binaryPropertyNames = binaryPropertyNameFull.split(',').map(key => key.trim());

					for (const propertyData of binaryPropertyNames) {
						const propertyName = 'template';
						const binaryPropertyName = propertyData;

						if (item.binary[binaryPropertyName] === undefined) {
							throw new NodeOperationError(this.getNode(), `No binary data property "${binaryPropertyName}" does not exists on item!`);
						}

						const binaryProperty = item.binary[binaryPropertyName] as IBinaryData;
						const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

						body[propertyName] = {
							value: binaryDataBuffer,
							options: {
								filename: binaryProperty.fileName,
								contentType: binaryProperty.mimeType,
							},
						};
					}

					const newItem: INodeExecutionData = {
						json: {},
						binary: {},
					};
					const data = await carboneFileUploadRequest.call(this, 'Post', endpoint, body, qs);
					newItem.json = data.data;

					returnItems.push(newItem);

				}


				if (operation === "deleteTemplate") {
					const templateId = this.getNodeParameter('id', itemIndex, '') as string;
					const endpoint = `template/${templateId}`;
					const newItem: INodeExecutionData = {
						json: {},
						binary: {},
					};
					newItem.json = await carboneApiRequest.call(this, 'Delete', endpoint);
					returnItems.push(newItem);
				}


				if (operation === "downloadReport") {
					const reportId = this.getNodeParameter('id', itemIndex, '') as string;
					const endpoint = `render/${reportId}`;
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;

					const newItem: INodeExecutionData = {
						json: {},
						binary: {},
					};
					if (items[itemIndex].binary !== undefined) {
						// Create a shallow copy of the binary data so that the old
						// data references which do not get changed still stay behind
						// but the incoming data does not get changed.
						newItem.binary = items[itemIndex].binary;
					}

					newItem.json = items[itemIndex].json;
					const response = await carboneFileDownloadRequest.call(this, 'Get', endpoint);

					newItem.binary![binaryPropertyName] = await this.helpers.prepareBinaryData(response.body, "Report");
					returnItems.push(newItem);
					//get report using ID
					//select file extension (pdf etc..)
					//generate the file using api?
				}


				if (operation === "getTemplate") {
					const templateId = this.getNodeParameter('id', itemIndex, '') as string;

					const endpoint = `template/${templateId}`;
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;

					const newItem: INodeExecutionData = {
						json: {},
						binary: {},
					};
					if (items[itemIndex].binary !== undefined) {
						newItem.binary = items[itemIndex].binary;
					}

					newItem.json = items[itemIndex].json;
					const response = await carboneFileDownloadRequest.call(this, 'Get', endpoint);

					newItem.binary![binaryPropertyName] = await this.helpers.prepareBinaryData(response.body, "Template");
					returnItems.push(newItem);
				}


				if (operation === "renderReport") {
					const templateId = this.getNodeParameter('id', itemIndex, '') as string;
					const endpoint = `render/${templateId}`;
					const bodyType = this.getNodeParameter('bodyType', itemIndex, '') as string;
					const body: IDataObject = {};
					if (bodyType === 'json') {
						const tempBody = this.getNodeParameter('body', itemIndex, '') as string;
						try {
							body.data = JSON.parse(tempBody) as IDataObject;
						}
						catch (error) {
							throw new NodeOperationError(this.getNode(), error, {
								itemIndex,
							});
						}
					}
					if (bodyType === 'perField') {
						const fieldArray = this.getNodeParameter('data.field', itemIndex, '') as IDataObject[];

						const data: IDataObject = {};
						for (let fieldIndex = 0; fieldIndex < fieldArray.length; fieldIndex++) {
							const field = fieldArray[fieldIndex];
							if (field.fieldType === 'string') {
								data[field.fieldName as string] = field.fieldValue as string;
							}
							if (field.fieldType === 'array') {

								data[field.fieldName as string] = JSON.parse(field.fieldValue as string);
							}

						}
						body.data = data;

					}
					const newItem: INodeExecutionData = {
						json: {},
						binary: {},
					};
					body.convertTo = 'pdf';
					newItem.json = await carboneApiRequest.call(this, 'Post', endpoint, body);
					returnItems.push(newItem);



				}



			} catch (error) {

				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {

					if (error.context) {

						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(returnItems);
	}
}
