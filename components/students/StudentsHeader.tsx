// components/students/StudentsHeader.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Plus, Download } from "lucide-react";
import Link from "next/link";

interface StudentsHeaderProps {
  classes: Array<{ id: string; name: string }>;
}

export default function StudentsHeader({ classes }: StudentsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedClass, setSelectedClass] = useState(
    searchParams.get("class") || ""
  );
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || ""
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters();
  };

  const updateFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedClass) params.set("class", selectedClass);
    if (selectedStatus) params.set("status", selectedStatus);

    router.push(`/students?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedClass("");
    setSelectedStatus("");
    router.push("/students");
  };

  const hasActiveFilters = search || selectedClass || selectedStatus;

  return (
    <div className="space-y-4">
      {/* Title and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground">
            Manage and track all students in your madrasa
          </p>
        </div>
        <Link
          href="/students/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Student</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or student number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
              }}
              className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
              }}
              className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="withdrawn">Withdrawn</option>
            </select>

            <button
              type="button"
              onClick={updateFilters}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Apply Filters
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-destructive hover:underline"
              >
                Clear All
              </button>
            )}

            {/* Export Button (Placeholder) */}
            <button
              type="button"
              className="btn-outline ml-auto flex items-center space-x-2"
              title="Export to Excel"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
