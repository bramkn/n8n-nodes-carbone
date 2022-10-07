
import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
//set these for creating credentials to make api calls that link to the ones in the documentation( headers/rest APi's)
export class CarboneApi implements ICredentialType {
	name = 'carboneApi';
	displayName = 'Carbone API';
	documentationUrl = 'https://carbone.io/api-reference.html#carbone-js-api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: 'https://api.carbone.io',
		},



	];
}
