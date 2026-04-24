import Btn from "../../Btn.jsx";
import Card from "../../Card.jsx";

export default function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-black/50" role="presentation" onClick={onClose}>
      <div className="mx-auto mt-20 w-[min(460px,calc(100%-24px))]" onClick={(event) => event.stopPropagation()}>
        <Card>
          <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn small variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn small onClick={onConfirm}>{confirmLabel}</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
