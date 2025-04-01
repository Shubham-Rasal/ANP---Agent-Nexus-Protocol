import { Tool } from './schema';

export const PRESET_TOOLS: Tool[] = [
  {
    id: 'gmail-send',
    name: 'Gmail Send Email',
    description: 'Send an email using Gmail',
    category: 'email',
    provider: 'google',
    requiresAuth: true,
    parameters: [
      {
        id: 'to',
        name: 'To',
        type: 'string',
        description: 'Email recipient address',
        required: true,
      },
      {
        id: 'subject',
        name: 'Subject',
        type: 'string',
        description: 'Email subject line',
        required: true,
      },
      {
        id: 'body',
        name: 'Body',
        type: 'string',
        description: 'Email body content',
        required: true,
      },
      {
        id: 'cc',
        name: 'CC',
        type: 'string',
        description: 'Carbon copy recipients',
        required: false,
      },
      {
        id: 'bcc',
        name: 'BCC',
        type: 'string',
        description: 'Blind carbon copy recipients',
        required: false,
      },
    ],
    createdAt: '2023-09-15T10:30:00Z',
    updatedAt: '2023-09-15T10:30:00Z',
  },
  {
    id: 'akave-storage',
    name: 'Akave Decentralized Storage',
    description: 'Access and manage files on the Akave decentralized storage network',
    category: 'storage',
    provider: 'akave',
    requiresAuth: false,
    parameters: [
      {
        id: 'bucketName',
        name: 'Bucket Name',
        type: 'string',
        description: 'The name of the storage bucket to access',
        required: true,
      },
      {
        id: 'operation',
        name: 'Operation',
        type: 'string',
        description: 'Operation to perform (list, info, download)',
        required: true,
      },
      {
        id: 'fileName',
        name: 'File Name',
        type: 'string',
        description: 'Name of the file to operate on (required for info and download operations)',
        required: false,
      },
    ],
    createdAt: '2023-10-25T11:15:00Z',
    updatedAt: '2023-10-25T11:15:00Z',
  },
  {
    id: 'calendar-create',
    name: 'Create Calendar Event',
    description: 'Create a new event in Google Calendar',
    category: 'calendar',
    provider: 'google',
    requiresAuth: true,
    parameters: [
      {
        id: 'title',
        name: 'Event Title',
        type: 'string',
        description: 'Title of the calendar event',
        required: true,
      },
      {
        id: 'start',
        name: 'Start Time',
        type: 'string',
        description: 'Start time in ISO format',
        required: true,
      },
      {
        id: 'end',
        name: 'End Time',
        type: 'string',
        description: 'End time in ISO format',
        required: true,
      },
      {
        id: 'description',
        name: 'Description',
        type: 'string',
        description: 'Description of the event',
        required: false,
      },
      {
        id: 'attendees',
        name: 'Attendees',
        type: 'array',
        description: 'List of attendee email addresses',
        required: false,
      },
    ],
    createdAt: '2023-09-15T12:00:00Z',
    updatedAt: '2023-09-15T12:00:00Z',
  },
  {
    id: 'data-aggregate',
    name: 'Data Aggregation',
    description: 'Aggregates data from multiple sources',
    category: 'analysis',
    provider: 'custom',
    requiresAuth: false,
    parameters: [
      {
        id: 'sources',
        name: 'Data Sources',
        type: 'array',
        description: 'Array of data source identifiers',
        required: true,
      },
      {
        id: 'aggregationType',
        name: 'Aggregation Type',
        type: 'string',
        description: 'Type of aggregation to perform (sum, average, count, etc.)',
        required: true,
      },
      {
        id: 'groupBy',
        name: 'Group By',
        type: 'string',
        description: 'Field to group results by',
        required: false,
      },
    ],
    createdAt: '2023-09-16T09:45:00Z',
    updatedAt: '2023-09-16T09:45:00Z',
  },
  {
    id: 'email-template',
    name: 'Email Template Sender',
    description: 'Send emails using predefined templates',
    category: 'email',
    provider: 'sendgrid',
    requiresAuth: true,
    parameters: [
      {
        id: 'templateId',
        name: 'Template ID',
        type: 'string',
        description: 'ID of the email template to use',
        required: true,
      },
      {
        id: 'recipients',
        name: 'Recipients',
        type: 'array',
        description: 'List of recipient email addresses',
        required: true,
      },
      {
        id: 'templateData',
        name: 'Template Data',
        type: 'object',
        description: 'Data to populate the template variables',
        required: true,
      },
    ],
    createdAt: '2023-09-16T14:20:00Z',
    updatedAt: '2023-09-16T14:20:00Z',
  },
  {
    id: 'csv-processor',
    name: 'CSV Processor',
    description: 'Process and transform CSV data',
    category: 'analysis',
    provider: 'custom',
    requiresAuth: false,
    parameters: [
      {
        id: 'inputData',
        name: 'Input Data',
        type: 'string',
        description: 'CSV data to process or URL to CSV file',
        required: true,
      },
      {
        id: 'transformations',
        name: 'Transformations',
        type: 'array',
        description: 'List of transformations to apply to the data',
        required: true,
      },
      {
        id: 'outputFormat',
        name: 'Output Format',
        type: 'string',
        description: 'Format of the output (csv, json, etc.)',
        required: false,
        defaultValue: 'csv',
      },
    ],
    createdAt: '2023-09-17T08:30:00Z',
    updatedAt: '2023-09-17T08:30:00Z',
  },
]; 