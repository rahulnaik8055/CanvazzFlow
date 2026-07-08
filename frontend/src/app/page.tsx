"use client";

import NavBar from "@/components/landing/NavBar";
import HeroSection from "@/components/landing/HeroSection";
import TechStackSection from "@/components/landing/TechStackSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
import HighlightsSection from "@/components/landing/HighlightsSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main>
        <HeroSection />
        <TechStackSection />
        <FeaturesSection />
        <WorkflowSection />
        <ArchitectureSection />
        <HighlightsSection />
        <ShowcaseSection />
      </main>
      <Footer />
    </div>
  );
}
