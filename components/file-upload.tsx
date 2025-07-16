"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  label: string
  description: string
  file: File | null
  onFileChange: (file: File | null) => void
  accept?: string
  disabled?: boolean
}

export default function FileUpload({
  label,
  description,
  file,
  onFileChange,
  accept = "image/*",
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFile = droppedFiles.find((f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024)

    if (validFile) {
      onFileChange(validFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.size <= 10 * 1024 * 1024) {
      onFileChange(selectedFile)
    }
  }

  const handleRemove = () => {
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver && !disabled && "border-blue-400 bg-blue-50",
          file && "border-green-400 bg-green-50",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          {file ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <FileImage className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">{file.name}</div>
                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-sm text-gray-900">Click to upload or drag and drop</div>
                <div className="text-xs text-gray-500">{description}</div>
                <div className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
