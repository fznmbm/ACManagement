// components/settings/UserManagement.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  UserX,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";

interface UserManagementProps {
  users: any[];
  currentUserId: string;
}

export default function UserManagement({
  users: initialUsers,
  currentUserId,
}: UserManagementProps) {
  const router = useRouter();
  const supabase = createClient();

  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      alert("You cannot change your own role");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      alert("You cannot deactivate your own account");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        )
      );
      router.refresh();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to update user status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      alert("You cannot delete your own account");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers(users.filter((u) => u.id !== userId));
      router.refresh();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "teacher":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <ShieldCheck className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage system users and their permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {user.full_name?.charAt(0) ||
                            user.email?.charAt(0) ||
                            "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.full_name || "No name"}
                          {user.id === currentUserId && (
                            <span className="ml-2 text-xs text-primary">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.id === currentUserId ? (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center space-x-1 ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        <span className="capitalize">
                          {user.role.replace("_", " ")}
                        </span>
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateRole(user.id, e.target.value)
                        }
                        disabled={loading}
                        className="text-xs px-2 py-1 border border-input rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        handleToggleStatus(user.id, user.is_active)
                      }
                      disabled={user.id === currentUserId || loading}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.created_at
                      ? formatDate(user.created_at, "short")
                      : "Unknown"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1 hover:bg-accent rounded"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={loading}
                          className="p-1 hover:bg-accent rounded disabled:opacity-50"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* Add User Modal (Placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To add a new user, they should sign up through the login page.
              Then you can assign their role here.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> New users will have "teacher" role by
                default. You can change their role from this page after they
                sign up.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal (Placeholder) */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  defaultValue={editingUser.full_name}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  defaultValue={editingUser.email}
                  className="form-input"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  defaultValue={editingUser.phone}
                  className="form-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("Save functionality to be implemented");
                  setEditingUser(null);
                }}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
