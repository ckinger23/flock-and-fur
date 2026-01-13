"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCleanerProfile, updateCleanerProfile } from "@/lib/actions/profile";
import { toast } from "sonner";

export default function CleanerProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [formData, setFormData] = useState({
    bio: "",
    animalExperience: "",
    yearsExperience: "",
    hasTransportation: false,
    serviceAreas: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      const result = await getCleanerProfile();
      if (result.profile) {
        setFormData({
          bio: result.profile.bio || "",
          animalExperience: result.profile.animalExperience || "",
          yearsExperience: result.profile.yearsExperience?.toString() || "",
          hasTransportation: result.profile.hasTransportation || false,
          serviceAreas: result.profile.serviceAreas?.join(", ") || "",
        });
      }
      setIsFetching(false);
    }
    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await updateCleanerProfile({
      bio: formData.bio || undefined,
      animalExperience: formData.animalExperience || undefined,
      yearsExperience: formData.yearsExperience
        ? parseInt(formData.yearsExperience)
        : undefined,
      hasTransportation: formData.hasTransportation,
      serviceAreas: formData.serviceAreas
        ? formData.serviceAreas.split(",").map((s) => s.trim())
        : [],
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile updated successfully!");
      router.refresh();
    }

    setIsLoading(false);
  };

  if (isFetching) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/cleaner"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            A complete profile helps clients trust you and increases your
            chances of getting hired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell clients about yourself, your background, and why you love working with animals..."
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                disabled={isLoading}
              />
            </div>

            {/* Animal Experience */}
            <div className="space-y-2">
              <Label htmlFor="animalExperience">
                Animal Handling Experience
              </Label>
              <Textarea
                id="animalExperience"
                name="animalExperience"
                placeholder="Describe your experience with animals: types you've worked with, care experience, any certifications..."
                value={formData.animalExperience}
                onChange={handleChange}
                rows={4}
                disabled={isLoading}
              />
            </div>

            {/* Years Experience */}
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                name="yearsExperience"
                type="number"
                min="0"
                placeholder="e.g., 5"
                value={formData.yearsExperience}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Service Areas */}
            <div className="space-y-2">
              <Label htmlFor="serviceAreas">Service Areas</Label>
              <Input
                id="serviceAreas"
                name="serviceAreas"
                placeholder="e.g., Downtown, Homewood, Vestavia Hills"
                value={formData.serviceAreas}
                onChange={handleChange}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Separate areas with commas
              </p>
            </div>

            {/* Transportation */}
            <div className="flex items-center gap-2">
              <input
                id="hasTransportation"
                name="hasTransportation"
                type="checkbox"
                checked={formData.hasTransportation}
                onChange={handleChange}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="hasTransportation" className="font-normal">
                I have reliable transportation
              </Label>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
