// File: app/(public)/news/page.tsx
"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";

// Note: Metadata export doesn't work in client components
// Move metadata to a separate layout.tsx or use static export

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // News items data
  const newsItems = [
    {
      id: 1,
      date: "December 2024",
      category: "Announcement",
      title: "Spring Term 2025 Registration Now Open",
      description:
        "We are now accepting applications for the Spring 2025 term starting in January. Early registration is encouraged as spaces are limited.",
      featured: true,
    },
    {
      id: 2,
      date: "December 2024",
      category: "Event",
      title: "Ramadan Program 2025 Details Announced",
      description:
        "Join us for our special Ramadan evening program featuring Taraweeh prayers, Quran recitation, and Islamic lectures. Program runs throughout the blessed month.",
      featured: true,
    },
    {
      id: 3,
      date: "November 2024",
      category: "Achievement",
      title: "15 Students Complete Quran Memorization",
      description:
        "Congratulations to our 15 students who successfully completed their Quran memorization milestones this term. A special ceremony was held to celebrate their achievements.",
      featured: false,
    },
    {
      id: 4,
      date: "November 2024",
      category: "Event",
      title: "Parent-Teacher Meetings This Month",
      description:
        "Individual parent-teacher consultation meetings will be held throughout November. Check your email for your scheduled appointment time.",
      featured: false,
    },
    {
      id: 5,
      date: "October 2024",
      category: "Announcement",
      title: "New Arabic Language Program Launched",
      description:
        "We're excited to introduce our new comprehensive Arabic language program for ages 8-14. Classes focus on reading, writing, and conversational skills.",
      featured: false,
    },
    {
      id: 6,
      date: "October 2024",
      category: "Achievement",
      title: "School Receives Community Excellence Award",
      description:
        "Al Hikmah Institute has been recognized by the local Muslim community for outstanding contributions to Islamic education and youth development.",
      featured: false,
    },
    {
      id: 7,
      date: "September 2024",
      category: "Event",
      title: "Annual Family Day 2024 - Huge Success!",
      description:
        "Thank you to all families who attended our annual Family Day. Over 200 people enjoyed activities, food, and community bonding.",
      featured: false,
    },
    {
      id: 8,
      date: "September 2024",
      category: "Announcement",
      title: "Autumn Term Classes Begin",
      description:
        "Welcome back! The Autumn 2024 term has begun. All students should have received their updated class schedules and term calendars.",
      featured: false,
    },
  ];

  const categories = ["All", "Announcements", "Events", "Achievements"];

  // Filter news based on selected category
  const getFilteredNews = () => {
    if (selectedCategory === "All") return newsItems;

    // Map plural categories to singular
    const categoryMap: { [key: string]: string } = {
      Announcements: "Announcement",
      Events: "Event",
      Achievements: "Achievement",
    };

    const filterCategory = categoryMap[selectedCategory] || selectedCategory;
    return newsItems.filter((item) => item.category === filterCategory);
  };

  const filteredNews = getFilteredNews();
  const featuredNews = filteredNews.filter((item) => item.featured);
  const regularNews = filteredNews.filter((item) => !item.featured);

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Event":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "Achievement":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "Announcement":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="text-sm font-semibold text-primary">
                Latest Updates
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              News & Announcements
            </h1>
            <p className="text-lg text-muted-foreground">
              Stay informed about the latest happenings, events, and
              achievements at Al Hikmah Institute Crawley.
            </p>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Filter Tabs - NOW FUNCTIONAL */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-lg border-2 transition-all duration-300 font-medium text-sm ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground border-primary shadow-lg"
                    : "border-border hover:border-primary hover:bg-primary/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured News */}
          {featuredNews.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Featured Updates
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredNews.map((item) => (
                  <div
                    key={item.id}
                    className="group p-6 bg-card border-2 border-primary/20 rounded-lg hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.date}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-muted-foreground mb-4">
                      {item.description}
                    </p>

                    <button className="text-primary font-medium hover:underline inline-flex items-center gap-1 text-sm">
                      Read more
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All News Grid */}
          {regularNews.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">All Updates</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularNews.map((item) => (
                  <div
                    key={item.id}
                    className="group p-6 bg-card border border-border rounded-lg hover:border-primary hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      {item.date}
                    </p>

                    <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4">
                      {item.description}
                    </p>

                    <button className="text-primary font-medium hover:underline inline-flex items-center gap-1 text-sm">
                      Learn more →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {filteredNews.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-muted-foreground text-lg mb-2">
                No news found in this category.
              </p>
              <p className="text-sm text-muted-foreground">
                Try selecting a different category above.
              </p>
            </div>
          )}

          {/* News Count */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredNews.length} of {newsItems.length} updates
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </div>

          {/* Newsletter Signup */}
          <div className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
            <div className="max-w-2xl mx-auto text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>

              <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
              <p className="text-muted-foreground mb-6">
                Want to receive news and announcements directly? Contact us to
                be added to our mailing list.
              </p>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Join Our Growing Community
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Enroll your child today and be part of our Islamic education
              family.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-8 py-3 bg-background border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
              >
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
