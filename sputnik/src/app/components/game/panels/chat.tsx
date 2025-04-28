'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/components/auth/AuthContext';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { getPanelBaseStyles, mergeStyles, panelStyles, touchFriendlyStyles } from '@/lib/styles/responsive';

// Use the types from our API
type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// For UI display
type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// Format timestamp like Twitter ("Today, 8:26 PM")
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
  
  const isYesterday = date.getDate() === now.getDate() - 1 && 
                      date.getMonth() === now.getMonth() && 
                      date.getFullYear() === now.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

  if (isToday) {
    return `Today, ${timeString}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeString}`;
  } else {
    // Format date as Month Day for older messages
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${date.toLocaleDateString('en-US', options)}, ${timeString}`;
  }
};

export default function ChatPanel() {
  const { sputnikCreationNumber } = useAuth();
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "gm - let's fly. where should we go?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Store conversation history for API calls
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'You are DARK AI, an assistant helping navigate a spacecraft through space. Provide concise, helpful responses about navigation, planets, and spacecraft systems.'
    },
    {
      role: 'assistant',
      content: "gm - let's fly. where should we go?"
    }
  ]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`;
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault(); // Prevent new line on Enter without shift
      handleSendMessage();
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userInput = input.trim();
    
    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userInput,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Add user message to conversation history
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userInput
    };
    
    const updatedHistory = [...conversationHistory, userChatMessage];
    
    setMessages(prev => [...prev, userMessage]);
    setConversationHistory(updatedHistory);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call API with updated conversation history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedHistory
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Replace [NUMBER] with actual sputnik number if available
      let content = data.message.content;
      if (content.includes('[NUMBER]') && sputnikCreationNumber !== null) {
        content = content.replace('[NUMBER]', `${sputnikCreationNumber}`);
      }
      
      // Add AI response to UI
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: content,
        sender: 'ai',
        timestamp: new Date()
      };
      
      // Add AI response to conversation history with the replaced content
      const aiChatMessage: ChatMessage = {
        role: 'assistant',
        content: content
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setConversationHistory(prev => [...prev, aiChatMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now().toString(),
          content: 'Sorry, I encountered an error processing your request.',
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
      
      // Add error to conversation history as system message
      setConversationHistory(prev => [
        ...prev, 
        {
          role: 'system',
          content: 'Error processing request'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Choose style variant based on device
  const variant = isMobile ? 'mobile' : 'desktop';
  
  // Get responsive base container styles
  const containerBaseStyles = mergeStyles(
    getPanelBaseStyles(variant),
    panelStyles.chat[variant]
  );
  
  // Update header styles for mobile
  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isMobile ? '16px' : '12px 16px',
    borderBottom: 'none',
    cursor: 'pointer',
    height: isMobile ? '56px' : '52px',
    background: 'rgba(0, 0, 0, 0.5)',
  };
  
  // Update input area styles for mobile
  const inputAreaStyles = {
    padding: isMobile ? '14px 16px' : '12px 16px',
    paddingBottom: isMobile ? `calc(14px + env(safe-area-inset-bottom, 0px))` : '12px 16px',
    borderTop: '1px solid rgba(250, 250, 250, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#000000',
  };
  
  // If minimized, show just the header
  if (!isExpanded) {
    return (
      <div style={mergeStyles(
        containerBaseStyles,
        { 
          height: isMobile ? '56px' : '52px', 
          maxHeight: isMobile ? '56px' : '52px' 
        }
      )}>
        <div 
          style={mergeStyles(
            headerStyles,
            isMobile ? touchFriendlyStyles : {},
            { height: '100%' }
          )}
          onClick={toggleExpanded}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#63B3ED',
              marginRight: '8px',
              boxShadow: '0 0 5px #63B3ED'
            }} />
            <span style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600' }}>Chat</span>
          </div>
          <span style={{ 
            color: '#fafafa', 
            fontSize: '14px', 
            fontWeight: '300',
            width: '14px',
            textAlign: 'center' 
          }}>▲</span>
        </div>
      </div>
    );
  }
  
  // Full expanded chat panel
  const expandedHeightStyles = {
    height: isMobile ? 'calc(35vh + env(safe-area-inset-bottom, 0px))' : '530px',
    maxHeight: isMobile ? 'calc(35vh + env(safe-area-inset-bottom, 0px))' : '530px',
  };
  
  return (
    <div style={mergeStyles(
      containerBaseStyles,
      expandedHeightStyles,
      { display: 'flex', flexDirection: 'column' }
    )}>
      {/* Chat Header */}
      <div 
        style={mergeStyles(
          headerStyles,
          isMobile ? touchFriendlyStyles : {}
        )}
        onClick={toggleExpanded}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#63B3ED',
            marginRight: '8px',
            boxShadow: '0 0 5px #63B3ED'
          }} />
          <span style={{ color: '#fafafa', fontSize: '14px', fontWeight: '600' }}>Chat</span>
        </div>
        <span style={{ 
          color: '#fafafa', 
          fontSize: '14px', 
          fontWeight: '300',
          width: '14px',
          textAlign: 'center' 
        }}>−</span>
      </div>
      
      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'transparent',
      }}>
        {messages.map((message, index) => {
          // Check if we should show timestamp (first message or new day)
          const showTimestamp = index === 0 || 
            (index > 0 && new Date(message.timestamp).getDate() !== new Date(messages[index-1].timestamp).getDate());
          
          return (
            <div key={message.id}>
              {/* Message bubble with proper Twitter styling */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '4px',
              }}>
                <div style={{
                  backgroundColor: message.sender === 'user' ? '#1d9bf0' : '#202327', // Twitter colors
                  color: '#ffffff',
                  padding: '12px 16px',
                  // Border radius: top-left, top-right, bottom-right, bottom-left
                  borderRadius: message.sender === 'user' 
                    ? '18px 18px 4px 18px' // User bubbles: only bottom-right is straight
                    : '18px 18px 18px 4px', // AI bubbles: only bottom-left is straight
                  maxWidth: isMobile ? '85%' : '80%',
                  wordBreak: 'break-word',
                  fontSize: isMobile ? '15px' : '14px',
                  lineHeight: 1.4,
                  position: 'relative',
                }}>
                  {message.content}
                </div>
                
                {/* Timestamp like Twitter */}
                <div style={{
                  color: '#71767b', // Twitter timestamp gray
                  fontSize: '12px',
                  marginTop: '4px',
                  paddingLeft: message.sender === 'user' ? '0' : '4px',
                  paddingRight: message.sender === 'user' ? '4px' : '0',
                }}>
                  {formatTimestamp(message.timestamp)}
                  {message.sender === 'user' && ' • Sent'}
                </div>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div style={{
            alignSelf: 'flex-start',
            backgroundColor: '#202327', // Twitter dark gray
            borderRadius: '18px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              animation: 'pulse 1s infinite',
            }} />
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              animation: 'pulse 1s infinite 0.2s',
            }} />
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              animation: 'pulse 1s infinite 0.4s',
            }} />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div style={mergeStyles(inputAreaStyles)}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#202327', // Twitter's dark input background
          borderRadius: '24px',
          padding: '8px 12px',
          width: '100%',
          position: 'relative',
        }}>
          {/* Left chevron icon */}
          <div style={{ 
            color: '#1d9bf0', 
            fontSize: '16px',
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
           }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          {/* Textarea for input */}
          <textarea 
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Start a new message"
            rows={1}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: '#fafafa',
              fontSize: isMobile ? '16px' : '14px', // Larger font for mobile
              resize: 'none',
              overflow: 'hidden',
              minHeight: isMobile ? '26px' : '24px',
              maxHeight: '96px', // Approx 4 lines
              fontFamily: 'inherit',
              paddingTop: isMobile ? '4px' : '0',
            }}
            ref={textareaRef}
          />
          
          {/* Send button - only shown when there's input */}
          <div 
            onClick={input.trim() && !isLoading ? handleSendMessage : undefined}
            style={{
              width: isMobile ? '36px' : '28px',
              height: isMobile ? '36px' : '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: input.trim() && !isLoading ? '#1d9bf0' : 'rgba(29, 155, 240, 0.4)',
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              marginLeft: '4px',
            }}
          >
            <svg width={isMobile ? '22' : '18'} height={isMobile ? '22' : '18'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12L20 4L12 20L10 14L4 12Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
} 