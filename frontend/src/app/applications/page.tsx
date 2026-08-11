"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_APPLICATIONS_PAGE } from "@/lib/queries";
import {
  CREATE_APPLICATION,
  UPDATE_APPLICATION,
  DELETE_APPLICATION,
} from "@/lib/mutations";
import type { Application, Organization, GraphQLService } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Boxes, Plus, Edit2, Trash2, Building2, Server, Search } from "lucide-react";
import Link from "next/link";

interface ApplicationsPageData {
  applications: Application[];
  organizations: Organization[];
  graphqlServices: GraphQLService[];
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [services, setServices] = useState<GraphQLService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createOrgId, setCreateOrgId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editOrgId, setEditOrgId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<ApplicationsPageData>(GET_APPLICATIONS_PAGE);
      setApplications(data.applications || []);
      setOrganizations(data.organizations || []);
      setServices(data.graphqlServices || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Lookup maps
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const org of organizations) {
      map.set(org.id, org.name);
    }
    return map;
  }, [organizations]);

  const serviceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const svc of services) {
      counts.set(svc.applicationId, (counts.get(svc.applicationId) || 0) + 1);
    }
    return counts;
  }, [services]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (selectedOrgFilter !== "ALL" && app.organizationId !== selectedOrgFilter) {
        return false;
      }
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const orgName = (orgMap.get(app.organizationId) || "").toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        orgName.includes(q) ||
        app.id.toLowerCase().includes(q)
      );
    });
  }, [applications, selectedOrgFilter, searchQuery, orgMap]);

  // Open Create Modal
  const openCreateModal = () => {
    if (organizations.length > 0) {
      setCreateOrgId(organizations[0]?.id || "");
    }
    setCreateName("");
    setCreateDesc("");
    setIsCreateOpen(true);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOrgId || !createName.trim()) return;

    setIsCreating(true);
    try {
      await graphqlRequest(CREATE_APPLICATION, {
        input: {
          organizationId: createOrgId,
          name: createName.trim(),
          description: createDesc.trim() || "SpikeFlow registered application",
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Application "${createName}" created successfully!`,
      });

      setIsCreateOpen(false);
      setCreateName("");
      setCreateDesc("");
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create application",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (app: Application) => {
    setEditingApp(app);
    setEditOrgId(app.organizationId);
    setEditName(app.name);
    setEditDesc(app.description);
  };

  // Submit Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editOrgId || !editName.trim()) return;

    setIsUpdating(true);
    try {
      await graphqlRequest(UPDATE_APPLICATION, {
        id: editingApp.id,
        input: {
          organizationId: editOrgId,
          name: editName.trim(),
          description: editDesc.trim(),
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Application updated successfully!`,
      });

      setEditingApp(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update application",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!deletingApp) return;

    setIsDeleting(true);
    try {
      await graphqlRequest(DELETE_APPLICATION, {
        id: deletingApp.id,
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Application "${deletingApp.name}" deleted successfully!`,
      });

      setDeletingApp(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to delete application. Please delete associated services first.",
      });
      setDeletingApp(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Applications"
        subtitle="Manage product applications and service groupings"
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
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Organization Filter */}
                <select
                  value={selectedOrgFilter}
                  onChange={(e) => setSelectedOrgFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="ALL">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Create Application Button */}
              <button
                onClick={openCreateModal}
                disabled={organizations.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
                title={
                  organizations.length === 0
                    ? "Please create an organization first"
                    : "Create application"
                }
              >
                <Plus className="w-4 h-4" />
                <span>Create Application</span>
              </button>
            </div>

            {/* Organizations Warning if None Exist */}
            {organizations.length === 0 && !isLoading && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center justify-between">
                <span>
                  No organizations found. You must create an organization before adding applications.
                </span>
                <Link
                  href="/organizations"
                  className="font-bold underline text-amber-200 hover:text-white"
                >
                  Create Organization →
                </Link>
              </div>
            )}

            {/* Applications Table */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-cyan-400" />
                    <span>Registered Applications ({applications.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Application workloads mapped to parent organizations
                  </p>
                </div>
              </div>

              {isLoading ? (
                <TableSkeleton rows={4} cols={5} />
              ) : filteredApps.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-3">
                  <p className="text-slate-300 font-medium">No applications found</p>
                  <p className="text-slate-400">
                    Create an application linked to your organization to begin onboarding GraphQL services.
                  </p>
                  {organizations.length > 0 && (
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Application</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold">Application</th>
                        <th className="px-6 py-3.5 font-semibold">Organization</th>
                        <th className="px-6 py-3.5 font-semibold">Description</th>
                        <th className="px-6 py-3.5 font-semibold">Services</th>
                        <th className="px-6 py-3.5 font-semibold">Created At</th>
                        <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredApps.map((app) => {
                        const orgName = orgMap.get(app.organizationId) || "Unknown Org";
                        const svcCount = serviceCounts.get(app.id) || 0;

                        return (
                          <tr
                            key={app.id}
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            {/* Application Name */}
                            <td className="px-6 py-4">
                              <div className="font-sans font-bold text-slate-100 text-sm">
                                {app.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: {app.id.slice(0, 8)}
                              </div>
                            </td>

                            {/* Organization */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-sans text-xs">
                                <Building2 className="w-3 h-3 text-cyan-400" />
                                {orgName}
                              </span>
                            </td>

                            {/* Description */}
                            <td className="px-6 py-4 text-slate-300 font-sans max-w-xs truncate">
                              {app.description || "-"}
                            </td>

                            {/* Services Count */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-950/60 text-indigo-400 border border-indigo-800/50">
                                <Server className="w-3 h-3" />
                                {svcCount} {svcCount === 1 ? "service" : "services"}
                              </span>
                            </td>

                            {/* Created At */}
                            <td className="px-6 py-4 text-slate-400">
                              {formatDate(app.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(app)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                                  title="Edit application"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingApp(app)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                                  title="Delete application"
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
        title="Create Application"
        subtitle="Provision an application workload linked to an organization"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Parent Organization *
            </label>
            <select
              required
              value={createOrgId}
              onChange={(e) => setCreateOrgId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Application Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shopping App"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Demo shopping application with checkout and product catalog"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-sans focus:outline-none focus:border-cyan-500 resize-none"
            />
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
              <span>{isCreating ? "Creating..." : "Create Application"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editingApp !== null}
        onClose={() => setEditingApp(null)}
        title="Edit Application"
        subtitle={`Updating ${editingApp?.name || ""}`}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Parent Organization *
            </label>
            <select
              required
              value={editOrgId}
              onChange={(e) => setEditOrgId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Application Name *
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
              Description
            </label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingApp(null)}
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
        isOpen={deletingApp !== null}
        onClose={() => setDeletingApp(null)}
        onConfirm={handleDelete}
        title="Delete Application"
        resourceName={deletingApp?.name || ""}
        resourceType="Application"
        warningText={
          deletingApp && (serviceCounts.get(deletingApp.id) || 0) > 0
            ? `Warning: This application has ${serviceCounts.get(deletingApp.id)} active GraphQL services. Deleting it will fail if child services exist.`
            : undefined
        }
        isDeleting={isDeleting}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
