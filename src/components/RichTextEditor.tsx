"use client";

import React, { useRef, useEffect, useState } from "react";
import { 
  ImageIcon, 
  Video, 
  Upload, 
  Link as LinkIcon, 
  RotateCcw, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  X 
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaTypeInput, setMediaTypeInput] = useState<"image" | "video">("image");
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [insertPosition, setInsertPosition] = useState<"end" | "cursor">("end");

  const savedRangeRef = useRef<Range | null>(null);
  const isEditingRef = useRef<boolean>(false);

  // Sync value to editor content if changed externally
  useEffect(() => {
    if (editorRef.current && !isEditingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const saveSelection = () => {
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        try {
          const range = sel.getRangeAt(0);
          if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
            // Only save selection if it's inside a specific text node or child element
            savedRangeRef.current = range.cloneRange();
          }
        } catch (e) {
          // ignore
        }
      }
    }
  };

  const restoreSelection = () => {
    if (typeof window !== "undefined" && savedRangeRef.current && editorRef.current) {
      const sel = window.getSelection();
      if (sel) {
        try {
          if (editorRef.current.contains(savedRangeRef.current.commonAncestorContainer)) {
            sel.removeAllRanges();
            sel.addRange(savedRangeRef.current);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  };

  const handleInput = () => {
    isEditingRef.current = true;
    saveSelection();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    setTimeout(() => {
      isEditingRef.current = false;
    }, 100);
  };

  const execCmd = (command: string, arg: string | undefined = undefined) => {
    isEditingRef.current = true;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    document.execCommand(command, false, arg);
    saveSelection();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    setTimeout(() => {
      isEditingRef.current = false;
    }, 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengunggah file.");
      }

      if (json.fileType === "image") {
        insertHtmlAtTarget(
          `<div className="my-4 text-center"><img src="${json.url}" alt="${json.fileName}" class="my-4 max-w-full rounded-2xl border border-zinc-200 shadow-lg mx-auto" /></div>`
        );
      } else {
        insertHtmlAtTarget(
          `<div class="my-4"><video src="${json.url}" controls class="w-full rounded-2xl border border-zinc-200 shadow-lg max-h-[400px] bg-black"></video></div>`
        );
      }
      setShowMediaModal(false);
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat unggah file.");
    } finally {
      setUploading(false);
    }
  };

  const handleInsertUrl = () => {
    if (!mediaUrlInput.trim()) return;
    const url = mediaUrlInput.trim();

    if (mediaTypeInput === "image") {
      insertHtmlAtTarget(
        `<div className="my-4 text-center"><img src="${url}" alt="Gambar Modul" class="my-4 max-w-full rounded-2xl border border-zinc-200 shadow-lg mx-auto" /></div>`
      );
    } else {
      insertHtmlAtTarget(
        `<div class="my-4"><video src="${url}" controls class="w-full rounded-2xl border border-zinc-200 shadow-lg max-h-[400px] bg-black"></video></div>`
      );
    }

    setMediaUrlInput("");
    setShowMediaModal(false);
  };

  const insertHtmlAtTarget = (htmlToInsert: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    isEditingRef.current = true;
    editor.focus();

    let range: Range | null = null;
    const sel = window.getSelection();

    // If position is set to "cursor", try to use saved or active range
    if (insertPosition === "cursor") {
      if (savedRangeRef.current) {
        try {
          if (editor.contains(savedRangeRef.current.commonAncestorContainer)) {
            // Ensure range is not pointing at (editor, 0)
            if (!(savedRangeRef.current.commonAncestorContainer === editor && savedRangeRef.current.startOffset === 0)) {
              range = savedRangeRef.current;
            }
          }
        } catch (e) {
          range = null;
        }
      }

      if (!range && sel && sel.rangeCount > 0) {
        try {
          const activeRange = sel.getRangeAt(0);
          if (editor.contains(activeRange.commonAncestorContainer)) {
            if (!(activeRange.commonAncestorContainer === editor && activeRange.startOffset === 0)) {
              range = activeRange;
            }
          }
        } catch (e) {
          range = null;
        }
      }
    }

    if (range && insertPosition === "cursor") {
      // Insert at active cursor selection
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlToInsert + `<p><br></p>`;
      const fragment = document.createDocumentFragment();
      let child: Node | null;
      let lastInsertedNode: Node | null = null;
      while ((child = tempDiv.firstChild)) {
        lastInsertedNode = fragment.appendChild(child);
      }

      range.deleteContents();
      range.insertNode(fragment);

      if (lastInsertedNode && sel) {
        try {
          const newRange = document.createRange();
          newRange.setStartAfter(lastInsertedNode);
          newRange.setEndAfter(lastInsertedNode);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();
        } catch (e) {}
      }
    } else {
      // Append to the VERY END of the editor content (GUARANTEED AT BOTTOM)
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlToInsert + `<p><br></p>`;
      while (tempDiv.firstChild) {
        editor.appendChild(tempDiv.firstChild);
      }

      // Scroll editor to bottom
      editor.scrollTop = editor.scrollHeight;
    }

    onChange(editor.innerHTML);
    setTimeout(() => {
      isEditingRef.current = false;
    }, 200);
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white shadow-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 p-2 text-xs">
        {/* Text Style */}
        <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2">
          <button
            type="button"
            title="Tebal (Bold)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("bold")}
            className="h-8 w-8 rounded-lg font-black hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
          >
            B
          </button>
          <button
            type="button"
            title="Miring (Italic)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("italic")}
            className="h-8 w-8 rounded-lg italic font-serif hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
          >
            I
          </button>
          <button
            type="button"
            title="Garis Bawah (Underline)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("underline")}
            className="h-8 w-8 rounded-lg underline hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
          >
            U
          </button>
          <button
            type="button"
            title="Coret (Strikethrough)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("strikeThrough")}
            className="h-8 w-8 rounded-lg line-through hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
          >
            S
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-zinc-200 px-2">
          <button
            type="button"
            title="Judul Besar (H1)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("formatBlock", "<h1>")}
            className="px-2 py-1 rounded-lg font-extrabold hover:bg-zinc-200 text-zinc-700 text-3xs uppercase tracking-wider transition cursor-pointer"
          >
            H1
          </button>
          <button
            type="button"
            title="Sub Judul (H2)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("formatBlock", "<h2>")}
            className="px-2 py-1 rounded-lg font-bold hover:bg-zinc-200 text-zinc-700 text-3xs uppercase tracking-wider transition cursor-pointer"
          >
            H2
          </button>
          <button
            type="button"
            title="Teks Normal (Paragraph)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("formatBlock", "<p>")}
            className="px-2 py-1 rounded-lg font-normal hover:bg-zinc-200 text-zinc-600 text-3xs uppercase tracking-wider transition cursor-pointer"
          >
            Teks
          </button>
        </div>

        {/* Alignments */}
        <div className="flex items-center gap-0.5 border-r border-zinc-200 px-2">
          <button
            type="button"
            title="Rata Kiri"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("justifyLeft")}
            className="h-8 w-8 rounded-lg hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center justify-center"
          >
            <AlignLeft className="w-4 h-4 text-zinc-700" />
          </button>
          <button
            type="button"
            title="Rata Tengah"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("justifyCenter")}
            className="h-8 w-8 rounded-lg hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center justify-center"
          >
            <AlignCenter className="w-4 h-4 text-zinc-700" />
          </button>
          <button
            type="button"
            title="Rata Kanan"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("justifyRight")}
            className="h-8 w-8 rounded-lg hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center justify-center"
          >
            <AlignRight className="w-4 h-4 text-zinc-700" />
          </button>
          <button
            type="button"
            title="Rata Kanan Kiri (Justify)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("justifyFull")}
            className="h-8 w-8 rounded-lg hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center justify-center"
          >
            <AlignJustify className="w-4 h-4 text-zinc-700" />
          </button>
        </div>

        {/* Lists & Quote */}
        <div className="flex items-center gap-1 border-r border-zinc-200 px-2">
          <button
            type="button"
            title="Poin Poin (Bullet List)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("insertUnorderedList")}
            className="px-2 py-1 rounded-lg hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center justify-center text-xs font-bold"
          >
            • List
          </button>
          <button
            type="button"
            title="Daftar Angka (Numbered List)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("insertOrderedList")}
            className="px-2 py-1 rounded-lg hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center justify-center text-xs font-bold"
          >
            1. List
          </button>
          <button
            type="button"
            title="Kutipan (Blockquote)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("formatBlock", "<blockquote>")}
            className="h-8 w-8 rounded-lg hover:bg-zinc-200 text-zinc-700 transition cursor-pointer flex items-center justify-center text-xs font-serif font-bold"
          >
            “ ”
          </button>
        </div>

        {/* Media & Link Insertion */}
        <div className="flex items-center gap-1.5 pl-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              saveSelection();
              setShowMediaModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#5A77DF]/10 hover:bg-[#5A77DF]/20 border border-[#5A77DF]/30 px-3 py-1 text-3xs font-extrabold text-[#5A77DF] transition cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <Video className="w-3.5 h-3.5" />
            <span>Sisipkan Gambar & Video</span>
          </button>
          <button
            type="button"
            title="Hapus Format (Clear Formatting)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd("removeFormat")}
            className="h-8 w-8 rounded-lg hover:bg-rose-100 text-rose-600 transition cursor-pointer flex items-center justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        onFocus={saveSelection}
        onClick={saveSelection}
        className="min-h-[220px] max-h-[500px] overflow-y-auto p-4 text-sm text-zinc-900 outline-none focus:ring-0 prose max-w-none custom-scrollbar font-sans bg-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-[#5A77DF] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:text-xl [&_h1]:font-black [&_h2]:text-lg [&_h2]:font-bold"
        style={{ whiteSpace: "pre-wrap" }}
        data-placeholder={placeholder || "Tuliskan materi pelajaran secara mendalam di sini..."}
      />

      {/* Media Upload / Insert Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 space-y-5 shadow-2xl text-left text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#5A77DF]" />
                <Video className="w-4 h-4 text-[#5A77DF]" />
                <span>Sisipkan Media Ke Materi</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Position Option Selector */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-3xs font-extrabold uppercase tracking-wider text-[#5A77DF] font-mono">
                Posisi Penempatan Gambar / Video
              </label>
              <div className="flex gap-4 text-xs font-extrabold text-zinc-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="insertPosition"
                    checked={insertPosition === "end"}
                    onChange={() => setInsertPosition("end")}
                    className="accent-[#5A77DF]"
                  />
                  <span>Di Baris Akhir Teks (Default)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="insertPosition"
                    checked={insertPosition === "cursor"}
                    onChange={() => setInsertPosition("cursor")}
                    className="accent-[#5A77DF]"
                  />
                  <span>Sesuai Posisi Kursor</span>
                </label>
              </div>
            </div>

            {/* Tab selector: Upload File vs Insert Link */}
            <div className="flex rounded-xl bg-zinc-100 p-1 text-xs border border-zinc-200">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`flex-1 rounded-lg py-1.5 font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "upload"
                    ? "bg-[#5A77DF] text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah File</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`flex-1 rounded-lg py-1.5 font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "url"
                    ? "bg-[#5A77DF] text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Link URL</span>
              </button>
            </div>

            {activeTab === "upload" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center space-y-3 hover:border-[#5A77DF] transition">
                  <Upload className="w-8 h-8 text-[#5A77DF] mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-zinc-800">
                      Pilih Gambar atau Video dari Komputer
                    </p>
                    <p className="text-3xs text-zinc-500 mt-1">
                      Mendukung PNG, JPG, GIF, WebP, MP4, WebM (Maks. 50MB)
                    </p>
                  </div>
                  <label className="inline-block rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2 text-xs font-extrabold text-white transition cursor-pointer shadow-md">
                    {uploading ? "Mengunggah..." : "Pilih File..."}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-3xs font-extrabold uppercase tracking-wider text-zinc-500 font-mono">
                    Jenis Media
                  </label>
                  <div className="flex gap-4 text-xs font-semibold text-zinc-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        checked={mediaTypeInput === "image"}
                        onChange={() => setMediaTypeInput("image")}
                        className="accent-[#5A77DF]"
                      />
                      <ImageIcon className="w-3.5 h-3.5 text-[#5A77DF]" />
                      <span>Gambar</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        checked={mediaTypeInput === "video"}
                        onChange={() => setMediaTypeInput("video")}
                        className="accent-[#5A77DF]"
                      />
                      <Video className="w-3.5 h-3.5 text-[#5A77DF]" />
                      <span>Video (MP4/Embed)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-extrabold uppercase tracking-wider text-zinc-500 font-mono">
                    URL Media *
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg atau video.mp4"
                    value={mediaUrlInput}
                    onChange={(e) => setMediaUrlInput(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-[#5A77DF] font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleInsertUrl}
                  disabled={!mediaUrlInput.trim()}
                  className="w-full rounded-xl bg-[#5A77DF] hover:bg-[#3E53A2] px-4 py-2.5 text-xs font-extrabold text-white transition disabled:opacity-50 cursor-pointer shadow-md"
                >
                  Sisipkan Media Ke Editor
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
