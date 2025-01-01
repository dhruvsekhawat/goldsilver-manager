import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ProfileSelectorProps {
  currentProfile: string;
  profiles: string[];
  onProfileChange: (profile: string) => void;
  onAddProfile: (profile: string) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  currentProfile,
  profiles,
  onProfileChange,
  onAddProfile,
}) => {
  const { toast } = useToast();

  const handleAddProfile = () => {
    const name = prompt("Enter new profile name:");
    if (!name) return;
    
    if (profiles.includes(name)) {
      toast({
        title: "Error",
        description: "Profile already exists",
        variant: "destructive",
      });
      return;
    }
    
    onAddProfile(name);
    toast({
      title: "Success",
      description: "Profile added successfully",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentProfile} onValueChange={onProfileChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select profile" />
        </SelectTrigger>
        <SelectContent>
          {profiles.map((profile) => (
            <SelectItem key={profile} value={profile}>
              {profile}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={handleAddProfile}>
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};