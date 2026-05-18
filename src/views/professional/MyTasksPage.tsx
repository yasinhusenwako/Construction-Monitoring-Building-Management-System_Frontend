"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { fetchLiveProjects, fetchLiveBookings } from "@/lib/live-api";
import { getMyAssignments, getMyBookingAssignments } from "@/lib/multi-professional-api";
import { ProjectsPage } from "@/views/projects/ProjectsPage";
import { BookingsPage } from "@/views/bookings/BookingsPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, Calendar } from "lucide-react";

export function MyTasksPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("projects");
  const [projectCount, setProjectCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        if (currentUser?.id) {
          // Fetch project assignments
          const projectAssignments = await getMyAssignments();
          setProjectCount(projectAssignments.length);

          // Fetch booking assignments
          const bookingAssignments = await getMyBookingAssignments();
          setBookingCount(bookingAssignments.length);
        }
      } catch (error) {
        console.error("Failed to fetch task counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [currentUser?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0E2271]">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            View your assigned projects and bookings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen size={16} />
            Projects
            {!loading && projectCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[#1A3580] px-2 py-0.5 text-xs font-semibold text-white">
                {projectCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar size={16} />
            Bookings
            {!loading && bookingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[#1A3580] px-2 py-0.5 text-xs font-semibold text-white">
                {bookingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          <ProjectsPage />
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <BookingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
