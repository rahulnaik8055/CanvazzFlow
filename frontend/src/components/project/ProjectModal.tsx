import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
}

export function ProjectModal({ open, onClose, onSubmit }: ProjectModalProps) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
      setForm({ name: "", description: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">
              Project name
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Marketing redesign"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="What's this project about?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>
            {saving ? "Creating..." : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
