'use client';

import { useEffect, useState } from 'react';

export default function KeycloakDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [keycloakStatus, setKeycloakStatus] = useState<string>('Checking...');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    const runDiagnostics = async () => {
      addLog('Starting Keycloak diagnostics...');

      // Test 1: Check if Keycloak server is accessible
      try {
        addLog('Test 1: Checking Keycloak server...');
        const response = await fetch('http://localhost:8090/realms/buildms/.well-known/openid-configuration');
        if (response.ok) {
          const data = await response.json();
          addLog('✅ Keycloak server is accessible');
          addLog(`Issuer: ${data.issuer}`);
          addLog(`Authorization endpoint: ${data.authorization_endpoint}`);
        } else {
          addLog(`❌ Keycloak server returned status: ${response.status}`);
        }
      } catch (error: any) {
        addLog(`❌ Cannot reach Keycloak server: ${error.message}`);
      }

      // Test 2: Check if Keycloak JS is loaded
      addLog('Test 2: Checking Keycloak JS library...');
      try {
        const Keycloak = (await import('keycloak-js')).default;
        addLog('✅ Keycloak JS library loaded');
        
        // Test 3: Try to initialize Keycloak
        addLog('Test 3: Initializing Keycloak...');
        const keycloak = new Keycloak({
          url: 'http://localhost:8090',
          realm: 'buildms',
          clientId: 'buildms-frontend',
        });

        addLog('Keycloak instance created, calling init...');
        
        keycloak.init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
          pkceMethod: 'S256',
        })
        .then((authenticated) => {
          addLog(`✅ Keycloak initialized successfully`);
          addLog(`Authenticated: ${authenticated}`);
          if (authenticated) {
            addLog(`Token: ${keycloak.token?.substring(0, 50)}...`);
            addLog(`User: ${JSON.stringify(keycloak.tokenParsed)}`);
          }
          setKeycloakStatus('✅ Working');
        })
        .catch((error) => {
          addLog(`❌ Keycloak initialization failed: ${error.message}`);
          addLog(`Error details: ${JSON.stringify(error)}`);
          setKeycloakStatus('❌ Failed');
        });
      } catch (error: any) {
        addLog(`❌ Error loading Keycloak JS: ${error.message}`);
        setKeycloakStatus('❌ Failed');
      }

      // Test 4: Check window.keycloak
      addLog('Test 4: Checking global Keycloak instance...');
      setTimeout(() => {
        if ((window as any).keycloak) {
          addLog('✅ Global Keycloak instance found');
          addLog(`Authenticated: ${(window as any).keycloak.authenticated}`);
        } else {
          addLog('❌ No global Keycloak instance found');
        }
      }, 2000);
    };

    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔍 Keycloak Debug Page
          </h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Status</h2>
            <div className="text-2xl font-bold">{keycloakStatus}</div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Diagnostic Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
              {logs.length === 0 && <div>Running diagnostics...</div>}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Console tab</li>
              <li>Look for any red error messages</li>
              <li>Share the logs above and any console errors</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
