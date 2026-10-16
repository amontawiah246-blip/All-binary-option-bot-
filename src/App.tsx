/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { agentEngine } from './services/agentEngine';
import { derivWs, ConnectionStatus } from './services/derivWs';
import { reportingService } from './services/reportingService';
import { soundFx } from './services/soundFx';
import { AgentSignal, CeoDirective, ExecutiveReport, MarketAgent } from './types/agent';
import { Header } from './components/Dashboard/Header';
import { CeoOverviewTab } from './components/Dashboard/CeoOverviewTab';
import { FleetGridTab } from './components/Dashboard/FleetGridTab';
import { Fleet3DScene } from './components/ThreeScene/Fleet3DScene';
import { TerminalTab } from './components/Dashboard/TerminalTab';
import { ReportsTab } from './components/Dashboard/ReportsTab';
import { AgentDetailModal } from './components/Dashboard/AgentDetailModal';
import { MobileNav } from './components/Dashboard/MobileNav';

export default function App() {
  const [agents, setAgents] = useState<MarketAgent[]>(agentEngine.getAgentsList());
  const [signals, setSignals] = useState<AgentSignal[]>(agentEngine.getSignals());
  const [directives, setDirectives] = useState<CeoDirective[]>(agentEngine.getDirectives());
  const [reports, setReports] = useState<ExecutiveReport[]>(reportingService.getReports());

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(derivWs.status);
  const [ticksPerSecond, setTicksPerSecond] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  const [currentTab, setCurrentTab] = useState<'overview' | 'fleet' | 'three' | 'terminal' | 'reports'>('overview');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Initialize engine and subscriptions
  useEffect(() => {
    // Start engine
    agentEngine.start();

    // Listen to agent engine state updates
    const unsubEngine = agentEngine.onStateChange((newAgents, newSignals, newDirectives) => {
      setAgents([...newAgents]);
      setSignals([...newSignals]);
      setDirectives([...newDirectives]);
    });

    // Listen to Deriv WS status
    const unsubStatus = derivWs.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Listen to Reports
    const unsubReports = reportingService.onReportsChange((reps) => {
      setReports([...reps]);
    });

    // Meter polling for latency & ticks/s
    const meterInterval = setInterval(() => {
      setTicksPerSecond(derivWs.ticksPerSecond);
      setLatencyMs(derivWs.latencyMs);
    }, 1000);

    return () => {
      unsubEngine();
      unsubStatus();
      unsubReports();
      clearInterval(meterInterval);
      agentEngine.stop();
    };
  }, []);

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setIsDetailModalOpen(true);
    soundFx.playAgentSelect();
  };

  const handleToggleMute = (symbol: string) => {
    agentEngine.toggleMuteAgent(symbol);
  };

  const handleTriggerSignal = (symbol: string, type: 'STRONG_BUY' | 'STRONG_SELL') => {
    agentEngine.triggerManualSignal(symbol, type);
    soundFx.playSignalAlert(true);
  };

  const handleGenerateReport = () => {
    soundFx.playSignalAlert(false);
    reportingService.generateReport(agents, signals);
    setCurrentTab('reports');
  };

  const handleEmergencyHedge = () => {
    soundFx.playSignalAlert(true);
    // Dispatches emergency hedge directive to all 50 agents
    agentEngine.triggerManualSignal('frxUSDCHF', 'STRONG_BUY');
    agentEngine.triggerManualSignal('RDBEAR', 'STRONG_BUY');
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <Header
        connectionStatus={connectionStatus}
        ticksPerSecond={ticksPerSecond}
        latencyMs={latencyMs}
        totalSignalsCount={signals.length}
        activeDirectives={directives}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onGenerateReport={handleGenerateReport}
        onEmergencyHedge={handleEmergencyHedge}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8">
        {currentTab === 'three' ? (
          /* Full Viewport 3D Swarm Scene */
          <div className="w-full h-[calc(100vh-65px)]">
            <Fleet3DScene
              agents={agents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={handleSelectAgent}
              ticksPerSecond={ticksPerSecond}
            />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-5 sm:py-6">
            {currentTab === 'overview' && (
              <CeoOverviewTab
                agents={agents}
                signals={signals}
                directives={directives}
                onSelectAgent={handleSelectAgent}
                onOpenReportModal={handleGenerateReport}
                onTriggerManualDirective={handleEmergencyHedge}
              />
            )}

            {currentTab === 'fleet' && (
              <FleetGridTab
                agents={agents}
                onSelectAgent={handleSelectAgent}
                onToggleMute={handleToggleMute}
              />
            )}

            {currentTab === 'terminal' && (
              <TerminalTab
                agents={agents}
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
                onTriggerSignal={handleTriggerSignal}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsTab
                reports={reports}
                agents={agents}
                onGenerateReport={handleGenerateReport}
                onSelectAgent={handleSelectAgent}
              />
            )}
          </div>
        )}
      </main>

      {/* Deep-Dive Agent Telemetry Modal */}
      {isDetailModalOpen && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setIsDetailModalOpen(false)}
          onToggleMute={handleToggleMute}
          onForceSignal={handleTriggerSignal}
        />
      )}

      {/* Mobile-First Bottom Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeSignalsCount={signals.length}
      />
    </div>
  );
}
