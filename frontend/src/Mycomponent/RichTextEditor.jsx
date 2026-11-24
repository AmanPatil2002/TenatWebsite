
import { useEffect, useRef } from "react";

const CKEDITOR_URL =
  "https://cdn.ckeditor.com/4.22.1/full-all/ckeditor.js";

let ckeditorPromise;

function loadCKEditor() {
  if (window.CKEDITOR) {
    return Promise.resolve(window.CKEDITOR);
  }

  if (!ckeditorPromise) {
    ckeditorPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = CKEDITOR_URL;
      script.async = true;

      script.onload = () => {
        if (window.CKEDITOR) {
          resolve(window.CKEDITOR);
        } else {
          reject(new Error("CKEditor failed to initialize"));
        }
      };

      script.onerror = () => {
        ckeditorPromise = null;
        reject(new Error("Unable to load CKEditor"));
      };

      document.head.appendChild(script);
    });
  }

  return ckeditorPromise;
}

const RichTextEditor = ({
  initialData = "",
  onChange,
  height = 350,
}) => {
  const textareaRef = useRef(null);
  const editorRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    loadCKEditor()
      .then((CKEDITOR) => {
        if (cancelled || !textareaRef.current) return;

        const editor = CKEDITOR.replace(textareaRef.current, {
          height,

          versionCheck: false,
          removePlugins: "exportpdf",

          toolbar: [
            { name: "document", items: ["Source", "-", "NewPage", "Preview", "Print"] },
            { name: "clipboard", items: ["Cut", "Copy", "Paste", "PasteText", "PasteFromWord", "-", "Undo", "Redo"] },
            { name: "editing", items: ["Find", "Replace", "-", "SelectAll"] },
            { name: "basicstyles", items: ["Bold", "Italic", "Underline", "Strike", "-", "Subscript", "Superscript"] },
            { name: "paragraph", items: ["NumberedList", "BulletedList", "-", "Outdent", "Indent", "-", "Blockquote", "JustifyLeft", "JustifyCenter", "JustifyRight", "JustifyBlock"] },
            { name: "links", items: ["Link", "Unlink", "Anchor"] },
            { name: "insert", items: ["Image", "Table", "HorizontalRule", "SpecialChar"] },
            { name: "styles", items: ["Styles", "Format", "Font", "FontSize"] },
            { name: "colors", items: ["TextColor", "BGColor"] },
            { name: "tools", items: ["Maximize"] }
          ],

          allowedContent: true,
        });

        editorRef.current = editor;

        editor.on("change", () => {
          onChangeRef.current?.(editor.getData());
        });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
        }
      });

    return () => {
      cancelled = true;

      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <textarea
      ref={textareaRef}
      defaultValue={initialData}
    />
  );
};

export default RichTextEditor;
