"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { graphqlRequest } from "@/lib/graphql";
import { GET_ORGANIZATIONS_PAGE } from "@/lib/queries";
import {
  CREATE_ORGANIZATION,
  UPDATE_ORGANIZATION,
  DELETE_ORGANIZATION,
} from "@/lib/mutations";
import type { Organization, Application } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Building2, Plus, Edit2, Trash2, Boxes, Search } from "lucide-react";

interface OrganizationsPageData {
  organizations: Organization[];
  applications: Application[];
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const data = await graphqlRequest<OrganizationsPageData>(GET_ORGANIZATIONS_PAGE);
      setOrganizations(data.organizations || []);
      setApplications(data.applications || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // App count per org
  const appCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of applications) {
      counts.set(app.organizationId, (counts.get(app.organizationId) || 0) + 1);
    }
    return counts;
  }, [applications]);

  // Filtered orgs
  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        org.name.toLowerCase().includes(q) ||
        org.slug.toLowerCase().includes(q) ||
        org.id.toLowerCase().includes(q)
      );
    });
  }, [organizations, searchQuery]);

  // Auto slug generation on name change
  const handleNameChange = (name: string) => {
    setCreateName(name);
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setCreateSlug(slug);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createSlug.trim()) return;

    setIsCreating(true);
    try {
      await graphqlRequest(CREATE_ORGANIZATION, {
        input: {
          name: createName.trim(),
          slug: createSlug.trim(),
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Organization "${createName}" created successfully!`,
      });

      setIsCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create organization",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Open Edit
  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditName(org.name);
    setEditSlug(org.slug);
  };

  // Submit Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg || !editName.trim() || !editSlug.trim()) return;

    setIsUpdating(true);
    try {
      await graphqlRequest(UPDATE_ORGANIZATION, {
        id: editingOrg.id,
        input: {
          name: editName.trim(),
          slug: editSlug.trim(),
        },
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Organization updated successfully!`,
      });

      setEditingOrg(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update organization",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!deletingOrg) return;

    setIsDeleting(true);
    try {
      await graphqlRequest(DELETE_ORGANIZATION, {
        id: deletingOrg.id,
      });

      setToast({
        id: Date.now().toString(),
        type: "success",
        message: `Organization "${deletingOrg.name}" deleted successfully!`,
      });

      setDeletingOrg(null);
      await fetchData(false);
    } catch (err) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to delete organization. Please delete associated applications first.",
      });
      setDeletingOrg(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Organizations"
        subtitle="Manage root tenant organizations and global routing domains"
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
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Create Organization Button */}
              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all duration-150 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Organization</span>
              </button>
            </div>

            {/* Organizations Table */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span>Registered Organizations ({organizations.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Root level tenancy entities configured in SpikeFlow
                  </p>
                </div>
              </div>

              {isLoading ? (
                <TableSkeleton rows={4} cols={4} />
              ) : filteredOrgs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-3">
                  <p className="text-slate-300 font-medium">No organizations found</p>
                  <p className="text-slate-400">Create your first organization to get started with SpikeFlow onboarding.</p>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Organization</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold">Name</th>
                        <th className="px-6 py-3.5 font-semibold">Slug</th>
                        <th className="px-6 py-3.5 font-semibold">Applications</th>
                        <th className="px-6 py-3.5 font-semibold">Created At</th>
                        <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredOrgs.map((org) => {
                        const count = appCounts.get(org.id) || 0;

                        return (
                          <tr
                            key={org.id}
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            {/* Name */}
                            <td className="px-6 py-4">
                              <div className="font-sans font-bold text-slate-100 text-sm">
                                {org.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                ID: {org.id.slice(0, 8)}
                              </div>
                            </td>

                            {/* Slug */}
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-mono">
                                {org.slug}
                              </span>
                            </td>

                            {/* Applications count */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                                <Boxes className="w-3 h-3" />
                                {count} {count === 1 ? "app" : "apps"}
                              </span>
                            </td>

                            {/* Created At */}
                            <td className="px-6 py-4 text-slate-400">
                              {formatDate(org.createdAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEdit(org)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                                  title="Edit organization"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingOrg(org)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                                  title="Delete organization"
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
        title="Create Organization"
        subtitle="Provision a new tenant organization in SpikeFlow"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Organization Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Demo Organization"
              value={createName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Slug Identifier *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. demo-org"
              value={createSlug}
              onChange={(e) => setCreateSlug(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              URL-friendly unique slug for routing namespace
            </p>
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
              <span>{isCreating ? "Creating..." : "Create Organization"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editingOrg !== null}
        onClose={() => setEditingOrg(null)}
        title="Edit Organization"
        subtitle={`Updating ${editingOrg?.name || ""}`}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 uppercase mb-1.5">
              Organization Name *
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
              Slug Identifier *
            </label>
            <input
              type="text"
              required
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingOrg(null)}
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
        isOpen={deletingOrg !== null}
        onClose={() => setDeletingOrg(null)}
        onConfirm={handleDelete}
        title="Delete Organization"
        resourceName={deletingOrg?.name || ""}
        resourceType="Organization"
        warningText={
          deletingOrg && (appCounts.get(deletingOrg.id) || 0) > 0
            ? `Warning: This organization has ${appCounts.get(deletingOrg.id)} active applications. Deleting it will fail if child applications exist.`
            : undefined
        }
        isDeleting={isDeleting}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
