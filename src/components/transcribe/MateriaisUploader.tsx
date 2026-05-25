"use client"

import { FileText, ImageIcon, Loader2, Paperclip, X } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  extractMaterial,
  formatFileSize,
  type MaterialItem,
} from "@/lib/material-extract"

interface MateriaisUploaderProps {
  materials: MaterialItem[]
  onChange: (materials: MaterialItem[]) => void
  disabled?: boolean
}

const ACCEPT =
  ".txt,.md,.markdown,.csv,.json,image/png,image/jpeg,image/webp,image/gif"

export function MateriaisUploader({
  materials,
  onChange,
  disabled,
}: MateriaisUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [loadingCount, setLoadingCount] = useState(0)

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    if (arr.length === 0) return

    setLoadingCount((c) => c + arr.length)
    const added: MaterialItem[] = []
    for (const file of arr) {
      try {
        const item = await extractMaterial(file)
        added.push(item)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : `Falha em ${file.name}`,
        )
      }
    }
    setLoadingCount((c) => Math.max(0, c - arr.length))
    if (added.length > 0) {
      onChange([...materials, ...added])
      toast.success(
        added.length === 1
          ? `"${added[0].name}" anexado`
          : `${added.length} arquivos anexados`,
      )
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ""
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  const remove = (id: string) => {
    onChange(materials.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="text-muted-foreground h-4 w-4" />
          <h3 className="text-foreground text-sm font-semibold">
            Materiais de apoio
          </h3>
          {materials.length > 0 && (
            <span className="text-muted-foreground text-xs">
              ({materials.length})
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || loadingCount > 0}
        >
          {loadingCount > 0 ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : null}
          Anexar
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Anexe rascunhos, fotos de quadro/post-it ou notas. A IA usa isso como
        contexto extra na hora de gerar a ata.
      </p>

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <p className="text-muted-foreground text-xs">
          Arrasta arquivos aqui ou clica pra escolher
        </p>
        <p className="text-muted-foreground/70 mt-0.5 text-[10px]">
          .txt, .md, .csv, .json, .png, .jpg, .webp, .gif · até 8MB por imagem
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {materials.length > 0 && (
        <ul className="space-y-1.5">
          {materials.map((m) => (
            <li
              key={m.id}
              className="border-border bg-muted/30 flex items-center gap-2 rounded-md border px-2.5 py-1.5"
            >
              {m.kind === "image" ? (
                m.dataUrl ? (
                  <img
                    src={m.dataUrl}
                    alt={m.name}
                    className="border-border h-8 w-8 shrink-0 rounded border object-cover"
                  />
                ) : (
                  <ImageIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                )
              ) : (
                <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-xs font-medium">
                  {m.name}
                </p>
                <p className="text-muted-foreground text-[10px]">
                  {formatFileSize(m.sizeBytes)}
                  {m.kind === "text" && m.text
                    ? ` · ${m.text.length.toLocaleString("pt-BR")} chars`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(m.id)
                }}
                disabled={disabled}
                className="text-muted-foreground hover:text-destructive shrink-0 rounded p-1 transition-colors disabled:opacity-50"
                aria-label={`Remover ${m.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
