import React, { useState, useEffect, useRef, useMemo } from 'react';
import Navbar from './components/Navbar';
import ShaderBg from './components/ShaderBg';
import LandingView from './components/LandingView';
import SinglePredictor from './components/SinglePredictor';
import BatchPredictor from './components/BatchPredictor';
import AuthModal from './components/AuthModal';
import ChurnAdvisorChat from './components/Chatbot/ChurnAdvisorChat';
import { getCurrentUser, logoutUser, seedDemoUser } from './lib/authDb';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingTargetView, setPendingTargetView] = useState(null);

  // View routing state
  const [currentView, setCurrentView] = useState(() => {
    const user = getCurrentUser();
    const hash = window.location.hash.toLowerCase();
    // Gate view if not authenticated
    if (!user && (hash === '#single' || hash === '#batch')) {
      return 'landing';
    }
    if (hash === '#single') return 'single';
    if (hash === '#batch') return 'batch';
    return 'landing';
  });

  // Inspected customer state for seamless transfer from batch
  const [inspectedCustomer, setInspectedCustomer] = useState(null);
  const singleResetRef = useRef(null);

  // Persistent Batch CSV state (lives across view switches until explicitly replaced/cleared)
  const [batchCustomers, setBatchCustomers] = useState([]);
  const [batchStagedFile, setBatchStagedFile] = useState(null);
  const [batchIsProcessing, setBatchIsProcessing] = useState(false);

  // Real-time single predictor telemetry for AI Advisor context
  const [liveSingleData, setLiveSingleData] = useState({ profile: null, prob: null, inspectedId: null });
  const handleProfileUpdate = (profile, prob, inspectedId) => {
    setLiveSingleData({ profile, prob, inspectedId });
  };

  // Real-time batch cohort statistics for AI Advisor context
  const cohortStats = useMemo(() => {
    if (batchCustomers.length === 0) return null;
    const total = batchCustomers.length;
    const high = batchCustomers.filter(c => c.riskTier === 'High Risk').length;
    const highPct = Math.round((high / total) * 100);
    const avg = Math.round((batchCustomers.reduce((acc, c) => acc + c.prob, 0) / total) * 100);
    const loss = batchCustomers
      .filter(c => c.riskTier === 'High Risk')
      .reduce((acc, c) => acc + c.annualLoss, 0);
    return {
      totalCount: total,
      highRiskCount: high,
      highRiskPct: highPct,
      avgChurnPct: avg,
      totalLoss: loss
    };
  }, [batchCustomers]);

  // Initialize DB and seed demo user on mount
  useEffect(() => {
    seedDemoUser();
  }, []);

  // Sync state with URL hash & handle gating
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const user = getCurrentUser();

      if (hash === '#single') {
        if (!user) {
          setPendingTargetView('single');
          setAuthModalOpen(true);
          window.location.hash = '';
          setCurrentView('landing');
        } else {
          setCurrentView('single');
        }
      } else if (hash === '#batch') {
        if (!user) {
          setPendingTargetView('batch');
          setAuthModalOpen(true);
          window.location.hash = '';
          setCurrentView('landing');
        } else {
          setCurrentView('batch');
        }
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Specular Hover Engine
  useEffect(() => {
    const handleMouseMove = (e) => {
      const wrapper = e.target.closest('.css-specular-wrapper');
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        wrapper.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        wrapper.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ClickSpark Global Particle Engine
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let sparks = [];
    const sparkCount = 8;
    const sparkRadius = 15;
    const sparkSize = 10;
    const duration = 400;

    const handleClick = (e) => {
      const now = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          angle: (2 * Math.PI * i) / sparkCount,
          startTime: now
        });
      }
    };
    document.addEventListener('click', handleClick, { capture: true });

    let animId;
    const draw = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;
        const progress = elapsed / duration;
        const eased = progress * (2 - progress);
        const distance = eased * sparkRadius;
        const lineLength = sparkSize * (1 - eased);
        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);
        ctx.strokeStyle = '#00f298';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        return true;
      });
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  // Safe navigation with auth gating
  const navigateToView = (viewName) => {
    if ((viewName === 'single' || viewName === 'batch') && !currentUser) {
      setPendingTargetView(viewName);
      setAuthModalOpen(true);
      return;
    }

    setCurrentView(viewName);
    window.location.hash = viewName === 'landing' ? '' : `#${viewName}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Inspect customer from Batch CSV -> Single Predictor
  const handleInspectCustomer = (customer) => {
    setInspectedCustomer(customer);
    navigateToView('single');
  };

  const handleNavbarReset = () => {
    if (singleResetRef.current) {
      singleResetRef.current();
    }
  };

  const handleBatchReset = () => {
    setBatchCustomers([]);
    setBatchStagedFile(null);
    setBatchIsProcessing(false);
  };

  // Auth Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);

    // If user was attempting to reach a specific view, direct them there
    const target = pendingTargetView || 'landing';
    setPendingTargetView(null);
    setCurrentView(target);
    window.location.hash = target === 'landing' ? '' : `#${target}`;
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setInspectedCustomer(null);
    navigateToView('landing');
  };

  const handleOpenAuth = (targetView = null) => {
    setPendingTargetView(targetView);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col text-text-main relative">
      {/* 3D Animated ShaderGradient Background */}
      <ShaderBg />

      {/* Navigation Header */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={navigateToView} 
        onReset={currentView === 'single' ? handleNavbarReset : currentView === 'batch' ? handleBatchReset : null}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Routed Workspace */}
      <main className="flex-1 w-full pb-16">
        {currentView === 'landing' && (
          <LandingView 
            onSelectView={navigateToView} 
            currentUser={currentUser}
            onRequireAuth={handleOpenAuth}
          />
        )}

        {currentView === 'single' && (
          <SinglePredictor 
            initialProfile={inspectedCustomer} 
            onNavigate={navigateToView}
            resetRef={singleResetRef}
            onProfileUpdate={handleProfileUpdate}
          />
        )}

        {currentView === 'batch' && (
          <BatchPredictor 
            customers={batchCustomers}
            setCustomers={setBatchCustomers}
            stagedFile={batchStagedFile}
            setStagedFile={setBatchStagedFile}
            isProcessing={batchIsProcessing}
            setIsProcessing={setBatchIsProcessing}
            onInspectCustomer={handleInspectCustomer} 
            onNavigate={navigateToView}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        targetViewName={pendingTargetView}
      />

      {/* Toast Notification Viewport */}
      <div className="toast-viewport" id="toast-viewport"></div>

      {/* Floating AI Churn Advisor Chatbot */}
      <ChurnAdvisorChat 
        currentPage={currentView}
        activeProfile={liveSingleData.profile}
        currentProb={liveSingleData.prob}
        inspectedId={liveSingleData.inspectedId}
        cohortStats={cohortStats}
      />
    </div>
  );
}
