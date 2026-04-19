import ComparisonSlider from "../ComparisonSlider.jsx";

export default function EditorCanvas({ originalUrl, previewUrl, beforeInfo, afterInfo }) {
  if (!originalUrl) return null;

  return (
    <ComparisonSlider
      before={originalUrl}
      after={previewUrl || originalUrl}
      beforeLabel="Original"
      afterLabel="Edited"
      beforeInfo={beforeInfo}
      afterInfo={afterInfo}
      width="100%"
      height={420}
    />
  );
}
