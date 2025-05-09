'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Trash2, X, BrainCircuit, Wrench, Briefcase, Calendar, Brain, UserCheck } from 'lucide-react';
import { PRESET_AGENTS } from '@/features/agents/presets';
import { Badge } from '@/components/ui/badge';
import { AGENT_MODELS, STORAGE_PROVIDERS } from '@/features/agents/schema';
import { PRESET_TOOLS } from '@/features/tools/presets';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DynamicAgentTester } from '@/features/agentTesting/DynamicAgentTester';
import { DataAnalyzerAgentCard } from '@/components/sidebar/DataAnalyzerAgentCard';
import { toast } from 'sonner';
import Link from 'next/link';

// Define TypeScript interfaces
interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  storageProvider: string;
  tools: string[];
  systemPrompt?: string;
  isCustom?: boolean;
  customRoute?: string;
}

interface Model {
  id: string;
  name: string;
}

interface Storage {
  id: string;
  name: string;
}

interface Tool {
  id: string;
  name: string;
  description: string;
}

export default function AgentManagerPage() {
  // Add Lead Qualifier agent to the preset agents
  const allAgents = [
    ...PRESET_AGENTS,
    {
      id: 'lead-qualifier',
      name: 'Lead Qualifier',
      description: 'Qualify leads based on contact information',
      model: 'gpt-4o-mini',
      storageProvider: 'local',
      tools: ['lead-qualification'],
      systemPrompt: 'You are a lead qualification assistant. Your task is to analyze lead contact information, determine if the lead is qualified based on having valid contact methods, and provide recommendations for follow-up actions.',
      isCustom: true,
      customRoute: '/agents/lead-qualifier'
    }
  ];
  
  const [agents, setAgents] = useState<Agent[]>(allAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showTester, setShowTester] = useState(false);
  const [showUtilities, setShowUtilities] = useState(false);
  
  // Define a meeting scheduler agent for testing
  const meetingSchedulerAgent: Agent = {
    id: 'meeting-scheduler',
    name: 'Meeting Scheduler',
    description: 'Schedule meetings using natural language inputs',
    model: 'gpt-4',
    storageProvider: 'google-calendar',
    tools: ['google-calendar'],
    systemPrompt: 'You are a helpful assistant that schedules meetings based on natural language requests.'
  };

  // Define a research assistant agent for testing
  const researchAssistantAgent: Agent = {
    id: 'research-agent',
    name: 'Research Assistant',
    description: 'Search the web for information on any topic',
    model: 'gpt-4o-mini',
    storageProvider: 'local',
    tools: ['web-search'],
    systemPrompt: 'You are a research assistant. Your job is to find and summarize accurate information on any topic. Search the web to gather facts, then present your findings in a well-organized, objective, and easy-to-understand format.'
  };

  // Function to handle clicking on an agent card
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowTester(false); // Reset tester visibility when selecting a new agent
    setShowUtilities(false); // Hide utilities when an agent is selected
  };

  // Function to close the sidebar
  const closeSidebar = () => {
    setSelectedAgent(null);
    setShowTester(false);
    setShowUtilities(false);
  };

  // Function to toggle utilities sidebar
  const toggleUtilitiesSidebar = () => {
    setShowUtilities(!showUtilities);
    if (!showUtilities) {
      setSelectedAgent(null); // Deselect any selected agent when showing utilities
    }
  };

  // Function to show meeting scheduler in sidebar
  const showMeetingSchedulerSidebar = () => {
    setSelectedAgent(meetingSchedulerAgent);
    setShowTester(true); // Automatically show the tester for the meeting scheduler
    setShowUtilities(false);
  };

  // Function to show research assistant in sidebar
  const showResearchAssistantSidebar = () => {
    setSelectedAgent(researchAssistantAgent);
    setShowTester(true); // Automatically show the tester for the research assistant
    setShowUtilities(false);
  };

  // Helper to get the model name instead of just the ID
  const getModelName = (modelId: string) => {
    const model = AGENT_MODELS.find((m: Model) => m.id === modelId);
    return model ? model.name : modelId;
  };

  // Helper to get the storage provider name
  const getStorageName = (storageId: string) => {
    const storage = STORAGE_PROVIDERS.find((s: Storage) => s.id === storageId);
    return storage ? storage.name : storageId;
  };

  // Helper to get tool details
  const getToolDetails = (toolId: string) => {
    return PRESET_TOOLS.find((tool: Tool) => tool.id === toolId);
  };

  return (
    <div className="flex p-8">
      {/* Main content */}
      <div className={`flex-1 space-y-6 transition-all duration-300 ${selectedAgent || showUtilities ? 'pr-[33.333%]' : ''}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Agent Manager</h1>
            <p className="text-gray-500">Create and manage AI agents for your workflows</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              toast("Coming soon!", {
                description: "Agent creation will be available in a future update."
              })
             
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Agent
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <Card 
              key={agent.id} 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => agent.isCustom && agent.customRoute ? null : handleAgentClick(agent)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        // Settings functionality would go here
                      }}
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        // Delete functionality would go here
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Model:</span>
                    <span className="font-medium">{getModelName(agent.model)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage:</span>
                    <span className="font-medium">{getStorageName(agent.storageProvider)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tools:</span>
                    <span className="font-medium">{agent.tools.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.tools.map(tool => (
                      <Badge key={tool} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Add an Open Agent button for custom agents with routes */}
                  {agent.isCustom && agent.customRoute && (
                    <div className="pt-2">
                      <Link href={agent.customRoute}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Open Agent
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sidebar - Either shows agent details or utility agents */}
      {(selectedAgent || showUtilities) && (
        <div className="w-1/3 border-l bg-white transition-all duration-300 transform h-screen fixed top-0 right-0 overflow-y-auto shadow-lg z-50">
          <ScrollArea className="h-screen">
            <div className="p-6">
              {/* Close button */}
              <button 
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={closeSidebar}
              >
                <X className="h-6 w-6" />
              </button>

              {selectedAgent ? (
                // Agent details content
                <div className="pt-6">
                  {/* Agent header with icon */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <BrainCircuit className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedAgent.name}</h2>
                      <p className="text-gray-500">{selectedAgent.description}</p>
                    </div>
                  </div>
                  
                  {/* Agent details section */}
                  <div className="space-y-6">
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-3">Configuration</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Model:</span>
                          <Badge variant="outline" className="px-3 py-1">
                            {getModelName(selectedAgent.model)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Storage Provider:</span>
                          <Badge variant="outline" className="px-3 py-1">
                            {getStorageName(selectedAgent.storageProvider)}
                          </Badge>
                        </div>
                        {selectedAgent.systemPrompt && (
                          <div className="pt-2">
                            <h4 className="font-medium mb-2">System Prompt:</h4>
                            <div className="bg-gray-50 p-3 rounded-md text-sm">
                              {selectedAgent.systemPrompt}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-3">Tools & Capabilities</h3>
                      <div className="space-y-3">
                        {selectedAgent.tools.map(toolId => {
                          const tool = getToolDetails(toolId);
                          return tool ? (
                            <div key={toolId} className="flex items-start bg-gray-50 p-3 rounded-md">
                              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                <Wrench className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">{tool.name}</div>
                                <div className="text-sm text-gray-500">{tool.description}</div>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6 mt-6 flex gap-3">
                    <Button className="flex-1">Edit Agent</Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowTester(!showTester)}
                    >
                      {showTester ? 'Hide Test Interface' : 'Test Agent'}
                    </Button>
                  </div>
                  
                  {/* Test Interface - only visible when showTester is true */}
                  {showTester && (
                    <div className="border-t pt-6 mt-6">
                      <DynamicAgentTester agent={selectedAgent} />
                    </div>
                  )}
                </div>
              ) : (
                // Utility agents content
                <div className="pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Utility Agents</h2>
                      <p className="text-gray-500">Specialized tools that help with common tasks</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <Card 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={showMeetingSchedulerSidebar}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Meeting Scheduler</CardTitle>
                            <CardDescription>Schedule meetings using natural language</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    <Card 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={showResearchAssistantSidebar}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <Brain className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Research Assistant</CardTitle>
                            <CardDescription>Search the web for information on any topic</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    <DataAnalyzerAgentCard />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
} 