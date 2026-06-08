import { Clock, Mail } from "lucide-react";

export default function ComingSoonBanner() {
  return (
    <div className="w-full bg-slate-900 dark:bg-slate-950 py-20 px-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Clock className="h-8 w-8 text-primary" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-white mb-3">
          We're Working On This
        </h2>

        {/* Subtext */}
        <p className="text-slate-400 text-lg mb-2">
          This section is currently being updated.
        </p>
        <p className="text-slate-500 text-base mb-8">
          We're putting the finishing touches on this page to ensure it meets
          the highest standards. Please check back soon.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-600 text-sm">In the meantime</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/apply"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Apply Now for 2026–2027
          </a>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 text-slate-300 rounded-lg font-medium hover:border-slate-400 hover:text-white transition-colors"
          >
            <Mail className="h-4 w-4" />
            Contact Us
          </a>
        </div>

        {/* Footer note */}
        {/* <p className="mt-8 text-xs text-slate-600">
          Al Hikmah Institute Crawley · Islamic Education Centre
        </p> */}
      </div>
    </div>
  );
}
