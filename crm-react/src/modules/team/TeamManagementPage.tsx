import { logger } from '@/utils/logger';
import React, { useState, useEffect, useRef } from 'react';
import { Search, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronRight, Crown, Shield, Users, User as UserIcon, Circle } from 'lucide-react';

interface OrgNode {
  userId: number;
  name: string;
  role: string;
  email: string;
  isActive: boolean;
  children: OrgNode[];
  expanded?: boolean;
}

const getRoleIcon = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'ceo': return <Crown className="w-4 h-4 text-yellow-600" />;
    case 'sales_vp': return <Shield className="w-4 h-4 text-blue-600" />;
    case 'sales_manager': return <Users className="w-4 h-4 text-green-600" />;
    case 'sales_executive': return <UserIcon className="w-4 h-4 text-orange-600" />;
    case 'it_admin': return <Shield className="w-4 h-4 text-purple-600" />;
    default: return <UserIcon className="w-4 h-4 text-gray-600" />;
  }
};

const getRoleColor = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'ceo': return 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-300 dark:border-yellow-600';
    case 'sales_vp': return 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-600';
    case 'sales_manager': return 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-600';
    case 'sales_executive': return 'bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border-orange-300 dark:border-orange-600';
    case 'it_admin': return 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 border-purple-300 dark:border-purple-600';
    default: return 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30 border-gray-300 dark:border-gray-600';
  }
};

const NodeCard = ({ 
  node, 
  onToggle, 
  level = 0 
}: { 
  node: OrgNode & { expanded: boolean }; 
  onToggle: (userId: number) => void;
  level?: number;
}) => {
  const hasChildren = node.children.length > 0;
  const roleDisplay = node.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  
  // Calculate dimensions
  const nodeWidth = 200;
  const nodeSpacing = 40;
  const verticalSpacing = 60;
  
  // Calculate total width needed for children
  const calculateSubtreeWidth = (children: OrgNode[]): number => {
    if (children.length === 0) return nodeWidth;
    if (children.length === 1) return Math.max(nodeWidth, calculateSubtreeWidth(children[0].children));
    
    let totalWidth = 0;
    children.forEach((child, index) => {
      totalWidth += calculateSubtreeWidth(child.children);
      if (index < children.length - 1) totalWidth += nodeSpacing;
    });
    
    return Math.max(nodeWidth, totalWidth);
  };
  
  const subtreeWidth = hasChildren && node.expanded ? calculateSubtreeWidth(node.children) : nodeWidth;

  return (
    <div className="flex flex-col items-center" style={{ width: `${subtreeWidth}px` }}>
      {/* Node */}
      <div 
        className={`relative ${getRoleColor(node.role)} border-2 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer`}
        style={{ width: `${nodeWidth}px` }}
        onClick={() => hasChildren && onToggle(node.userId)}
      >
        {/* Status Indicator */}
        <div className="absolute top-2 right-2">
          <Circle className={`w-2 h-2 ${node.isActive ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'}`} />
        </div>

        {/* Content */}
        <div className="flex items-start gap-2">
          {getRoleIcon(node.role)}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate max-w-[150px]" title={node.name}>{node.name}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{roleDisplay}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={node.email}>{node.email}</p>
          </div>
        </div>

        {/* Expand/Collapse */}
        {hasChildren && (
          <div className="absolute bottom-1 right-1">
            {node.expanded ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && node.expanded && (
        <div className="relative flex flex-col items-center" style={{ marginTop: `${verticalSpacing}px` }}>
          {/* Vertical connector from parent */}
          <div 
            className="absolute bg-gray-600"
            style={{
              width: '2px',
              height: `${verticalSpacing / 2}px`,
              top: `-${verticalSpacing}px`,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          ></div>
          
          {/* Horizontal connector for multiple children */}
          {node.children.length > 1 && (
            <div 
              className="absolute bg-gray-600"
              style={{
                height: '2px',
                width: `${subtreeWidth - nodeWidth}px`,
                top: `-${verticalSpacing / 2}px`,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            ></div>
          )}

          {/* Children container */}
          <div className="flex justify-between" style={{ width: '100%', gap: `${nodeSpacing}px` }}>
            {node.children.map((child, index) => {
              const childSubtreeWidth = calculateSubtreeWidth(child.children);
              
              return (
                <div key={child.userId} className="relative flex flex-col items-center" style={{ width: `${childSubtreeWidth}px` }}>
                  {/* Vertical connector to child */}
                  {node.children.length > 1 && (
                    <div 
                      className="absolute bg-gray-600"
                      style={{
                        width: '2px',
                        height: `${verticalSpacing / 2}px`,
                        top: `-${verticalSpacing / 2}px`,
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  )}
                  
                  <NodeCard 
                    node={{ ...child, expanded: child.expanded ?? true }} 
                    onToggle={onToggle} 
                    level={level + 1} 
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const TeamManagementPage = () => {
  const [orgData, setOrgData] = useState<OrgNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrgData, setFilteredOrgData] = useState<OrgNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      const { authApi } = await import('@/api/authApi');
      const response = await fetch('/api/users/organization-tree', {
        headers: authApi.getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const expandedData = addExpandedState(data);
        setOrgData(expandedData);
        setFilteredOrgData(expandedData);
      }
    } catch (error) {
      logger.error('Failed to load organization tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpandedState = (node: OrgNode): OrgNode & { expanded: boolean } => ({
    ...node,
    expanded: true,
    children: node.children.map(child => addExpandedState(child))
  });

  const filterOrgData = (node: OrgNode & { expanded: boolean }, query: string): OrgNode & { expanded: boolean } | null => {
    const searchTerm = query.toLowerCase();
    const nodeMatches = node.name.toLowerCase().includes(searchTerm) ||
                       node.role.toLowerCase().includes(searchTerm) ||
                       node.email.toLowerCase().includes(searchTerm);
    
    const filteredChildren = node.children
      .map(child => filterOrgData(child as OrgNode & { expanded: boolean }, query))
      .filter(child => child !== null) as (OrgNode & { expanded: boolean })[];
    
    if (nodeMatches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
        expanded: query ? true : node.expanded // Auto-expand when searching
      };
    }
    
    return null;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!orgData) return;
    
    if (query.trim() === '') {
      setFilteredOrgData(orgData);
    } else {
      const filtered = filterOrgData(orgData as OrgNode & { expanded: boolean }, query);
      setFilteredOrgData(filtered);
    }
  };

  const handleToggle = (userId: number) => {
    const toggleNode = (node: OrgNode & { expanded: boolean }): OrgNode & { expanded: boolean } => {
      if (node.userId === userId) {
        return { ...node, expanded: !node.expanded };
      }
      return {
        ...node,
        children: node.children.map(child => toggleNode(child as OrgNode & { expanded: boolean }))
      };
    };

    if (orgData) {
      const updatedOrgData = toggleNode(orgData as OrgNode & { expanded: boolean });
      setOrgData(updatedOrgData);
      // Re-apply search filter if active
      if (searchQuery.trim()) {
        const filtered = filterOrgData(updatedOrgData, searchQuery);
        setFilteredOrgData(filtered);
      } else {
        setFilteredOrgData(updatedOrgData);
      }
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading organization chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organization Chart</h1>
            <p className="text-gray-600 dark:text-gray-300">Tech Tammina CRM Team Structure</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search employees"
                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-2 text-gray-700 dark:text-gray-300">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Chart */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="w-full h-full flex justify-center items-start pt-8 pb-8"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center top',
            minHeight: '100%'
          }}
        >
          {filteredOrgData ? (
            <NodeCard 
              node={filteredOrgData as OrgNode & { expanded: boolean }} 
              onToggle={handleToggle} 
            />
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No organization data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center gap-8 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              <span>CEO</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Sales VP</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>IT Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span>Sales Manager</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-orange-600" />
              <span>Sales Executive</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-green-500 fill-green-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-red-500 fill-red-500" />
              <span>Inactive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;
