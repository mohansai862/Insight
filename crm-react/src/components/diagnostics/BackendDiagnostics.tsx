/**
 * Backend Diagnostics Component
 * Helps identify connectivity and service issues
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface DiagnosticResult {
  service: string;
  url: string;
  status: 'checking' | 'success' | 'error';
  message: string;
  details?: any;
}

const BackendDiagnostics: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const services = [
    { name: 'Backend Health (8081)', url: 'http://30.0.1.159:8081/api/health' },
    { name: 'Leads API (8081)', url: 'http://30.0.1.159:8081/api/leads' },
    { name: 'Auth API (8081)', url: 'http://30.0.1.159:8081/api/auth' },
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    for (const service of services) {
      const result: DiagnosticResult = {
        service: service.name,
        url: service.url,
        status: 'checking',
        message: 'Checking...',
      };
      
      diagnosticResults.push(result);
      setResults([...diagnosticResults]);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(service.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          result.status = 'success';
          result.message = `✅ Service available (${response.status})`;
          try {
            const data = await response.text();
            result.details = data;
          } catch (e) {
            result.details = 'Response received but could not parse body';
          }
        } else {
          result.status = 'error';
          result.message = `❌ Service error (${response.status})`;
          try {
            const errorText = await response.text();
            result.details = errorText;
          } catch (e) {
            result.details = 'Could not read error response';
          }
        }
      } catch (error: any) {
        result.status = 'error';
        if (error.name === 'AbortError') {
          result.message = '⏱️ Request timeout (5s)';
          result.details = 'Service did not respond within 5 seconds';
        } else if (error.message?.includes('Failed to fetch')) {
          result.message = '🔌 Connection refused';
          result.details = 'Service is not running or not accessible';
        } else {
          result.message = `❌ Error: ${error.message}`;
          result.details = error.toString();
        }
      }

      setResults([...diagnosticResults]);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>Backend Service Diagnostics</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          This tool helps identify connectivity issues with the backend services.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          variant="primary"
          leftIcon={isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Results:</h3>
            {results.map((result, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-3 border rounded-lg"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{result.service}</span>
                    <span className="text-sm text-gray-500">({result.url})</span>
                  </div>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        Show details
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {typeof result.details === 'string' 
                          ? result.details 
                          : JSON.stringify(result.details, null, 2)
                        }
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Troubleshooting Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• If all services show "Connection refused", the backend is not running</li>
              <li>• If 8080 fails but 8081 works, update frontend API URLs to use port 8081</li>
              <li>• If 8081 fails but 8080 works, update backend to use port 8080</li>
              <li>• Check the backend application.properties for the correct server.port setting</li>
              <li>• Ensure no firewall is blocking the ports</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackendDiagnostics;