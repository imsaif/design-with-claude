'use client';

import { useState } from 'react';

export default function Home() {
  const [currentView, setCurrentView] = useState('home');

  const HomeView = () => (
    <>
      {/* Terminal-style title */}
      <h1 className="terminal-title">
        <span className="prompt">&gt;</span> Design with Claude<span className="blinking-cursor"></span>
      </h1>
      
      {/* Subtitle */}
      <p className="hero-subtitle">
        Specialized AI agents for every design challenge. From UI/UX to brand strategy, get expert assistance powered by Claude AI.
      </p>
      
      {/* CTA Buttons */}
      <div className="cta-buttons">
        <button 
          onClick={() => setCurrentView('install')} 
          className="btn-primary"
        >
          Install Instructions
        </button>
        <a href="https://github.com/imsaif/design-with-claude" className="btn-secondary">
          View on GitHub
        </a>
      </div>
      
      {/* Code Example */}
      <div className="code-example">
        <div className="code-line">
          <span className="prompt">$</span>
          <span className="command">git clone github.com/design-with-claude</span>
        </div>
        <div className="code-line">
          <span className="prompt">$</span>
          <span className="command">cp -r agents/* ~/.claude/agents/</span>
        </div>
        <div className="code-line">
          <span className="prompt">$</span>
          <span className="command">@ui-designer Create a modern dashboard</span>
        </div>
      </div>
    </>
  );

  const InstallView = () => (
    <>
      {/* Back button */}
      <div className="install-header">
        <button 
          onClick={() => setCurrentView('home')} 
          className="btn-back"
        >
          ← Back to Terminal
        </button>
      </div>
      
      {/* Installation title */}
      <h2 className="install-title">Installation Instructions</h2>
      
      {/* Installation sections */}
      <div className="install-sections">
        <div className="install-section">
          <h3 className="install-section-title">Clone and Use</h3>
          <div className="code-example">
            <div className="code-line">
              <span className="prompt">$</span>
              <span className="command">git clone https://github.com/imsaif/design-with-claude.git</span>
            </div>
            <div className="code-line">
              <span className="prompt">$</span>
              <span className="command">cd design-with-claude</span>
            </div>
          </div>
        </div>

        <div className="install-section">
          <h3 className="install-section-title">User-wide Installation</h3>
          <div className="code-example">
            <div className="code-line">
              <span className="prompt">$</span>
              <span className="command">git clone https://github.com/imsaif/design-with-claude.git</span>
            </div>
            <div className="code-line">
              <span className="prompt">$</span>
              <span className="command">cd design-with-claude</span>
            </div>
            <div className="code-line">
              <span className="prompt">$</span>
              <span className="command">cp -r agents/* ~/.claude/agents/</span>
            </div>
          </div>
        </div>

        <div className="install-section">
          <h3 className="install-section-title">Project-specific Installation</h3>
          <div className="code-example">
            <div className="code-line">
              <span className="prompt">$</span>
              <span className="command">cd your-project</span>
            </div>
            <div className="code-line">
              <span className="prompt">$</span>
              <span className="command">cp -r path/to/design-with-claude/agents/* .claude/agents/</span>
            </div>
          </div>
        </div>

        <div className="install-section">
          <h3 className="install-section-title">Web Interface</h3>
          <p className="install-description">
            Simply copy the content of any agent file and paste it at the beginning of your Claude conversation.
          </p>
        </div>

        <div className="install-section">
          <h3 className="install-section-title">Verify Installation</h3>
          <div className="code-example">
            <div className="code-line">
              <span className="prompt">$</span>
              <span className="command">ls ~/.claude/agents/</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="hero-section">
      <div className="terminal-window">
        {/* Terminal Header */}
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot red"></div>
            <div className="terminal-dot yellow"></div>
            <div className="terminal-dot green"></div>
          </div>
          <div className="terminal-window-title">design-with-claude — ~/terminal</div>
        </div>
        
        {/* Terminal Content - Switches between views */}
        <div className="terminal-content">
          {currentView === 'home' ? <HomeView /> : <InstallView />}
        </div>
      </div>
    </div>
  );
}