import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Network,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Send,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { aiGovernanceApi } from '../../api/ai';
import { MappingSuggestionResponse, FieldDefinitionInput } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner, TableSkeleton } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate, formatDepartmentName } from '../../utils/formatters';

export const AiMappingReviewPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('SUGGESTED');

  // Approve / Reject Modals
  const [selectedSuggestion, setSelectedSuggestion] = useState<MappingSuggestionResponse | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [actionComment, setActionComment] = useState('');

  // Analyze Schema Modal
  const [analyzeModalOpen, setAnalyzeModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('Tribal Development');
  const [newSchemaVersion, setNewSchemaVersion] = useState('1.0');
  const [fieldsJson, setFieldsJson] = useState(
    JSON.stringify(
      [
        {
          name: 'familyAnnualGrossEarnings',
          type: 'number',
          description: 'Gross household income in INR',
        },
        {
          name: 'tribalClusterRegistrationNumber',
          type: 'string',
          description: 'Unique tribal community registration certificate number',
        },
      ],
      null,
      2
    )
  );

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Fetch Mapping Suggestions
  const {
    data: suggestions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['aiSuggestions', filterDepartment, filterStatus],
    queryFn: () =>
      aiGovernanceApi.listSuggestions(
        filterDepartment || undefined,
        filterStatus || undefined
      ),
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (sugId: string) =>
      aiGovernanceApi.approveMapping(sugId, { comments: actionComment }),
    onSuccess: (data) => {
      setSelectedSuggestion(null);
      setActionType(null);
      setActionComment('');
      setActionSuccessMessage(`Mapping approved: ${data.canonical_field}`);
      queryClient.invalidateQueries({ queryKey: ['aiSuggestions'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Approval failed.';
      setActionErrorMessage(msg);
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (sugId: string) =>
      aiGovernanceApi.rejectMapping(sugId, { reason: actionComment || 'Rejected by data steward' }),
    onSuccess: (data) => {
      setSelectedSuggestion(null);
      setActionType(null);
      setActionComment('');
      setActionSuccessMessage(`Mapping rejected: ${data.id}`);
      queryClient.invalidateQueries({ queryKey: ['aiSuggestions'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Rejection failed.';
      setActionErrorMessage(msg);
    },
  });

  // Schema Analysis Mutation
  const analyzeMutation = useMutation({
    mutationFn: (payload: { department: string; schema_version: string; fields: FieldDefinitionInput[] }) =>
      aiGovernanceApi.analyzeSchema(payload),
    onSuccess: (data) => {
      setAnalyzeModalOpen(false);
      setActionSuccessMessage(
        `AI Schema Analysis complete. Generated ${data.suggestions_count} candidate mappings.`
      );
      setFilterStatus('SUGGESTED');
      queryClient.invalidateQueries({ queryKey: ['aiSuggestions'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Schema analysis failed.';
      setActionErrorMessage(msg);
    },
  });

  const handleStartAnalysis = () => {
    try {
      const parsedFields = JSON.parse(fieldsJson);
      analyzeMutation.mutate({
        department: newDeptName,
        schema_version: newSchemaVersion,
        fields: parsedFields,
      });
    } catch {
      setActionErrorMessage('Fields input must be valid JSON array of field definitions.');
    }
  };

  const getConfidenceBadge = (cat: string, score: number) => {
    const pct = Math.round(score * 100);
    switch (cat?.toUpperCase()) {
      case 'HIGH':
        return <Badge variant="success" size="sm">High ({pct}%)</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm">Medium ({pct}%)</Badge>;
      default:
        return <Badge variant="danger" size="sm">Low ({pct}%)</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">AI Schema Onboarding & Mapping Governance</h1>
            <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2 py-0.5 rounded">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Review and governance interface for AI-generated field mappings between external department schemas and the canonical data model.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAnalyzeModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Analyze New Schema
          </Button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{actionSuccessMessage}</div>
        </div>
      )}

      {actionErrorMessage && (
        <ErrorBanner
          title="Action Error"
          message={actionErrorMessage}
          onRetry={() => setActionErrorMessage(null)}
        />
      )}

      {/* Governance Banner */}
      <div className="p-4 rounded-lg bg-slate-900 text-slate-200 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white block text-sm">
            Deterministic Runtime Safety Policy
          </span>
          AI is used strictly during administrative onboarding to generate candidate field suggestions. AI is NEVER in the runtime data transformation path. Every mapping requires explicit human approval before persisting to the canonical schema registry.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase">Status:</span>
          {['SUGGESTED', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st === 'ALL' ? '' : st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                (st === 'ALL' && !filterStatus) || filterStatus === st
                  ? 'bg-gov-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Suggestions
          </Button>
        </div>
      </div>

      {/* Main Suggestions Table */}
      <Card
        title="Candidate Schema Field Mappings"
        subtitle="Review AI reasoning, candidate matches, and execute Steward approval"
      >
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <ErrorBanner
            title="Failed to load AI suggestions"
            message={error instanceof Error ? error.message : 'Please check API connectivity.'}
            onRetry={() => refetch()}
          />
        ) : !suggestions || suggestions.length === 0 ? (
          <EmptyState
            title="No mapping suggestions pending review"
            description="All candidate schema mappings have been reviewed or no incoming schema is currently queued for onboarding."
            icon={<Sparkles className="w-7 h-7 text-slate-400" />}
            actionLabel="Analyze new schema"
            onAction={() => setAnalyzeModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-4">Incoming Field</th>
                  <th className="py-3 px-4">Canonical Target</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">AI Reasoning</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Human Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {suggestions.map((sug) => (
                  <tr key={sug.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {formatDepartmentName(sug.department)}
                      <span className="block text-xs font-mono font-normal text-slate-400">
                        v{sug.schema_version}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-slate-900">{sug.source_field}</span>
                      <span className="block text-xs font-mono text-slate-500">type: {sug.source_type}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-gov-primary">{sug.canonical_field}</span>
                      <span className="block text-xs font-mono text-slate-500">type: {sug.canonical_type}</span>
                    </td>
                    <td className="py-4 px-4">
                      {getConfidenceBadge(sug.confidence_category, sug.confidence_score)}
                    </td>
                    <td className="py-4 px-4 max-w-xs text-xs text-slate-600">
                      {sug.reason}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          sug.status === 'APPROVED'
                            ? 'success'
                            : sug.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {sug.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {sug.status === 'SUGGESTED' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              setSelectedSuggestion(sug);
                              setActionType('APPROVE');
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedSuggestion(sug);
                              setActionType('REJECT');
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Reviewed: {formatDate(sug.reviewed_at || sug.updated_at)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Action Modal */}
      {selectedSuggestion && actionType && (
        <Modal
          isOpen={Boolean(selectedSuggestion)}
          onClose={() => {
            setSelectedSuggestion(null);
            setActionType(null);
          }}
          title={
            actionType === 'APPROVE'
              ? 'Approve Schema Mapping'
              : 'Reject Candidate Mapping'
          }
          subtitle={`Source: ${selectedSuggestion.source_field} ➔ Target: ${selectedSuggestion.canonical_field}`}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedSuggestion(null);
                  setActionType(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'APPROVE' ? 'success' : 'danger'}
                onClick={() => {
                  if (actionType === 'APPROVE') {
                    approveMutation.mutate(selectedSuggestion.id);
                  } else {
                    rejectMutation.mutate(selectedSuggestion.id);
                  }
                }}
                isLoading={approveMutation.isPending || rejectMutation.isPending}
              >
                Confirm {actionType === 'APPROVE' ? 'Approval' : 'Rejection'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
              <div><strong>Department:</strong> {selectedSuggestion.department}</div>
              <div><strong>Source Field:</strong> {selectedSuggestion.source_field} ({selectedSuggestion.source_type})</div>
              <div><strong>Canonical Target:</strong> {selectedSuggestion.canonical_field} ({selectedSuggestion.canonical_type})</div>
              <div><strong>AI Confidence:</strong> {Math.round(selectedSuggestion.confidence_score * 100)}%</div>
            </div>

            <p className="text-xs text-slate-600">
              <strong>AI Justification:</strong> {selectedSuggestion.reason}
            </p>

            <div>
              <label htmlFor="action-notes" className="block text-sm font-medium text-slate-700 mb-1">
                Data Steward Notes (Optional)
              </label>
              <textarea
                id="action-notes"
                rows={2}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder="Add audit notes regarding this schema approval..."
                className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Analyze New Schema Modal */}
      <Modal
        isOpen={analyzeModalOpen}
        onClose={() => setAnalyzeModalOpen(false)}
        title="AI-Assisted Schema Onboarding"
        subtitle="Submit a new government department schema payload for semantic analysis"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAnalyzeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStartAnalysis}
              isLoading={analyzeMutation.isPending}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Run AI Analysis
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dept-name" className="block text-sm font-medium text-slate-700 mb-1">
                Department Name
              </label>
              <input
                id="dept-name"
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary"
                placeholder="e.g. Higher Education"
              />
            </div>
            <div>
              <label htmlFor="schema-version" className="block text-sm font-medium text-slate-700 mb-1">
                Schema Version
              </label>
              <input
                id="schema-version"
                type="text"
                value={newSchemaVersion}
                onChange={(e) => setNewSchemaVersion(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary"
                placeholder="1.0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fields-json" className="block text-sm font-medium text-slate-700 mb-1">
              Field Definitions JSON Array
            </label>
            <textarea
              id="fields-json"
              rows={8}
              value={fieldsJson}
              onChange={(e) => setFieldsJson(e.target.value)}
              className="w-full font-mono text-xs rounded-md border border-slate-300 p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-gov-primary"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
