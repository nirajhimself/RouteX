import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";

// ✅ FIX: remove config dependency
const COMPANY_ID = 1;

export default function Booking() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    type: null,
    client: null,
    package: {},
    carrier: null,
  });

  const onChange = (key, val) => {
    setData((prev) => ({ ...prev, [key]: val }));
  };

  const reset = () => {
    setStep(0);
    setData({ type: null, client: null, package: {}, carrier: null });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">New Booking</h1>

      {step === 0 && (
        <Step1 data={data} onChange={onChange} onNext={() => setStep(1)} />
      )}

      {step === 1 && (
        <Step2
          data={data}
          onChange={onChange}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <Step3
          data={data}
          onChange={onChange}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && <Step4 data={data} onReset={reset} />}
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 1
// ─────────────────────────────────────────
function Step1({ data, onChange, onNext }) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!data.type) return;

    const fetchClients = async () => {
      try {
        const res = await api.get(`/clients/${COMPANY_ID}`);
        setClients(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchClients();
  }, [data.type]);

  return (
    <div>
      <h2>Select Type</h2>

      <button onClick={() => onChange("type", "B2B")}>B2B</button>
      <button onClick={() => onChange("type", "B2C")}>B2C</button>

      <div>
        {clients.map((c) => (
          <div key={c.id} onClick={() => onChange("client", c)}>
            {c.name}
          </div>
        ))}
      </div>

      <button onClick={onNext} disabled={!data.client}>
        Next
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 2
// ─────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack }) {
  const f = data.package || {};

  const set = (k, v) => onChange("package", { ...f, [k]: v });

  return (
    <div>
      <input
        placeholder="Weight"
        value={f.weight || ""}
        onChange={(e) => set("weight", e.target.value)}
      />

      <input
        placeholder="City"
        value={f.receiver_city || ""}
        onChange={(e) => set("receiver_city", e.target.value)}
      />

      <button onClick={onBack}>Back</button>
      <button onClick={onNext}>Next</button>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 3 (FIXED)
// ─────────────────────────────────────────
function Step3({ data, onChange, onNext, onBack }) {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const f = data.package || {};

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const w = parseFloat(f.weight) || 1;
        const dest = f.receiver_city || "Delhi";
        const origin = f.sender_city || "Mumbai";

        const res = await api.get(
          `/carrier-rates?weight=${w}&destination=${dest}&origin=${origin}`,
        );

        setRates(res.data.rates || []);
      } catch (err) {
        console.error(err);
        setRates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [f.weight, f.receiver_city, f.sender_city]);

  return (
    <div>
      {loading ? (
        <p>Loading rates...</p>
      ) : (
        rates.map((r, i) => (
          <div key={i} onClick={() => onChange("carrier", r)}>
            {r.carrier} - ₹{r.rate}
          </div>
        ))
      )}

      <button onClick={onBack}>Back</button>
      <button onClick={onNext} disabled={!data.carrier}>
        Confirm
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 4 (FIXED)
// ─────────────────────────────────────────
function Step4({ data, onReset }) {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const createBooking = async () => {
      try {
        const res = await api.post("/bookings/create", {
          company_id: COMPANY_ID,
          booking_type: data.type,
          weight_kg: parseFloat(data.package.weight || 0),
          carrier: data.carrier.carrier,
        });

        setBooking(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    createBooking();
  }, []);

  if (!booking) return <p>Creating booking...</p>;

  return (
    <div>
      <h2>Success</h2>
      <p>{booking.tracking_number}</p>

      <button
        onClick={() => {
          if (booking?.tracking_number) {
            navigator.clipboard.writeText(booking.tracking_number);
          }
        }}
      >
        Copy
      </button>

      <button onClick={onReset}>New Booking</button>
    </div>
  );
}
