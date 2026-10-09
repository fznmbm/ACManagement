// File: components/users/UsersClient.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Shield,
  Mail,
  Calendar,
} from "lucide-react";
import { AddUserModal } from "@/components/users/AddUserModal";
import { EditUserModal } from "@/components/users/EditUserModal";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: "super_admin" | "admin" | "teacher";
  created_at: string;
  last_sign_in_at: string | null;
}

// Access is guaranteed by the server component that renders this (super_admin
// only), so there's no client-side role gate here.
export default function UsersClient() {
  const { toast, confirm } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter, users]);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const usersWithAuth = (profiles || []).map((profile) => ({
        ...profile,
        last_sign_in_at: null,
      }));

      setUsers(usersWithAuth);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and role
  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (
      !(await confirm({
        title: "Delete user",
        message: `Delete ${userEmail}? This can't be undone.`,
        confirmText: "Delete user",
        destructive: true,
      }))
    ) {
      return;
    }

    try {
      const response = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("User deleted.");
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting user");
    }
  };

  // Reset password
  const handleResetPassword = async (userEmail: string) => {
    if (!(await confirm(`Send a password reset email to ${userEmail}?`))) {
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success("Password reset email sent.");
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error("Failed to send password reset email");
    }
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      teacher: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
    return (
      colors[role as keyof typeof colors] || "bg-gray-500/10 text-gray-600"
    );
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                User Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage system users, roles, and permissions
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add New User
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchUsers}
            className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Super Admins</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u) => u.role === "super_admin").length}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Admins</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.role === "admin").length}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Teachers</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.role === "teacher").length}
            </p>
          </div>
        </div>

        {/* Users list */}
        <div className="bg-card border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.full_name?.charAt(0) ||
                            user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {user.full_name || "No name"}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {formatRole(user.role)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.email)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" /> Reset
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="inline-flex items-center justify-center rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.full_name?.charAt(0) ||
                                  user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.full_name || "No name"}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {formatRole(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.email)}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                              title="Reset password"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteUser(user.id, user.email)
                              }
                              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
