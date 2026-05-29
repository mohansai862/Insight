/**
 * Tech Tammina CRM - Lead Sources Management
 * Admin CRUD for lead sources used in Leads module
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Edit3, Trash2, Plus, ArrowUpDown } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/lib/store';
import { addSource, updateSource, deleteSource } from '@/lib/slices/leadSourcesSlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';

const formSchema = z.object({
  name: z.string().min(1, 'Source name is required'),
});

type FormValues = z.infer<typeof formSchema>;

const LeadSourcesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const sources = useAppSelector((s) => s.leadSources.items);

  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const perPage = 10;
  const [sortAsc, setSortAsc] = React.useState(true);

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors, isSubmitting: isEditSubmitting }, setError: setEditError } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? sources.filter((s) => s.name.toLowerCase().includes(q)) : sources;
    const sorted = [...list].sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    return sorted;
  }, [sources, search, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = React.useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage]);

  const onAdd = (values: FormValues) => {
    const exists = sources.some((s) => s.name.toLowerCase() === values.name.trim().toLowerCase());
    if (exists) {
      setError('name', { type: 'validate', message: 'Source name must be unique' });
      return;
    }
    dispatch(addSource(values.name.trim()));
    setIsAddOpen(false);
    reset({ name: '' });
  };

  const onEdit = (values: FormValues) => {
    if (!editingId) return;
    const exists = sources.some((s) => s.name.toLowerCase() === values.name.trim().toLowerCase() && s.id !== editingId);
    if (exists) {
      setEditError('name', { type: 'validate', message: 'Source name must be unique' });
      return;
    }
    dispatch(updateSource({ id: editingId, name: values.name.trim() }));
    setIsEditOpen(false);
    setEditingId(null);
  };

  const onDelete = (id: string) => {
    const ok = window.confirm('Are you sure you want to delete this source?');
    if (ok) dispatch(deleteSource(id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Sources</h1>
          <p className="text-gray-600 mt-1">Delivering Excellence — Administer sources used in Leads</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { reset({ name: '' }); setIsAddOpen(true); }}>
          Add Source
        </Button>
      </div>

      <Card className="bg-white/70 backdrop-blur-glass shadow-glass">
        <CardHeader>
          <CardTitle>All Sources ({sources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex-1 max-w-sm">
              <Input placeholder="Search sources" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Button variant="ghost" onClick={() => setSortAsc((v) => !v)} leftIcon={<ArrowUpDown className="w-4 h-4" />}>Sort</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Source ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Source Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">No sources</td>
                  </tr>
                ) : (
                  paged.map((s) => (
                    <motion.tr key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="border-b border-gray-100">
                      <td className="py-3 px-4">{s.id}</td>
                      <td className="py-3 px-4">{s.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit3 className="w-4 h-4" />}
                            onClick={() => { setEditingId(s.id); resetEdit({ name: s.name }); setIsEditOpen(true); }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => onDelete(s.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} leftIcon={<ChevronLeft className="w-4 h-4" />}>Prev</Button>
              <Button variant="ghost" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} rightIcon={<ChevronRight className="w-4 h-4" />}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Source">
        <ModalContent>
          <form onSubmit={handleSubmit(onAdd)}>
            <Input label="Source Name *" placeholder="e.g., Website" {...register('name')} error={errors.name?.message} />
            <ModalFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>Save</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Source">
        <ModalContent>
          <form onSubmit={handleEditSubmit(onEdit)}>
            <Input label="Source Name *" placeholder="e.g., Website" {...registerEdit('name')} error={editErrors.name?.message} />
            <ModalFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={isEditSubmitting}>Save Changes</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default LeadSourcesPage;
