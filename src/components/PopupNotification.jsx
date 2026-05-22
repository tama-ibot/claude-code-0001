export default function PopupNotification({ onStart, onDismiss }) {
  return (
    <div className="popup-overlay" onClick={onDismiss}>
      <div className="popup-card" onClick={e => e.stopPropagation()}>
        <div className="popup-icon">💭</div>
        <h2 className="popup-title">チェックインの時間です</h2>
        <p className="popup-text">
          最近、何が気になっていますか？<br />
          頭の中にあることを少し話してみませんか。
        </p>
        <div className="popup-actions">
          <button className="btn btn-secondary btn-sm" onClick={onDismiss}>
            後で
          </button>
          <button className="btn btn-primary btn-sm" onClick={onStart}>
            話してみる
          </button>
        </div>
      </div>
    </div>
  )
}
