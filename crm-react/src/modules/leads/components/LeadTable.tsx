import { motion } from 'framer-motion';
import { Eye, MoreVertical } from 'lucide-react';
import React from 'react';

import { getCurrentRole } from '@/utils/rbac';

import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { LeadRow } from '../LeadsManagement';

interface LeadTableProps {
  leads: LeadRow[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLeadClick: (lead: LeadRow) => void;
  onEditLead: (lead: LeadRow) => void;
  onDeleteLead: (lead: LeadRow) => void;
}

interface MenuProps {
  lead: LeadRow;
  onActions: () => void;
  onDelete: () => void;
}

const Menu: React.FC<MenuProps> = ({ lead, onActions, onDelete }) => {
  const [open, setOpen] = React.useState(false);
  const role = getCurrentRole();

  // For Sales Manager and Sales VP, show only eye icon
  if (role === 'Sales_Manager' || role === 'Sales_VP') {
    return (
      <Button
        variant="ghost"
        size="sm"
        aria-label="View lead"
        className="p-2 rounded-full w-9 h-9"
        onClick={(e) => {
          e.stopPropagation();
          onActions();
        }}
      >
        <Eye className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-label="More actions"
        className="p-2 rounded-full w-9 h-9"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-20">
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={() => {
              onActions();
              setOpen(false);
            }}
          >
            <span className="w-4 h-4 text-gray-600">👁</span> Actions
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            <span className="w-4 h-4">🗑</span> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onLeadClick,
  onEditLead,
  onDeleteLead,
}) => {
  return (
    <Card className="bg-white/70 backdrop-blur-glass shadow-glass">
      <CardHeader>
        <CardTitle>All Leads ({leads.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Lead Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Lead Source</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Company Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Designation</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Created By</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-gray-500">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => onLeadClick(lead)}
                    >
                      <td className="py-3 px-4">
                        {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {(() => {
                          const status = (lead.status || 'new').toLowerCase().trim();
                          
                          if (status === 'new') {
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '500',
                                borderRadius: '9999px',
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                border: '1px solid #93c5fd'
                              }}>
                                New
                              </span>
                            );
                          }
                          
                          if (status === 'contacted') {
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '500',
                                borderRadius: '9999px',
                                backgroundColor: '#fed7aa',
                                color: '#ea580c',
                                border: '1px solid #fdba74'
                              }}>
                                Contacted
                              </span>
                            );
                          }
                          
                          if (status === 'qualified') {
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '500',
                                borderRadius: '9999px',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                border: '1px solid #86efac'
                              }}>
                                Qualified
                              </span>
                            );
                          }
                          
                          if (status === 'unqualified') {
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '500',
                                borderRadius: '9999px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5'
                              }}>
                                Unqualified
                              </span>
                            );
                          }
                          
                          if (status === 'converted') {
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '500',
                                borderRadius: '9999px',
                                backgroundColor: '#f3e8ff',
                                color: '#7c3aed',
                                border: '1px solid #c4b5fd'
                              }}>
                                Converted
                              </span>
                            );
                          }
                          
                          return (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: '500',
                              borderRadius: '9999px',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              border: '1px solid #d1d5db'
                            }}>
                              {lead.status || 'New'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {lead.source ? lead.source.replace('_', ' ') : '—'}
                      </td>
                      <td className="py-3 px-4">{lead.companyName}</td>
                      <td className="py-3 px-4">{lead.designation}</td>
                      <td className="py-3 px-4">{lead.email}</td>
                      <td className="py-3 px-4">{lead.createdBy || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="text-orange-600 font-medium">
                          {lead.assignedToName || lead.assignedTo?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative inline-block text-left">
                          <Menu
                            lead={lead}
                            onActions={() => onLeadClick(lead)}
                            onDelete={() => onDeleteLead(lead)}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
