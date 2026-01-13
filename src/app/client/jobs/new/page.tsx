"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createJob } from "@/lib/actions/jobs";

const animalTypes = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "BIRD", label: "Bird" },
  { value: "HORSE", label: "Horse" },
  { value: "GOAT", label: "Goat" },
  { value: "CHICKEN", label: "Chicken" },
  { value: "PIG", label: "Pig" },
  { value: "COW", label: "Cow" },
  { value: "RABBIT", label: "Rabbit" },
  { value: "OTHER", label: "Other" },
];

const enclosureTypes = [
  { value: "CAGE", label: "Cage" },
  { value: "PEN", label: "Pen" },
  { value: "BARN", label: "Barn" },
  { value: "STABLE", label: "Stable" },
  { value: "COOP", label: "Coop" },
  { value: "YARD", label: "Yard" },
  { value: "KENNEL", label: "Kennel" },
  { value: "OTHER", label: "Other" },
];

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    animalType: "",
    enclosureType: "",
    enclosureSize: "",
    numberOfAnimals: "1",
    address: "",
    zipCode: "",
    suggestedPrice: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await createJob({
        title: formData.title,
        description: formData.description,
        animalTypes: [formData.animalType],
        enclosureType: formData.enclosureType,
        enclosureSize: formData.enclosureSize || undefined,
        numberOfAnimals: parseInt(formData.numberOfAnimals) || 1,
        address: formData.address,
        zipCode: formData.zipCode,
        suggestedPrice: formData.suggestedPrice
          ? parseFloat(formData.suggestedPrice)
          : undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/client/jobs/${result.jobId}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/client"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
          <CardDescription>
            Describe your cleanup needs and we&apos;ll connect you with qualified
            cleaners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Chicken coop cleaning needed"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the job in detail: condition, special requirements, access instructions, etc."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                disabled={isLoading}
              />
            </div>

            {/* Animal & Enclosure */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Animal Type</Label>
                <Select
                  value={formData.animalType}
                  onValueChange={(value) =>
                    handleSelectChange("animalType", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select animal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {animalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Enclosure Type</Label>
                <Select
                  value={formData.enclosureType}
                  onValueChange={(value) =>
                    handleSelectChange("enclosureType", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select enclosure type" />
                  </SelectTrigger>
                  <SelectContent>
                    {enclosureTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Size & Count */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enclosureSize">Enclosure Size (optional)</Label>
                <Input
                  id="enclosureSize"
                  name="enclosureSize"
                  placeholder="e.g., 10x10 feet, small, large"
                  value={formData.enclosureSize}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfAnimals">Number of Animals</Label>
                <Input
                  id="numberOfAnimals"
                  name="numberOfAnimals"
                  type="number"
                  min="1"
                  value={formData.numberOfAnimals}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Street address"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value="Birmingham" disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="35201"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="suggestedPrice">Suggested Price (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="suggestedPrice"
                  name="suggestedPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7"
                  placeholder="0.00"
                  value={formData.suggestedPrice}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank to receive quotes from cleaners
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Posting..." : "Post Job"}
              </Button>
              <Link href="/client">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
