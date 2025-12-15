// File: app/(public)/gallery/page.tsx
"use client";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";

// Note: Metadata export doesn't work in client components
// Move metadata to a separate layout.tsx or use static export

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
    title: string;
    category: string;
  } | null>(null);

  // Gallery images data
  const galleryImages = [
    {
      id: 1,
      src: "/gallery/event-1.jpg",
      alt: "Graduation Ceremony event 2025",
      category: "Events",
      title: "Graduation Ceremony event 2025",
    },
    {
      id: 2,
      src: "/gallery/event-2.jpg",
      alt: "Graduation Ceremony event 2025",
      category: "Events",
      title: "Graduation Ceremony event 2025",
    },
    {
      id: 3,
      src: "/gallery/event-3.jpg",
      alt: "Graduation Ceremony event 2025",
      category: "Events",
      title: "Graduation Ceremony event 2025",
    },
    {
      id: 4,
      src: "/gallery/event-4.jpg",
      alt: "Graduation Ceremony event 2025",
      category: "Events",
      title: "Graduation Ceremony event 2025",
    },
    {
      id: 5,
      src: "/gallery/event-5.jpg",
      alt: "Graduation Ceremony event 2025",
      category: "Events",
      title: "Graduation Ceremony event 2025",
    },
    {
      id: 6,
      src: "/gallery/event-6.jpg",
      alt: "Graduation Ceremony event 2025",
      category: "Events",
      title: "Graduation Ceremony event 2025",
    },
    {
      id: 7,
      src: "/gallery/classroom-1.jpg",
      alt: "Students learning with teacher",
      category: "Classrooms",
      title: "Class Session",
    },
    {
      id: 8,
      src: "/gallery/classroom-2.jpg",
      alt: "Islamic Studies classroom",
      category: "Classrooms",
      title: "Class Session",
    },

    {
      id: 9,
      src: "/gallery/classroom-3.jpg",
      alt: "Islamic Studies classroom",
      category: "Classrooms",
      title: "Class Session",
    },
    {
      id: 10,
      src: "/gallery/classroom-4.jpg",
      alt: "Islamic Studies classroom",
      category: "Classrooms",
      title: "Class Session",
    },

    {
      id: 11,
      src: "/gallery/classroom-5.jpg",
      alt: "Islamic Studies classroom",
      category: "Classrooms",
      title: "Class Session",
    },
    {
      id: 12,
      src: "/gallery/classroom-6.jpg",
      alt: "Islamic Studies classroom",
      category: "Classrooms",
      title: "Class Session",
    },
  ];

  const categories = ["All", "Classrooms", "Events"];

  // Filter images based on selected category
  const filteredImages =
    selectedCategory === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === selectedCategory);

  // Open lightbox
  const openLightbox = (image: (typeof galleryImages)[0]) => {
    setLightboxImage(image);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxImage(null);
    // Re-enable body scroll
    document.body.style.overflow = "unset";
  };

  // Close on Escape key
  useState(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  });

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Photo Gallery
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore our Islamic education centre through photos of our
              classrooms, facilities, events, and student activities.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
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

          {/* Gallery Grid - WITH FILTERING */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                onClick={() => openLightbox(image)}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer"
              >
                {/* Actual Image */}
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center text-white p-4">
                    <p className="font-semibold mb-2">{image.title}</p>
                    <p className="text-sm text-white/80 mb-4">
                      {image.category}
                    </p>
                    <div className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm inline-flex items-center gap-2">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                      View Fullscreen
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results Message */}
          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No photos found in this category.
              </p>
            </div>
          )}

          {/* Photo Count */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredImages.length} of {galleryImages.length} photos
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Want to Visit Our Centre?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              See our facilities in person and meet our qualified teachers.
              Contact us to arrange a visit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-3 bg-background border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-[10000] p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8 text-white" />
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={lightboxImage.src}
                alt={lightboxImage.alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{lightboxImage.title}</h3>
              <p className="text-white/80">{lightboxImage.category}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Press ESC or click outside to close
          </div>
        </div>
      )}
    </div>
  );
}
