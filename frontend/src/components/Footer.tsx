"use client";

import { Clock, Globe, MessageCircle, Share2, Mail } from "lucide-react";

const socialIcons = [
  { icon: Globe, label: "GitHub" },
  { icon: MessageCircle, label: "Twitter" },
  { icon: Share2, label: "LinkedIn" },
  { icon: Mail, label: "Email" },
];

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "Integrations", href: "#" },
  { label: "Changelog", href: "#" },
  { label: "API", href: "#" },
];

const companyLinks = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Security", href: "#" },
  { label: "Cookie Policy", href: "#" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <a href="#" className="flex items-center gap-2.5 group mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-text">
                Chronos
                <span className="text-gradient-primary">Intel</span>
              </span>
            </a>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs mb-6">
              AI-powered investigation platform for enterprise security teams.
              Transform evidence into truth.
            </p>
            <div className="flex items-center gap-3">
              {socialIcons.map((item) => (
                <a
                  key={item.label}
                  href="#"
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-2 border border-border hover:border-primary/30 hover:bg-surface-3 text-text-muted hover:text-primary-light transition-all duration-200"
                  aria-label={item.label}
                >
                  <item.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-5">
              Product
            </h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-text transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; {year} ChronosIntel. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            Built with{" "}
            <span className="text-primary-light">&hearts;</span> for
            investigators.
          </p>
        </div>
      </div>
    </footer>
  );
}
