"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Globe } from "lucide-react";

function CopyButton({ text, compact = false }: { text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 ${compact ? 'p-2' : 'px-4 py-2'} text-gray-400 hover:text-white transition-all hover:bg-white/5 rounded-lg`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {!compact && <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>}
    </button>
  );
}

const cliSteps = [
  {
    step: "1",
    title: "Clone the Repository",
    command: "git clone https://github.com/imsaif/design-with-claude.git",
    description: "Get the complete collection of design agents from GitHub"
  },
  {
    step: "2", 
    title: "Install Agents",
    command: "cp -r agents/* ~/.claude/agents/",
    description: "Copy all agents to your Claude configuration directory"
  },
  {
    step: "3",
    title: "Start Using Agents", 
    command: "@ui-designer Create a modern dashboard",
    description: "Use any agent by mentioning it with @ in Claude CLI"
  }
];

const webSteps = [
  {
    step: "1",
    title: "Browse Agents",
    command: "Navigate to any agent category above",
    description: "Explore the different categories to find the right agent"
  },
  {
    step: "2",
    title: "Copy Agent Content", 
    command: "Click on an agent file in the GitHub repo",
    description: "Copy the entire agent content from the repository"
  },
  {
    step: "3",
    title: "Paste in Chat",
    command: "Paste the agent content into Claude.ai",
    description: "Start a new conversation with the agent instructions"
  }
];

export default function GettingStarted() {
  const [activeTab, setActiveTab] = useState<'cli' | 'web'>('cli');
  
  const currentSteps = activeTab === 'cli' ? cliSteps : webSteps;

  return (
    <section id="getting-started" className="px-6 lg:px-8 bg-gradient-to-b from-transparent via-black/20 to-transparent" style={{paddingTop: '20rem', paddingBottom: '20rem'}}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center" style={{marginBottom: '8rem'}}>
          <h2 className="text-6xl font-bold leading-tight" style={{marginBottom: '3rem'}}>Getting Started</h2>
          <p className="text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">Choose your preferred method to start using design agents</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center" style={{marginBottom: '6rem'}}>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-2 max-w-lg">
            <button
              onClick={() => setActiveTab('cli')}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all focus:ring-2 focus:ring-cyan-500/20 ${
                activeTab === 'cli'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-selected={activeTab === 'cli'}
              role="tab"
              aria-controls="cli-content"
            >
              <Terminal className="w-4 h-4" />
              <span className="text-base">CLI Installation</span>
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all focus:ring-2 focus:ring-cyan-500/20 ${
                activeTab === 'web'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-selected={activeTab === 'web'}
              role="tab"
              aria-controls="web-content"
            >
              <Globe className="w-4 h-4" />
              <span className="text-base">Web Usage</span>
            </button>
          </div>
        </div>
        
        {/* Steps */}
        <div 
          id={activeTab === 'cli' ? 'cli-content' : 'web-content'}
          role="tabpanel"
          style={{display: 'flex', flexDirection: 'column', gap: '6rem'}}
        >
          {currentSteps.map((item, index) => (
            <div key={index} className="flex items-start" style={{gap: '3rem'}}>
              {/* Step Number */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center font-bold text-3xl text-white shadow-xl">
                  {item.step}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 text-left" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                <div>
                  <h3 className="text-3xl font-bold text-white leading-tight" style={{marginBottom: '1rem'}}>{item.title}</h3>
                  <p className="text-gray-300 text-xl leading-relaxed">{item.description}</p>
                </div>
                
                {/* Command Block */}
                <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl" style={{padding: '2rem'}}>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-cyan-300 font-mono text-lg flex-1">
                      {item.command}
                    </code>
                    {item.command.startsWith('git') || item.command.startsWith('cp') || item.command.startsWith('@') ? (
                      <div className="flex justify-center sm:justify-end">
                        <CopyButton text={item.command} compact />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}