"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_ROUTING_POLICIES_PAGE } from "@/lib/queries";
import {
  CREATE_ROUTING_POLICY,
  UPDATE_ROUTING_POLICY,
  DELETE_ROUTING_POLICY,
} from "@/lib/mutations";
import type { RoutingPolicy, Operation, Runtime } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Route,
  Plus,
  Edit2,
  Trash2,
  Server,
  Zap,
  Layers,
  Cpu,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import Link from "next/link";

interface RoutingPoliciesPageData {
  routingPolicies: RoutingPolicy[];
  operations: Operation[];
}

export default function RoutingPoliciesPage() {
  const [policies, setPolicies] = useState<RoutingPolicy[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [runtimeFilter, setRuntimeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createOpId, setCreateOpId] = useState("");
  const [createRuntime, setCreateRuntime] = useState<Runtime>("DOCKER");
  const [createCpuThreshold, setCreateCpuThreshold] = useState(80);
  const [createReqThreshold, setCreateReqThreshold] = useState(1000);
  const [createEnabled, setCreateEnabled] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingPolicy, setEditingPolicy] = useState<RoutingPolicy | null>(null);
  const [editOpId, setEditOpId] = useState("");
  const [editRuntime, setEditRuntime] = useState<Runtime>("DOCKER");
  const [editCpuThreshold, setEditCpuThreshold] = useState(80);
  const [editReqThreshold, setEditReqThreshold] = useState(1000);
  const [editEnabled, setEditEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingPolicy, setDeletingPolicy] = useState<RoutingPolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<RoutingPoliciesPageData>(GET_ROUTING_POLICIES_PAGE);
      setPolicies(data.routingPolicies || []);
      setOperations(data.operations || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routing policies");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Lookup maps
  const opMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const op of operations) {
      map.set(op.id, op.name);
    }
    return map;
  }, [operations]);

  // Operations that don't have policies yet
  const availableOpsForCreation = useMemo(() => {
    const existingOpIds = new Set(policies.map((p) => p.operationId));
    return operations.filter((op) => !existingOpIds.has(op.id));
  }, [operations, policies]);

  // Filtered policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((pol) => {
      if (runtimeFilter !== "ALL" && pol.preferredRuntime !== runtimeFilter) return false;
      if (statusFilter === "ACTIVE" && !pol.enabled) return false;
      if (statusFilter === "DISABLED" && pol.enabled) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const opName = (opMap.get(pol.operationId) || "").toLowerCase();
      return (
        opName.includes(q) ||
        pol.preferredRuntime.toLowerCase().includes(q) ||
        pol.id.toLowerCase().includes(q)
      );
    });
  }, [policies, runtimeFilter, statusFilter, searchQuery, opMap]);

  // Open Create
  const openCreateModal = () => {
    if (operations.length > 0) {
      const defaultOp = availableOpsForCreation[0] || operations[0];
      setCreateOpId(defaultOp?.id || "");
    }
    setCreateRuntime("DOCKER");
    setCreateCpuThreshold(80);
    setCreateReqThreshold(1000);
    setCreateEnabled(true);
    setIsCreateOpen(true);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOpId) return;

    setIsCreating(true);
    try {
      await graphqlRequest(CREATE_ROUTING_POLICY, {
        input: {
          operationId: createOpId,
          preferredRuntime: createRuntime,
          cpuThreshold: Number(createCpuThreshold),
          requestThreshold: Number(createReqThreshold),
          enabled: createEnabled,
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Routing policy configured successfully!`,
      });

      setIsCreateOpen(false);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create routing policy",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Open Edit
  const openEditModal = (pol: RoutingPolicy) => {
    setEditingPolicy(pol);
    setEditOpId(pol.operationId);
    setEditRuntime(pol.preferredRuntime);
    setEditCpuThreshold(pol.cpuThreshold);
    setEditReqThreshold(pol.requestThreshold);
    setEditEnabled(pol.enabled);
  };

  // Submit Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy || !editOpId) return;

    setIsUpdating(true);
    try {
      await graphqlRequest(UPDATE_ROUTING_POLICY, {
        id: editingPolicy.id,
        input: {
          operationId: editOpId,
          preferredRuntime: editRuntime,
          cpuThreshold: Number(editCpuThreshold),
          requestThreshold: Number(editReqThreshold),
          enabled: editEnabled,
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Routing policy updated successfully!`,
      });

      setEditingPolicy(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update routing policy",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!deletingPolicy) return;

    setIsDeleting(true);
    try {
      await graphqlRequest(DELETE_ROUTING_POLICY, {
        id: deletingPolicy.id,
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Routing policy deleted successfully!`,
      });

      setDeletingPolicy(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete routing policy",
      });
      setDeletingPolicy(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Routing Policies"
        subtitle="Manage dynamic execution runtime thresholds and failover rules"
        onRefresh={() => fetchData(false)}
        isLoading={isRefreshing || isLoading}
        lastUpdated={lastUpdated}
      />

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {error ? (
          <ErrorState
            message={error}
            onRetry={() => fetchData(true)}
            isRetrying={isLoading}
          />
        ) : (
          <>
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search policies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Runtime Filter */}
                <select
                  value={runtimeFilter}
                  onChange={(e) => setRuntimeFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Preferred Runtimes</option>
                  <option value="DOCKER">Docker</option>
                  <option value="SERVERLESS">Serverless</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Policies</option>
                  <option value="DISABLED">Disabled Policies</option>
                </select>
              </div>

              {/* Create Policy Button */}
              <button
                onClick={openCreateModal}
                disabled={operations.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
                title={
                  operations.length === 0
                    ? "Please register an operation first"
                    : "Configure Routing Policy"
                }
              >
                <Plus className="w-4 h-4" />
                <span>Configure Policy</span>
              </button>
            </div>

            {/* Operations Warning if None Exist */}
            {operations.length === 0 && !isLoading && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center justify-between">
                <span>
                  No operations found. You must register GraphQL operations before defining routing policies.
                </span>
                <Link
                  href="/operations"
                  className="font-bold underline text-amber-200 hover:text-white"
                >
                  Register Operation →
                </Link>
              </div>
            )}

            {/* Policies Table */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Route className="w-4 h-4 text-cyan-400" />
                    <span>Configured Policies ({policies.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Active routing policies evaluated in real-time by the Decision Engine
                  </p>
                </div>
              </div>

              {isLoading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : filteredPolicies.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-3">
                  <p className="text-slate-300 font-medium">No routing policies configured</p>
                  <p className="text-slate-400">
                    Configure a policy to enable automated runtime failover when CPU exceeds thresholds.
                  </p>
                  {operations.length > 0 && (
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Configure Policy</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold">Target Operation</th>
                        <th className="px-6 py-3.5 font-semibold">Preferred Runtime</th>
                        <th className="px-6 py-3.5 font-semibold">CPU Threshold</th>
                        <th className="px-6 py-3.5 font-semibold">Request Limit</th>
                        <th className="px-6 py-3.5 font-semibold">Status</th>
                        <th className="px-6 py-3.5 font-semibold">Created At</th>
                        <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPolicies.map((pol) => {
                        const opName = opMap.get(pol.operationId) || "Unknown Operation";

                        return (
                          <tr
                            key={pol.id}
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            {/* Operation */}
                            <td className="px-6 py-4">
                              <div className="font-sans font-bold text-slate-100 text-sm">
                                {opName}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: {pol.operationId.slice(0, 8)}
                              </div>
                            </td>

                            {/* Preferred Runtime */}
                            <td className="px-6 py-4">
                              {pol.preferredRuntime === "DOCKER" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 font-mono text-xs">
                                  <Server className="w-3.5 h-3.5" />
                                  Docker
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/50 text-amber-400 font-mono text-xs">
                                  <Zap className="w-3.5 h-3.5" />
                                  Serverless
                                </span>
                              )}
                            </td>

                            {/* CPU Threshold */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-slate-200">
                                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                                <strong className="text-cyan-400 text-sm font-bold">{pol.cpuThreshold}%</strong>
                              </div>
                            </td>

                            {/* Request Threshold */}
                            <td className="px-6 py-4 text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-slate-400" />
                                <span>{pol.requestThreshold} req/min</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              {pol.enabled ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                  <XCircle className="w-3 h-3" />
                                  Disabled
                                </span>
                              )}
                            </td>

                            {/* Created At */}
                            <td className="px-6 py-4 text-slate-400">
                              {formatDate(pol.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(pol)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                                  title="Edit routing policy"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingPolicy(pol)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                                  title="Delete routing policy"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Configure Routing Policy"
        subtitle="Set preferred runtime and CPU/Request thresholds for an operation"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Target Operation *
            </label>
            <select
              required
              value={createOpId}
              onChange={(e) => setCreateOpId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {operations.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Preferred Runtime *
            </label>
            <select
              value={createRuntime}
              onChange={(e) => setCreateRuntime(e.target.value as Runtime)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="DOCKER">DOCKER (Standard Compute Forwarding)</option>
              <option value="SERVERLESS">SERVERLESS (Auto-scaling Cloud Function / Lambda)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                CPU Threshold (%) *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={createCpuThreshold}
                onChange={(e) => setCreateCpuThreshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Failover occurs when host CPU exceeds this value
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                Request Threshold (req/min) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={createReqThreshold}
                onChange={(e) => setCreateReqThreshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={createEnabled}
                onChange={(e) => setCreateEnabled(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-slate-200">Enable this policy immediately</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? "Saving..." : "Create Policy"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editingPolicy !== null}
        onClose={() => setEditingPolicy(null)}
        title="Edit Routing Policy"
        subtitle={`Target Operation: ${opMap.get(editingPolicy?.operationId || "") || ""}`}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Target Operation *
            </label>
            <select
              required
              value={editOpId}
              onChange={(e) => setEditOpId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {operations.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Preferred Runtime *
            </label>
            <select
              value={editRuntime}
              onChange={(e) => setEditRuntime(e.target.value as Runtime)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="DOCKER">DOCKER (Standard Compute Forwarding)</option>
              <option value="SERVERLESS">SERVERLESS (Auto-scaling Cloud Function / Lambda)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                CPU Threshold (%) *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={editCpuThreshold}
                onChange={(e) => setEditCpuThreshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                Request Threshold (req/min) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={editReqThreshold}
                onChange={(e) => setEditReqThreshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={editEnabled}
                onChange={(e) => setEditEnabled(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-slate-200">Policy Enabled</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingPolicy(null)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deletingPolicy !== null}
        onClose={() => setDeletingPolicy(null)}
        onConfirm={handleDelete}
        title="Delete Routing Policy"
        resourceName={`Policy for ${opMap.get(deletingPolicy?.operationId || "") || "Operation"}`}
        resourceType="Routing Policy"
        isDeleting={isDeleting}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
