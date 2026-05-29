import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const BackendDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Backend Service Availability
    try {
      const response = await fetch('http://30.0.1.159:8081/api/leads', {
        method: 'GET',
        headers: {
          'X-User-Id': '1',
          'X-User-Role': 'Sales_Manager'
        }
      });
      
      if (response.ok) {
        results.push({
          name: 'Backend Service',
          status: 'success',
          message: 'Backend service is running and accessible',
          details: `Status: ${response.status}`
        });
      } else {
        results.push({
          name: 'Backend Service',
          status: 'error',
          message: 'Backend service returned an error',
          details: `Status: ${response.status}`
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Backend Service',
        status: 'error',
        message: 'Cannot connect to backend service',
        details: error.message
      });
    }

    // Test 2: Session Data
    const session = localStorage.getItem('tech_tammina_session');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        results.push({
          name: 'Session Data',
          status: 'success',
          message: 'Session data is valid',
          details: `User ID: ${sessionData.id || sessionData.userId}, Role: ${sessionData.role}`
        });
      } catch (error) {
        results.push({
          name: 'Session Data',
          status: 'warning',
          message: 'Session data exists but is invalid JSON',
          details: 'Session data cannot be parsed'
        });
      }
    } else {
      results.push({
        name: 'Session Data',
        status: 'warning',
        message: 'No session data found',
        details: 'Using default user ID and role'
      });
    }

    // Test 3: Lead Conversion Endpoint
    try {
      const response = await fetch('http://30.0.1.159:8081/api/leads/999/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '1',
          'X-User-Role': 'Sales_Manager'
        },
        body: JSON.stringify({
          companyName: 'Test Company',
          contactName: 'Test Contact',
          contactEmail: 'test@example.com'
        })
      });
      
      // We expect 404 for non-existent lead, but endpoint should be accessible
      if (response.status === 404) {
        results.push({
          name: 'Conversion Endpoint',
          status: 'success',
          message: 'Conversion endpoint is accessible',
          details: 'Endpoint responds correctly (404 for non-existent lead)'
        });
      } else if (response.status === 500) {
        results.push({
          name: 'Conversion Endpoint',
          status: 'error',
          message: 'Conversion endpoint has internal server error',
          details: 'Backend service may have configuration issues'
        });
      } else {
        results.push({
          name: 'Conversion Endpoint',
          status: 'warning',
          message: 'Conversion endpoint responded unexpectedly',
          details: `Status: ${response.status}`
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Conversion Endpoint',
        status: 'error',
        message: 'Cannot reach conversion endpoint',
        details: error.message
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>Backend Diagnostics</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRunning ? 'Running...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{diagnostic.name}</h4>
                  {getStatusBadge(diagnostic.status)}
                </div>
                <p className="text-sm text-gray-600 mt-1">{diagnostic.message}</p>
                {diagnostic.details && (
                  <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-1 rounded">
                    {diagnostic.details}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {diagnostics.length === 0 && !isRunning && (
            <div className="text-center text-gray-500 py-4">
              No diagnostics run yet. Click Refresh to start.
            </div>
          )}
          
          {isRunning && (
            <div className="text-center text-gray-500 py-4">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Running diagnostics...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BackendDiagnostics;