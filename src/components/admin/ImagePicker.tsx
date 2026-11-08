import { Info, Link2, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useRef, type ChangeEvent } from "react";
import { toast } from "sonner";

import { SmartImage } from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCEPTED_IMAGE_TYPES, isGoogleDriveUrl, resolveImageUrl, validateImageFile } from "@/lib/images";
import type { ImageValue } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface ImagePickerProps {
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  label?: string;
  /** "contain" keeps logos/icons uncropped in the preview. */
  previewFit?: "cover" | "contain";
  allowUpload?: boolean;
}

export function previewSrc(value: ImageValue): string | null {
  if (value.source === "upload") return value.previewUrl ?? value.uploadedUrl;
  const resolved = resolveImageUrl(value.originalUrl);
  return resolved.ok ? resolved.url : null;
}

export function ImagePicker({ value, onChange, label = "Image", previewFit = "contain", allowUpload = true }: ImagePickerProps) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const resolved = value.originalUrl.trim() ? resolveImageUrl(value.originalUrl) : null;
  const src = previewSrc(value);

  // Release object URLs we created for local previews.
  useEffect(() => {
    const url = value.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [value.previewUrl]);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    onChange({ ...value, source: "upload", file, previewUrl: URL.createObjectURL(file) });
  };

  const removeImage = () => {
    if (value.source === "upload") onChange({ ...value, file: null, previewUrl: null, uploadedUrl: null });
    else onChange({ ...value, originalUrl: "" });
  };

  const tabs = [
    { key: "url" as const, label: "Google Drive / Image URL", icon: Link2 },
    ...(allowUpload ? [{ key: "upload" as const, label: "Upload Image From Computer", icon: Upload }] : []),
  ];

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      {tabs.length > 1 && (
        <div className="grid grid-cols-1 gap-2 rounded-xl bg-muted p-1 sm:grid-cols-2" role="radiogroup" aria-label="Image source">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={value.source === t.key}
              onClick={() => onChange({ ...value, source: t.key })}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                value.source === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div className="space-y-2">
          {value.source === "url" ? (
            <>
              <Label htmlFor={`${id}-url`} className="text-xs text-muted-foreground">
                Google Drive / External Image URL
              </Label>
              <Input
                id={`${id}-url`}
                type="url"
                inputMode="url"
                placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
                value={value.originalUrl}
                onChange={(e) => onChange({ ...value, originalUrl: e.target.value })}
              />
              {resolved && !resolved.ok && <p className="text-xs text-destructive">{resolved.error}</p>}
              {resolved?.ok && resolved.driveId && (
                <p className="text-xs text-success">Google Drive file detected — converted to a direct image link.</p>
              )}
              <p className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {isGoogleDriveUrl(value.originalUrl) || !value.originalUrl
                  ? "For Google Drive images, set sharing to “Anyone with the link” so visitors can see them."
                  : "Any JPG, PNG, WebP, GIF or SVG link works."}
              </p>
            </>
          ) : (
            <>
              <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={onFile} />
              <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> {src ? "Replace image" : "Upload Image From Computer"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {value.file ? `Selected: ${value.file.name}` : "JPG, PNG, WebP or GIF, up to 10 MB. Saved when you click Save."}
              </p>
            </>
          )}
          {src && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={removeImage}>
              <Trash2 className="h-4 w-4" /> Remove image
            </Button>
          )}
        </div>
        <SmartImage
          src={src}
          alt="Preview"
          fit={previewFit}
          className="aspect-video w-full rounded-xl border border-border sm:aspect-square"
        />
      </div>
    </fieldset>
  );
}
