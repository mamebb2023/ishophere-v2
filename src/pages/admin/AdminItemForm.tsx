import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, PackagePlus, PencilLine, PackageX, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/format";
import { centsToPrice, priceToCents } from "@/lib/money";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { uploadItemImage } from "@/lib/storage";
import type { Category, Item } from "@/lib/types";

const itemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional()
    .or(z.literal("")),
  price: z
    .string()
    .trim()
    .min(1, "Enter a price")
    .refine(
      (value) => /^\d+(\.\d{1,2})?$/.test(value),
      "Use a valid price, e.g. 12.99",
    )
    .refine((value) => Number(value) > 0, "Price must be greater than zero"),
  stock: z.number().int().min(0, "Stock cannot be negative").max(100000),
  category_id: z.string(),
  sort_order: z.number().int().min(0).max(100000),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export function AdminItemForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: 0,
      category_id: "",
      sort_order: 0,
    },
  });

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const categoriesResult = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (categoriesResult.error) {
      setError(getErrorMessage(categoriesResult.error));
    } else {
      setCategories((categoriesResult.data ?? []) as Category[]);
    }

    if (id) {
      const itemResult = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (itemResult.error) {
        setError(getErrorMessage(itemResult.error));
      } else if (!itemResult.data) {
        setNotFound(true);
      } else {
        const item = itemResult.data as Item;
        setImageUrl(item.image_url);
        reset({
          name: item.name,
          description: item.description ?? "",
          price: centsToPrice(item.price_cents),
          stock: item.stock,
          category_id: item.category_id ?? "",
          sort_order: item.sort_order,
        });
      }
    }

    setLoading(false);
  }, [id, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(values: ItemFormValues) {
    setSaving(true);
    setError(null);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadItemImage(imageFile);
      }

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        price_cents: priceToCents(values.price),
        stock: values.stock,
        category_id: values.category_id || null,
        sort_order: values.sort_order,
        image_url: finalImageUrl,
      };

      if (isEditing && id) {
        const { error: updateError } = await supabase
          .from("items")
          .update(payload)
          .eq("id", id);
        if (updateError) throw updateError;
        toast.success("Item updated");
      } else {
        const { error: insertError } = await supabase
          .from("items")
          .insert(payload);
        if (insertError) throw insertError;
        toast.success("Item created");
      }

      navigate("/admin/items");
    } catch (submitError) {
      const message = getErrorMessage(submitError);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        icon={PackageX}
        title="Item not found"
        description="This item may have been deleted."
        action={
          <Button asChild>
            <Link to="/admin/items">Back to items</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Link
        to="/admin/items"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to items
      </Link>

      <AdminPageHeader
        icon={isEditing ? PencilLine : PackagePlus}
        title={isEditing ? "Edit item" : "New item"}
        description={
          isEditing
            ? "Update product details, stock, or image."
            : "Add a product to the shop."
        }
      />

      {error ? (
        <Alert variant="error" title="Could not save item" className="mb-4">
          <p>{error}</p>
        </Alert>
      ) : null}

      <form
        id="item-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-6 pb-24 lg:grid-cols-[1fr_360px] lg:pb-0"
      >
        <Card>
          <CardHeader>
            <CardTitle>Item details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Fresh sourdough loaf"
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={6}
                placeholder="What should customers know about this item?"
                {...register("description")}
              />
              {errors.description ? (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  placeholder="12.99"
                  {...register("price")}
                />
                {errors.price ? (
                  <p className="text-sm text-destructive">
                    {errors.price.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category_id">Category</Label>
                <Select id="category_id" {...register("category_id")}>
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min={0}
                  step={1}
                  {...register("stock", { valueAsNumber: true })}
                />
                {errors.stock ? (
                  <p className="text-sm text-destructive">
                    {errors.stock.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  step={1}
                  {...register("sort_order", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first.
                </p>
                {errors.sort_order ? (
                  <p className="text-sm text-destructive">
                    {errors.sort_order.message}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                currentUrl={imageUrl}
                onFileSelected={setImageFile}
              />
            </CardContent>
          </Card>

          <Card className="hidden lg:block">
            <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? <Spinner /> : <Save />}
                {saving
                  ? "Saving…"
                  : isEditing
                    ? "Save changes"
                    : "Create item"}
              </Button>
              <Button asChild variant="outline" type="button">
                <Link to="/admin/items">Cancel</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Setting stock to 0 hides the item from the shop.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Button
            type="submit"
            form="item-form"
            size="lg"
            disabled={saving}
            className="flex-1"
          >
            {saving ? <Spinner /> : <Save />}
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create item"}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/admin/items">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
