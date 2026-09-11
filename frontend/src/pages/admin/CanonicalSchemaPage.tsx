import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, Database, RefreshCw, Tag, Code } from 'lucide-react';
import { aiGovernanceApi } from '../../api/ai';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';

export const CanonicalSchemaPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const {
    data: canonicalFields,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['canonicalSchema'],
    queryFn: () => aiGovernanceApi.getCanonicalSchema(),
  });

  const domains = ['ALL', ...Array.from(new Set((canonicalFields || []).map((f) => f.domain)))];

  const filteredFields = (canonicalFields || []).filter((f) => {
    const matchesDomain = selectedDomain === 'ALL' || f.domain === selectedDomain;
    const matchesSearch =
      !searchTerm ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.domain.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Canonical Schema Registry</h1>
            <Badge variant="info" size="sm">Single Source of Truth</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Deterministic centralized data definitions used to normalize disparate departmental models.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Registry
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search canonical fields or descriptions..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase shrink-0">Domain:</span>
          {domains.map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize shrink-0 ${
                selectedDomain === dom
                  ? 'bg-gov-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Canonical Fields Table */}
      <Card
        title="Registered Canonical Entities & Data Types"
        subtitle="Immutable target fields for cross-department data mapping (/api/ai/canonical-schema)"
      >
        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : isError ? (
          <ErrorBanner
            title="Failed to load canonical schema"
            message={error instanceof Error ? error.message : 'Please check connection.'}
            onRetry={() => refetch()}
          />
        ) : filteredFields.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-6">
            No canonical fields found matching your filter criteria.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Field Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-4">Sample / Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFields.map((field) => (
                  <tr key={field.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-gov-primary">
                      {field.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {field.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" size="sm">
                        {field.domain}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-slate-800">{field.description}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {field.example !== undefined && field.example !== null
                        ? String(field.example)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
