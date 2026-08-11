"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_OPERATIONS_PAGE } from "@/lib/queries";
import {
  CREATE_OPERATION,
  UPDATE_OPERATION,
  DELETE_OPERATION,
} from "@/lib/mutations";
import type {
  Operation,
  GraphQLService,
  RoutingPolicy,
  OperationType,
  EstimatedCost,
  Priority,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Server,
  Database,
  ShieldCheck,
  ShieldAlert,
  Search,
} from "lucide-react";
import Link from "next/link";

interface OperationsPageData {
  operations: Operation[];
  graphqlServices: GraphQLService[];
  routingPolicies: RoutingPolicy[];
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [services, setServices] = useState<GraphQLService[]>([]);
  const [policies, setPolicies] = useState<RoutingPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createServiceId, setCreateServiceId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<OperationType>("QUERY");
  const [createCost, setCreateCost] = useState<EstimatedCost>("LOW");
  const [createCacheable, setCreateCacheable] = useState(true);
  const [createRequiresDb, setCreateRequiresDb] = useState(true);
  const [createPriority, setCreatePriority] = useState<Priority>("MEDIUM");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [editServiceId, setEditServiceId] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<OperationType>("QUERY");
  const [editCost, setEditCost] = useState<EstimatedCost>("LOW");
  const [editCacheable, setEditCacheable] = useState(true);
  const [editRequiresDb, setEditRequiresDb] = useState(true);
  const [editPriority, setEditPriority] = useState<Priority>("MEDIUM");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingOp, setDeletingOp] = useState<Operation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<OperationsPageData>(GET_OPERATIONS_PAGE);
      setOperations(data.operations || []);
      setServices(data.graphqlServices || []);
      setPolicies(data.routingPolicies || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load operations");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Lookup maps
  const serviceMap = useMemo(() => {
    const map = new Map<string, GraphQLService>();
    for (const svc of services) {
      map.set(svc.id, svc);
    }
    return map;
  }, [services]);

  const policyMap = useMemo(() => {
    const map = new Map<string, RoutingPolicy>();
    for (const pol of policies) {
      map.set(pol.operationId, pol);
    }
    return map;
  }, [policies]);

  // Filtered operations
  const filteredOps = useMemo(() => {
    return operations.filter((op) => {
      if (serviceFilter !== "ALL" && op.graphQLServiceId !== serviceFilter) return false;
      if (typeFilter !== "ALL" && op.type !== typeFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const svcName = (serviceMap.get(op.graphQLServiceId)?.name || "").toLowerCase();
      return (
        op.name.toLowerCase().includes(q) ||
        svcName.includes(q) ||
        op.id.toLowerCase().includes(q)
      );
    });
  }, [operations, serviceFilter, typeFilter, searchQuery, serviceMap]);

  // Open Create
  const openCreateModal = () => {
    if (services.length > 0) {
      setCreateServiceId(services[0]?.id || "");
    }
    setCreateName("");
    setCreateType("QUERY");
    setCreateCost("LOW");
    setCreateCacheable(true);
    setCreateRequiresDb(true);
    setCreatePriority("MEDIUM");
    setIsCreateOpen(true);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createServiceId || !createName.trim()) return;

    setIsCreating(true);
    try {
      await graphqlRequest(CREATE_OPERATION, {
        input: {
          graphQLServiceId: createServiceId,
          name: createName.trim(),
          type: createType,
          estimatedCost: createCost,
          cacheable: createCacheable,
          requiresDatabase: createRequiresDb,
          priority: createPriority,
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Operation "${createName}" registered successfully!`,
      });

      setIsCreateOpen(false);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create operation",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Open Edit
  const openEditModal = (op: Operation) => {
    setEditingOp(op);
    setEditServiceId(op.graphQLServiceId);
    setEditName(op.name);
    setEditType(op.type);
    setEditCost(op.estimatedCost);
    setEditCacheable(op.cacheable);
    setEditRequiresDb(op.requiresDatabase);
    setEditPriority(op.priority);
  };

  // Submit Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOp || !editServiceId || !editName.trim()) return;

    setIsUpdating(true);
    try {
      await graphqlRequest(UPDATE_OPERATION, {
        id: editingOp.id,
        input: {
          graphQLServiceId: editServiceId,
          name: editName.trim(),
          type: editType,
          estimatedCost: editCost,
          cacheable: editCacheable,
          requiresDatabase: editRequiresDb,
          priority: editPriority,
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Operation updated successfully!`,
      });

      setEditingOp(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update operation",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!deletingOp) return;

    setIsDeleting(true);
    try {
      await graphqlRequest(DELETE_OPERATION, {
        id: deletingOp.id,
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Operation "${deletingOp.name}" deleted successfully!`,
      });

      setDeletingOp(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to delete operation. Please delete associated routing policies first.",
      });
      setDeletingOp(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Operations"
        subtitle="Manage registered GraphQL operations, heuristics, and execution metadata"
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
                    placeholder="Search operations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Service Filter */}
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Services</option>
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name}
                    </option>
                  ))}
                </select>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="QUERY">Queries</option>
                  <option value="MUTATION">Mutations</option>
                </select>
              </div>

              {/* Create Operation Button */}
              <button
                onClick={openCreateModal}
                disabled={services.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
                title={
                  services.length === 0
                    ? "Please register a GraphQL service first"
                    : "Register Operation"
                }
              >
                <Plus className="w-4 h-4" />
                <span>Register Operation</span>
              </button>
            </div>

            {/* Services Warning if None Exist */}
            {services.length === 0 && !isLoading && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center justify-between">
                <span>
                  No GraphQL services found. You must create a service before registering operations.
                </span>
                <Link
                  href="/services"
                  className="font-bold underline text-amber-200 hover:text-white"
                >
                  Create Service →
                </Link>
              </div>
            )}

            {/* Operations Table */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Registered Operations ({operations.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Operation heuristics and AST metadata cached in Redis
                  </p>
                </div>
              </div>

              {isLoading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : filteredOps.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-3">
                  <p className="text-slate-300 font-medium">No operations found</p>
                  <p className="text-slate-400">
                    Register your first operation (e.g. GetProducts) to enable intelligent gateway routing.
                  </p>
                  {services.length > 0 && (
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Operation</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold">Operation Name</th>
                        <th className="px-6 py-3.5 font-semibold">Type</th>
                        <th className="px-6 py-3.5 font-semibold">Service</th>
                        <th className="px-6 py-3.5 font-semibold">Cost & Priority</th>
                        <th className="px-6 py-3.5 font-semibold">Cache & DB</th>
                        <th className="px-6 py-3.5 font-semibold">Routing Policy</th>
                        <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredOps.map((op) => {
                        const svc = serviceMap.get(op.graphQLServiceId);
                        const policy = policyMap.get(op.id);

                        return (
                          <tr
                            key={op.id}
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            {/* Operation Name */}
                            <td className="px-6 py-4">
                              <div className="font-sans font-bold text-slate-100 text-sm">
                                {op.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: {op.id.slice(0, 8)}
                              </div>
                            </td>

                            {/* Type */}
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                                  op.type === "QUERY"
                                    ? "bg-cyan-950/60 text-cyan-400 border-cyan-800/50"
                                    : "bg-purple-950/60 text-purple-400 border-purple-800/50"
                                }`}
                              >
                                {op.type}
                              </span>
                            </td>

                            {/* Service */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-sans text-xs">
                                <Server className="w-3 h-3 text-cyan-400" />
                                {svc?.name || "Unknown Service"}
                              </span>
                            </td>

                            {/* Cost & Priority */}
                            <td className="px-6 py-4 space-y-1">
                              <div className="text-slate-300">
                                Priority: <strong className="text-slate-100">{op.priority}</strong>
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                Cost: {op.estimatedCost}
                              </div>
                            </td>

                            {/* Cache & DB */}
                            <td className="px-6 py-4 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Database className="w-3 h-3 text-cyan-400" />
                                <span className="text-slate-300">
                                  Cache: {op.cacheable ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                DB: {op.requiresDatabase ? "Yes" : "No"}
                              </div>
                            </td>

                            {/* Routing Policy */}
                            <td className="px-6 py-4">
                              {policy ? (
                                <Link
                                  href="/routing-policies"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs hover:bg-emerald-900/50 transition-colors"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>{policy.preferredRuntime} ({policy.cpuThreshold}%)</span>
                                </Link>
                              ) : (
                                <Link
                                  href="/routing-policies"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] hover:text-cyan-400 hover:bg-slate-750 transition-colors"
                                >
                                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                                  <span>+ Add Policy</span>
                                </Link>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(op)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                                  title="Edit operation"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingOp(op)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                                  title="Delete operation"
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
        title="Register GraphQL Operation"
        subtitle="Configure operation metadata, cost heuristics, and execution settings"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Upstream GraphQL Service *
            </label>
            <select
              required
              value={createServiceId}
              onChange={(e) => setCreateServiceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} ({svc.endpoint})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Operation Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GetProducts"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Must exactly match the GraphQL AST operation name in client queries
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                Type
              </label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value as OperationType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="QUERY">QUERY</option>
                <option value="MUTATION">MUTATION</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                Estimated Cost
              </label>
              <select
                value={createCost}
                onChange={(e) => setCreateCost(e.target.value as EstimatedCost)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                Priority
              </label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={createCacheable}
                onChange={(e) => setCreateCacheable(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-slate-200">Cacheable in Redis</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={createRequiresDb}
                onChange={(e) => setCreateRequiresDb(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-slate-200">Requires Database</span>
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
              <span>{isCreating ? "Registering..." : "Register Operation"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editingOp !== null}
        onClose={() => setEditingOp(null)}
        title="Edit Operation"
        subtitle={`Updating ${editingOp?.name || ""}`}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Upstream GraphQL Service *
            </label>
            <select
              required
              value={editServiceId}
              onChange={(e) => setEditServiceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} ({svc.endpoint})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Operation Name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                Type
              </label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as OperationType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="QUERY">QUERY</option>
                <option value="MUTATION">MUTATION</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                Estimated Cost
              </label>
              <select
                value={editCost}
                onChange={(e) => setEditCost(e.target.value as EstimatedCost)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
                Priority
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={editCacheable}
                onChange={(e) => setEditCacheable(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-slate-200">Cacheable in Redis</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={editRequiresDb}
                onChange={(e) => setEditRequiresDb(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-slate-200">Requires Database</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingOp(null)}
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
        isOpen={deletingOp !== null}
        onClose={() => setDeletingOp(null)}
        onConfirm={handleDelete}
        title="Delete Operation"
        resourceName={deletingOp?.name || ""}
        resourceType="Operation"
        warningText={
          deletingOp && policyMap.has(deletingOp.id)
            ? "Warning: This operation has an associated routing policy. Deleting it will remove the policy as well."
            : undefined
        }
        isDeleting={isDeleting}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
