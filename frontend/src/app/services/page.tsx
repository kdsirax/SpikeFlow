"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_SERVICES_PAGE } from "@/lib/queries";
import {
  CREATE_GRAPHQL_SERVICE,
  UPDATE_GRAPHQL_SERVICE,
  DELETE_GRAPHQL_SERVICE,
} from "@/lib/mutations";
import type { GraphQLService, Application, Operation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Server, Plus, Edit2, Trash2, Globe, Boxes, Layers, Search } from "lucide-react";
import Link from "next/link";

interface ServicesPageData {
  graphqlServices: GraphQLService[];
  applications: Application[];
  operations: Operation[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<GraphQLService[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [appFilter, setAppFilter] = useState("ALL");
  const [envFilter, setEnvFilter] = useState("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createAppId, setCreateAppId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEndpoint, setCreateEndpoint] = useState("");
  const [createEnv, setCreateEnv] = useState("development");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingService, setEditingService] = useState<GraphQLService | null>(null);
  const [editAppId, setEditAppId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEndpoint, setEditEndpoint] = useState("");
  const [editEnv, setEditEnv] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingService, setDeletingService] = useState<GraphQLService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<ServicesPageData>(GET_SERVICES_PAGE);
      setServices(data.graphqlServices || []);
      setApplications(data.applications || []);
      setOperations(data.operations || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load GraphQL services");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Lookup maps
  const appMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of applications) {
      map.set(app.id, app.name);
    }
    return map;
  }, [applications]);

  const opCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const op of operations) {
      counts.set(op.graphQLServiceId, (counts.get(op.graphQLServiceId) || 0) + 1);
    }
    return counts;
  }, [operations]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      if (appFilter !== "ALL" && svc.applicationId !== appFilter) return false;
      if (envFilter !== "ALL" && svc.environment.toLowerCase() !== envFilter.toLowerCase())
        return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const appName = (appMap.get(svc.applicationId) || "").toLowerCase();
      return (
        svc.name.toLowerCase().includes(q) ||
        svc.endpoint.toLowerCase().includes(q) ||
        svc.environment.toLowerCase().includes(q) ||
        appName.includes(q) ||
        svc.id.toLowerCase().includes(q)
      );
    });
  }, [services, appFilter, envFilter, searchQuery, appMap]);

  // Open Create
  const openCreateModal = () => {
    if (applications.length > 0) {
      setCreateAppId(applications[0]?.id || "");
    }
    setCreateName("");
    setCreateEndpoint("http://product-service:5000/graphql");
    setCreateEnv("development");
    setIsCreateOpen(true);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createAppId || !createName.trim() || !createEndpoint.trim()) return;

    setIsCreating(true);
    try {
      await graphqlRequest(CREATE_GRAPHQL_SERVICE, {
        input: {
          applicationId: createAppId,
          name: createName.trim(),
          endpoint: createEndpoint.trim(),
          environment: createEnv.trim() || "development",
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `GraphQL Service "${createName}" created successfully!`,
      });

      setIsCreateOpen(false);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create GraphQL service",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Open Edit
  const openEditModal = (svc: GraphQLService) => {
    setEditingService(svc);
    setEditAppId(svc.applicationId);
    setEditName(svc.name);
    setEditEndpoint(svc.endpoint);
    setEditEnv(svc.environment);
  };

  // Submit Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editAppId || !editName.trim() || !editEndpoint.trim()) return;

    setIsUpdating(true);
    try {
      await graphqlRequest(UPDATE_GRAPHQL_SERVICE, {
        id: editingService.id,
        input: {
          applicationId: editAppId,
          name: editName.trim(),
          endpoint: editEndpoint.trim(),
          environment: editEnv.trim(),
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `GraphQL Service updated successfully!`,
      });

      setEditingService(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update GraphQL service",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!deletingService) return;

    setIsDeleting(true);
    try {
      await graphqlRequest(DELETE_GRAPHQL_SERVICE, {
        id: deletingService.id,
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `GraphQL Service "${deletingService.name}" deleted successfully!`,
      });

      setDeletingService(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to delete service. Please delete associated operations first.",
      });
      setDeletingService(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="GraphQL Services"
        subtitle="Configure upstream GraphQL microservices and execution endpoints"
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
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Application Filter */}
                <select
                  value={appFilter}
                  onChange={(e) => setAppFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Applications</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>

                {/* Environment Filter */}
                <select
                  value={envFilter}
                  onChange={(e) => setEnvFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Environments</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              {/* Create Service Button */}
              <button
                onClick={openCreateModal}
                disabled={applications.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
                title={
                  applications.length === 0
                    ? "Please create an application first"
                    : "Create GraphQL Service"
                }
              >
                <Plus className="w-4 h-4" />
                <span>Create Service</span>
              </button>
            </div>

            {/* Applications Warning if None Exist */}
            {applications.length === 0 && !isLoading && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center justify-between">
                <span>
                  No applications found. You must create an application before registering GraphQL services.
                </span>
                <Link
                  href="/applications"
                  className="font-bold underline text-amber-200 hover:text-white"
                >
                  Create Application →
                </Link>
              </div>
            )}

            {/* Services Table */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span>Registered Services ({services.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Upstream GraphQL subgraphs and endpoints proxied by SpikeFlow
                  </p>
                </div>
              </div>

              {isLoading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : filteredServices.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-3">
                  <p className="text-slate-300 font-medium">No GraphQL services found</p>
                  <p className="text-slate-400">
                    Register your first upstream service (e.g. Product Service) to begin proxying queries.
                  </p>
                  {applications.length > 0 && (
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Service</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold">Service Name</th>
                        <th className="px-6 py-3.5 font-semibold">Application</th>
                        <th className="px-6 py-3.5 font-semibold">Endpoint</th>
                        <th className="px-6 py-3.5 font-semibold">Environment</th>
                        <th className="px-6 py-3.5 font-semibold">Operations</th>
                        <th className="px-6 py-3.5 font-semibold">Created At</th>
                        <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredServices.map((svc) => {
                        const appName = appMap.get(svc.applicationId) || "Unknown App";
                        const count = opCounts.get(svc.id) || 0;

                        return (
                          <tr
                            key={svc.id}
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            {/* Service Name */}
                            <td className="px-6 py-4">
                              <div className="font-sans font-bold text-slate-100 text-sm">
                                {svc.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: {svc.id.slice(0, 8)}
                              </div>
                            </td>

                            {/* Application */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-sans text-xs">
                                <Boxes className="w-3 h-3 text-cyan-400" />
                                {appName}
                              </span>
                            </td>

                            {/* Endpoint URL */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-slate-300 max-w-xs truncate">
                                <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                <span className="truncate select-all">{svc.endpoint}</span>
                              </div>
                            </td>

                            {/* Environment Badge */}
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                                {svc.environment}
                              </span>
                            </td>

                            {/* Operations Count */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-950/60 text-indigo-400 border border-indigo-800/50">
                                <Layers className="w-3 h-3" />
                                {count} {count === 1 ? "operation" : "operations"}
                              </span>
                            </td>

                            {/* Created At */}
                            <td className="px-6 py-4 text-slate-400">
                              {formatDate(svc.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(svc)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                                  title="Edit service"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingService(svc)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                                  title="Delete service"
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
        title="Create GraphQL Service"
        subtitle="Register an upstream GraphQL subgraph endpoint"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Parent Application *
            </label>
            <select
              required
              value={createAppId}
              onChange={(e) => setCreateAppId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Service Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Product Service"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              GraphQL Endpoint URL *
            </label>
            <input
              type="url"
              required
              placeholder="e.g. http://product-service:5000/graphql"
              value={createEndpoint}
              onChange={(e) => setCreateEndpoint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Environment
            </label>
            <select
              value={createEnv}
              onChange={(e) => setCreateEnv(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="development">development</option>
              <option value="staging">staging</option>
              <option value="production">production</option>
            </select>
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
              <span>{isCreating ? "Creating..." : "Create Service"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editingService !== null}
        onClose={() => setEditingService(null)}
        title="Edit GraphQL Service"
        subtitle={`Updating ${editingService?.name || ""}`}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Parent Application *
            </label>
            <select
              required
              value={editAppId}
              onChange={(e) => setEditAppId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Service Name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              GraphQL Endpoint URL *
            </label>
            <input
              type="url"
              required
              value={editEndpoint}
              onChange={(e) => setEditEndpoint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Environment
            </label>
            <select
              value={editEnv}
              onChange={(e) => setEditEnv(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="development">development</option>
              <option value="staging">staging</option>
              <option value="production">production</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingService(null)}
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
        isOpen={deletingService !== null}
        onClose={() => setDeletingService(null)}
        onConfirm={handleDelete}
        title="Delete GraphQL Service"
        resourceName={deletingService?.name || ""}
        resourceType="GraphQL Service"
        warningText={
          deletingService && (opCounts.get(deletingService.id) || 0) > 0
            ? `Warning: This service has ${opCounts.get(deletingService.id)} registered operations. Deleting it will fail if child operations exist.`
            : undefined
        }
        isDeleting={isDeleting}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
