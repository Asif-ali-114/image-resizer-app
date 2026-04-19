import Btn from "./Btn.jsx";

export default function DownloadButton({ blob, filename, label = "Download", variant = "success", small = true, className = "" }) {
  if (!blob) return null;

  const handleDownload = () => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "image";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const sizeKB = (blob.size / 1024).toFixed(1);

  return (
    <Btn onClick={handleDownload} variant={variant} small={small} className={className}>
      {`↓ ${label} · ${sizeKB} KB`}
    </Btn>
  );
}
