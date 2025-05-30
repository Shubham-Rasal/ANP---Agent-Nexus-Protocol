"use client";

import React, { useState, useRef, useEffect } from 'react';
import { agents } from '@/app/agents.json';
import AgentResponse from '@/components/AgentResponse';
import WorkflowPanel from '@/components/WorkflowPanel';
import { SendHorizontal, Sparkles, AlertCircle, Info, ChevronDown, Settings, HelpCircle, Clock, Zap, History, PlusCircle, ArrowLeft, Database, Check, Loader2, RefreshCw } from 'lucide-react';
import TaskRouter from '@/components/TaskRouter';
import ReactMarkdown from 'react-markdown';
import { getStorachaService, StorachaItem } from '@/features/agents/leadgen/storacha-service';
import StorachaOperationIndicator from '@/components/StorachaOperationIndicator';
import { Message, AgentInfo, SubTask, ChatSession, StorachaOperation } from '@/types/chatTypes';

export default function MultiAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTasks, setActiveTasks] = useState<SubTask[]>([]);
  const [workflowPanelOpen, setWorkflowPanelOpen] = useState(false);
  const [showExamples, setShowExamples] = useState<boolean>(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isRouterActive, setIsRouterActive] = useState(false);
  const [routerDialogOpen, setRouterDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [storachaItems, setStorachaItems] = useState<StorachaItem[]>([]);
  const [showStorachaPanel, setShowStorachaPanel] = useState(false);
  const [isStorachaEnabled, setIsStorachaEnabled] = useState(true);
  const [storageOperations, setStorageOperations] = useState<StorachaOperation[]>([]);
  const [isSavedToStoracha, setIsSavedToStoracha] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Add this code right after all the state initialization, before the useEffects
  // Check if we should explicitly be in a new chat state
  useEffect(() => {
    // If we have a creating-new-chat flag set, ensure we're really starting fresh
    if (localStorage.getItem('anp-creating-new-chat') === 'true') {
      console.log('Creating new chat from flag - clearing state');
      localStorage.removeItem('anp-current-chat-id');
      setMessages([]);
      setActiveTasks([]);
      setCurrentChatId(null);
      setShowExamples(true);
      
      // We'll clear the flag only after the component is fully mounted and initialized
      setTimeout(() => {
        localStorage.removeItem('anp-creating-new-chat');
      }, 100);
    }
  }, []);
  
  // Load chat history from localStorage on component mount
  useEffect(() => {
    const loadChatHistory = () => {
      // If we're explicitly in a new chat state (marked by a special flag), don't load previous chats
      if (localStorage.getItem('anp-creating-new-chat') === 'true') {
        // Clear the flag
        localStorage.removeItem('anp-creating-new-chat');
        // Also ensure we have no current chat ID
        localStorage.removeItem('anp-current-chat-id');
        return;
      }
      
      const savedHistory = localStorage.getItem('anp-chat-history');
      if (savedHistory) {
        try {
          // Parse the JSON and ensure Date objects are properly reconstructed
          const parsedHistory: ChatSession[] = JSON.parse(savedHistory, (key, value) => {
            if (key === 'timestamp' || (key === 'messages' && Array.isArray(value))) {
              // For message arrays, convert timestamps in each message
              if (key === 'messages' && Array.isArray(value)) {
                return value.map(msg => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }));
              }
              return new Date(value);
            }
            return value;
          });
          
          setChatHistory(parsedHistory);
          
          // Load most recent chat if available
          const currentChatId = localStorage.getItem('anp-current-chat-id');
          if (currentChatId) {
            const currentChat = parsedHistory.find(chat => chat.id === currentChatId);
            if (currentChat) {
              setCurrentChatId(currentChatId);
              setMessages(currentChat.messages);
              setActiveTasks(currentChat.activeTasks || []);
            } else {
              // If we have a current chat ID but no matching chat, clear the current chat ID
              localStorage.removeItem('anp-current-chat-id');
            }
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          // Reset if there's an error
          localStorage.removeItem('anp-chat-history');
          localStorage.removeItem('anp-current-chat-id');
        }
      }
    };
    
    loadChatHistory();
  }, []);

  // Save current chat to localStorage when messages change
  useEffect(() => {
    const saveChatToHistory = () => {
      // Only save if we actually have messages and we're not creating a new chat
      if (messages.length > 0 && !isLoading && localStorage.getItem('anp-creating-new-chat') !== 'true') {
        // Create a chat ID if we don't have one
        const chatId = currentChatId || `chat-${Date.now()}`;
        
        // Generate a title from the first user message
        const firstUserMessage = messages.find(m => m.role === 'user');
        let title = 'New Chat';
        if (firstUserMessage) {
          title = firstUserMessage.content.substring(0, 40);
          if (firstUserMessage.content.length > 40) title += '...';
        }
        
        // Create or update the current chat session
        const updatedChat: ChatSession = {
          id: chatId,
          title,
          timestamp: new Date(),
          messages: messages,
          activeTasks: activeTasks
        };
        
        // Update chat history (replace if exists, add if new)
        let updatedHistory = [...chatHistory];
        const existingIndex = updatedHistory.findIndex(chat => chat.id === chatId);
        
        if (existingIndex >= 0) {
          updatedHistory[existingIndex] = updatedChat;
        } else {
          updatedHistory = [updatedChat, ...updatedHistory];
        }
        
        // Check if the history actually changed to avoid unnecessary updates
        const historyChanged = JSON.stringify(updatedHistory) !== JSON.stringify(chatHistory);
        
        // Only update state if there are actual changes
        if (historyChanged) {
          // Update state
          setChatHistory(updatedHistory);
          setCurrentChatId(chatId);
          
          // Save to localStorage
          localStorage.setItem('anp-chat-history', JSON.stringify(updatedHistory));
          localStorage.setItem('anp-current-chat-id', chatId);
        } else {
          // Just ensure the current chat ID is set correctly
          if (currentChatId !== chatId) {
            setCurrentChatId(chatId);
            localStorage.setItem('anp-current-chat-id', chatId);
          }
        }
        
        return updatedChat;
      }
      return null;
    };
    
    if (!isLoading) {
      saveChatToHistory();
    }
  }, [messages, activeTasks, isLoading, currentChatId]); // Remove chatHistory from dependencies
  
  // Load Storacha items when component mounts
  useEffect(() => {
    // Initial load of Storacha items (but only for item listing, not auto-loading chats)
    const initialLoadOnly = async () => {
      try {
        const storachaService = getStorachaService();
        const allItems = await storachaService.getAllItems();
        setStorachaItems(allItems);
        
        // Only load a chat if we have no messages, no current chat ID, and no creating-new-chat flag
        if (messages.length === 0 && 
            currentChatId === null && 
            localStorage.getItem('anp-creating-new-chat') !== 'true') {
          
          // Filter for chat objects specifically
          const chatItems = allItems.filter(item => 
            item.agentId === 'chat' && 
            item.dataType === 'metadata' &&
            item.metadata?.chatId
          );
          
          // If we have chat items and no current chat is loaded, load the most recent one
          if (chatItems.length > 0) {
            try {
              // Sort by timestamp descending
              const sortedChats = chatItems.sort((a, b) => {
                const timestampA = a.metadata?.timestamp || 0;
                const timestampB = b.metadata?.timestamp || 0;
                return timestampB - timestampA;
              });
              
              // Get the most recent chat
              const mostRecentChat = sortedChats[0];
              
              // Parse the chat object from the content
              const chatObject = JSON.parse(mostRecentChat.content);
              
              // Convert timestamps back to Date objects
              const processedMessages = chatObject.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }));
              
              // Load the chat into the UI
              setMessages(processedMessages);
              setCurrentChatId(chatObject.id);
              
              // Add a system message indicating chat was loaded from Storacha
              addSystemMessage(`Loaded chat from Storacha storage (ID: ${chatObject.id})`);
              setIsSavedToStoracha(true);
              setLastSavedTimestamp(new Date(chatObject.timestamp));
              setShowExamples(false);
            } catch (parseError) {
              console.error('Error parsing chat data from Storacha:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Error loading Storacha items:', error);
      }
    };
    
    initialLoadOnly();
    
  }, []);
  
  // Initialize localStorage-dependent state after component mounts (client-side only)
  useEffect(() => {
    // Now it's safe to access localStorage (browser-only)
    const creatingNewChat = localStorage.getItem('anp-creating-new-chat') === 'true';
    setShowExamples(creatingNewChat || showExamples);
  }, []);
  
  // Fix the startNewChat function to be more aggressive at clearing state
  const startNewChat = () => {
    console.log('Starting new chat - clearing state and setting flag');
    
    // Set flag FIRST before any state changes to prevent race conditions
    localStorage.setItem('anp-creating-new-chat', 'true');
    localStorage.removeItem('anp-current-chat-id');
    
    // Save current chat first if needed
    if (messages.length > 0) {
      // Save the current chat to history before starting a new one
      const currentChat: ChatSession = {
        id: currentChatId || `chat-${Date.now()}`,
        title: messages.find(m => m.role === 'user')?.content.substring(0, 40) || 'New Chat',
        timestamp: new Date(),
        messages: messages,
        activeTasks: activeTasks
      };
      
      // Update chat history
      let updatedHistory = [...chatHistory];
      const existingIndex = updatedHistory.findIndex(chat => chat.id === currentChat.id);
      
      if (existingIndex >= 0) {
        updatedHistory[existingIndex] = currentChat;
      } else {
        updatedHistory = [currentChat, ...updatedHistory];
      }
      
      // Update state and localStorage
      setChatHistory(updatedHistory);
      localStorage.setItem('anp-chat-history', JSON.stringify(updatedHistory));
    }
    
    // Clear ALL state that could influence chat display
    setMessages([]);
    setActiveTasks([]);
    setCurrentChatId(null);
    localStorage.removeItem('anp-current-chat-id');
    setIsSavedToStoracha(false);
    setLastSavedTimestamp(null);
    setShowExamples(true);
    
    // Focus on input for new message
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Force the examples to show up
    setTimeout(() => {
      setShowExamples(true);
    }, 100);
  };

  // Helper function to select a chat from history
  const selectChat = (chatId: string) => {
    // Clear any new chat flag
    localStorage.removeItem('anp-creating-new-chat');
    
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat) {
      setMessages(selectedChat.messages);
      setActiveTasks(selectedChat.activeTasks || []);
      setCurrentChatId(chatId);
      setShowChatHistory(false);
      
      // Save this as the current chat
      localStorage.setItem('anp-current-chat-id', chatId);
      
      // Hide examples when loading a chat
      setShowExamples(false);
    }
  };

  // Helper function to delete a chat from history
  const deleteChat = (chatId: string, event: React.MouseEvent) => {
    // Stop the event from bubbling to parent (which would select the chat)
    event.stopPropagation();
    
    // Confirm deletion
    if (confirm('Are you sure you want to delete this chat?')) {
      const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
      setChatHistory(updatedHistory);
      localStorage.setItem('anp-chat-history', JSON.stringify(updatedHistory));
      
      // If we're deleting the current chat, start a new one
      if (currentChatId === chatId) {
        startNewChat();
      }
    }
  };

  // Helper function to format date for display
  const formatChatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date >= today) {
      return 'Today';
    }
    
    // Check if date is yesterday
    if (date >= yesterday) {
      return 'Yesterday';
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Helper function to add system messages
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMessage]);
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Update the WorkflowPanel when activeTasks changes
  // useEffect(() => {
  //   if (activeTasks.length > 0) {
  //     setWorkflowPanelOpen(true);
  //   }
  // }, [activeTasks]);

  // Focus on input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Helper function to handle example click
  const handleExampleClick = (example: string) => {
    setInput(example);
    setShowExamples(false);
    
    // Focus the input after selecting an example
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Apply autocomplete suggestion by replacing the last word with the suggestion
  const applySuggestion = (suggestion: string) => {
    const words = input.split(' ');
    const lastWordIndex = words.length - 1;
    
    // If there's content, replace the last word with the suggestion
    if (lastWordIndex >= 0) {
      words[lastWordIndex] = suggestion;
      const newInput = words.join(' ');
      setInput(newInput);
      
      // Clear suggestions after applying
      setSuggestions([]);
      
      // Set focus back to the textarea
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Position cursor at the end
          const len = newInput.length;
          inputRef.current.selectionStart = len;
          inputRef.current.selectionEnd = len;
          
          // Update height
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
        }
      }, 0);
    }
  };

  // Generate a unique ID for a storage operation
  const generateOperationId = (): string => {
    return `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };
  
  // Helper function to handle storage operations but now only stores in local storage
  const trackStorageOperation = async (
    operation: 'upload' | 'download' | 'list' | 'share' | 'info' | 'delegation',
    agentId: string,
    status: 'pending' | 'success' | 'error',
    dataType?: string,
    message?: string,
    messageId?: string
  ): Promise<string> => {
    const id = generateOperationId();
    const operationTimestamp = new Date();
    
    // Create the operation record
    const newOperation: StorachaOperation = {
      id,
      operation,
      agentId,
      status,
      message,
      timestamp: operationTimestamp,
      dataType,
      messageId
    };
    
    // Add to operations list
    setStorageOperations(prev => [...prev, newOperation]);
    
    return id;
  };
  
  // Update a tracked operation's status
  const updateTrackedOperation = (
    id: string,
    status: 'pending' | 'success' | 'error',
    message?: string
  ): void => {
    setStorageOperations(prev => 
      prev.map(op => 
        op.id === id 
          ? { ...op, status, message: message || op.message, timestamp: new Date() } 
          : op
      )
    );
  };
  
  // Updated to only track in local storage - no longer stores in Storacha
  const trackMessageLocally = async (message: Message) => {
    try {
      // Determine the agent ID
      const agentId = message.agentId || 'unknown';
      
      // Determine the data type based on the message
      let dataType: 'input' | 'output' | 'chain_of_thought';
      
      if (message.role === 'user') {
        dataType = 'input';
      } else if (message.role === 'agent' && message.isThought) {
        dataType = 'chain_of_thought';
      } else {
        dataType = 'output';
      }
      
      // Add a tracking operation
      const operationId = trackStorageOperation(
        'info',
        agentId,
        'success',
        dataType,
        'Message stored locally',
        message.id
      );
      
      // Mark conversation as unsaved to Storacha
      setIsSavedToStoracha(false);
      
      return operationId;
    } catch (error) {
      console.error('Error tracking message locally:', error);
      return null;
    }
  };
  
  // Updated to use trackMessageLocally instead of Storacha storage
  const processTaskWithRouter = async (userQuery: string) => {
    // Reset state for new message
    setShowExamples(false);
    setIsLoading(true);
    setIsRouterActive(true);
    setActiveTasks([]);
    setIsSavedToStoracha(false);
    
    // Add user message to the chat
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: userQuery,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Track user message locally
    await trackMessageLocally(userMessage);
    
    // Add system message - Identifying agents
    addSystemMessage('Analyzing query and identifying appropriate agents...');
    
    try {
      // Check localStorage for auth token
      const authToken = localStorage.getItem('anp_google_auth');
      if (!authToken) {
        addSystemMessage('Authentication required. Please sign in to use task router.');
        setIsRouterActive(false);
        setIsLoading(false);
        return;
      }

      // Call our Task Router API to analyze the query and determine intent
      const response = await fetch('/api/task-router', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          authToken: authToken
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Task router API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add system message with router decision
      addSystemMessage(`Query analyzed: Routing to ${data.agent} agent (${Math.round(data.confidence * 100)}% confidence)`);
      
      // Create a subtask for the chosen agent
      const agentInfo = determineAgentInfo(data.agent);
      const task: SubTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: `Process query using ${data.agent} capabilities`,
        agent: agentInfo,
        status: 'pending'
      };
      
      setActiveTasks([task]);
      
      // Add system message - Assigning task
      addSystemMessage(`Assigning task to ${agentInfo.name}...`);
      
      // Update task status to in-progress
      setActiveTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'in-progress' } : t
      ));
      
      // Add "thinking" message showing the thought process
      const thoughtMessageId = `thought-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const thoughtMessage: Message = {
        id: thoughtMessageId,
        role: 'agent',
        content: 'Analyzing the query and determining the best approach...',
        timestamp: new Date(),
        agentId: agentInfo.id,
        isThought: true,
        isLoading: true
      };
      setMessages(prev => [...prev, thoughtMessage]);
      
      // After a short delay, update the thought with more details
      setTimeout(async () => {
        const updatedThought = `Analyzing query related to ${data.agent}. Determining relevant information and appropriate response format.`;
        
        setMessages(prev => prev.map(m => 
          m.id === thoughtMessageId ? { 
            ...m, 
            content: updatedThought,
            isLoading: false
          } : m
        ));
        
        // Track thought locally
        await trackMessageLocally({
          ...thoughtMessage,
          content: updatedThought,
          isLoading: false
        });
        
      }, 1500);
      
      // Add loading message for the agent response
      const loadingMessageId = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const loadingMessage: Message = {
        id: loadingMessageId,
        role: 'agent',
        content: 'Working on your request...',
        timestamp: new Date(),
        agentId: agentInfo.id,
        isLoading: true
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, loadingMessage]);
      }, 2500);
      
      // Add the final result after task has completed
      setTimeout(async () => {
        // Check if there's context available from previous agent interactions
        let enhancedResult = data.result;
        
        // Track context retrieval for display purposes, but don't actually fetch from Storacha
        const contextOperationId = trackStorageOperation(
          'info',
          'local',
          'success',
          'metadata',
          'Using locally stored context'
        );
        
        // Replace loading message with actual response
        setMessages(prev => prev.map(m => 
          m.id === loadingMessageId ? { 
            ...m, 
            content: enhancedResult, 
            isLoading: false 
          } : m
        ));
        
        // Track agent response locally
        await trackMessageLocally({
          ...loadingMessage,
          content: enhancedResult,
          isLoading: false
        });
        
        // Add system message - Task completed
        addSystemMessage('Task completed successfully.');
        
        // Reset loading and router states
        setIsLoading(false);
        setIsRouterActive(false);
        
        // Explicitly save the chat to localStorage once the task is completed
        const currentMessages = [...messages, {
          ...loadingMessage,
          content: enhancedResult,
          isLoading: false
        }];
        
        const chatId = currentChatId || `chat-${Date.now()}`;
        const firstUserMessage = currentMessages.find(m => m.role === 'user');
        let title = 'New Chat';
        if (firstUserMessage) {
          title = firstUserMessage.content.substring(0, 40);
          if (firstUserMessage.content.length > 40) title += '...';
        }
        
        // Create the chat session
        const newChat: ChatSession = {
          id: chatId,
          title,
          timestamp: new Date(),
          messages: currentMessages,
          activeTasks: [{ ...task, status: 'completed' }]
        };
        
        // Update chat history
        let updatedHistory = [...chatHistory];
        const existingIndex = updatedHistory.findIndex(chat => chat.id === chatId);
        
        if (existingIndex >= 0) {
          updatedHistory[existingIndex] = newChat;
        } else {
          updatedHistory = [newChat, ...updatedHistory];
        }
        
        // Directly update localStorage
        localStorage.setItem('anp-chat-history', JSON.stringify(updatedHistory));
        localStorage.setItem('anp-current-chat-id', chatId);
        
        // Update the state to match what's in localStorage
        setChatHistory(updatedHistory);
        setCurrentChatId(chatId);
      }, 3500);
      
    } catch (error) {
      console.error('Error calling task router:', error);
      
      // Add error message
      addSystemMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset states
      setIsLoading(false);
      setIsRouterActive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      return;
    }
    
    // Clear input and reset suggestions
    const userQuery = input;
    setInput('');
    setSuggestions([]);
    setActiveSuggestion(-1);
    
    // Process the task using the task router
    await processTaskWithRouter(userQuery);
  };

  // Helper function to determine agent info based on agent ID
  const determineAgentInfo = (agentId: string): AgentInfo => {
    // Map agent IDs from task router to agent info in agents.json
    switch(agentId) {
      case 'gmail':
        return agents.find(a => a.id === 'gmail-assistant') || 
               agents.find(a => a.name.toLowerCase().includes('email')) || 
               agents[0];
      case 'lead_qualifier':
        return agents.find(a => a.id === 'lead-qualifier') || 
               agents.find(a => a.name.toLowerCase().includes('lead')) || 
               agents[1];
      default:
        // Default to first agent if no match
        return agents[0];
    }
  };

  // Calculate time elapsed since the first message
  const getElapsedTime = () => {
    if (messages.length === 0) return null;
    const firstMessageTime = messages[0].timestamp;
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - firstMessageTime.getTime()) / 1000);
    
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
  };

  const elapsedTime = getElapsedTime();

  // Add this function with the other utility functions
  const loadChatFromStoracha = async (storachaItemId: string) => {
    try {
      // Clear any new chat flag
      localStorage.removeItem('anp-creating-new-chat');

      const storachaService = getStorachaService();
      
      // Get the item from Storacha
      const item = storachaItems.find(item => item.id === storachaItemId);
      
      if (!item) {
        throw new Error(`Chat with ID ${storachaItemId} not found`);
      }
      
      // Track the load operation
      trackStorageOperation(
        'download',
        'chat',
        'pending',
        'metadata',
        `Loading chat from Storacha storage`
      );
      
      // Parse the chat object
      const chatObject = JSON.parse(item.content);
      
      // Save current chat if needed
      if (messages.length > 0) {
        // Create a chat session and add to history directly
        const chatId = currentChatId || `chat-${Date.now()}`;
        
        // Generate a title from the first user message
        const firstUserMessage = messages.find(m => m.role === 'user');
        let title = 'New Chat';
        if (firstUserMessage) {
          title = firstUserMessage.content.substring(0, 40);
          if (firstUserMessage.content.length > 40) title += '...';
        }
        
        // Create or update the current chat session
        const updatedChat: ChatSession = {
          id: chatId,
          title,
          timestamp: new Date(),
          messages: messages,
          activeTasks: activeTasks
        };
        
        // Update chat history (replace if exists, add if new)
        let updatedHistory = [...chatHistory];
        const existingIndex = updatedHistory.findIndex(chat => chat.id === chatId);
        
        if (existingIndex >= 0) {
          updatedHistory[existingIndex] = updatedChat;
        } else {
          updatedHistory = [updatedChat, ...updatedHistory];
        }
        
        // Update state
        setChatHistory(updatedHistory);
        
        // Save to localStorage
        localStorage.setItem('anp-chat-history', JSON.stringify(updatedHistory));
      }
      
      // Convert timestamps back to Date objects
      const processedMessages = chatObject.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      // Load the chat into the UI
      setMessages(processedMessages);
      setCurrentChatId(chatObject.id);
      
      // Add a system message indicating chat was loaded from Storacha
      addSystemMessage(`Loaded chat from Storacha storage (ID: ${chatObject.id})`);
      setIsSavedToStoracha(true);
      setLastSavedTimestamp(new Date(chatObject.timestamp));
      
      // Update operation status
      trackStorageOperation(
        'download',
        'chat',
        'success',
        'metadata',
        `Successfully loaded chat with ${processedMessages.length} messages`
      );
      
      // Close the Storacha panel
      setShowStorachaPanel(false);
      
    } catch (error) {
      console.error('Error loading chat from Storacha:', error);
      
      // Track the error
      trackStorageOperation(
        'download',
        'chat',
        'error',
        'metadata',
        `Error loading chat: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      // Show error message
      addSystemMessage(`Error loading chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update the StorachaPanel component to show both local and Storacha chats
  const StorachaPanel = () => {
    // If not showing the panel, return null
    if (!showStorachaPanel) return null;
    
    // Filter for Storacha chat items
    const storachaChats = storachaItems.filter(item => 
      item.agentId === 'chat' && 
      item.dataType === 'metadata' &&
      item.metadata?.chatId
    ).sort((a, b) => {
      const timestampA = a.metadata?.timestamp || 0;
      const timestampB = b.metadata?.timestamp || 0;
      return timestampB - timestampA;
    });
    
    // Get local chats that aren't in Storacha yet
    // Extract Storacha chat IDs for comparison
    const storachaChatIds = storachaChats.map(item => {
      try {
        const chatObj = JSON.parse(item.content);
        return chatObj.id;
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    // Filter localStorage chats that aren't in Storacha
    const localOnlyChats = chatHistory.filter(chat => 
      !storachaChatIds.includes(chat.id)
    ).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    // Function to render a chat card
    const renderChatCard = (
      id: string, 
      title: string, 
      messageCount: number, 
      timestamp: Date, 
      isLocal: boolean,
      onClick: () => void
    ) => (
      <div
        key={id}
        className={`p-4 border ${isLocal ? 'border-amber-200 bg-amber-50 hover:bg-amber-100' : 'border-gray-200 hover:bg-gray-50'} rounded-md cursor-pointer transition-colors`}
        onClick={onClick}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
              {title}
            </p>
            {isLocal && (
              <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">Local</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {messageCount} messages
            </p>
            <p className="text-xs text-gray-400">
              {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
      </div>
    );
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Chat Storage</h2>
            <button
              onClick={() => setShowStorachaPanel(false)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Storage summary */}
          <div className="mb-4 bg-gray-50 p-3 rounded-md flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{localOnlyChats.length}</span> local chats, 
                <span className="font-medium ml-1">{storachaChats.length}</span> in Storacha
              </p>
            </div>
            <button
              onClick={syncChatsToStoracha}
              disabled={isSyncing || localOnlyChats.length === 0}
              className={`
                text-xs px-3 py-1 rounded-md
                ${isSyncing || localOnlyChats.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'} 
              `}
            >
              {isSyncing ? 'Syncing...' : 'Sync All'}
            </button>
          </div>

          {/* Local chats section */}
          {localOnlyChats.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-medium">Local Chats</h3>
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Not synced to Storacha
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {localOnlyChats.map(chat => {
                  // Get the first user message as a preview
                  const firstUserMsg = chat.messages.find(m => m.role === 'user');
                  const title = firstUserMsg 
                    ? (firstUserMsg.content.length > 60 
                      ? firstUserMsg.content.substring(0, 60) + '...' 
                      : firstUserMsg.content)
                    : chat.title || 'Untitled Chat';
                  
                  return renderChatCard(
                    chat.id,
                    title,
                    chat.messages.length,
                    chat.timestamp,
                    true,
                    () => {
                      // Clear any new chat flag
                      localStorage.removeItem('anp-creating-new-chat');
                      
                      // Load from local storage
                      setMessages(chat.messages);
                      setActiveTasks(chat.activeTasks || []);
                      setCurrentChatId(chat.id);
                      localStorage.setItem('anp-current-chat-id', chat.id);
                      setShowStorachaPanel(false);
                      
                      // Hide examples when loading a chat
                      setShowExamples(false);
                    }
                  );
                })}
              </div>
            </div>
          )}

          {/* Storacha chats section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Storacha Chats</h3>
            {storachaChats.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md">No chats found in Storacha storage.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {storachaChats.map(item => {
                  try {
                    const chatObject = JSON.parse(item.content);
                    const messageCount = chatObject.messages?.length || 0;
                    const timestamp = new Date(item.timestamp);
                    
                    // Get the first user message as a preview
                    const firstUserMessage = chatObject.messages?.find((msg: { role: string; content: string }) => msg.role === 'user')?.content || '';
                    const preview = firstUserMessage.length > 60 
                      ? firstUserMessage.substring(0, 60) + '...' 
                      : firstUserMessage;
                    
                    return renderChatCard(
                      item.id,
                      preview || chatObject.id,
                      messageCount,
                      timestamp,
                      false,
                      () => loadChatFromStoracha(item.id)
                    );
                  } catch (error) {
                    // Handle parsing errors gracefully
                    return (
                      <div key={item.id} className="p-4 border border-red-100 bg-red-50 rounded-md">
                        <p className="text-sm text-red-600">Invalid chat data</p>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium mb-3">Recent Storage Operations</h3>
            <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
              {storageOperations.length === 0 ? (
                <p className="text-sm text-gray-500">No recent operations</p>
              ) : (
                <div className="space-y-2">
                  {storageOperations.slice(0, 10).map(op => (
                    <div key={op.id} className="flex items-center text-sm">
                      <span className={`inline-block w-20 font-medium ${
                        op.status === 'success' ? 'text-green-600' : 
                        op.status === 'error' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {op.operation}
                      </span>
                      <span className="text-gray-700 mx-2">
                        {op.agentId}
                      </span>
                      {op.dataType && (
                        <span className="text-gray-500 mx-2">
                          {op.dataType}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs ml-auto">
                        {new Date(op.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setShowStorachaPanel(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handler for save button success
  const handleSaveSuccess = (itemIds: string[]) => {
    if (itemIds.length > 0) {
      setIsSavedToStoracha(true);
      setLastSavedTimestamp(new Date());
      addSystemMessage(`Chat successfully saved to Storacha storage (ID: ${itemIds[0]})`);
      
      // Update storage operations tracking
      trackStorageOperation(
        'upload',
        'chat',
        'success',
        'metadata',
        `Saved complete chat with ${messages.length} messages`
      );
    }
  };
  
  // Handler for save button error
  const handleSaveError = (error: string) => {
    // Add system message about error
    addSystemMessage(`Error saving to Storacha: ${error}`);
  };
  
  // Handler for save button start
  const handleSaveStart = () => {
    // Add system message about save starting
    addSystemMessage('Saving conversation to Storacha...');
  };

  // Create a new function to sync all local chats to Storacha
  const syncChatsToStoracha = async () => {
    if (isSyncing) return;
    
    // Get local chat history for count
    const localHistory = JSON.parse(localStorage.getItem('anp-chat-history') || '[]');
    if (localHistory.length === 0) {
      addSystemMessage('No local chats to sync.');
      return;
    }
    
    // Show confirmation dialog
    const shouldSync = window.confirm(
      `This will sync ${localHistory.length} local chats to Storacha storage. Continue?`
    );
    
    if (!shouldSync) {
      return;
    }
    
    setIsSyncing(true);
    addSystemMessage('Syncing local chats to Storacha storage...');
    
    try {
      const storachaService = getStorachaService();
      
      // Try to get delegation for storage access
      try {
        await storachaService.requestApproval('user');
      } catch (error) {
        console.error('Error getting delegation:', error);
        addSystemMessage('Failed to get storage access permission');
        setIsSyncing(false);
        return;
      }
      
      // Track operation
      trackStorageOperation(
        'upload',
        'chat',
        'pending',
        'metadata',
        `Syncing ${localHistory.length} local chats to Storacha`
      );
      
      // Get existing Storacha items to avoid duplicates
      const allItems = await storachaService.getAllItems();
      const existingChatIds = allItems
        .filter(item => item.agentId === 'chat' && item.metadata?.chatId)
        .map(item => {
          try {
            const chatObj = JSON.parse(item.content);
            return chatObj.id;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      
      // Sync each chat that doesn't already exist in Storacha
      let syncedCount = 0;
      for (const chat of localHistory) {
        // Skip if this chat is already in Storacha
        if (existingChatIds.includes(chat.id)) {
          console.log(`Chat ${chat.id} already exists in Storacha, skipping`);
          continue;
        }
        
        try {
          // Prepare chat object
          const chatObject = {
            id: chat.id,
            timestamp: chat.timestamp.getTime(),
            messages: chat.messages.map((msg: Message) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp.getTime(),
              agentId: msg.agentId || 'user',
              isThought: msg.isThought || false
            })),
            agentIds: Array.from(new Set(chat.messages
              .filter((msg: Message) => msg.agentId)
              .map((msg: Message) => msg.agentId))) as string[]
          };
          
          // Store in Storacha
          await storachaService.storeItem(
            'chat',
            'metadata',
            JSON.stringify(chatObject),
            {
              chatId: chatObject.id,
              timestamp: chatObject.timestamp,
              messageCount: chatObject.messages.length,
              agentIds: chatObject.agentIds
            }
          );
          
          // Also share the chat for access by other agents
          await storachaService.storeSharedItem(
            'metadata',
            JSON.stringify(chatObject),
            {
              chatId: chatObject.id,
              timestamp: chatObject.timestamp,
              messageCount: chatObject.messages.length,
              agentIds: chatObject.agentIds,
              sourceAgentId: 'chat'
            }
          );
          
          syncedCount++;
        } catch (error) {
          console.error(`Error syncing chat ${chat.id}:`, error);
        }
      }
      
      // Update status
      trackStorageOperation(
        'upload',
        'chat',
        'success',
        'metadata',
        `Synced ${syncedCount} of ${localHistory.length} chats to Storacha`
      );
      
      // Add success message
      if (syncedCount > 0) {
        addSystemMessage(`Successfully synced ${syncedCount} chats to Storacha storage.`);
        setIsSavedToStoracha(true);
        setLastSavedTimestamp(new Date());
        
        // Refresh Storacha items
        const items = await storachaService.getAllItems();
        setStorachaItems(items);
      } else {
        addSystemMessage('No new chats needed to be synced.');
      }
    } catch (error) {
      console.error('Error syncing chats to Storacha:', error);
      
      // Track error
      trackStorageOperation(
        'upload',
        'chat',
        'error',
        'metadata',
        `Error syncing chats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      // Add error message
      addSystemMessage(`Error syncing chats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Now update the UI to include a sync button in the chat header
  // Add this JSX in the appropriate location in the return statement, near other chat controls
  // Add a Sync button to the chat header or toolbar
  const SyncButton = () => (
    <button
      onClick={syncChatsToStoracha}
      disabled={isSyncing}
      className={`
        flex items-center px-3 py-1.5 rounded-md text-sm
        ${isSyncing ? 'bg-gray-100 text-gray-500' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'} 
        border border-purple-200
        transition-colors duration-200 ml-2
      `}
      title="Sync local chats to Storacha storage"
    >
      {isSyncing ? (
        <>
          <Loader2 size={16} className="animate-spin mr-1" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <RefreshCw size={16} className="mr-1" />
          <span>Sync to Storacha</span>
        </>
      )}
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Chat History Sidebar */}
      <div className={`flex flex-col border-r border-gray-200 bg-gray-50 ${showChatHistory ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-700">Chat History</h2>
          <button 
            onClick={() => setShowChatHistory(false)}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        
        <div className="flex flex-col gap-1 p-2 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="text-center p-4 text-gray-500 text-sm">
              No previous chats found
            </div>
          ) : (
            chatHistory.map(chat => {
              // Group chats by date
              const chatDate = formatChatDate(chat.timestamp);
              
              return (
                <div key={chat.id} className="flex flex-col">
                  <div 
                    onClick={() => selectChat(chat.id)}
                    className={`flex items-start p-3 rounded-md cursor-pointer hover:bg-gray-200 transition-colors ${chat.id === currentChatId ? 'bg-gray-200 border-l-4 border-purple-500' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900 truncate">{chat.title}</p>
                        <span className="text-xs text-gray-500">{chat.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{chatDate} · {chat.messages.length} messages</p>
                    </div>
                    <button 
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete chat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {!showChatHistory && (
              <button 
                onClick={() => setShowChatHistory(true)} 
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                title="View chat history"
              >
                <History size={20} />
              </button>
            )}
            <h2 className="font-medium text-gray-800">
              {messages.length > 0 ? (
                // Show truncated first message as title
                messages.find(m => m.role === 'user')?.content.substring(0, 40) + 
                (messages.find(m => m.role === 'user')?.content.length! > 40 ? '...' : '')
              ) : (
                'New Chat'
              )}
            </h2>
            
            {/* Display elapsed time if there are messages */}
            {messages.length > 0 && (
              <div className="flex items-center text-xs text-gray-500 ml-2">
                <Clock size={14} className="mr-1" />
                <span>
                  {elapsedTime}
                </span>
              </div>
            )}
            
            {/* Display save status */}
            {messages.length > 0 && (
              <div className="flex items-center text-xs ml-2">
                {isSavedToStoracha ? (
                  <div className="text-green-600 flex items-center">
                    <div className="mr-1">
                      <Check size={14} className="text-green-600" />
                    </div>
                    <span>Saved {lastSavedTimestamp ? `at ${lastSavedTimestamp.toLocaleTimeString(['en-US'], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="text-amber-600 flex items-center">
                    <div className="mr-1">
                      <AlertCircle size={14} className="text-amber-600" />
                    </div>
                    <span>Unsaved to Storacha</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={startNewChat}
              className="flex items-center px-3 py-1.5 rounded-md text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
            >
              <PlusCircle size={16} className="mr-1" />
              New Chat
            </button>
            
            
            {activeTasks.length > 0 && (
              <button 
                onClick={() => setWorkflowPanelOpen(true)}
                className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 border border-gray-200"
              >
                <Zap size={16} className="mr-1 text-amber-500" />
                View Workflow
              </button>
            )}
            
            <button 
              onClick={() => setShowStorachaPanel(true)}
              className="flex items-center px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 border border-gray-200"
              title="View storage"
            >
              <Database size={16} className="mr-1 text-blue-500" />
              Storage ({storachaItems.length})
            </button>
            
            <button 
              onClick={() => setRouterDialogOpen(true)} 
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100" 
              title="How it works"
            >
              <HelpCircle size={20} />
            </button>
            
            <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100" title="Settings">
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Messages Container */}
        <div 
          ref={chatContainerRef} 
          className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="max-w-lg text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Agent Protocol Chat</h2>
                <p className="text-gray-500 mb-6">
                  Ask complex questions that require multiple specialized agents to solve.
                  The protocol will break down your query, route to relevant experts, and synthesize a comprehensive response.
                </p>
                
                {/* Example questions */}
                {showExamples && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                      Try asking one of these questions:
                    </h3>
                    <div className="space-y-2">
                      {[
                        "What are the no of leads in the storage?",
                        "Send a mail to Shubham Rasal at bluequbits@gmail.com about job opportunities ",
                        "What are the top 5 products in the storage?"
                      ].map((example, i) => (
                        <button
                          key={i}
                          onClick={() => handleExampleClick(example)}
                          className="w-full text-left p-2 rounded-md text-sm hover:bg-purple-50 text-gray-600 hover:text-purple-700 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* First render messages */}
              {messages.map((message, index) => {
                // Create a composite key combining the message ID and index
                const messageKey = `${message.id}-index-${index}`;
                
                // Find storage operations related to this message
                const relatedOperations = storageOperations.filter(
                  op => op.messageId === message.id
                );
                
                return (
                  <React.Fragment key={messageKey}>
                    {/* Render the message itself */}
                    {message.role === 'system' ? (
                      <div className="flex justify-center">
                        <div className="bg-gray-50 px-4 py-2 rounded-full flex items-center max-w-md border border-gray-200">
                          <Info size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{message.content}</span>
                        </div>
                      </div>
                    ) : message.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-purple-50 rounded-lg px-4 py-3 shadow-sm hover:shadow transition-shadow max-w-2xl">
                          <p className="text-gray-800">{message.content}</p>
                        </div>
                      </div>
                    ) : message.role === 'router' ? (
                      message.isThought ? (
                        <div className="flex justify-center">
                          <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full flex items-center max-w-lg">
                            <AlertCircle size={14} className="text-blue-500 mr-2" />
                            <span className="text-xs text-gray-600 italic">{message.content}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex">
                          <div className="bg-white border border-purple-200 rounded-lg px-4 py-3 shadow-sm max-w-2xl">
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )
                    ) : message.role === 'agent' ? (
                      // Find the agent info
                      (() => {
                        const agent = agents.find(a => a.id === message.agentId);
                        
                        if (!agent) {
                          // If agent not found
                          return (
                            <div className="flex">
                              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm max-w-2xl">
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Use the AgentResponse component
                        return (
                          <AgentResponse 
                            key={messageKey} 
                            agent={agent} 
                            content={message.content} 
                            loading={message.isLoading || false}
                            isThought={message.isThought}
                          />
                        );
                      })()
                    ) : null}
                    
                    {/* Render related storage operations */}
                    {relatedOperations.map(operation => (
                      <StorachaOperationIndicator
                        key={`${messageKey}-op-${operation.id}`}
                        operation={operation.operation}
                        agentId={operation.agentId}
                        status={operation.status}
                        message={operation.message}
                        timestamp={operation.timestamp}
                        dataType={operation.dataType}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
              
              {/* Render orphaned operations (not linked to a specific message) */}
              {storageOperations
                .filter(op => !op.messageId)
                .map(operation => (
                  <StorachaOperationIndicator
                    key={`orphan-op-${operation.id}`}
                    operation={operation.operation}
                    agentId={operation.agentId}
                    status={operation.status}
                    message={operation.message}
                    timestamp={operation.timestamp}
                    dataType={operation.dataType}
                  />
                ))
              }
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      
        {/* Input section */}
        <div className="border-t border-gray-200 bg-white py-3 px-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 group">
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize the textarea based on content
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                  
                  
                }}
                onKeyDown={(e) => {
                  // Handle suggestion navigation with arrow keys
                  if (suggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
                      return;
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveSuggestion(prev => Math.max(prev - 1, -1));
                      return;
                    } else if (e.key === 'Tab') {
                      e.preventDefault();
                      // If a suggestion is active, apply it
                      if (activeSuggestion >= 0) {
                        applySuggestion(suggestions[activeSuggestion]);
                      } else if (suggestions.length > 0) {
                        // Apply first suggestion if none is active
                        applySuggestion(suggestions[0]);
                      }
                      return;
                    }
                  }
                
                  if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                    e.preventDefault(); // Prevent default to avoid new line
                    setSuggestions([]); // Clear suggestions
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about a complex topic... (Shift+Enter for new line)"
                className="w-full py-3 px-4 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-shadow shadow-sm hover:shadow resize-none min-h-[46px] max-h-[150px] overflow-y-auto leading-normal"
                style={{ height: '46px' }} // Initial height
                disabled={isLoading}
                rows={1}
              ></textarea>
              
              {/* Autocomplete suggestions */}
              {suggestions.length > 0 && !isLoading && (
                <div className="absolute left-0 right-16 bottom-full mb-1 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden z-10">
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${index === activeSuggestion ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                  <div className="px-2 py-1 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
                    Press <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">Tab</kbd> to autocomplete, <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">↑</kbd><kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">↓</kbd> to navigate
                  </div>
                </div>
              )}
              
              {/* Character count */}
              {input.length > 0 && (
                <div className="absolute right-16 top-3 text-xs text-gray-400 pointer-events-none">
                  {input.length} {input.length === 1 ? 'char' : 'chars'}
                </div>
              )}
              
              {/* Clear button */}
              {input.trim() && (
                <button
                  onClick={() => {
                    setInput('');
                    // Reset height when cleared
                    if (inputRef.current) {
                      (inputRef.current as HTMLTextAreaElement).style.height = '46px';
                    }
                  }}
                  className="absolute right-2 top-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full group-hover:opacity-100 transition-opacity"
                  title="Clear input"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className={`flex items-center justify-center px-4 py-3 rounded-lg ${
                input.trim() && !isLoading 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
              title="Send message (Enter)"
            >
              <SendHorizontal className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Send</span>
            </button>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            {/* Status message */}
            <div className="flex items-center">
              {isLoading && (
                <>
                  <div className="animate-pulse mr-2 h-2 w-2 rounded-full bg-purple-500"></div>
                  Processing your question with specialized agents...
                </>
              )}
              {!isLoading && !input && (
                <div className="flex items-center opacity-60">
                  <span className="hidden sm:inline mr-1">Press</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs mr-1">Enter</kbd>
                  <span className="hidden sm:inline mr-1">to send, </span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs mx-1">Shift</kbd>
                  <span className="hidden sm:inline">+</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs mx-1">Enter</kbd>
                  <span className="hidden sm:inline">for new line</span>
                </div>
              )}
              {!isLoading && input && (
                <div className="flex items-center opacity-75">
                  <span className="text-purple-600 font-medium">{calculateComplexity(input)}</span>
                </div>
              )}
            </div>
            
            {/* Right side options */}
            <div className="flex items-center space-x-3">
              {/* Example queries button (if no messages yet) */}
              {messages.length === 0 && !showExamples && (
                <button 
                  className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                  onClick={() => setShowExamples(true)}
                >
                  <Sparkles className="inline-block h-3 w-3 mr-1" />
                  Show examples
                </button>
              )}
              
              {/* AI model info */}
              <div className="text-xs text-gray-400 flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                <span>Multi-agent processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Workflow Panel */}
      <WorkflowPanel
        open={workflowPanelOpen}
        onClose={() => setWorkflowPanelOpen(false)}
        tasks={activeTasks}
      />
      
      {/* Storacha Panel */}
      <StorachaPanel />
      
      {/* TaskRouter Dialog */}
      {routerDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">How Agent Nexus Protocol Works</h2>
              <button 
                onClick={() => setRouterDialogOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                The Agent Nexus Protocol breaks down complex questions into specialized subtasks and routes them to the best agents
                based on their capabilities, stake in the network, and relationships with other agents.
              </p>
              <TaskRouter isActive={isRouterActive} />
            </div>
            <div className="border-t border-gray-200 pt-4">
              <button 
                onClick={() => setRouterDialogOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for generating dummy content
function generateSubtasks(query: string, selectedAgents: AgentInfo[]): SubTask[] {
  const queryLower = query.toLowerCase();
  const tasks: SubTask[] = [];
  
  // Generate relevant subtasks based on query keywords and agent capabilities
  if (selectedAgents.length >= 3) {
    if (queryLower.includes('legal') || queryLower.includes('compliance') || queryLower.includes('regulation')) {
      tasks.push({
        id: `task-legal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Analyze legal and regulatory requirements',
        agent: selectedAgents[0],
        status: 'pending'
      });
    } else {
      tasks.push({
        id: `task-research-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Research background information',
        agent: selectedAgents[0],
        status: 'pending'
      });
    }
    
    if (queryLower.includes('financial') || queryLower.includes('cost') || queryLower.includes('money')) {
      tasks.push({
        id: `task-finance-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Evaluate financial implications',
        agent: selectedAgents[1],
        status: 'pending'
      });
    } else {
      tasks.push({
        id: `task-domain-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Analyze domain-specific factors',
        agent: selectedAgents[1],
        status: 'pending'
      });
    }
    
    if (queryLower.includes('risk') || queryLower.includes('security') || queryLower.includes('threat')) {
      tasks.push({
        id: `task-risk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Assess potential risks and mitigations',
        agent: selectedAgents[2],
        status: 'pending'
      });
    } else {
      tasks.push({
        id: `task-recommend-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        description: 'Provide recommendations and next steps',
        agent: selectedAgents[2],
        status: 'pending'
      });
    }
  }
  
  return tasks;
}

// Helper function to generate agent responses
function generateAgentResponse(task: SubTask): string {
  const agentType = task.agent.id.split('_')[1];
  
  // Generate responses based on agent type and task description
  if (agentType === 'legal') {
    return `Based on my analysis of relevant legal frameworks, I can confirm that there are several regulatory considerations for ${task.description.toLowerCase()}:\n\n1. Compliance with local regulations requires careful documentation\n2. Potential liability issues should be addressed proactively\n3. Consider establishing a compliance monitoring framework`;
  } else if (agentType === 'finance' || agentType === 'crypto' || agentType === 'realestate') {
    return `From a financial perspective, ${task.description.toLowerCase()} presents both opportunities and challenges:\n\n• Initial investment: approximately $50,000 - $75,000\n• Expected ROI: 15-20% within first 18 months\n• Key risk factors: market volatility, regulatory changes\n• Recommend phased implementation to manage cash flow`;
  } else if (agentType === 'health' || agentType === 'food') {
    return `Health assessment for ${task.description.toLowerCase()}:\n\n• Primary benefits: improved wellbeing metrics in 83% of cases\n• Potential concerns: requires proper implementation protocols\n• Compliance with health regulations in all relevant jurisdictions\n• Recommendation: proceed with appropriate safety monitoring`;
  } else if (agentType === 'tech' || agentType === 'cyber' || agentType === 'ai') {
    return `Technical analysis of ${task.description.toLowerCase()}:\n\n• Implementation complexity: Medium\n• Key technologies required: cloud infrastructure, data encryption\n• Security considerations: data handling protocols needed\n• Timeline: approximately 2-3 months for full deployment`;
  } else {
    return `I've completed my analysis of ${task.description.toLowerCase()} and found that:\n\n• Multiple approaches are viable depending on priorities\n• Key success factors include thorough planning and stakeholder engagement\n• Common pitfalls can be avoided through regular assessment\n• Recommendation: proceed with a structured implementation plan`;
  }
}

// Generate thought process logs that would be shown in the workflow panel
function generateThoughtProcess(task: SubTask): string {
  const agentType = task.agent.id.split('_')[1];
  
  if (agentType === 'legal') {
    return `1. Query received: "${task.description}"\n2. Accessing legal knowledge base...\n3. Found 17 relevant regulations\n4. Analyzing applicability to current context\n5. Identifying key compliance requirements\n6. Evaluating documentation needs\n7. Checking for jurisdictional variations\n8. Determining potential liability issues\n9. Formulating monitoring recommendations\n10. Finalizing analysis with confidence score: 87%`;
  } else if (agentType === 'finance' || agentType === 'crypto' || agentType === 'realestate') {
    return `1. Query received: "${task.description}"\n2. Accessing financial models...\n3. Building cash flow projections\n4. Estimating initial investment requirements\n5. Calculating expected ROI based on market benchmarks\n6. Identifying key risk factors from similar ventures\n7. Analyzing market volatility impact\n8. Testing sensitivity to regulatory changes\n9. Evaluating implementation approaches\n10. Finalizing recommendations with confidence score: 92%`;
  } else if (agentType === 'health' || agentType === 'food') {
    return `1. Query received: "${task.description}"\n2. Accessing health databases...\n3. Reviewing clinical outcomes data\n4. Analyzing wellbeing metrics from similar initiatives\n5. Identifying potential implementation concerns\n6. Checking regulatory compliance requirements\n7. Evaluating safety considerations\n8. Assessing risk/benefit profile\n9. Determining monitoring protocols\n10. Finalizing assessment with confidence score: 89%`;
  } else if (agentType === 'tech' || agentType === 'cyber' || agentType === 'ai') {
    return `1. Query received: "${task.description}"\n2. Accessing technology knowledge graphs...\n3. Determining technical requirements\n4. Evaluating implementation complexity\n5. Identifying necessary infrastructure components\n6. Analyzing security considerations\n7. Assessing data handling requirements\n8. Estimating deployment timeline\n9. Mapping potential integration points\n10. Finalizing technical analysis with confidence score: 94%`;
  } else {
    return `1. Query received: "${task.description}"\n2. Accessing general knowledge base...\n3. Identifying relevant domains and approaches\n4. Evaluating success factors from similar cases\n5. Analyzing common implementation pitfalls\n6. Determining stakeholder considerations\n7. Assessing planning requirements\n8. Estimating resource needs\n9. Formulating structured implementation plan\n10. Finalizing recommendations with confidence score: 85%`;
  }
}

// Helper function to generate a final synthesized response
function generateFinalResponse(tasks: SubTask[], query: string): string {
  const queryLower = query.toLowerCase();
  
  let introduction = '';
  if (queryLower.includes('legal') || queryLower.includes('compliance')) {
    introduction = "Based on our comprehensive legal and regulatory analysis";
  } else if (queryLower.includes('financial') || queryLower.includes('cost')) {
    introduction = "After evaluating the financial implications and economic factors";
  } else if (queryLower.includes('risk') || queryLower.includes('security')) {
    introduction = "Following our thorough risk assessment and security evaluation";
  } else if (queryLower.includes('health') || queryLower.includes('medical')) {
    introduction = "Based on health data analysis and medical expertise";
  } else {
    introduction = "After comprehensive analysis across multiple domains";
  }
  
  return `${introduction}, here's a synthesized answer to your query:\n\n${tasks.map(task => 
    `• ${task.description}: ${task.response?.split('\n')[0]}`
  ).join('\n\n')}\n\nIn conclusion, there are several important factors to consider and a structured approach is recommended. Would you like more detailed information on any specific aspect?`;
}

// Helper function to analyze query complexity for UI feedback
function calculateComplexity(query: string): string {
  const length = query.length;
  const words = query.split(/\s+/).filter(Boolean).length;
  const sentences = query.split(/[.!?]+/).filter(Boolean).length;
  const specialTerms = [
    'legal', 'financial', 'technical', 'medical', 'scientific', 'analysis', 
    'compare', 'contrast', 'evaluate', 'explain', 'synthesize', 'breakdown',
    'implications', 'consequences', 'benefits', 'drawbacks', 'advantages',
    'security', 'privacy', 'regulations', 'compliance', 'framework'
  ].filter(term => query.toLowerCase().includes(term)).length;
  
  // Calculate a complexity score
  let score = 0;
  
  // Length-based complexity
  if (length > 200) score += 3;
  else if (length > 100) score += 2;
  else if (length > 50) score += 1;
  
  // Word count complexity
  if (words > 40) score += 3;
  else if (words > 20) score += 2;
  else if (words > 10) score += 1;
  
  // Sentence structure complexity
  if (sentences > 3) score += 2;
  else if (sentences > 1) score += 1;
  
  // Special terms complexity
  score += Math.min(3, specialTerms);
  
  // Determine the complexity label
  if (score >= 8) return "Complex query - multiple agents needed";
  if (score >= 5) return "Moderate complexity";
  if (score >= 3) return "Simple query";
  return "Basic query";
} 