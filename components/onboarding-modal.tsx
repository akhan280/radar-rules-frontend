"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { completeOnboarding } from "../lib/actions/user-actions";

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      await completeOnboarding();
      setIsOpen(false);
      toast.success("Onboarding completed!");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Radar Rules!</DialogTitle>
          <DialogDescription>
            Let's get you started with our platform. We'll help you set up your
            first project and show you how to use our fraud detection tools.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h3 className="font-medium">Quick Start Guide:</h3>
            <ul className="list-disc pl-4 space-y-2">
              <li>Create your first project</li>
              <li>Upload your CSV data</li>
              <li>Review fraud detection rules</li>
              <li>Analyze results and optimize</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleComplete} disabled={isLoading}>
            {isLoading ? "Getting Started..." : "Get Started"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
