/**
 * Orders Page
 * -----------
 * Displays the signed-in user's order history and purchase request tracking.
 *
 * Features:
 * - Order history list with status badges
 * - Per-order request tracking timeline
 * - Filter by order status
 * - Summary stats (total spent, active orders, completed)
 * - Cancel pending orders
 */

import {useState} from "react";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import Button from "../ui/Button";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiChevronDown,
  HiChevronUp,
  HiOutlineCalendar,
  HiOutlineMapPin,
} from "react-icons/hi2";
import {useOrders} from "../features/orders/useOrders";
import {useCancelOrder} from "../features/orders/useCancelOrder";

/* ─────────────── helpers ─────────────── */

function getStatusStyle(status) {
  switch (status) {
    case "COMPLETED":
      return "order-badge--completed";
    case "IN_TRANSIT":
      return "order-badge--transit";
    case "PROCESSING":
      return "order-badge--processing";
    case "PENDING":
      return "order-badge--pending";
    case "CANCELLED":
      return "order-badge--cancelled";
    default:
      return "order-badge--pending";
  }
}

function getStatusLabel(status) {
  const labels = {
    PENDING: "Pending",
    PROCESSING: "Processing",
    IN_TRANSIT: "In Transit",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

const TRACKING_STEPS = ["PENDING", "PROCESSING", "IN_TRANSIT", "COMPLETED"];

function getStepIndex(status) {
  return TRACKING_STEPS.indexOf(status);
}

/* ─────────────── sub-components ─────────────── */

function StatCard({icon, label, value, accent}) {
  return (
    <div className={`order-stat-card order-stat-card--${accent}`}>
      <div className="order-stat-icon">{icon}</div>
      <div>
        <p className="order-stat-value">{value}</p>
        <p className="order-stat-label">{label}</p>
      </div>
    </div>
  );
}

function TrackingTimeline({status}) {
  if (status === "CANCELLED") {
    return (
      <div className="order-tracking-cancelled">
        <HiOutlineXCircle className="text-error text-lg" />
        <span className="text-error text-sm font-medium">
          This order was cancelled
        </span>
      </div>
    );
  }

  const currentStep = getStepIndex(status);

  return (
    <div className="order-tracking-timeline">
      {TRACKING_STEPS.map((step, i) => {
        const isDone = i <= currentStep;
        const isActive = i === currentStep;
        return (
          <div key={step} className="order-tracking-step">
            <div
              className={`order-tracking-dot ${isDone ? "order-tracking-dot--done" : ""} ${isActive ? "order-tracking-dot--active" : ""}`}
            >
              {isDone && !isActive && (
                <HiOutlineCheckCircle className="text-xs" />
              )}
            </div>
            <span
              className={`order-tracking-label ${isActive ? "text-brand-primary font-semibold" : isDone ? "text-text-primary" : "text-text-secondary"}`}
            >
              {getStatusLabel(step)}
            </span>
            {i < TRACKING_STEPS.length - 1 && (
              <div
                className={`order-tracking-line ${i < currentStep ? "order-tracking-line--done" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({order, onCancel}) {
  const [expanded, setExpanded] = useState(false);

  const {
    id,
    cropName,
    quantity,
    unitPrice,
    totalPrice,
    status,
    orderDate,
    estimatedDelivery,
    location,
    farmerName,
  } = order;

  const canCancel = status === "PENDING";

  return (
    <article className="order-card">
      {/* ── card header ── */}
      <div className="order-card-header">
        <div className="order-card-meta">
          <span className="order-card-id">Order #{id}</span>
          <span className={`order-badge ${getStatusStyle(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        <button
          className="order-card-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <HiChevronUp className="text-lg" />
          ) : (
            <HiChevronDown className="text-lg" />
          )}
        </button>
      </div>

      {/* ── card summary ── */}
      <div className="order-card-summary">
        <div>
          <p className="order-card-crop">{cropName}</p>
          <div className="order-card-details-row">
            <span className="flex items-center gap-1 text-text-secondary text-sm">
              <HiOutlineCalendar className="text-base" />
              Ordered {orderDate}
            </span>
            <span className="flex items-center gap-1 text-text-secondary text-sm">
              <HiOutlineMapPin className="text-base" />
              {location}
            </span>
          </div>
        </div>

        <div className="order-card-price-block">
          <p className="order-card-total">${totalPrice.toFixed(2)}</p>
          <p className="order-card-qty text-text-secondary text-sm">
            {quantity} units · ${unitPrice}/ea
          </p>
        </div>
      </div>

      {/* ── expanded tracking ── */}
      {expanded && (
        <div className="order-card-expanded">
          <div className="order-expanded-section">
            <h4 className="order-section-title">Request Tracking</h4>
            <TrackingTimeline status={status} />
          </div>

          <div className="order-expanded-section">
            <h4 className="order-section-title">Order Details</h4>
            <div className="order-detail-grid">
              <div className="order-detail-item">
                <span className="order-detail-label">Farmer</span>
                <span className="order-detail-value">{farmerName}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">Est. Delivery</span>
                <span className="order-detail-value">{estimatedDelivery}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">Quantity</span>
                <span className="order-detail-value">{quantity} units</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">Unit Price</span>
                <span className="order-detail-value">${unitPrice}/unit</span>
              </div>
            </div>
          </div>

          {canCancel && (
            <div className="order-card-actions">
              <Button
                variation="danger"
                size="small"
                onClick={() => onCancel(id)}
              >
                Cancel Order
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ─────────────── filter tab ─────────────── */
const FILTERS = [
  {label: "All", value: "all"},
  {label: "Pending", value: "PENDING"},
  {label: "Processing", value: "PROCESSING"},
  {label: "In Transit", value: "IN_TRANSIT"},
  {label: "Completed", value: "COMPLETED"},
  {label: "Cancelled", value: "CANCELLED"},
];

/* ─────────────── main page ─────────────── */

function Orders() {
  const {orders, isLoading} = useOrders();
  const {cancelOrder} = useCancelOrder();
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered =
    activeFilter === "all"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  const totalSpent = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const activeCount = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PROCESSING" || o.status === "IN_TRANSIT"
  ).length;

  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loader" />
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      <Row type="horizontal">
        <Heading type="h1" className="text-text-primary">
          My Orders
        </Heading>
      </Row>

      {/* Stats */}
      <div className="orders-stats-grid">
        <StatCard
          icon={<HiOutlineClipboardDocumentList />}
          label="Total Orders"
          value={orders.length}
          accent="neutral"
        />
        <StatCard
          icon={<HiOutlineTruck />}
          label="Active Orders"
          value={activeCount}
          accent="info"
        />
        <StatCard
          icon={<HiOutlineCheckCircle />}
          label="Completed"
          value={completedCount}
          accent="success"
        />
        <StatCard
          icon={<HiOutlineCurrencyDollar />}
          label="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          accent="harvest"
        />
      </div>

      {/* Filter tabs */}
      <div className="orders-filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`orders-filter-tab ${activeFilter === f.value ? "orders-filter-tab--active" : ""}`}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="orders-empty">
          <HiOutlineClipboardDocumentList className="orders-empty-icon" />
          <p className="text-text-secondary text-base">
            {activeFilter === "all"
              ? "You haven't placed any orders yet."
              : `No ${getStatusLabel(activeFilter).toLowerCase()} orders found.`}
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onCancel={cancelOrder} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
