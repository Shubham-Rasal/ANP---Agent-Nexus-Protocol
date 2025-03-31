import { Agent } from './schema';

export const PRESET_AGENTS: Agent[] = [
  {
    id: 'lead-qualifier',
    name: 'Lead Qualifier',
    description: 'Qualifies leads based on criteria and assigns a score',
    model: 'gpt-4',
    storageProvider: 'local',
    tools: ['data-aggregate', 'csv-processor'],
    createdAt: '2023-10-12T14:30:00Z',
    updatedAt: '2023-10-12T14:30:00Z',
    systemPrompt: 'You are a lead qualification assistant. Your task is to analyze lead data, score potential customers based on established criteria, and provide recommendations for follow-up actions.',
  },
  {
    id: 'email-outreach',
    name: 'Email Outreach Agent',
    description: 'Sends personalized email sequences to leads',
    model: 'gpt-4-turbo',
    storageProvider: 'mongodb',
    tools: ['gmail-send', 'email-template'],
    createdAt: '2023-10-15T09:45:00Z',
    updatedAt: '2023-10-15T09:45:00Z',
    systemPrompt: 'You are an email outreach specialist. Your goal is to create personalized emails that engage potential customers, establish a connection, and generate interest in our products or services.',
  },
  {
    id: 'meeting-scheduler',
    name: 'Meeting Scheduler',
    description: 'Schedules sales calls and demos with qualified leads',
    model: 'claude-3-sonnet',
    storageProvider: 'postgresql',
    tools: ['calendar-create', 'gmail-send'],
    createdAt: '2023-10-18T16:20:00Z',
    updatedAt: '2023-10-18T16:20:00Z',
    systemPrompt: 'You are a meeting scheduling assistant. Your role is to coordinate and schedule meetings between our sales team and potential clients, finding optimal times that work for all participants.',
  },
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyzes lead and customer data for insights',
    model: 'claude-3-opus',
    storageProvider: 'pinecone',
    tools: ['data-aggregate', 'sheets-read', 'csv-processor'],
    createdAt: '2023-10-20T11:15:00Z',
    updatedAt: '2023-10-20T11:15:00Z',
    systemPrompt: 'You are a data analysis expert. Your purpose is to examine customer and lead data, identify patterns and trends, and generate actionable insights to improve sales and marketing strategies.',
  },
  {
    id: 'follow-up-manager',
    name: 'Follow-up Manager',
    description: 'Manages follow-up communications with leads',
    model: 'gpt-3.5-turbo',
    storageProvider: 'redis',
    tools: ['gmail-send', 'calendar-create'],
    createdAt: '2023-10-22T13:40:00Z',
    updatedAt: '2023-10-22T13:40:00Z',
    systemPrompt: 'You are a follow-up specialist. Your job is to maintain contact with potential customers who have shown interest but have not yet converted, providing them with relevant information and encouragement to move forward in the sales process.',
  },
]; 