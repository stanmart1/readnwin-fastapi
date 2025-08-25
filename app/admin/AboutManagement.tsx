"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import { EnhancedApiClient } from "@/lib/api-enhanced";

// Dynamically import SecureQuill to avoid SSR issues
const SecureQuill = dynamic(() => import("@/components/SecureQuill"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse"></div>,
});



interface AboutContent {
  hero: {
    title: string;
    subtitle: string;
  };
  aboutSection?: {
    image: string;
    imageAlt: string;
  };
  mission: {
    title: string;
    description: string;
    features: string[];
  };
  missionGrid: Array<{
    icon: string;
    title: string;
    description: string;
    color: string;
  }>;
  stats: Array<{
    number: string;
    label: string;
  }>;
  values: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  story: {
    title: string;
    description: string;
    timeline: Array<{
      year: string;
      title: string;
      description: string;
    }>;
  };
  team: Array<{
    name: string;
    role: string;
    bio: string;
    image: string;
    linkedin: string;
    twitter: string;
  }>;
  cta: {
    title: string;
    description: string;
    primaryButton: string;
    secondaryButton: string;
  };
}

export default function AboutManagement() {
  const [content, setContent] = useState<AboutContent>({
    hero: { title: "", subtitle: "" },
    aboutSection: { image: "", imageAlt: "" },
    mission: { title: "", description: "", features: [] },
    missionGrid: [],
    stats: [],
    values: [],
    story: { title: "", description: "", timeline: [] },
    team: [],
    cta: { title: "", description: "", primaryButton: "", secondaryButton: "" },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [showPreview, setShowPreview] = useState(false);

  const loadAboutContent = useCallback(async () => {
    try {
      const api = new EnhancedApiClient();
      const token = localStorage.getItem("token");
      if (token) {
        api.setToken(token);
      }

      const data = await api.request("/about/admin");
      // Ensure missionGrid exists, add default if missing
      if (!data.missionGrid) {
        data.missionGrid = getDefaultContent().missionGrid;
      }
      setContent(data);
    } catch (error) {
      console.error("Error loading about content:", error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAboutContent();
  }, [loadAboutContent]);

  const getDefaultContent = (): AboutContent => ({
    hero: {
      title: "About ReadnWin",
      subtitle:
        "Revolutionizing the way people read, learn, and grow through technology",
    },
    aboutSection: {
      image: "/images/about.png",
      imageAlt: "ReadnWin about section - Empowering minds through reading",
    },
    mission: {
      title: "Our Mission",
      description:
        "At ReadnWin, we believe that reading is the foundation of personal growth and societal progress. Our mission is to make quality literature accessible to everyone, everywhere.",
      features: [
        "Unlimited Access",
        "AI-Powered Recommendations",
        "Global Community",
      ],
    },
    missionGrid: [
      {
        icon: "ri-book-line",
        title: "Digital Library",
        description: "Access millions of books instantly",
        color: "text-blue-600",
      },
      {
        icon: "ri-brain-line",
        title: "Smart Learning",
        description: "AI-powered reading insights",
        color: "text-purple-600",
      },
      {
        icon: "ri-group-line",
        title: "Reader Community",
        description: "Connect with fellow readers",
        color: "text-cyan-600",
      },
      {
        icon: "ri-device-line",
        title: "Multi-Platform",
        description: "Read anywhere, anytime",
        color: "text-green-600",
      },
    ],
    stats: [
      { number: "50K+", label: "Active Readers" },
      { number: "100K+", label: "Books Available" },
      { number: "95%", label: "Reader Satisfaction" },
      { number: "24/7", label: "Support Available" },
    ],
    values: [
      {
        icon: "ri-book-open-line",
        title: "Accessibility",
        description:
          "Making reading accessible to everyone, regardless of background or ability.",
      },
      {
        icon: "ri-lightbulb-line",
        title: "Innovation",
        description:
          "Continuously innovating to enhance the reading experience with cutting-edge technology.",
      },
      {
        icon: "ri-heart-line",
        title: "Community",
        description:
          "Building a global community of readers who share knowledge and inspire each other.",
      },
      {
        icon: "ri-shield-check-line",
        title: "Quality",
        description:
          "Maintaining the highest standards in content curation and platform reliability.",
      },
    ],
    story: {
      title: "Our Story",
      description:
        "ReadnWin was born from a simple observation: while technology was advancing rapidly, the way we read and access literature remained largely unchanged.",
      timeline: [
        {
          year: "2019",
          title: "Founded",
          description: "Started with a vision to democratize reading",
        },
        {
          year: "2021",
          title: "Growth",
          description: "Reached 10,000 active readers",
        },
        {
          year: "2023",
          title: "Innovation",
          description: "Launched AI-powered reading recommendations",
        },
        {
          year: "2025",
          title: "Expansion",
          description: "Global platform with 50,000+ readers",
        },
      ],
    },
    team: [
      {
        name: "Sarah Johnson",
        role: "CEO & Founder",
        bio: "Former publishing executive with 15+ years in digital reading innovation. Passionate about making literature accessible to everyone.",
        image: "/images/team/sarah-johnson.jpg",
        linkedin: "#",
        twitter: "#",
      },
      {
        name: "Dr. Michael Chen",
        role: "CTO",
        bio: "PhD in Computer Science with expertise in AI and machine learning. Leads our technology innovation and platform development.",
        image: "/images/team/michael-chen.jpg",
        linkedin: "#",
        twitter: "#",
      },
      {
        name: "Emma Rodriguez",
        role: "Head of Content",
        bio: "Former literary agent and editor. Curates our book collection and ensures quality content for our readers.",
        image: "/images/team/emma-rodriguez.jpg",
        linkedin: "#",
        twitter: "#",
      },
      {
        name: "David Wilson",
        role: "Head of Design",
        bio: "Award-winning UX designer focused on creating intuitive reading experiences across all devices.",
        image: "/images/team/david-wilson.jpg",
        linkedin: "#",
        twitter: "#",
      },
    ],
    cta: {
      title: "Join the Reading Revolution",
      description:
        "Start your journey with ReadnWin and discover a world of knowledge, imagination, and growth.",
      primaryButton: "Get Started Free",
      secondaryButton: "Learn More",
    },
  });

  const sanitizeContent = (data: any): any => {
    if (typeof data === 'string') {
      // Basic HTML sanitization - remove script tags and dangerous attributes
      return data
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '');
    } else if (Array.isArray(data)) {
      return data.map(sanitizeContent);
    } else if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = sanitizeContent(value);
      }
      return sanitized;
    }
    return data;
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const api = new EnhancedApiClient();
      const token = localStorage.getItem("token");
      if (token) {
        api.setToken(token);
      }

      // Sanitize content before sending
      const sanitizedContent = sanitizeContent(content);

      await api.request("/about/admin", {
        method: "PUT",
        body: JSON.stringify(sanitizedContent),
      });

      toast.success("About page content saved successfully!");

      // Dispatch event to refresh public pages
      if (typeof window !== "undefined") {
        // Dispatch custom event
        window.dispatchEvent(
          new CustomEvent("about-content-updated", {
            detail: { timestamp: Date.now() },
          }),
        );

        // Also use localStorage to trigger storage event (for cross-tab communication)
        localStorage.setItem("about-content-updated", Date.now().toString());



        // Additional cache busting for any cached API responses
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              if (name.includes("about") || name.includes("api")) {
                caches.delete(name);
              }
            });
          });
        }
      }
    } catch (error) {
      console.error("Error saving about content:", error);
      toast.error("Failed to save content. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateContent = useCallback((section: keyof AboutContent, data: any) => {
    setContent((prev) => ({ ...prev, [section]: data }));
  }, []);

  const addArrayItem = (section: keyof AboutContent, item: any) => {
    setContent((prev) => ({
      ...prev,
      [section]: [...(prev[section] as any[]), item],
    }));
  };

  const removeArrayItem = (section: keyof AboutContent, index: number) => {
    setContent((prev) => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((_, i) => i !== index),
    }));
  };

  const removeMissionFeature = (index: number) => {
    setContent((prev) => ({
      ...prev,
      mission: {
        ...prev.mission,
        features: prev.mission.features.filter((_, i) => i !== index),
      },
    }));
  };

  const removeStoryTimelineItem = (index: number) => {
    setContent((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        timeline: prev.story.timeline.filter((_, i) => i !== index),
      },
    }));
  };

  const updateArrayItem = (
    section: keyof AboutContent,
    index: number,
    data: any,
  ) => {
    setContent((prev) => ({
      ...prev,
      [section]: (prev[section] as any[]).map((item, i) =>
        i === index ? data : item,
      ),
    }));
  };

  const addMissionFeature = () => {
    setContent((prev) => ({
      ...prev,
      mission: {
        ...prev.mission,
        features: [...prev.mission.features, ""],
      },
    }));
  };

  const addStoryTimelineItem = () => {
    setContent((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        timeline: [
          ...prev.story.timeline,
          { year: "", title: "", description: "" },
        ],
      },
    }));
  };

  const updateStoryTimelineItem = (index: number, data: any) => {
    setContent((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        timeline: prev.story.timeline.map((item, i) =>
          i === index ? data : item,
        ),
      },
    }));
  };

  const addMissionGridItem = () => {
    setContent((prev) => ({
      ...prev,
      missionGrid: [
        ...prev.missionGrid,
        { icon: "", title: "", description: "", color: "text-blue-600" },
      ],
    }));
  };

  const removeMissionGridItem = (index: number) => {
    setContent((prev) => ({
      ...prev,
      missionGrid: prev.missionGrid.filter((_, i) => i !== index),
    }));
  };

  const updateMissionGridItem = (index: number, data: any) => {
    setContent((prev) => ({
      ...prev,
      missionGrid: prev.missionGrid.map((item, i) =>
        i === index ? data : item,
      ),
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          About Page Management
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Manage the content displayed on the public About Us page
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4 md:mb-6">
        <nav className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {[
            { id: "hero", label: "Hero Section", icon: "ri-layout-top-line" },
            {
              id: "aboutSection",
              label: "About Section",
              icon: "ri-image-line",
            },
            { id: "mission", label: "Mission", icon: "ri-target-line" },
            { id: "missionGrid", label: "Mission Grid", icon: "ri-grid-line" },
            { id: "stats", label: "Statistics", icon: "ri-bar-chart-line" },
            { id: "values", label: "Values", icon: "ri-heart-line" },
            { id: "story", label: "Story", icon: "ri-book-line" },
            { id: "team", label: "Team", icon: "ri-team-line" },
            { id: "cta", label: "Call to Action", icon: "ri-cursor-line" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                activeSection === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <i className={`${tab.icon} text-sm md:text-base`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Preview Toggle */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
        >
          <i
            className={`${showPreview ? "ri-eye-off-line" : "ri-eye-line"} text-sm md:text-base`}
          ></i>
          <span className="hidden sm:inline">
            {showPreview ? "Hide Preview" : "Show Preview"}
          </span>
          <span className="sm:hidden">{showPreview ? "Hide" : "Preview"}</span>
        </button>
      </div>

      {/* Content Sections */}
      <div className="space-y-4 md:space-y-6">
        {/* Hero Section */}
        {activeSection === "hero" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Hero Section
            </h2>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={content.hero?.title || ""}
                  onChange={(e) =>
                    updateContent("hero", {
                      ...content.hero,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  placeholder="Enter hero title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Subtitle
                </label>
                <textarea
                  value={content.hero?.subtitle || ""}
                  onChange={(e) =>
                    updateContent("hero", {
                      ...content.hero,
                      subtitle: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  placeholder="Enter hero subtitle"
                />
              </div>
            </div>
          </div>
        )}

        {/* About Section */}
        {activeSection === "aboutSection" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              About Section (Homepage)
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <i className="ri-information-line mr-1"></i>
                Configure the image and overlay content displayed in the About
                section on the homepage.
              </p>
            </div>
            <div className="space-y-4">
              {/* Image Upload and Editor Section */}
              <div className="space-y-4">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <i className="ri-information-line mr-1"></i>
                    Upload or change the image displayed in the About Us section
                    on the homepage. Recommended size: 600x400 pixels or larger.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 w-32 h-24">
                      <img
                        src={content.aboutSection?.image || "/images/about.png"}
                        alt={content.aboutSection?.imageAlt || "Current image"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholder-image.jpg";
                          e.currentTarget.alt = "Image not found";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        Current:{" "}
                        {content.aboutSection?.image || "/images/about.png"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById("imageUpload")?.click()
                          }
                          disabled={uploading}
                          className={`px-3 py-1 text-white text-sm rounded-md transition-colors ${
                            uploading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <i
                            className={`${uploading ? "ri-loader-4-line animate-spin" : "ri-upload-line"} mr-1`}
                          ></i>
                          {uploading ? "Uploading..." : "Upload New Image"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newUrl = prompt(
                              "Enter new image URL:",
                              content.aboutSection?.image || "",
                            );
                            if (newUrl) {
                              updateContent("aboutSection", {
                                ...content.aboutSection,
                                image: newUrl,
                              });
                            }
                          }}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                        >
                          <i className="ri-link mr-1"></i>
                          Change URL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Reset to default image?")) {
                              updateContent("aboutSection", {
                                ...content.aboutSection,
                                image: "/images/about.png",
                              });
                            }
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                        >
                          <i className="ri-refresh-line mr-1"></i>
                          Reset to Default
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File size must be less than 5MB");
                        return;
                      }
                      if (!file.type.startsWith('image/')) {
                        toast.error("Please select a valid image file");
                        return;
                      }
                      try {
                        setUploading(true);
                        const formData = new FormData();
                        formData.append("image", file);

                        const api = new EnhancedApiClient();
                        const token = localStorage.getItem("token");
                        if (token) {
                          api.setToken(token);
                        }
                        
                        const response = await api.uploadFile("/about/upload-image", formData);

                        updateContent("aboutSection", {
                          ...content.aboutSection,
                          image: response.url,
                        });
                        toast.success("Image uploaded successfully!");
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast.error(
                          "Failed to upload image. Please try again.",
                        );
                      } finally {
                        setUploading(false);
                      }
                    }
                  }}
                />

                {/* Image URL Input (for manual entry) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={content.aboutSection?.image || ""}
                    onChange={(e) =>
                      updateContent("aboutSection", {
                        ...content.aboutSection,
                        image: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter image URL (e.g., /images/about.png)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the path to your image file (e.g.,
                    /images/your-image.jpg) or use the upload button above
                  </p>
                </div>

                {/* Image Information */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Image Guidelines
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • <strong>Recommended size:</strong> 600x400 pixels or
                      larger
                    </li>
                    <li>
                      • <strong>Supported formats:</strong> JPG, PNG, GIF, WebP
                    </li>
                    <li>
                      • <strong>Maximum file size:</strong> 5MB
                    </li>
                    <li>
                      • <strong>Best results:</strong> High-quality images with
                      good contrast
                    </li>
                    <li>
                      • <strong>Accessibility:</strong> Ensure the image has
                      meaningful alt text
                    </li>
                  </ul>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Alt Text
                </label>
                <input
                  type="text"
                  value={content.aboutSection?.imageAlt || ""}
                  onChange={(e) =>
                    updateContent("aboutSection", {
                      ...content.aboutSection,
                      imageAlt: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter image alt text for accessibility"
                />
              </div>

              {/* Image Preview */}
              {content.aboutSection?.image && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Preview (How it will appear on homepage)
                  </label>
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 max-w-md shadow-lg">
                    <img
                      src={content.aboutSection.image}
                      alt={content.aboutSection.imageAlt || "Preview"}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/about.png";
                        e.currentTarget.alt =
                          "Image not found - using fallback";
                        toast.error(
                          "Failed to load uploaded image, using fallback",
                        );
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This preview shows how the image will appear on the homepage
                    About section
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mission Section */}
        {activeSection === "mission" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Mission Section
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <i className="ri-information-line mr-1"></i>
                Use the rich text editor below to format your mission
                description with bold text, lists, and other formatting options.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={content.mission?.title || ""}
                  onChange={(e) =>
                    updateContent("mission", {
                      ...content.mission,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  placeholder="Enter mission title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Description
                </label>
                <SecureQuill
                  value={content.mission?.description || ""}
                  onChange={(value) =>
                    updateContent("mission", {
                      ...content.mission,
                      description: value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  {(content.mission?.features || []).map((feature, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...(content.mission?.features || [])];
                          newFeatures[index] = e.target.value;
                          updateContent("mission", {
                            ...content.mission,
                            features: newFeatures,
                          });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter feature"
                      />
                      <button
                        onClick={() => removeMissionFeature(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addMissionFeature}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mission Grid Section */}
        {activeSection === "missionGrid" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Mission Grid Section
            </h2>
            <p className="text-gray-600 mb-4 md:mb-6">
              Manage the grid components displayed beside the mission text on
              the About page.
            </p>
            <div className="space-y-3 md:space-y-4">
              {(content.missionGrid || []).filter(item => item != null).map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      Grid Item {index + 1}
                    </h3>
                    <button
                      onClick={() => removeMissionGridItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon (Remix Icon class)
                      </label>
                      <input
                        type="text"
                        value={item?.icon || ""}
                        onChange={(e) =>
                          updateMissionGridItem(index, {
                            ...item,
                            icon: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., ri-book-line"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color Class
                      </label>
                      <select
                        value={item?.color || "text-blue-600"}
                        onChange={(e) =>
                          updateMissionGridItem(index, {
                            ...item,
                            color: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text-blue-600">Blue</option>
                        <option value="text-purple-600">Purple</option>
                        <option value="text-cyan-600">Cyan</option>
                        <option value="text-green-600">Green</option>
                        <option value="text-red-600">Red</option>
                        <option value="text-yellow-600">Yellow</option>
                        <option value="text-indigo-600">Indigo</option>
                        <option value="text-pink-600">Pink</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={item?.title || ""}
                        onChange={(e) =>
                          updateMissionGridItem(index, {
                            ...item,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter grid item title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item?.description || ""}
                        onChange={(e) =>
                          updateMissionGridItem(index, {
                            ...item,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter grid item description"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addMissionGridItem}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Grid Item
              </button>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {activeSection === "stats" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Statistics Section
            </h2>
            <div className="space-y-3 md:space-y-4">
              {(content.stats || []).map((stat, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      Stat {index + 1}
                    </h3>
                    <button
                      onClick={() => removeArrayItem("stats", index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number
                      </label>
                      <input
                        type="text"
                        value={stat.number}
                        onChange={(e) =>
                          updateArrayItem("stats", index, {
                            ...stat,
                            number: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 50K+"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) =>
                          updateArrayItem("stats", index, {
                            ...stat,
                            label: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Active Readers"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addArrayItem("stats", { number: "", label: "" })}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Statistic
              </button>
            </div>
          </div>
        )}

        {/* Values Section */}
        {activeSection === "values" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Values Section
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <i className="ri-information-line mr-1"></i>
                Use the rich text editor below to format your value descriptions
                with bold text, lists, and other formatting options.
              </p>
            </div>
            <div className="space-y-4">
              {(content.values || []).map((value, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      Value {index + 1}
                    </h3>
                    <button
                      onClick={() => removeArrayItem("values", index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon (Remix Icon class)
                      </label>
                      <input
                        type="text"
                        value={value?.icon || ""}
                        onChange={(e) =>
                          updateArrayItem("values", index, {
                            ...value,
                            icon: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., ri-heart-line"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={value?.title || ""}
                        onChange={(e) =>
                          updateArrayItem("values", index, {
                            ...value,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter value title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <SecureQuill
                        value={value.description}
                        onChange={(newValue) =>
                          updateArrayItem("values", index, {
                            ...value,
                            description: newValue,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  addArrayItem("values", {
                    icon: "",
                    title: "",
                    description: "",
                  })
                }
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Value
              </button>
            </div>
          </div>
        )}

        {/* Story Section */}
        {activeSection === "story" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Story Section
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <i className="ri-information-line mr-1"></i>
                Use the rich text editor below to format your story description
                with bold text, lists, and other formatting options.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={content.story?.title || ""}
                  onChange={(e) =>
                    updateContent("story", {
                      ...content.story,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter story title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Description
                </label>
                <SecureQuill
                  value={content.story?.description || ""}
                  onChange={(value) =>
                    updateContent("story", {
                      ...content.story,
                      description: value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline
                </label>
                <div className="space-y-3">
                  {(content.story?.timeline || []).map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">
                          Timeline Item {index + 1}
                        </h3>
                        <button
                          onClick={() => removeStoryTimelineItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year
                          </label>
                          <input
                            type="text"
                            value={item?.year || ""}
                            onChange={(e) =>
                              updateStoryTimelineItem(index, {
                                ...item,
                                year: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 2019"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={item?.title || ""}
                            onChange={(e) =>
                              updateStoryTimelineItem(index, {
                                ...item,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Founded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item?.description || ""}
                            onChange={(e) =>
                              updateStoryTimelineItem(index, {
                                ...item,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter description"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addStoryTimelineItem}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Timeline Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Section */}
        {activeSection === "team" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Team Section
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <i className="ri-information-line mr-1"></i>
                Use the rich text editor below to format team member bios with
                bold text, lists, and other formatting options.
              </p>
            </div>
            <div className="space-y-4">
              {(content.team || []).map((member, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      Team Member {index + 1}
                    </h3>
                    <button
                      onClick={() => removeArrayItem("team", index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={member?.name || ""}
                        onChange={(e) =>
                          updateArrayItem("team", index, {
                            ...member,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter member name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={member?.role || ""}
                        onChange={(e) =>
                          updateArrayItem("team", index, {
                            ...member,
                            role: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter member role"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <SecureQuill
                        value={member?.bio || ""}
                        onChange={(value) =>
                          updateArrayItem("team", index, {
                            ...member,
                            bio: value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={member?.image || ""}
                        onChange={(e) =>
                          updateArrayItem("team", index, {
                            ...member,
                            image: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL
                      </label>
                      <input
                        type="text"
                        value={member?.linkedin || ""}
                        onChange={(e) =>
                          updateArrayItem("team", index, {
                            ...member,
                            linkedin: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter LinkedIn URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter URL
                      </label>
                      <input
                        type="text"
                        value={member?.twitter || ""}
                        onChange={(e) =>
                          updateArrayItem("team", index, {
                            ...member,
                            twitter: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter Twitter URL"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  addArrayItem("team", {
                    name: "",
                    role: "",
                    bio: "",
                    image: "",
                    linkedin: "",
                    twitter: "",
                  })
                }
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Team Member
              </button>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {activeSection === "cta" && (
          <div className="bg-white rounded-lg border p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Call to Action Section
            </h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <i className="ri-information-line mr-1"></i>
                Use the rich text editor below to format your CTA description
                with bold text, lists, and other formatting options.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={content.cta?.title || ""}
                  onChange={(e) =>
                    updateContent("cta", {
                      ...content.cta,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter CTA title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  Description
                </label>
                <SecureQuill
                  value={content.cta?.description || ""}
                  onChange={(value) =>
                    updateContent("cta", { ...content.cta, description: value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={content.cta?.primaryButton || ""}
                    onChange={(e) =>
                      updateContent("cta", {
                        ...content.cta,
                        primaryButton: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter primary button text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Button Text
                  </label>
                  <input
                    type="text"
                    value={content.cta?.secondaryButton || ""}
                    onChange={(e) =>
                      updateContent("cta", {
                        ...content.cta,
                        secondaryButton: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter secondary button text"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="mt-6 md:mt-8 bg-white rounded-lg border p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            Content Preview
          </h2>
          <div className="space-y-4 md:space-y-6">
            {/* Hero Preview */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                Hero Section
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {content.hero.title || "Hero Title"}
                </h1>
                <p className="text-gray-600">
                  {content.hero.subtitle || "Hero subtitle will appear here"}
                </p>
              </div>
            </div>

            {/* About Section Preview */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                About Section (Homepage)
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={content.aboutSection?.image || "/images/about.png"}
                      alt={
                        content.aboutSection?.imageAlt || "About section image"
                      }
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholder-image.jpg";
                        e.currentTarget.alt = "Image not found";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Content Preview
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {content.hero.title ||
                        "About section title will appear here"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {content.hero.subtitle ||
                        "About section subtitle will appear here"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Preview */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                Mission Section
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {content.mission.title || "Mission Title"}
                </h2>
                <div
                  className="text-gray-600 mb-3"
                  dangerouslySetInnerHTML={{
                    __html:
                      content.mission.description ||
                      "Mission description will appear here",
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {(content.mission?.features || []).map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Values Preview */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                Values Section
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.values.slice(0, 2).map((value, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {value.title || "Value Title"}
                    </h4>
                    <div
                      className="text-gray-600 text-sm"
                      dangerouslySetInnerHTML={{
                        __html:
                          value.description ||
                          "Value description will appear here",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Story Preview */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                Story Section
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {content.story.title || "Story Title"}
                </h2>
                <div
                  className="text-gray-600 mb-3"
                  dangerouslySetInnerHTML={{
                    __html:
                      content.story.description ||
                      "Story description will appear here",
                  }}
                />
              </div>
            </div>

            {/* Team Preview */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                Team Section
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.team.slice(0, 2).map((member, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {member.name || "Team Member Name"}
                    </h4>
                    <p className="text-blue-600 text-sm mb-2">
                      {member.role || "Team Member Role"}
                    </p>
                    <div
                      className="text-gray-600 text-sm"
                      dangerouslySetInnerHTML={{
                        __html:
                          member.bio || "Team member bio will appear here",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Preview */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">
                Call to Action Section
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {content.cta.title || "CTA Title"}
                </h2>
                <div
                  className="text-gray-600 mb-3"
                  dangerouslySetInnerHTML={{
                    __html:
                      content.cta.description ||
                      "CTA description will appear here",
                  }}
                />
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
                    {content.cta.primaryButton || "Primary Button"}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm">
                    {content.cta.secondaryButton || "Secondary Button"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => {
              loadAboutContent();
              toast.success("Content refreshed from database!");
            }}
            className="px-4 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
          >
            <i className="ri-refresh-line mr-2"></i>
            Refresh
          </button>

          <button
            onClick={saveContent}
            disabled={saving}
            className="px-4 md:px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
