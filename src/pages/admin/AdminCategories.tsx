import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  FolderTree,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ICONS } from "@/components/admin/IconPicker";
import { IconSelect } from "@/components/admin/IconSelect";
import { ColorPicker } from "@/components/admin/ColorPicker";
import { getErrorMessage } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Category } from "@/lib/types";

const DEFAULT_ICON = "FolderTree";
const DEFAULT_COLOR = "#1e5b3a";

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; color?: string }>
> = Object.fromEntries(ICONS.map(({ name, Component }) => [name, Component]));

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (fetchError) {
      setError(getErrorMessage(fetchError));
    } else {
      setCategories((data ?? []) as Category[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setName("");
    setIcon(DEFAULT_ICON);
    setColor(DEFAULT_COLOR);
    setSortOrder(0);
    setEditingId(null);
  }

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setIcon(category.icon || DEFAULT_ICON);
    setColor(category.color || DEFAULT_COLOR);
    setSortOrder(category.sort_order);
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Category name must be at least 2 characters");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: trimmed,
        slug: slugify(trimmed),
        icon,
        color,
        sort_order: sortOrder,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
        toast.success("Category updated");
      } else {
        const { error: insertError } = await supabase
          .from("categories")
          .insert(payload);

        if (insertError) throw insertError;
        toast.success("Category created");
      }

      resetForm();
      setDialogOpen(false);
      await load();
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Items in this category will become uncategorized.`,
    );
    if (!confirmed) return;

    setBusyId(category.id);

    try {
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (deleteError) throw deleteError;

      toast.success(`${category.name} deleted`);
      if (editingId === category.id) resetForm();
      await load();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError));
    } finally {
      setBusyId(null);
    }
  }

  const slugPreview = name.trim() ? slugify(name) : "category-slug";

  return (
    <div>
      <AdminPageHeader
        icon={FolderTree}
        title="Categories"
        description="Group items so customers can browse quickly."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus />
              Add category
            </Button>
          </div>
        }
      />

      {error && (
        <Alert
          variant="error"
          title="Could not load categories"
          className="mb-4"
        >
          <p>{error}</p>
        </Alert>
      )}

      <div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Create a category to organize your items."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y">
              {categories.map((category) => {
                const categoryIcon = category.icon || DEFAULT_ICON;
                const categoryColor = category.color || DEFAULT_COLOR;
                const IconComponent = ICON_MAP[categoryIcon] ?? FolderTree;
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-4"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: categoryColor }}
                    >
                      <IconComponent size={18} color="#ffffff" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {category.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{category.slug} · order {category.sort_order}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => startEdit(category)}
                    >
                      <Pencil />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Delete ${category.name}`}
                      disabled={busyId === category.id}
                      onClick={() => void handleDelete(category)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit category" : "Add category"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this category name, icon, color, and display order."
                : "Create a category to organize your items."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
              <Label htmlFor="category-icon" className="h-5">
                Icon
              </Label>
              <div className="flex h-5 items-center gap-2">
                <Label htmlFor="category-name">Name</Label>
                <p className="text-xs text-muted-foreground">
                  Slug: <span className="font-mono">{slugPreview}</span>
                </p>
              </div>

              <IconSelect value={icon} onChange={setIcon} />
              <Input
                id="category-name"
                className="h-10"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Bakery"
                maxLength={80}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5 rounded-xl bg-card">
              <Label htmlFor="category-color">Color</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-sort">Sort order</Label>
              <Input
                id="category-sort"
                type="number"
                min={0}
                step={1}
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(Math.max(0, Number(event.target.value) || 0))
                }
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first.
              </p>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : editingId ? <Save /> : <Plus />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Add category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
